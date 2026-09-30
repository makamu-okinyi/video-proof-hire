import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { KenyaTileMap } from '@/components/admin/console/KenyaTileMap';
import { KpiTile } from '@/components/admin/console/Charts';
import { EmptyState, PageHeader, Panel, Segmented, Skeleton } from '@/components/admin/console/primitives';
import { percent } from '@/components/admin/console/format';
import { Button } from '@/components/ui/button';
import { downloadCsv } from '@/components/admin/console/csv';

type Kind = 'applicants' | 'ventures' | 'employers';
const KINDS: { value: Kind; label: string }[] = [
  { value: 'applicants', label: 'Applicants' },
  { value: 'ventures', label: 'Ventures' },
  { value: 'employers', label: 'Employers' },
];

export default function Geography() {
  useDocumentTitle('Geography · Admin');
  const [kind, setKind] = useState<Kind>('applicants');
  const [county, setCounty] = useState<string | null>(null);
  const data = useQuery(api.adminGeo.distribution, { kind });

  const ranked = useMemo(
    () => (data ? [...data.counties].filter((c) => c.count > 0).sort((a, b) => b.count - a.count) : []),
    [data],
  );
  const known = data ? data.inKenya + data.outsideKenya : 0;

  return (
    <>
      <PageHeader
        title="Geography"
        description="Where people and ventures are, based on the location they entered themselves. Nothing is estimated: anyone without a location counts as unknown."
        actions={<Segmented label="Show" value={kind} onChange={(k) => { setKind(k); setCounty(null); }} options={KINDS} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label={`Total ${kind}`} loading={!data} value={data?.total} />
        <KpiTile label="In Kenya" loading={!data} value={data?.inKenya} sub={data && percent(data.inKenya, data.total) + ' of total'} />
        <KpiTile label="Outside Kenya" loading={!data} value={data?.outsideKenya} sub={data && percent(data.outsideKenya, data.total) + ' of total'} />
        <KpiTile label="Location unknown" loading={!data} value={data?.unknown} sub={data && (data.total ? `${percent(data.unknown, data.total)} have not set one` : undefined)} tone={data && data.total > 0 && data.unknown / data.total > 0.5 ? 'attention' : 'default'} />
      </div>

      {data && data.total === 0 && (
        <Panel className="mt-6"><EmptyState title={`No ${kind} yet`}>Once people join and add their county, the map fills in.</EmptyState></Panel>
      )}
      {data && data.total > 0 && known === 0 && (
        <p role="status" className="mt-6 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          Nobody has shared a location yet. Counties are asked for during signup, on profile edit and in the venture wizard, so the map will populate as people fill them in.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="County map" description="One tile per county (not to scale). Select a tile to focus it.">
          {!data ? <Skeleton className="h-96 w-full" /> : (
            <KenyaTileMap counts={data.counties} selected={county} onSelect={setCounty} unit={kind} />
          )}
        </Panel>

        <Panel
          title={county ? county : 'Ranked counties'}
          description={county ? undefined : 'Counties with at least one entry.'}
          action={
            <div className="flex gap-2">
              {county && <Button variant="ghost" size="sm" onClick={() => setCounty(null)} className="pointer-events-auto">Show all</Button>}
              {data && (
                <Button
                  variant="outline"
                  size="sm"
                  className="pointer-events-auto"
                  onClick={() => downloadCsv(`donjo-${kind}-by-county`, ['County', 'Count'], [...data.counties.map((c) => [c.county, c.count] as [string, number]), ['Outside Kenya', data.outsideKenya], ['Unknown', data.unknown]])}
                >
                  Export CSV
                </Button>
              )}
            </div>
          }
        >
          {!data ? <Skeleton className="h-64 w-full" /> : county ? (
            <p className="text-sm">
              <span className="font-mono text-3xl font-semibold">{data.counties.find((c) => c.county === county)?.count ?? 0}</span>{' '}
              <span className="text-muted-foreground">{kind} in {county} ({percent(data.counties.find((c) => c.county === county)?.count ?? 0, data.inKenya)} of those mapped in Kenya)</span>
            </p>
          ) : ranked.length === 0 ? (
            <p className="text-sm text-muted-foreground">No county data yet.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Counties ranked by count</caption>
                <thead className="sticky top-0 bg-[hsl(var(--popover))]"><tr className="text-left text-xs uppercase tracking-wide text-muted-foreground"><th scope="col" className="py-2 pr-3">#</th><th scope="col" className="py-2 pr-3">County</th><th scope="col" className="py-2 pr-3 text-right">Count</th><th scope="col" className="py-2 text-right">Share</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {ranked.map((c, i) => (
                    <tr key={c.county} className="cursor-pointer hover:bg-accent/40" onClick={() => setCounty(c.county)}>
                      <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 pr-3"><button type="button" onClick={() => setCounty(c.county)} className="text-left hover:underline">{c.county}</button></td>
                      <td className="py-2 pr-3 text-right font-mono">{c.count}</td>
                      <td className="py-2 text-right font-mono text-muted-foreground">{percent(c.count, data.inKenya)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.countries.length > 0 && !county && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outside Kenya</p>
              <ul className="space-y-1 text-sm">
                {data.countries.map((c) => (
                  <li key={c.country} className="flex justify-between"><span>{c.country}</span><span className="font-mono">{c.count}</span></li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
