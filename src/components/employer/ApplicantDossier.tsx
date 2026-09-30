import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadarChart } from '@/components/employer/RadarChart';

const CRITERIA = [
  { key: 'communication', label: 'Communication' },
  { key: 'technical', label: 'Technical skill' },
  { key: 'problemSolving', label: 'Problem solving' },
  { key: 'roleFit', label: 'Role fit' },
  { key: 'presentation', label: 'Presentation' },
] as const;
type Key = (typeof CRITERIA)[number]['key'];
type Scores = Record<Key, number>;
const BLANK: Scores = { communication: 0, technical: 0, problemSolving: 0, roleFit: 0, presentation: 0 };

const when = (t: number) =>
  new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** One applicant in depth: profile, skill match, radar of reviewer ratings, status history. */
export function ApplicantDossier({ applicationId, onClose }: { applicationId: Id<'jobApplications'> | null; onClose: () => void }) {
  const data = useQuery(api.employerInsights.dossier, applicationId ? { applicationId } : 'skip');
  const save = useMutation(api.employerInsights.saveAssessment);
  const [scores, setScores] = useState<Scores>(BLANK);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    setScores(data.assessment ? { ...data.assessment.scores } : BLANK);
    setNote(data.assessment?.note ?? '');
  }, [data?.application.id, data?.assessment?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const complete = CRITERIA.every((c) => scores[c.key] >= 1);

  const onSave = async () => {
    if (!applicationId || !complete || busy) return;
    setBusy(true);
    try {
      await save({ applicationId, scores, note });
      toast.success('Assessment saved');
    } catch {
      toast.error('Could not save the assessment. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const displayName = data?.applicant.fullName || (data?.applicant.username ? `@${data.applicant.username}` : 'Applicant');
  const radarAxes = CRITERIA.map((c) => ({
    label: c.label,
    value: scores[c.key] >= 1 ? scores[c.key] : null,
  }));

  return (
    <Dialog open={applicationId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? displayName : 'Applicant dossier'}</DialogTitle>
          <DialogDescription>{data ? `Applied for ${data.job.title}` : 'Loading...'}</DialogDescription>
        </DialogHeader>

        {!data ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" /></div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline" className="capitalize">{data.application.status}</Badge>
              {data.applicant.isVerified && <span className="inline-flex items-center gap-1 text-coral"><CheckCircle className="h-4 w-4" />Verified</span>}
              {(data.applicant.county || data.applicant.country) && (
                <span className="text-muted-foreground">{data.applicant.county ? `${data.applicant.county}, Kenya` : data.applicant.country}</span>
              )}
            </div>

            {data.applicant.bio && <p className="text-sm leading-relaxed text-muted-foreground">{data.applicant.bio}</p>}

            <section aria-labelledby="dossier-match">
              <h3 id="dossier-match" className="text-sm font-semibold">Skill match</h3>
              {data.skillMatch.required === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">This job lists no required skills.</p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-muted-foreground">{data.skillMatch.matched.length} of {data.skillMatch.required} required skills listed on their profile.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.skillMatch.matched.map((s) => <Badge key={s} className="text-xs">{s}</Badge>)}
                    {data.skillMatch.missing.map((s) => <Badge key={s} variant="outline" className="text-xs text-muted-foreground">{s} (not listed)</Badge>)}
                  </div>
                </>
              )}
              {data.applicant.skills.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">All skills: {data.applicant.skills.join(', ')}</p>
              )}
            </section>

            <section aria-labelledby="dossier-assess" className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 id="dossier-assess" className="text-sm font-semibold">Your assessment</h3>
                <p className="mt-1 text-xs text-muted-foreground">Rate each area from 1 (weak) to 5 (excellent).</p>
                <div className="mt-3 space-y-3">
                  {CRITERIA.map((c) => (
                    <div key={c.key} role="group" aria-label={c.label}>
                      <p className="text-xs font-medium">{c.label}</p>
                      <div className="mt-1 flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={scores[c.key] === n}
                            aria-label={`${c.label} ${n} of 5`}
                            onClick={() => setScores((s) => ({ ...s, [c.key]: n }))}
                            className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${scores[c.key] === n ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <label htmlFor="assess-note" className="mt-4 block text-xs font-medium">Notes (private to your team)</label>
                <textarea
                  id="assess-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 1000))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
                />
                <Button className="mt-3" onClick={onSave} disabled={!complete || busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Save assessment
                </Button>
                {!complete && <p className="mt-2 text-xs text-muted-foreground">Rate all five areas to save.</p>}
              </div>
              <div className="flex flex-col items-center">
                <RadarChart axes={radarAxes} />
                {data.team.reviewers > 1 && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Team average across {data.team.reviewers} reviewers:{' '}
                    {data.team.averages.map((a) => a.average ?? '-').join(' / ')}
                  </p>
                )}
              </div>
            </section>

            {data.application.coverMessage && (
              <section aria-labelledby="dossier-cover">
                <h3 id="dossier-cover" className="text-sm font-semibold">Cover message</h3>
                <p className="mt-2 rounded-lg bg-secondary p-3 text-sm">{data.application.coverMessage}</p>
              </section>
            )}

            <section aria-labelledby="dossier-history">
              <h3 id="dossier-history" className="text-sm font-semibold">Status history</h3>
              <ol className="mt-2 space-y-2 border-l border-border pl-4 text-sm">
                {data.application.history.map((h, i) => (
                  <li key={`${h.status}-${h.at}-${i}`} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <span className="font-medium capitalize">{h.status}</span>
                    <span className="text-muted-foreground"> &middot; {when(h.at)}</span>
                  </li>
                ))}
              </ol>
            </section>

            {data.videos.length > 0 && (
              <section aria-labelledby="dossier-videos">
                <h3 id="dossier-videos" className="text-sm font-semibold">Video portfolio ({data.videos.length})</h3>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {data.videos.map((vd) => (
                    <a key={vd.id} href={`/watch/${vd.id}`} target="_blank" rel="noopener noreferrer" className="relative aspect-[9/16] overflow-hidden rounded-lg bg-muted">
                      {vd.thumbnailUrl ? <img src={vd.thumbnailUrl} alt={vd.title ?? 'Video'} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center p-1 text-center text-xs text-muted-foreground">{vd.title ?? 'Video'}</span>}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <XCircle className="hidden" aria-hidden="true" />
              Shortlist or reject from the applicants list; every change is recorded above.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
