import { useState } from 'react';
import { useQuery } from 'convex/react';
import { Activity, Eye, Layers, Users } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AreaTrend, BarList, KpiTile } from '@/components/admin/console/Charts';
import { EmptyState, PageHeader, Panel, Segmented, Skeleton } from '@/components/admin/console/primitives';
import { formatNumber, percent, roleLabel } from '@/components/admin/console/format';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

function shortDay(day: string) {
  return new Date(day + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function Analytics() {
  useDocumentTitle('Analytics · Admin');
  const [days, setDays] = useState(30);
  const data = useQuery(api.analytics.summary, { days });
  const funnel = useQuery(api.analytics.funnel, { days });
  const loading = data === undefined;

  return (
    <>
      <PageHeader
        title="Analytics & traffic"
        description="First-party, privacy-friendly analytics. No IP addresses, cookies or personal data are stored; Do Not Track is respected. Days are East Africa Time."
        actions={<Segmented label="Date range" value={days} onChange={setDays} options={RANGES} />}
      />

      {data && !data.hasData && (
        <Panel className="mb-6">
          <EmptyState title="No traffic recorded yet">
            Page views appear here as soon as visitors browse the site. Admin pages are never tracked, and visitors with Do Not Track enabled are excluded.
          </EmptyState>
        </Panel>
      )}
      {data?.truncated && (
        <p role="status" className="mb-4 rounded-xl bg-amber-100 px-4 py-2.5 text-sm text-amber-900">
          Traffic is high: figures are based on the most recent 12,000 events in this window and may under-count the oldest days.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Visitors" loading={loading} icon={<Users className="h-5 w-5" />} value={data && formatNumber(data.totals.visitors)} sub={data && `${data.newVsReturning.new} new · ${data.newVsReturning.returning} returning`} spark={data?.series.map((s) => s.visitors)} />
        <KpiTile label="Page views" loading={loading} icon={<Eye className="h-5 w-5" />} value={data && formatNumber(data.totals.pageviews)} spark={data?.series.map((s) => s.pageviews)} />
        <KpiTile label="Sessions" loading={loading} icon={<Layers className="h-5 w-5" />} value={data && formatNumber(data.totals.sessions)} sub={data && `${data.totals.pagesPerSession} pages per session`} />
        <KpiTile label="Active users" loading={loading} icon={<Activity className="h-5 w-5" />} value={data && `${data.active.dau} / ${data.active.wau} / ${data.active.mau}`} sub="Daily / weekly / monthly" />
      </div>

      <Panel title="Visitors and page views" className="mt-6">
        {loading ? <Skeleton className="h-64 w-full" /> : (
          <AreaTrend data={data.series} xKey="day" xFormatter={shortDay} series={[{ key: 'pageviews', label: 'Page views' }, { key: 'visitors', label: 'Visitors' }]} />
        )}
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Top pages">
          {loading ? <Skeleton className="h-48 w-full" /> : data.topPages.length === 0 ? <p className="text-sm text-muted-foreground">No page views yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Most viewed pages</caption>
                <thead><tr className="text-left text-xs uppercase tracking-wide text-muted-foreground"><th scope="col" className="pb-2 pr-3">Page</th><th scope="col" className="pb-2 pr-3 text-right">Views</th><th scope="col" className="pb-2 text-right">Visitors</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {data.topPages.map((p) => (
                    <tr key={p.path}><td className="max-w-[16rem] truncate py-2 pr-3 font-mono text-xs">{p.path}</td><td className="py-2 pr-3 text-right font-mono">{p.views}</td><td className="py-2 text-right font-mono">{p.visitors}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Referrers">
          {loading ? <Skeleton className="h-48 w-full" /> : <BarList items={data.referrers} empty="No referrer data yet" />}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Devices">{loading ? <Skeleton className="h-32 w-full" /> : <BarList items={data.devices} empty="No data yet" />}</Panel>
        <Panel title="Browsers">{loading ? <Skeleton className="h-32 w-full" /> : <BarList items={data.browsers} empty="No data yet" />}</Panel>
        <Panel title="Operating systems">{loading ? <Skeleton className="h-32 w-full" /> : <BarList items={data.operatingSystems} empty="No data yet" />}</Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Visitors by country (approximate)" description="Inferred from each browser's timezone setting, not from IP addresses. Shared timezones (e.g. East Africa) can blur neighbouring countries.">
          {loading ? <Skeleton className="h-40 w-full" /> : <BarList items={data.countries} empty="No timezone data yet" />}
        </Panel>
        <Panel title="Languages and campaigns">
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Browser language</p>
                <BarList items={data.languages} empty="No data yet" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">UTM source</p>
                <BarList items={data.utmSources} empty="No tagged campaign traffic yet" />
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        className="mt-6"
        title="Signup funnel"
        description="Visit and sign-in-page counts come from analytics; the remaining stages are exact database counts for accounts created in the same window. They are period totals, not a per-visitor cohort."
      >
        {funnel === undefined ? <Skeleton className="h-40 w-full" /> : (
          <ol className="space-y-3">
            {funnel.stages.map((s, i) => {
              const top = funnel.stages[0].count;
              return (
                <li key={s.key}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-foreground">{i + 1}. {s.label}</span>
                    <span className="font-mono text-muted-foreground">{s.count.toLocaleString('en-GB')}{i === 1 && top ? ` · ${percent(s.count, top)} of visitors` : i >= 3 && funnel.stages[2].count ? ` · ${percent(s.count, funnel.stages[2].count)} of signups` : ''}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                    <div className="h-full rounded-full bg-[hsl(var(--brand-strong))]" style={{ width: `${Math.min(100, (s.count / Math.max(top, funnel.stages[2].count, 1)) * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {funnel?.cappedUsers && <p className="mt-3 text-xs text-muted-foreground">Signup stages are capped at the 500 most recent accounts in this window.</p>}
      </Panel>

      <Panel className="mt-6" title="Conversion by role" description="Of accounts created in this window, how many finished their profile and took a first action (uploaded a video, applied, posted a job, submitted a venture or challenge entry).">
        {funnel === undefined ? <Skeleton className="h-32 w-full" /> : funnel.byRole.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts were created in this window.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Conversion by role</caption>
              <thead><tr className="text-left text-xs uppercase tracking-wide text-muted-foreground"><th scope="col" className="pb-2 pr-3">Role</th><th scope="col" className="pb-2 pr-3 text-right">Signups</th><th scope="col" className="pb-2 pr-3 text-right">Profile complete</th><th scope="col" className="pb-2 text-right">First action</th></tr></thead>
              <tbody className="divide-y divide-border">
                {funnel.byRole.map((r) => (
                  <tr key={r.role}>
                    <td className="py-2 pr-3">{roleLabel(r.role)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{r.signups}</td>
                    <td className="py-2 pr-3 text-right font-mono">{r.profileComplete} <span className="text-muted-foreground">({percent(r.profileComplete, r.signups)})</span></td>
                    <td className="py-2 text-right font-mono">{r.firstAction} <span className="text-muted-foreground">({percent(r.firstAction, r.signups)})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
