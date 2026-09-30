import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { Fingerprint, HardDrive, ShieldCheck } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { ChangePasswordPanel } from '@/components/settings/ChangePasswordPanel';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { KpiTile } from '@/components/admin/console/Charts';
import { DataTable, type Column } from '@/components/admin/console/DataTable';
import { Badge, PageHeader, Panel, Skeleton, statusTone } from '@/components/admin/console/primitives';
import { formatBytes, formatDateTime, formatNumber, timeAgo } from '@/components/admin/console/format';

type Entry = NonNullable<ReturnType<typeof useAudit>>['entries'][number];
function useAudit(args: { actor?: string; action?: string; from?: number; to?: number }) {
  return useQuery(api.adminSystem.auditLog, args);
}

function AuditLog() {
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const data = useAudit({
    actor: actor || undefined,
    action: action || undefined,
    from: from ? new Date(from + 'T00:00:00').getTime() : undefined,
    to: to ? new Date(to + 'T23:59:59').getTime() : undefined,
  });

  const columns: Column<Entry>[] = [
    { key: 'at', header: 'When', sortValue: (r) => r.at, cell: (r) => <span className="whitespace-nowrap">{formatDateTime(r.at)}</span>, csv: (r) => new Date(r.at).toISOString() },
    { key: 'actor', header: 'Actor', sortValue: (r) => r.actor ?? '', cell: (r) => r.actor ?? r.userId, csv: (r) => r.actor ?? r.userId },
    { key: 'action', header: 'Action', sortValue: (r) => r.action, cell: (r) => <Badge tone={statusTone(r.action)}>{r.action.replace(/_/g, ' ')}</Badge>, csv: (r) => r.action },
    { key: 'detail', header: 'Detail', cell: (r) => <span className="break-words text-muted-foreground">{r.detail ?? '-'}</span>, csv: (r) => r.detail },
    { key: 'ua', header: 'Browser', cell: () => null, csv: (r) => r.userAgent, csvOnly: true },
  ];

  return (
    <Panel title="Audit log" description="Every privileged action, newest first. Entries cannot be edited or deleted from the console.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Actor">
          <Select aria-label="Actor" placeholder="Anyone" value={actor} onValueChange={setActor} clearable options={(data?.actors ?? []).map((a) => ({ value: a.id, label: a.label }))} />
        </Field>
        <Field label="Action">
          <Select aria-label="Action" placeholder="Any action" value={action} onValueChange={setAction} clearable options={(data?.actions ?? []).map((a) => ({ value: a, label: a.replace(/_/g, ' ') }))} />
        </Field>
        <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={to || undefined} /></Field>
        <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from || undefined} /></Field>
      </div>
      <DataTable caption="Audit log" rows={data?.entries} columns={columns} rowKey={(r) => r.id} pageSize={25} exportName="donjo-audit-log" emptyTitle="No audit entries" emptyBody="Admin sign-ins and actions are recorded here." />
    </Panel>
  );
}

function RetentionSettings() {
  const settings = useQuery(api.analytics.getSettings, {});
  const setDays = useMutation(api.analytics.setRetentionDays);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (settings) setValue(String(settings.retentionDays)); }, [settings]);
  const n = Number(value);
  const error = value !== '' && (!Number.isInteger(n) || n < 7 || n > 730) ? 'Enter a whole number of days from 7 to 730' : undefined;
  return (
    <Panel title="Analytics retention" description="Traffic events older than this are deleted automatically (checked every few hours).">
      {settings === undefined ? <Skeleton className="h-16 w-full" /> : (
        <form className="flex flex-wrap items-end gap-3" onSubmit={async (e) => {
          e.preventDefault();
          if (error) return;
          setBusy(true);
          try { await setDays({ days: n }); toast.success('Retention updated'); } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not update'); } finally { setBusy(false); }
        }}>
          <div className="w-48"><Field label="Keep events for (days)" error={error}><Input type="number" min={7} max={730} value={value} onChange={(e) => setValue(e.target.value)} /></Field></div>
          <Button type="submit" disabled={busy || !!error || n === settings.retentionDays} className="pointer-events-auto">Save</Button>
        </form>
      )}
    </Panel>
  );
}

export default function System() {
  useDocumentTitle('System & security · Admin');
  const security = useQuery(api.adminSystem.adminSecurity, {});
  const health = useQuery(api.adminSystem.health, {});

  return (
    <>
      <PageHeader title="System & security" description="Audit trail, admin account hygiene and platform health." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiTile label="Admins" loading={!security} icon={<ShieldCheck className="h-5 w-5" />} value={security?.total} />
        <KpiTile
          label="Admins with a passkey"
          loading={!security}
          icon={<Fingerprint className="h-5 w-5" />}
          value={security && `${security.withPasskey} / ${security.total}`}
          sub={security && (security.withPasskey < security.total ? 'Encourage the rest to add one in Account settings' : 'Full coverage')}
          tone={security && security.withPasskey < security.total ? 'attention' : 'default'}
        />
        <KpiTile label="File storage" loading={!health} icon={<HardDrive className="h-5 w-5" />} value={health && formatBytes(health.storage.bytes)} sub={health && `${formatNumber(health.storage.files, health.storage.capped)} files`} />
      </div>

      <Panel title="Admin accounts" className="mt-6">
        {!security ? <Skeleton className="h-24 w-full" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Admin accounts</caption>
              <thead><tr className="text-left text-xs uppercase tracking-wide text-muted-foreground"><th scope="col" className="pb-2 pr-3">Admin</th><th scope="col" className="pb-2 pr-3">Last sign-in</th><th scope="col" className="pb-2 pr-3 text-right">Passkeys</th><th scope="col" className="pb-2 text-right">Active sessions</th></tr></thead>
              <tbody className="divide-y divide-border">
                {security.admins.map((a) => (
                  <tr key={a.userId}>
                    <td className="py-2 pr-3">{a.email ?? a.userId}</td>
                    <td className="py-2 pr-3">{timeAgo(a.lastSignIn)}</td>
                    <td className="py-2 pr-3 text-right">{a.passkeys > 0 ? <Badge tone="success">{a.passkeys}</Badge> : <Badge tone="warning">None</Badge>}</td>
                    <td className="py-2 text-right font-mono">{a.activeSessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Change password" description="Other devices are signed out when you change it." className="mt-6">
        <div className="max-w-md"><ChangePasswordPanel /></div>
      </Panel>

      <div className="mt-6"><AuditLog /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RetentionSettings />
        <Panel title="Data footprint" description="Rows per table (capped at 10,000 per table).">
          {!health ? <Skeleton className="h-40 w-full" /> : (
            <ul className="grid grid-cols-1 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
              {health.tables.map((t) => (
                <li key={t.table} className="flex justify-between gap-3"><span className="text-muted-foreground">{t.table}</span><span className="font-mono">{formatNumber(t.count, t.capped)}</span></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
