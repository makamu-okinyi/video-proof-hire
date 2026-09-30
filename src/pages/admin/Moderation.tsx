import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { Eye, EyeOff, Star, Trash2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/admin/console/DataTable';
import { ConfirmDialog } from '@/components/admin/console/Overlays';
import { Badge, PageHeader, Segmented } from '@/components/admin/console/primitives';
import { formatDate } from '@/components/admin/console/format';

type JobRow = NonNullable<ReturnType<typeof useJobs>>[number];
type ChallengeRow = NonNullable<ReturnType<typeof useChallenges>>[number];
function useJobs() { return useQuery(api.adminModeration.listJobs, {}); }
function useChallenges() { return useQuery(api.adminModeration.listChallenges, {}); }

type Pending = { kind: 'job' | 'challenge'; id: string; title: string } | null;

function visibilityBadge(r: { isActive: boolean; hidden: boolean }) {
  if (r.hidden) return <Badge tone="danger">Unpublished by admin</Badge>;
  return r.isActive ? <Badge tone="success">Live</Badge> : <Badge>Closed by employer</Badge>;
}

export default function Moderation() {
  useDocumentTitle('Jobs & challenges · Admin');
  const [tab, setTab] = useState<'jobs' | 'challenges'>('jobs');
  const jobs = useJobs();
  const challenges = useChallenges();
  const setJobHidden = useMutation(api.adminModeration.setJobHidden);
  const setJobFeatured = useMutation(api.adminModeration.setJobFeatured);
  const deleteJob = useMutation(api.adminModeration.deleteJob);
  const setChHidden = useMutation(api.adminModeration.setChallengeHidden);
  const setChFeatured = useMutation(api.adminModeration.setChallengeFeatured);
  const deleteChallenge = useMutation(api.adminModeration.deleteChallenge);
  const [del, setDel] = useState<Pending>(null);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); } catch (e) { toast.error(e instanceof Error ? e.message : 'Action failed'); }
  };

  const actions = <R extends { id: string; title: string; hidden: boolean; featured: boolean }>(
    kind: 'job' | 'challenge',
    hide: (id: string, hidden: boolean) => Promise<unknown>,
    feature: (id: string, featured: boolean) => Promise<unknown>,
  ) => (r: R) => (
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="sm" variant="outline" className="pointer-events-auto" onClick={() => run(() => hide(r.id, !r.hidden), r.hidden ? 'Republished' : 'Unpublished')}>
        {r.hidden ? <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" /> : <EyeOff className="mr-1.5 h-4 w-4" aria-hidden="true" />}
        {r.hidden ? 'Republish' : 'Unpublish'}
      </Button>
      <Button size="sm" variant="outline" className="pointer-events-auto" aria-pressed={r.featured} onClick={() => run(() => feature(r.id, !r.featured), r.featured ? 'Removed from featured' : 'Featured')}>
        <Star className={`mr-1.5 h-4 w-4 ${r.featured ? 'fill-current' : ''}`} aria-hidden="true" />{r.featured ? 'Unfeature' : 'Feature'}
      </Button>
      <Button size="sm" variant="destructive" className="pointer-events-auto" onClick={() => setDel({ kind, id: r.id, title: r.title })}>
        <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />Delete
      </Button>
    </div>
  );

  const jobActions = actions<JobRow>('job', (id, hidden) => setJobHidden({ jobId: id as Id<'jobPostings'>, hidden }), (id, featured) => setJobFeatured({ jobId: id as Id<'jobPostings'>, featured }));
  const chActions = actions<ChallengeRow>('challenge', (id, hidden) => setChHidden({ challengeId: id as Id<'challenges'>, hidden }), (id, featured) => setChFeatured({ challengeId: id as Id<'challenges'>, featured }));

  const jobColumns: Column<JobRow>[] = [
    { key: 'title', header: 'Job', sortValue: (r) => r.title.toLowerCase(), cell: (r) => <div className="min-w-0"><p className="truncate font-medium">{r.title}</p><p className="truncate text-xs text-muted-foreground">{r.company ?? 'Unknown company'} · {r.jobType}</p></div>, csv: (r) => r.title },
    { key: 'company', header: 'Company', cell: () => null, csv: (r) => r.company, csvOnly: true },
    { key: 'state', header: 'State', sortValue: (r) => (r.hidden ? 0 : r.isActive ? 2 : 1), cell: (r) => visibilityBadge(r), csv: (r) => (r.hidden ? 'unpublished' : r.isActive ? 'live' : 'closed') },
    { key: 'applicants', header: 'Applicants', sortValue: (r) => r.applicants, cell: (r) => r.applicants, csv: (r) => r.applicants, align: 'right' },
    { key: 'featured', header: 'Featured', cell: (r) => (r.featured ? <Badge tone="brand">Featured</Badge> : '-'), csv: (r) => r.featured, hideOnMobile: true },
    { key: 'posted', header: 'Posted', sortValue: (r) => r.createdAt, cell: (r) => formatDate(r.createdAt), csv: (r) => new Date(r.createdAt).toISOString() },
    { key: 'actions', header: 'Actions', isActions: true, cell: jobActions, align: 'right' },
  ];
  const chColumns: Column<ChallengeRow>[] = [
    { key: 'title', header: 'Challenge', sortValue: (r) => r.title.toLowerCase(), cell: (r) => <div className="min-w-0"><p className="truncate font-medium">{r.title}</p><p className="truncate text-xs text-muted-foreground">{r.company ?? 'Unknown company'}</p></div>, csv: (r) => r.title },
    { key: 'state', header: 'State', sortValue: (r) => (r.hidden ? 0 : r.isActive ? 2 : 1), cell: (r) => visibilityBadge(r), csv: (r) => (r.hidden ? 'unpublished' : r.isActive ? 'live' : 'closed') },
    { key: 'subs', header: 'Entries', sortValue: (r) => r.submissions, cell: (r) => r.submissions, csv: (r) => r.submissions, align: 'right' },
    { key: 'deadline', header: 'Deadline', cell: (r) => r.deadline ?? '-', csv: (r) => r.deadline },
    { key: 'featured', header: 'Featured', cell: (r) => (r.featured ? <Badge tone="brand">Featured</Badge> : '-'), csv: (r) => r.featured, hideOnMobile: true },
    { key: 'posted', header: 'Created', sortValue: (r) => r.createdAt, cell: (r) => formatDate(r.createdAt), csv: (r) => new Date(r.createdAt).toISOString() },
    { key: 'actions', header: 'Actions', isActions: true, cell: chActions, align: 'right' },
  ];

  return (
    <>
      <PageHeader
        title="Jobs & challenges"
        description="Moderate employer content. Unpublishing hides an item from the public and stops new applications; employers cannot undo it."
        actions={<Segmented label="Content type" value={tab} onChange={setTab} options={[{ value: 'jobs', label: 'Jobs' }, { value: 'challenges', label: 'Challenges' }]} />}
      />
      {tab === 'jobs' ? (
        <DataTable caption="Jobs" rows={jobs} columns={jobColumns} rowKey={(r) => r.id} searchText={(r) => `${r.title} ${r.company ?? ''}`} searchLabel="Search jobs" pageSize={25} exportName="donjo-jobs" emptyTitle="No jobs posted yet" emptyBody="Employer job posts will be listed here." />
      ) : (
        <DataTable caption="Challenges" rows={challenges} columns={chColumns} rowKey={(r) => r.id} searchText={(r) => `${r.title} ${r.company ?? ''}`} searchLabel="Search challenges" pageSize={25} exportName="donjo-challenges" emptyTitle="No challenges yet" emptyBody="Employer challenges will be listed here." />
      )}

      <ConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title={`Delete ${del?.kind === 'job' ? 'job' : 'challenge'}`}
        description={<>Permanently delete <strong>{del?.title}</strong>{del?.kind === 'job' ? ' and all of its applications' : ' and all of its entries'}? This cannot be undone.</>}
        confirmLabel="Delete permanently"
        destructive
        onConfirm={async () => {
          if (!del) return;
          if (del.kind === 'job') await deleteJob({ jobId: del.id as Id<'jobPostings'> });
          else await deleteChallenge({ challengeId: del.id as Id<'challenges'> });
          toast.success('Deleted');
        }}
      />
    </>
  );
}
