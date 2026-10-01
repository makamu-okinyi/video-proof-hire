import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Gauge } from '@/components/admin/console/Charts';
import { DataTable, type Column } from '@/components/admin/console/DataTable';
import { ConfirmDialog, Drawer } from '@/components/admin/console/Overlays';
import { Badge, EmptyState, PageHeader, Panel, Skeleton } from '@/components/admin/console/primitives';

type Plan = NonNullable<ReturnType<typeof usePlans>>[number];
type Employer = NonNullable<ReturnType<typeof useEmployers>>[number];
function usePlans() { return useQuery(api.plans.list, {}); }
function useEmployers() { return useQuery(api.plans.employerUsage, {}); }

const LIMIT_FIELDS = [
  { key: 'activeJobs', label: 'Active job posts' },
  { key: 'activeChallenges', label: 'Active challenges' },
  { key: 'shortlistSize', label: 'Shortlisted candidates' },
] as const;

interface FormState {
  slug: string; name: string; priceDisplay: string; description: string;
  limits: Record<(typeof LIMIT_FIELDS)[number]['key'], string>;
  features: string; isActive: boolean; order: string;
  offerLabel: string; offerPrice: string; offerEnds: string;
}
const blank: FormState = { slug: '', name: '', priceDisplay: '', description: '', limits: { activeJobs: '', activeChallenges: '', shortlistSize: '' }, features: '', isActive: true, order: '0', offerLabel: '', offerPrice: '', offerEnds: '' };

function PlanDrawer({ plan, open, onClose }: { plan: Plan | null; open: boolean; onClose: () => void }) {
  const upsert = useMutation(api.plans.upsert);
  const [f, setF] = useState<FormState>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF(plan ? {
      slug: plan.slug, name: plan.name, priceDisplay: plan.priceDisplay, description: plan.description ?? '',
      limits: {
        activeJobs: plan.limits.activeJobs?.toString() ?? '', activeChallenges: plan.limits.activeChallenges?.toString() ?? '',
        shortlistSize: plan.limits.shortlistSize?.toString() ?? '',
      },
      features: plan.features.join('\n'), isActive: plan.isActive, order: String(plan.order),
      offerLabel: plan.offer?.label ?? '', offerPrice: plan.offer?.priceDisplay ?? '',
      offerEnds: plan.offer?.endsAt ? new Date(plan.offer.endsAt).toISOString().slice(0, 10) : '',
    } : blank);
  }, [open, plan]);

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!/^[a-z0-9-]{2,30}$/.test(f.slug.trim().toLowerCase())) errs.slug = 'Use 2-30 lowercase letters, numbers or dashes';
    if (!f.name.trim()) errs.name = 'Give the plan a name';
    if (!f.priceDisplay.trim()) errs.priceDisplay = 'Enter how the price should read, e.g. "Free"';
    // Keep limits this form has no field for (e.g. seats) instead of silently dropping them.
    const limits: Record<string, number> = { ...(plan?.limits ?? {}) } as Record<string, number>;
    for (const l of LIMIT_FIELDS) delete limits[l.key];
    if (f.offerLabel.trim() && f.offerEnds && Number.isNaN(Date.parse(f.offerEnds))) errs.offerEnds = 'Enter a valid date';
    for (const l of LIMIT_FIELDS) {
      const raw = f.limits[l.key].trim();
      if (raw === '') continue;
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) errs[l.key] = 'Whole number, 0 or more (leave blank for no limit)';
      else limits[l.key] = n;
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await upsert({
        slug: f.slug, name: f.name, priceDisplay: f.priceDisplay, description: f.description.trim() || undefined,
        limits, features: f.features.split('\n'), isActive: f.isActive, order: Number(f.order) || 0,
        offer: f.offerLabel.trim()
          ? { label: f.offerLabel.trim().slice(0, 80), priceDisplay: f.offerPrice.trim().slice(0, 60) || undefined, endsAt: f.offerEnds ? new Date(`${f.offerEnds}T23:59:59`).getTime() : undefined }
          : undefined,
      });
      toast.success(plan ? 'Plan updated' : 'Plan created');
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message.replace(/^.*Uncaught Error:\s*/s, '').split('\n')[0] : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={plan ? `Edit ${plan.name}` : 'New plan'}
      description="Limits are enforced exactly as set when employers create jobs and challenges or shortlist candidates. Blank means unlimited, 0 means none allowed."
      footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose} className="pointer-events-auto">Cancel</Button><Button onClick={save} disabled={busy} className="pointer-events-auto">{plan ? 'Save changes' : 'Create plan'}</Button></div>}
    >
      <div className="space-y-4">
        <Field label="Slug" required hint="Short identifier. The plan every employer starts on has the slug free." error={errors.slug}>
          <Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} disabled={!!plan} autoCapitalize="none" />
        </Field>
        <Field label="Name" required error={errors.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} /></Field>
        <Field label="Price as shown" required hint='Free text, e.g. "Free" or "KES 4,900 per month".' error={errors.priceDisplay}><Input value={f.priceDisplay} onChange={(e) => setF({ ...f, priceDisplay: e.target.value })} maxLength={60} /></Field>
        <Field label="Description" optional counter={{ length: f.description.length, max: 300 }}><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={300} rows={2} /></Field>
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <legend className="mb-2 text-sm font-medium">Limits</legend>
          {LIMIT_FIELDS.map((l) => (
            <Field key={l.key} label={l.label} optional error={errors[l.key]}>
              <Input type="number" min={0} step={1} value={f.limits[l.key]} placeholder="Unlimited" onChange={(e) => setF({ ...f, limits: { ...f.limits, [l.key]: e.target.value } })} />
            </Field>
          ))}
        </fieldset>
        <fieldset className="space-y-3 rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-medium">Offer (optional)</legend>
          <p className="text-xs text-muted-foreground">A promotion shown with this plan until its end date. It does not change the limits above; those are always exactly what you set.</p>
          <Field label="Offer label" optional><Input value={f.offerLabel} onChange={(e) => setF({ ...f, offerLabel: e.target.value })} maxLength={80} placeholder="e.g. Launch offer: 3 months free" /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Offer price" optional><Input value={f.offerPrice} onChange={(e) => setF({ ...f, offerPrice: e.target.value })} maxLength={60} placeholder="e.g. $49 / month" /></Field>
            <Field label="Ends on" optional error={errors.offerEnds}><Input type="date" value={f.offerEnds} onChange={(e) => setF({ ...f, offerEnds: e.target.value })} /></Field>
          </div>
        </fieldset>
        <Field label="Features" optional hint="One per line.">
          <Textarea value={f.features} onChange={(e) => setF({ ...f, features: e.target.value })} rows={4} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Sort order"><Input type="number" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} /></Field>
          <Field label="Status">
            <Select aria-label="Status" value={f.isActive ? 'active' : 'hidden'} onValueChange={(v) => setF({ ...f, isActive: v === 'active' })} options={[{ value: 'active', label: 'Active' }, { value: 'hidden', label: 'Hidden' }]} />
          </Field>
        </div>
      </div>
    </Drawer>
  );
}

