import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { CheckCircle2, ExternalLink, FileDown, Loader2, FileText, RotateCcw, XCircle } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DataTable, type Column } from '@/components/admin/console/DataTable';
import { ConfirmDialog, Drawer } from '@/components/admin/console/Overlays';
import { Badge, PageHeader, Skeleton, statusTone } from '@/components/admin/console/primitives';
import { formatDate, formatDateTime, timeAgo } from '@/components/admin/console/format';

type Row = NonNullable<ReturnType<typeof useList>>[number];
function useList() {
  return useQuery(api.adminReview.list, {});
}

const STATUS_LABEL: Record<string, string> = { submitted: 'Awaiting review', shortlisted: 'Shortlisted', rejected: 'Rejected' };

function Section({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{body}</p>
    </div>
  );
}

function VentureDrawer({ ventureId, onClose }: { ventureId: Id<'ventures'> | null; onClose: () => void }) {
  const d = useQuery(api.adminReview.detail, ventureId ? { ventureId } : 'skip');
  const review = useMutation(api.adminReview.review);
  const saveNotes = useMutation(api.adminReview.saveNotes);
  const [notes, setNotes] = useState('');
  const [score, setScore] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [confirm, setConfirm] = useState<null | 'shortlisted' | 'rejected' | 'submitted'>(null);

  useEffect(() => {
    if (d) {
      setNotes(d.reviewNotes);
      setScore(d.reviewScore === null ? '' : String(d.reviewScore));
    }
  }, [d?.id, d?.reviewNotes, d?.reviewScore]);

  const scoreNum = score === '' ? undefined : Number(score);
  const scoreError = scoreNum !== undefined && (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) ? 'Enter a score from 0 to 10' : undefined;

  return (
    <Drawer open={!!ventureId} onOpenChange={(o) => !o && onClose()} title={d?.name ?? 'Venture'} description={d?.tagline} width="max-w-2xl">
      {d === undefined ? (
        <div className="space-y-3"><Skeleton className="h-48 w-full" /><Skeleton className="h-24 w-full" /></div>
      ) : d === null ? (
        <p className="text-sm text-muted-foreground">This venture no longer exists.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(d.status)}>{STATUS_LABEL[d.status] ?? d.status}</Badge>
            <Badge>{d.stage}</Badge>
            {d.industry.map((i) => <Badge key={i}>{i}</Badge>)}
            {(d.county || d.country) && <Badge tone="info">{d.county ? `${d.county}, Kenya` : d.country}</Badge>}
          </div>

          {d.pitchVideoUrl ? (
            <video src={d.pitchVideoUrl} controls preload="metadata" className="aspect-video w-full rounded-lg bg-black" aria-label={`Pitch video for ${d.name}`} />
          ) : (
            <p className="rounded-xl bg-[hsl(var(--muted))] px-4 py-3 text-sm text-muted-foreground">No pitch video was uploaded.</p>
          )}

          <div className="flex flex-wrap gap-2 text-sm">
            {d.decks.map((k) => (
              <a key={k.fileUrl} href={k.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 hover:bg-accent">
                <FileText className="h-4 w-4" aria-hidden="true" /> {k.title} (v{k.version})
              </a>
            ))}
            {d.websiteUrl && <a href={d.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 hover:bg-accent"><ExternalLink className="h-4 w-4" aria-hidden="true" /> Website</a>}
            {d.demoUrl && <a href={d.demoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 hover:bg-accent"><ExternalLink className="h-4 w-4" aria-hidden="true" /> Demo</a>}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Founders</h3>
            <ul className="space-y-1 text-sm">
              {d.founders.map((f) => (
                <li key={f.userId} className="flex justify-between gap-3">
                  <span>{f.name ?? 'Unnamed'}{f.title ? `, ${f.title}` : ''}{f.isLead ? ' (lead)' : ''}</span>
                  <span className="text-muted-foreground">{f.email}</span>
                </li>
              ))}
            </ul>
          </div>

          <Section title="Problem" body={d.problemStatement} />
          <Section title="Solution" body={d.solution ?? d.description} />
          <Section title="Traction" body={d.traction} />
          <Section title="Business model" body={d.businessModel} />
          <Section title="Market size" body={d.marketSize} />

          <div className="space-y-3 border-t border-border pt-5">
            <h3 className="text-sm font-semibold">Reviewer notes</h3>
            <Field label="Private notes" hint="Only admins see these." counter={{ length: notes.length, max: 4000 }}>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} rows={4} />
            </Field>
            <div className="flex items-end gap-3">
              <div className="w-44">
                <Field label="Score (0-10)" optional error={scoreError}>
                  <Input type="number" inputMode="decimal" min={0} max={10} step={0.5} value={score} onChange={(e) => setScore(e.target.value)} />
                </Field>
              </div>
              <Button
                variant="outline"
                disabled={savingNotes || !!scoreError}
                onClick={async () => {
                  setSavingNotes(true);
                  try {
                    await saveNotes({ ventureId: d.id, notes, score: scoreNum });
                    toast.success('Notes saved');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Could not save notes');
                  } finally {
                    setSavingNotes(false);
                  }
                }}
                className="pointer-events-auto"
              >
                Save notes
              </Button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">History</h3>
            <ol className="space-y-3 border-l border-border pl-4">
              {[...d.history].reverse().map((h, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full bg-[hsl(var(--brand-strong))]" aria-hidden="true" />
                  <p className="font-medium">{STATUS_LABEL[h.status] ?? h.status}{h.by ? ` by ${h.by}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(h.at)}</p>
                  {h.reason && <p className="mt-0.5 text-muted-foreground">Reason: {h.reason}</p>}
                </li>
              ))}
            </ol>
          </div>

          <div className="sticky bottom-0 -mx-5 flex flex-wrap gap-2 border-t border-border bg-background px-5 py-4 sm:-mx-6 sm:px-6">
            {d.status !== 'shortlisted' && <Button onClick={() => setConfirm('shortlisted')} className="pointer-events-auto"><CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />Shortlist</Button>}
            {d.status !== 'rejected' && <Button variant="destructive" onClick={() => setConfirm('rejected')} className="pointer-events-auto"><XCircle className="mr-2 h-4 w-4" aria-hidden="true" />Reject</Button>}
            {d.status !== 'submitted' && <Button variant="outline" onClick={() => setConfirm('submitted')} className="pointer-events-auto"><RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />Reopen</Button>}
          </div>

          <ConfirmDialog
            open={confirm === 'shortlisted'}
            onOpenChange={(o) => !o && setConfirm(null)}
            title="Shortlist this venture"
            description="The founder will see the new status."
            confirmLabel="Shortlist"
            onConfirm={async () => { await review({ ventureId: d.id, status: 'shortlisted' }); toast.success('Venture shortlisted'); }}
          />
          <ConfirmDialog
            open={confirm === 'rejected'}
            onOpenChange={(o) => !o && setConfirm(null)}
            title="Reject this venture"
            description="A reason is required and is stored with the decision."
            confirmLabel="Reject"
            destructive
            reasonLabel="Reason for rejection"
            reasonRequired
            onConfirm={async (reason) => { await review({ ventureId: d.id, status: 'rejected', reason }); toast.success('Venture rejected'); }}
          />
          <ConfirmDialog
            open={confirm === 'submitted'}
            onOpenChange={(o) => !o && setConfirm(null)}
            title="Reopen for review"
            description="The venture goes back into the review queue."
            confirmLabel="Reopen"
            onConfirm={async () => { await review({ ventureId: d.id, status: 'submitted' }); toast.success('Venture reopened'); }}
          />
        </div>
      )}
    </Drawer>
  );
}

export default function Review() {
  useDocumentTitle('Venture review · Admin');
  const rows = useList();
  const bulk = useMutation(api.adminReview.bulkReview);
  const [params, setParams] = useSearchParams();
  const openId = params.get('open') as Id<'ventures'> | null;
  const [bulkConfirm, setBulkConfirm] = useState<null | { ids: Id<'ventures'>[]; status: 'shortlisted' | 'rejected' | 'submitted'; clear: () => void }>(null);
  const [now] = useState(() => Date.now());
  const [pdfBusy, setPdfBusy] = useState(false);

  const downloadDossier = async () => {
    if (!rows?.length) return;
    setPdfBusy(true);
    try {
      const reactPdf = await import('@react-pdf/renderer');
      const { ApplicantDossierPDF } = await import('@/components/admin/ApplicantDossierPDF');
      const applicants = rows.map((r) => ({ applicantName: r.founderName || 'Unknown', jobRole: r.name, videoPortfolioUrl: r.pitchVideoUrl }));
      const blob = await reactPdf.pdf(<ApplicantDossierPDF applicants={applicants} title="Applicant Dossier" />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applicant-dossier-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      requestAnimationFrame(() => { document.body.removeChild(a); URL.revokeObjectURL(url); });
      toast.success('Dossier downloaded');
    } catch {
      toast.error('Could not build the PDF. Use Export CSV instead.');
    } finally {
      setPdfBusy(false);
    }
  };

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Venture', sortValue: (r) => r.name.toLowerCase(), cell: (r) => (<div className="min-w-0"><p className="truncate font-medium">{r.name}</p><p className="truncate text-xs text-muted-foreground">{r.tagline}</p></div>), csv: (r) => r.name },
    { key: 'founder', header: 'Founder', sortValue: (r) => r.founderName ?? '', cell: (r) => r.founderName ?? '-', csv: (r) => r.founderName },
    { key: 'stage', header: 'Stage', sortValue: (r) => r.stage, cell: (r) => r.stage, csv: (r) => r.stage },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, cell: (r) => <Badge tone={statusTone(r.status)}>{STATUS_LABEL[r.status] ?? r.status}</Badge>, csv: (r) => r.status },
    { key: 'waiting', header: 'Waiting', sortValue: (r) => (r.status === 'submitted' ? now - r.submittedAt : -1), cell: (r) => (r.status === 'submitted' ? timeAgo(r.submittedAt, now).replace(' ago', '') : '-'), csv: (r) => (r.status === 'submitted' ? Math.round((now - r.submittedAt) / 3600000) : '') },
    { key: 'submitted', header: 'Submitted', sortValue: (r) => r.submittedAt, cell: (r) => formatDate(r.submittedAt), csv: (r) => new Date(r.submittedAt).toISOString() },
    { key: 'score', header: 'Score', sortValue: (r) => r.score ?? -1, cell: (r) => (r.score === null ? '-' : r.score), csv: (r) => r.score, align: 'right' },
    { key: 'location', header: 'Location', cell: () => null, csv: (r) => r.county ?? r.country, csvOnly: true },
  ];

  return (
    <>
      <PageHeader title="Venture review" description="Review pitch videos and decks, record notes, and decide. Every decision is timestamped so velocity is measured from real data." />
      <DataTable
        caption="Ventures"
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.name} ${r.tagline} ${r.founderName ?? ''}`}
        searchLabel="Search ventures"
        filters={[{ key: 'status', label: 'Any status', options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })), match: (r, v) => r.status === v }]}
        pageSize={25}
        exportName="donjo-ventures"
        toolbar={<Button variant="outline" size="sm" onClick={downloadDossier} disabled={pdfBusy || !rows?.length} className="pointer-events-auto">{pdfBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />}Dossier (PDF)</Button>}
        selectable
        bulkActions={(selected, clear) => (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setBulkConfirm({ ids: selected.map((s) => s.id as Id<'ventures'>), status: 'shortlisted', clear })} className="pointer-events-auto">Shortlist</Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkConfirm({ ids: selected.map((s) => s.id as Id<'ventures'>), status: 'rejected', clear })} className="pointer-events-auto">Reject</Button>
            <Button size="sm" variant="outline" onClick={() => setBulkConfirm({ ids: selected.map((s) => s.id as Id<'ventures'>), status: 'submitted', clear })} className="pointer-events-auto">Reopen</Button>
          </div>
        )}
        onRowClick={(r) => setParams({ open: r.id })}
        emptyTitle="No ventures yet"
        emptyBody="Founders' applications will appear here once they submit."
      />
      <VentureDrawer ventureId={openId} onClose={() => setParams({})} />
      <ConfirmDialog
        open={!!bulkConfirm}
        onOpenChange={(o) => !o && setBulkConfirm(null)}
        title={bulkConfirm ? `${bulkConfirm.status === 'shortlisted' ? 'Shortlist' : bulkConfirm.status === 'rejected' ? 'Reject' : 'Reopen'} ${bulkConfirm.ids.length} venture${bulkConfirm.ids.length === 1 ? '' : 's'}` : ''}
        description="This applies to every selected venture and is recorded in the audit log."
        confirmLabel="Apply"
        destructive={bulkConfirm?.status === 'rejected'}
        reasonLabel={bulkConfirm?.status === 'rejected' ? 'Reason for rejection' : undefined}
        reasonRequired
        onConfirm={async (reason) => {
          if (!bulkConfirm) return;
          const n = await bulk({ ventureIds: bulkConfirm.ids, status: bulkConfirm.status, reason: reason || undefined });
          toast.success(`${n} venture${n === 1 ? '' : 's'} updated`);
          bulkConfirm.clear();
        }}
      />
    </>
  );
}
