import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState, PageHeader, Panel, Skeleton, statusTone } from '@/components/admin/console/primitives';
import { roleLabel, timeAgo } from '@/components/admin/console/format';
import { cn } from '@/lib/utils';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn('h-4 w-4', i <= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} aria-hidden="true" />
      ))}
    </span>
  );
}

export default function Feedback() {
  useDocumentTitle('Feedback · Admin');
  const [filter, setFilter] = useState<Filter>('pending');
  const rows = useQuery(api.feedback.adminList, filter === 'all' ? {} : { status: filter });
  const moderate = useMutation(api.feedback.moderate);

  const act = async (id: NonNullable<typeof rows>[number]['id'], status: 'approved' | 'rejected') => {
    try {
      await moderate({ id, status });
      toast.success(status === 'approved' ? 'Published as a testimonial' : 'Rejected');
    } catch (e) {
      toast.error(e instanceof Error ? e.message.replace(/^.*Uncaught Error:\s*/s, '').split('\n')[0] : 'Could not update');
    }
  };

  const avg = rows?.length ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1) : null;

  return (
    <>
      <PageHeader
        title="Feedback"
        description="Ratings and comments from members. Nothing is published until you approve it, and only comments the member agreed to share can be approved."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filter feedback">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn('pointer-events-auto h-9 rounded-md border px-3 text-sm font-medium', filter === f.value ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-muted')}
          >
            {f.label}
          </button>
        ))}
        {avg && <span className="ml-auto text-sm text-muted-foreground">Average in view: <strong className="text-foreground">{avg}</strong> / 5 from {rows?.length}</span>}
      </div>

      {rows === undefined ? (
        <Skeleton className="h-40 w-full" />
      ) : rows.length === 0 ? (
        <Panel><EmptyState title="Nothing here yet">Members are asked occasionally how they are enjoying Donjo. Their answers will appear here.</EmptyState></Panel>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars n={r.rating} />
                      <Badge tone={statusTone(r.status === 'approved' ? 'active' : r.status)}>{r.status === 'approved' ? 'published' : r.status}</Badge>
                      {r.allowPublic ? <Badge tone="info">OK to publish</Badge> : <Badge tone="neutral">Private</Badge>}
                    </div>
                    <p className="text-sm font-medium">{r.displayName} <span className="font-normal text-muted-foreground">· {roleLabel(r.role)} · {timeAgo(r.createdAt)}</span></p>
                    {r.comment ? <p className="max-w-2xl whitespace-pre-wrap text-sm">{r.comment}</p> : <p className="text-sm text-muted-foreground">Rating only, no comment.</p>}
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => void act(r.id, 'rejected')} className="pointer-events-auto">Reject</Button>
                      <Button onClick={() => void act(r.id, 'approved')} disabled={!r.allowPublic || !r.comment} title={!r.allowPublic ? 'The member did not agree to publish' : undefined} className="pointer-events-auto">Publish</Button>
                    </div>
                  )}
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