function ChangePlan({ employer, plans }: { employer: Employer; plans: Plan[] }) {
  const setPlan = useMutation(api.plans.setEmployerPlan);
  return (
    <div className="w-40">
      <Select
        aria-label={`Plan for ${employer.name}`}
        value={employer.planSlug}
        onValueChange={async (slug) => {
          if (!slug || slug === employer.planSlug) return;
          try { await setPlan({ userId: employer.userId, planSlug: slug }); toast.success(`${employer.name} moved to ${slug}`); }
          catch (e) { toast.error(e instanceof Error ? e.message : 'Could not change plan'); }
        }}
        options={plans.map((p) => ({ value: p.slug, label: p.name }))}
        placeholder="No plan"
      />
    </div>
  );
}

function PlanRequests() {
  const requests = useQuery(api.plans.listRequests, {});
  const resolve = useMutation(api.plans.resolveRequest);
  if (!requests?.length) return null;
  const act = async (id: (typeof requests)[number]['id'], approve: boolean) => {
    try {
      await resolve({ requestId: id, approve });
      toast.success(approve ? 'Employer moved to the new plan' : 'Request declined');
    } catch (e) {
      toast.error(e instanceof Error ? e.message.replace(/^.*Uncaught Error:\s*/s, '').split('\n')[0] : 'Could not update the request');
    }
  };
  return (
    <Panel title={`Plan requests (${requests.length})`} description="Employers asking to change tier. Approving moves them to that plan immediately." className="mb-6">
      <ul className="divide-y divide-border">
        {requests.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{r.name}</p>
              <p className="truncate text-xs text-muted-foreground">{r.email} · wants <strong>{r.planSlug}</strong> · {new Date(r.createdAt).toLocaleDateString('en-GB')}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void act(r.id, false)} className="pointer-events-auto">Decline</Button>
              <Button onClick={() => void act(r.id, true)} className="pointer-events-auto">Approve</Button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default function Plans() {
  useDocumentTitle('Plans & usage · Admin');
  const plans = usePlans();
  const employers = useEmployers();
  const removePlan = useMutation(api.plans.remove);
  const seedStandard = useMutation(api.plans.seedStandardPlans);
  const seedPlans = async () => {
    try {
      await seedStandard({});
      toast.success('Standard plans added');
    } catch {
      toast.error('Could not add the plans. Please try again.');
    }
  };
  const [editing, setEditing] = useState<Plan | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState<Plan | null>(null);

  const columns: Column<Employer>[] = [
    { key: 'name', header: 'Employer', sortValue: (r) => r.name.toLowerCase(), cell: (r) => <div className="min-w-0"><p className="truncate font-medium">{r.name}</p><p className="truncate text-xs text-muted-foreground">{r.email}</p></div>, csv: (r) => r.name },
    { key: 'email', header: 'Email', cell: () => null, csv: (r) => r.email, csvOnly: true },
    { key: 'plan', header: 'Plan', sortValue: (r) => r.planSlug, cell: (r) => (r.planName ? <Badge tone="info">{r.planName}</Badge> : <span className="text-muted-foreground">{r.planSlug} (undefined)</span>), csv: (r) => r.planSlug },
    {
      key: 'usage', header: 'Usage', hideOnMobile: false,
      cell: (r) => (
        <div className="min-w-[13rem] space-y-2">
          <Gauge label="Active jobs" used={r.usage.activeJobs} limit={r.limits?.activeJobs} />
          <Gauge label="Challenges" used={r.usage.activeChallenges} limit={r.limits?.activeChallenges} />
        </div>
      ),
    },
    { key: 'jobs', header: 'Active jobs', cell: () => null, csv: (r) => r.usage.activeJobs, csvOnly: true },
    { key: 'challenges', header: 'Active challenges', cell: () => null, csv: (r) => r.usage.activeChallenges, csvOnly: true },
    { key: 'change', header: 'Change plan', isActions: true, cell: (r) => (plans ? <ChangePlan employer={r} plans={plans} /> : null) },
  ];

  return (
    <>
      <PageHeader
        title="Plans & usage"
        description="Define employer subscription tiers and see how close each employer is to their limits. These plans govern in-app limits only; marketing pricing on the public site is managed separately."
        actions={<Button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="pointer-events-auto"><Plus className="mr-2 h-4 w-4" aria-hidden="true" />New plan</Button>}
      />

      <PlanRequests />

      <Panel title="Plans">
        {plans === undefined ? <Skeleton className="h-32 w-full" /> : plans.length === 0 ? (
          <EmptyState title="No plans defined yet" action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => void seedPlans()} className="pointer-events-auto">Add Starter, Venture and Enterprise</Button>
              <Button variant="outline" onClick={() => { setEditing(null); setDrawerOpen(true); }} className="pointer-events-auto">Create a custom plan</Button>
            </div>}>
            Until a plan exists for an employer's tier, no limits are enforced on them. The standard tiers match the public pricing page (Starter is slug "free", which every employer begins on). They start with no limits; set them per plan afterwards.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((p) => (
              <article key={p.slug} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.priceDisplay}</p>
                  </div>
                  <Badge tone={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Active' : 'Hidden'}</Badge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {LIMIT_FIELDS.map((l) => (
                    <div key={l.key}><dt className="text-xs text-muted-foreground">{l.label}</dt><dd className="font-mono">{p.limits[l.key] ?? 'Unlimited'}</dd></div>
                  ))}
                </dl>
                <div className="mt-4 flex justify-end gap-2">
                  <Button size="sm" variant="outline" className="pointer-events-auto" onClick={() => { setEditing(p); setDrawerOpen(true); }}><Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />Edit</Button>
                  <Button size="sm" variant="ghost" className="pointer-events-auto" aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Employer usage</h2>
      <DataTable
        caption="Employers with plan and usage"
        rows={employers}
        columns={columns}
        rowKey={(r) => r.userId}
        searchText={(r) => `${r.name} ${r.email ?? ''}`}
        searchLabel="Search employers"
        filters={plans ? [{ key: 'plan', label: 'Any plan', options: plans.map((p) => ({ value: p.slug, label: p.name })), match: (r, v) => r.planSlug === v }] : []}
        pageSize={10}
        exportName="donjo-employer-usage"
        emptyTitle="No employers yet"
        emptyBody="Employer accounts and their usage will appear here."
      />

      <PlanDrawer plan={editing} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete plan"
        description={<>Delete <strong>{deleting?.name}</strong>? Employers still on it must be moved first.</>}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => { if (deleting) { await removePlan({ slug: deleting.slug }); toast.success('Plan deleted'); } }}
      />
    </>
  );
}
