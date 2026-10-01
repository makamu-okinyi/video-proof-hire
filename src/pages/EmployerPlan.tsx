import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { describeError } from '@/lib/errors';

const LIMIT_LABELS: { key: 'activeJobs' | 'activeChallenges' | 'shortlistSize'; label: string }[] = [
  { key: 'activeJobs', label: 'Active jobs' },
  { key: 'activeChallenges', label: 'Active challenges' },
  { key: 'shortlistSize', label: 'Shortlisted candidates' },
];

/** Employers see every tier, what they use of their own, and can ask for a change. */
export default function EmployerPlan() {
  useDocumentTitle('Plan');
  const navigate = useNavigate();
  const plans = useQuery(api.plans.listPublic, {});
  const mine = useQuery(api.plans.myPlan, {});
  const request = useMutation(api.plans.requestPlan);
  const cancel = useMutation(api.plans.cancelPlanRequest);
  const [busy, setBusy] = useState<string | null>(null);

  const ask = async (slug: string, name: string) => {
    setBusy(slug);
    try {
      await request({ planSlug: slug });
      toast.success(`Request sent. The Donjo team will set up ${name} and get in touch.`);
    } catch (e) {
      toast.error(describeError(e, 'Could not send your request. Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  const loading = plans === undefined || mine === undefined;

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="-ml-2 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Plan</h1>
            <p className="text-sm text-muted-foreground">Your current tier and what each one includes.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading plans" /></div>
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Plans are not available yet. Please check back soon.</p>
        ) : (
          <>
            {mine?.limits && (
              <section className="rounded-lg border border-border bg-card p-5" aria-label="Your usage">
                <h2 className="mb-3 text-sm font-semibold">Your usage</h2>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {LIMIT_LABELS.map(({ key, label }) => {
                    const limit = mine.limits?.[key];
                    return (
                      <div key={key} className="rounded-md bg-muted px-3 py-2">
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="font-mono text-lg">{mine.usage[key]} <span className="text-sm text-muted-foreground">/ {limit === undefined || limit === null ? 'unlimited' : limit}</span></dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {plans.map((p) => {
                const isCurrent = mine?.slug === p.slug;
                const isPending = mine?.pendingRequest === p.slug;
                return (
                  <article key={p.slug} className={`flex flex-col rounded-lg border bg-card p-5 ${isCurrent ? 'border-foreground' : 'border-border'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-lg font-semibold">{p.name}</h2>
                      {isCurrent && <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">Current plan</span>}
                    </div>
                    {p.offer ? (
                      <div className="mt-1">
                        <p className="text-2xl font-semibold">{p.offer.priceDisplay ?? p.priceDisplay}</p>
                        <p className="text-sm text-muted-foreground"><s>{p.priceDisplay}</s> · {p.offer.label}{p.offer.endsAt ? `, until ${new Date(p.offer.endsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</p>
                      </div>
                    ) : (
                      <p className="mt-1 text-2xl font-semibold">{p.priceDisplay}</p>
                    )}
                    {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}

                    <ul className="mt-4 space-y-2 text-sm">
                      {LIMIT_LABELS.map(({ key, label }) => (
                        <li key={key} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{label}: {p.limits[key] === undefined || p.limits[key] === null ? 'unlimited' : p.limits[key]}</li>
                      ))}
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />{f}</li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-5">
                      {isCurrent ? (
                        <Button variant="outline" disabled className="w-full">You are on this plan</Button>
                      ) : isPending ? (
                        <div className="space-y-2">
                          <Button variant="outline" disabled className="w-full">Request sent, awaiting the team</Button>
                          <button type="button" onClick={() => void cancel({})} className="pointer-events-auto w-full text-center text-xs text-muted-foreground underline">Cancel request</button>
                        </div>
                      ) : (
                        <Button className="w-full" disabled={busy !== null} onClick={() => void ask(p.slug, p.name)}>
                          {busy === p.slug && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Request {p.name}
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Paid plans are set up and invoiced directly by the Donjo team. Your plan changes once they confirm.</p>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
