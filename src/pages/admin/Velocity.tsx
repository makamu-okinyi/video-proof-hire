import { useQuery } from 'convex/react';
import { Clock, Hourglass, ListChecks } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BarList, ColumnBars, KpiTile } from '@/components/admin/console/Charts';
import { EmptyState, PageHeader, Panel, Skeleton } from '@/components/admin/console/primitives';
import { formatDate, formatHours } from '@/components/admin/console/format';

const weekLabel = (v: string) => formatDate(Number(v)).replace(/ \d{4}$/, '');

export default function Velocity() {
  useDocumentTitle('Pipeline velocity · Admin');
  const v = useQuery(api.adminVelocity.ventures, {});
  const a = useQuery(api.adminVelocity.applications, {});

  return (
    <>
      <PageHeader
        title="Pipeline velocity"
        description="How quickly decisions are made, computed only from recorded status changes. Figures appear as soon as there are decisions to measure."
      />

      <h2 className="mb-3 text-lg font-semibold">Venture review</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Median time to decision" loading={!v} icon={<Clock className="h-5 w-5" />} value={v && formatHours(v.medianHoursToDecision)} sub={v && v.decided === 0 ? 'No decisions yet' : v && `Across ${v.decided} decided`} />
        <KpiTile label="Mean time to decision" loading={!v} value={v && formatHours(v.meanHoursToDecision)} />
        <KpiTile label="Awaiting review" loading={!v} icon={<Hourglass className="h-5 w-5" />} value={v?.pending} />
        <KpiTile label="Decided" loading={!v} icon={<ListChecks className="h-5 w-5" />} value={v && v.decided} sub={v && `of ${v.total} submitted`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Stage funnel">
          {!v ? <Skeleton className="h-40 w-full" /> : v.total === 0 ? <EmptyState title="No ventures submitted yet">The funnel fills in as founders submit.</EmptyState> : (
            <BarList items={v.funnel.map((f) => ({ name: f.label, count: f.count }))} total={v.total} />
          )}
        </Panel>
        <Panel title="Waiting time of pending ventures">
          {!v ? <Skeleton className="h-40 w-full" /> : v.pending === 0 ? <EmptyState title="Nothing is waiting">Every submitted venture has been decided.</EmptyState> : (
            <BarList items={v.aging.map((b) => ({ name: b.label, count: b.count }))} total={v.pending} />
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Decisions per week" description="Last 12 weeks">
          {!v ? <Skeleton className="h-52 w-full" /> : v.decided === 0 ? <EmptyState title="No decisions yet">Weekly decision counts appear after the first shortlist or rejection.</EmptyState> : (
            <ColumnBars data={v.decisionsPerWeek.map((w) => ({ week: String(w.weekStart), count: w.count }))} xKey="week" yKey="count" label="Decisions" xFormatter={weekLabel} />
          )}
        </Panel>
        <Panel title="Reviewer throughput">
          {!v ? <Skeleton className="h-52 w-full" /> : v.reviewers.length === 0 ? <EmptyState title="No reviewer activity yet">Each reviewer's decisions and median speed will be listed here.</EmptyState> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Decisions per reviewer</caption>
                <thead><tr className="text-left text-xs uppercase tracking-wide text-muted-foreground"><th scope="col" className="pb-2 pr-3">Reviewer</th><th scope="col" className="pb-2 pr-3 text-right">Decisions</th><th scope="col" className="pb-2 text-right">Median time</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {v.reviewers.map((r) => (
                    <tr key={r.reviewer}><td className="py-2 pr-3">{r.reviewer}</td><td className="py-2 pr-3 text-right font-mono">{r.decisions}</td><td className="py-2 text-right font-mono">{formatHours(r.medianHours)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold">Job applications</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Median time to response" loading={!a} value={a && formatHours(a.medianHoursToResponse)} sub={a && a.responded === 0 ? 'No employer responses yet' : a && `Across ${a.responded} responded`} />
        <KpiTile label="Mean time to response" loading={!a} value={a && formatHours(a.meanHoursToResponse)} />
        <KpiTile label="Awaiting response" loading={!a} value={a?.pending} />
        <KpiTile label="Applications" loading={!a} value={a?.total} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Waiting time of unanswered applications">
          {!a ? <Skeleton className="h-40 w-full" /> : a.pending === 0 ? <EmptyState title="No unanswered applications">Every application has had a response.</EmptyState> : (
            <BarList items={a.aging.map((b) => ({ name: b.label, count: b.count }))} total={a.pending} />
          )}
        </Panel>
        <Panel title="Employer responses per week" description="Last 12 weeks">
          {!a ? <Skeleton className="h-52 w-full" /> : a.responded === 0 ? <EmptyState title="No responses yet">Shortlists and rejections by employers will be charted here.</EmptyState> : (
            <ColumnBars data={a.responsesPerWeek.map((w) => ({ week: String(w.weekStart), count: w.count }))} xKey="week" yKey="count" label="Responses" xFormatter={weekLabel} />
          )}
        </Panel>
      </div>
    </>
  );
}
