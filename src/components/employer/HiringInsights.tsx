import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { KenyaTileMap } from '@/components/admin/console/KenyaTileMap';
import { NeoCard } from '@/components/ui/neo-card';

const fmt = (n: number | null) => (n === null ? 'No data yet' : `${n} ${n === 1 ? 'day' : 'days'}`);

/** Employer-facing insight: how fast decisions are made and where applicants are. Real data only. */
export function HiringInsights() {
  const times = useQuery(api.employerInsights.decisionTimes, {});
  const geo = useQuery(api.employerInsights.applicantCounties, {});
  const [selected, setSelected] = useState<string | null>(null);

  if (times === undefined || geo === undefined) return null;

  const picked = selected ? geo.counties.find((c) => c.county === selected)?.count ?? 0 : null;

  return (
    <section aria-labelledby="insights-heading" className="space-y-6">
      <h2 id="insights-heading" className="text-lg font-semibold text-charcoal">Hiring insights</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <NeoCard className="p-6">
          <p className="text-sm text-cool-grey">Average time to decision</p>
          <p className="mt-2 text-3xl font-bold text-charcoal" data-testid="avg-decision">{fmt(times.averageDays)}</p>
          <p className="mt-2 text-xs text-cool-grey">
            From application to shortlist or reject, across {times.decided} decided {times.decided === 1 ? 'application' : 'applications'}
            {times.undecided > 0 ? `. ${times.undecided} still waiting for a decision.` : '.'}
          </p>
        </NeoCard>
        <NeoCard className="p-6">
          <p className="text-sm text-cool-grey">Median</p>
          <p className="mt-2 text-3xl font-bold text-charcoal">{fmt(times.medianDays)}</p>
          <p className="mt-2 text-xs text-cool-grey">Half of your decisions were faster than this.</p>
        </NeoCard>
        <NeoCard className="p-6">
          <p className="text-sm text-cool-grey">Fastest and slowest</p>
          <p className="mt-2 text-3xl font-bold text-charcoal">
            {times.fastestDays === null ? 'No data yet' : `${times.fastestDays} to ${times.slowestDays} days`}
          </p>
          <p className="mt-2 text-xs text-cool-grey">Measured from recorded status changes only.</p>
        </NeoCard>
      </div>

      {times.byJob.length > 0 && (
        <NeoCard className="p-6">
          <h3 className="text-sm font-semibold text-charcoal">By job</h3>
          <ul className="mt-3 divide-y divide-border/50 text-sm">
            {times.byJob.map((j) => (
              <li key={j.jobId} className="flex items-center justify-between gap-4 py-2">
                <span className="truncate text-charcoal">{j.title}</span>
                <span className="shrink-0 text-cool-grey">{fmt(j.averageDays)} &middot; {j.decided} decided</span>
              </li>
            ))}
          </ul>
        </NeoCard>
      )}

      <NeoCard className="p-6">
        <h3 className="text-sm font-semibold text-charcoal">Where your applicants are</h3>
        {geo.total === 0 ? (
          <p className="mt-3 text-sm text-cool-grey">Applicant locations appear here once people apply to your jobs.</p>
        ) : (
          <>
            <p className="mt-1 text-xs text-cool-grey">
              {geo.inKenya} in Kenya, {geo.outsideKenya} outside Kenya, {geo.unknown} with no location set. Counties come from what each applicant entered on their profile.
            </p>
            <div className="mt-4 overflow-x-auto">
              <KenyaTileMap counts={geo.counties} selected={selected} onSelect={setSelected} unit="applicants" />
            </div>
            {selected && (
              <p className="mt-3 text-sm text-charcoal" aria-live="polite">
                {selected}: {picked} {picked === 1 ? 'applicant' : 'applicants'}
              </p>
            )}
          </>
        )}
      </NeoCard>
    </section>
  );
}
