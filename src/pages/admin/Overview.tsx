import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { Bell, Briefcase, ClipboardCheck, MessageSquare, Trophy, UserPlus, Users, Video } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BarList, KpiTile } from '@/components/admin/console/Charts';
import { EmptyState, PageHeader, Panel, Skeleton } from '@/components/admin/console/primitives';
import { formatNumber, roleLabel, timeAgo } from '@/components/admin/console/format';

export default function Overview() {
  useDocumentTitle('Overview · Admin');
  const stats = useQuery(api.adminOverview.stats, {});
  const activity = useQuery(api.adminOverview.activity, {});
  const loading = stats === undefined;

  const roles = stats
    ? Object.entries(stats.users.byRole).map(([name, count]) => ({ name: roleLabel(name), count })).sort((a, b) => b.count - a.count)
    : [];
  const ventureStatuses = stats
    ? Object.entries(stats.ventures.byStatus).map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count })).sort((a, b) => b.count - a.count)
    : [];

  return (
    <>
      <PageHeader title="Overview" description="Live counts across the platform. Everything here updates as it happens." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Users"
          loading={loading}
          icon={<Users className="h-5 w-5" />}
          value={stats && formatNumber(stats.users.total.count, stats.users.total.capped)}
          sub={stats && `+${stats.users.last7d} in 7 days · +${stats.users.last30d} in 30 days`}
          spark={stats?.users.signupSeries.map((d) => d.count)}
        />
        <KpiTile
          label="Ventures pending review"
          loading={loading}
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone={stats && stats.attention.pendingReviews > 0 ? 'attention' : 'default'}
          value={stats && stats.attention.pendingReviews}
          sub={
            stats &&
            (stats.attention.pendingReviews === 0
              ? 'All caught up'
              : `Oldest waiting ${timeAgo(stats.attention.oldestPendingAt).replace(' ago', '')}`)
          }
        />
        <KpiTile
          label="Active jobs"
          loading={loading}
          icon={<Briefcase className="h-5 w-5" />}
          value={stats && formatNumber(stats.jobs.active.count, stats.jobs.active.capped)}
          sub={stats && `${formatNumber(stats.jobs.applications.count, stats.jobs.applications.capped)} applications`}
        />
        <KpiTile
          label="Challenges"
          loading={loading}
          icon={<Trophy className="h-5 w-5" />}
          value={stats && formatNumber(stats.challenges.active.count, stats.challenges.active.capped)}
          sub={stats && `${formatNumber(stats.challenges.submissions.count, stats.challenges.submissions.capped)} submissions`}
        />
        <KpiTile
          label="Videos"
          loading={loading}
          icon={<Video className="h-5 w-5" />}
          value={stats && formatNumber(stats.videos.count, stats.videos.capped)}
        />
        <KpiTile
          label="Conversations"
          loading={loading}
          icon={<MessageSquare className="h-5 w-5" />}
          value={stats && formatNumber(stats.messaging.conversations.count, stats.messaging.conversations.capped)}
          sub={stats && `${formatNumber(stats.messaging.messages.count, stats.messaging.messages.capped)} messages`}
        />
        <KpiTile
          label="Unread notifications"
          loading={loading}
          icon={<Bell className="h-5 w-5" />}
          value={stats && formatNumber(stats.unreadNotifications.count, stats.unreadNotifications.capped)}
          sub="Across all users"
        />
        <KpiTile
          label="Signups (14 days)"
          loading={loading}
          icon={<UserPlus className="h-5 w-5" />}
          value={stats && stats.users.signupSeries.reduce((a, b) => a + b.count, 0)}
          spark={stats?.users.signupSeries.map((d) => d.count)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Users by role">
          {loading ? <Skeleton className="h-32 w-full" /> : <BarList items={roles} empty="No users yet" />}
        </Panel>
        <Panel title="Ventures by review status" action={<Link to="/admin/review" className="text-sm font-medium text-[hsl(var(--brand-strong))] hover:underline">Open queue</Link>}>
          {loading ? <Skeleton className="h-32 w-full" /> : <BarList items={ventureStatuses} empty="No ventures submitted yet" />}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="New signups">
          {activity === undefined ? <Skeleton className="h-40 w-full" /> : activity.signups.length === 0 ? (
            <EmptyState title="No signups yet">New accounts will appear here.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {activity.signups.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate text-foreground">{s.who}<span className="ml-2 text-muted-foreground">{roleLabel(s.role)}</span></span>
                  <span className="shrink-0 text-muted-foreground">{timeAgo(s.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recent applications">
          {activity === undefined ? <Skeleton className="h-40 w-full" /> : activity.applications.length === 0 ? (
            <EmptyState title="No applications yet">Job applications will appear here.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {activity.applications.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate text-foreground">{a.who}<span className="ml-2 text-muted-foreground">for {a.job}</span></span>
                  <span className="shrink-0 text-muted-foreground">{timeAgo(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Review decisions">
          {activity === undefined ? <Skeleton className="h-40 w-full" /> : activity.reviews.length === 0 ? (
            <EmptyState title="No review decisions yet">Shortlists and rejections will be listed here.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {activity.reviews.map((r, i) => (
                <li key={i} className="py-2.5 text-sm">
                  <p className="text-foreground">{r.detail}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(r.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
