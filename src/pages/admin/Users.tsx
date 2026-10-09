import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { KeyRound, Pencil, ShieldPlus, Trash2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/admin/console/DataTable';
import { ConfirmDialog, Drawer } from '@/components/admin/console/Overlays';
import { Badge, PageHeader, Skeleton, statusTone } from '@/components/admin/console/primitives';
import { formatDate, formatDateTime, roleLabel, timeAgo } from '@/components/admin/console/format';

type UserRow = NonNullable<ReturnType<typeof useUsersData>>['rows'][number];
function useUsersData() {
  return useQuery(api.adminUsers.list, {});
}

const ROLE_OPTIONS = ['talent', 'employer', 'founder', 'investor', 'judge'].map((r) => ({ value: r, label: roleLabel(r) }));

function errText(e: unknown) {
  return e instanceof Error ? e.message.replace(/^.*Uncaught Error:\s*/s, '').split('\n')[0] : 'Something went wrong';
}

function UserDrawer({ userId, onClose }: { userId: Id<'users'> | null; onClose: () => void }) {
  const detail = useQuery(api.adminUsers.detail, userId ? { userId } : 'skip');
  const setRole = useMutation(api.adminUsers.setRole);
  const setStatus = useMutation(api.adminUsers.setStatus);
  const revokeAdmin = useMutation(api.adminUsers.revokeAdmin);
  const updateUser = useMutation(api.adminUsers.updateUser);
  const deleteUser = useMutation(api.adminUsers.deleteUser);
  const resetPassword = useAction(api.adminUsers.resetPassword);
  const [form, setForm] = useState({ fullName: '', username: '', companyName: '', email: '' });
  const [newPassword, setNewPassword] = useState('');
  const [typed, setTyped] = useState('');
  const [role, setRoleState] = useState('');
  const [confirm, setConfirm] = useState<null | 'suspend' | 'reactivate' | 'role' | 'revoke' | 'edit' | 'password' | 'delete'>(null);

  useEffect(() => {
    if (detail?.profile) setRoleState(detail.profile.role);
  }, [detail?.profile?.role]);

  useEffect(() => {
    if (confirm === 'edit' && detail) {
      setForm({
        fullName: detail.profile?.fullName ?? '',
        username: detail.profile?.username ?? '',
        companyName: detail.profile?.companyName ?? '',
        email: detail.email ?? '',
      });
    }
    if (confirm === 'password') setNewPassword('');
    if (confirm === 'delete') setTyped('');
  }, [confirm, detail]);

  const isAdminUser = detail?.profile?.role === 'admin';
  const suspended = detail?.profile?.status === 'suspended';

  return (
    <Drawer open={!!userId} onOpenChange={(o) => !o && onClose()} title={detail?.profile?.fullName || detail?.profile?.username || detail?.email || 'User'} description={detail?.email ?? undefined}>
      {detail === undefined ? (
        <div className="space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-32 w-full" /></div>
      ) : detail === null ? (
        <p className="text-sm text-muted-foreground">This user no longer exists.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{roleLabel(detail.profile?.role ?? 'unassigned')}</Badge>
            <Badge tone={statusTone(detail.profile?.status ?? 'active')}>{detail.profile?.status ?? 'active'}</Badge>
            {detail.plan && <Badge tone="info">Plan: {detail.plan}</Badge>}
          </div>

          {suspended && (
            <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-900">
              Suspended {timeAgo(detail.profile?.suspendedAt)}: {detail.profile?.suspendedReason}
            </p>
          )}

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Joined</dt><dd className="text-right">{formatDateTime(detail.createdAt)}</dd>
            <dt className="text-muted-foreground">Last seen</dt><dd className="text-right">{timeAgo(detail.profile?.lastSeenAt)}</dd>
            <dt className="text-muted-foreground">Location</dt>
            <dd className="text-right">{detail.profile?.county ? `${detail.profile.county}, Kenya` : detail.profile?.country || 'Not set'}</dd>
            {detail.profile?.companyName && (<><dt className="text-muted-foreground">Company</dt><dd className="text-right">{detail.profile.companyName}</dd></>)}
            {isAdminUser && (<><dt className="text-muted-foreground">Last admin sign-in</dt><dd className="text-right">{formatDateTime(detail.lastAdminSignIn)}</dd></>)}
          </dl>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Activity</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                ['Videos', detail.counts.videos],
                ['Applications', detail.counts.applications],
                ['Job posts', detail.counts.jobPosts],
                ['Ventures', detail.counts.ventures],
                ['Challenge entries', detail.counts.challengeSubmissions],
                ['Passkeys', detail.counts.passkeys],
                ['Active sessions', detail.counts.activeSessions],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-xl bg-[hsl(var(--muted))] px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-mono text-lg">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {!isAdminUser && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Role</h3>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select aria-label="Role" value={role} onValueChange={setRoleState} options={ROLE_OPTIONS} />
                </div>
                <Button variant="outline" disabled={!role || role === detail.profile?.role} onClick={() => setConfirm('role')} className="pointer-events-auto">
                  Change role
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3 border-t border-border pt-5">
            <h3 className="text-sm font-semibold">Account access</h3>
            {isAdminUser ? (
              <Button variant="destructive" onClick={() => setConfirm('revoke')} className="pointer-events-auto">Revoke admin access</Button>
            ) : suspended ? (
              <Button onClick={() => setConfirm('reactivate')} className="pointer-events-auto">Reactivate account</Button>
            ) : (
              <Button variant="destructive" onClick={() => setConfirm('suspend')} className="pointer-events-auto">Suspend account</Button>
            )}
            <p className="text-xs text-muted-foreground">
              Suspending signs the user out everywhere and blocks them from using the platform until reactivated.
            </p>
          </div>

          {!isAdminUser && (
            <div className="space-y-3 border-t border-border pt-5">
              <h3 className="text-sm font-semibold">Manage account</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setConfirm('edit')} className="pointer-events-auto"><Pencil className="mr-2 h-4 w-4" aria-hidden="true" />Edit details</Button>
                <Button variant="outline" onClick={() => setConfirm('password')} className="pointer-events-auto"><KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />Reset password</Button>
                <Button variant="destructive" onClick={() => setConfirm('delete')} className="pointer-events-auto"><Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />Delete user</Button>
              </div>
              <p className="text-xs text-muted-foreground">Deleting permanently removes the account and all of its data. Resetting a password signs the user out everywhere.</p>
            </div>
          )}

          <ConfirmDialog
            open={confirm === 'edit'}
            onOpenChange={(o) => !o && setConfirm(null)}
            title="Edit user"
            description={
              <div className="space-y-3">
                <Field label="Full name"><Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} maxLength={100} /></Field>
                <Field label={detail.profile?.role === 'employer' ? 'Display name' : 'Username'}><Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} maxLength={50} autoComplete="off" /></Field>
                {detail.profile?.role === 'employer' && (
                  <Field label="Company name"><Input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} maxLength={100} /></Field>
                )}
                <Field label="Sign-in email"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} autoComplete="off" /></Field>
              </div>
            }
            confirmLabel="Save changes"
            onConfirm={async () => {
              await updateUser({
                userId: detail.id,
                fullName: form.fullName,
                username: form.username,
                email: form.email,
                ...(detail.profile?.role === 'employer' ? { companyName: form.companyName } : {}),
              });
              toast.success('User updated');
            }}
          />
          <ConfirmDialog
            open={confirm === 'password'}
            onOpenChange={(o) => !o && setConfirm(null)}
            title="Reset password"
            description={
              <div className="space-y-3">
                <p>Set a new password for this user and share it with them securely. They are signed out everywhere and can change it in settings.</p>
                <Field label="New password" hint="At least 8 characters.">
                  <div className="flex gap-2">
                    <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="off" />
                    <Button type="button" variant="outline" className="pointer-events-auto" onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
                      const buf = new Uint32Array(12);
                      crypto.getRandomValues(buf);
                      setNewPassword(Array.from(buf, (n) => chars[n % chars.length]).join(''));
                    }}>Generate</Button>
                  </div>
                </Field>
              </div>
            }
            confirmLabel="Set password"
            onConfirm={async () => {
              if (newPassword.length < 8) throw new Error('Use at least 8 characters');
              await resetPassword({ userId: detail.id, newPassword });
              toast.success('Password updated. Share it with the user securely.');
            }}
          />
          <ConfirmDialog
            open={confirm === 'delete'}
            onOpenChange={(o) => !o && setConfirm(null)}
            title="Delete user"
            description={
              <div className="space-y-3">
                <p>This permanently deletes <strong>{detail.email ?? 'this user'}</strong> and all their videos, applications and other data. It cannot be undone.</p>
                <Field label="Type DELETE to confirm"><Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" /></Field>
              </div>
            }
            confirmLabel="Delete permanently"
            destructive
            onConfirm={async () => {
              if (typed !== 'DELETE') throw new Error('Type DELETE (in capitals) to confirm');
              await deleteUser({ userId: detail.id, confirm: 'DELETE' });
              toast.success('User deleted');
              onClose();
            }}
          />

          <ConfirmDialog
            open={confirm === 'role'}
            onOpenChange={(o) => !o && setConfirm(null)}
            title="Change role"
            description={<>Change this user to <strong>{roleLabel(role)}</strong>? This is recorded in the audit log.</>}
            confirmLabel="Change role"
            onConfirm={async () => { await setRole({ userId: detail.id, role }); toast.success('Role updated'); }}
          />
          <ConfirmDialog
            open={confirm === 'suspend'}
            onOpenChange={(o) => !o && setConfirm(null)}
            title="Suspend account"
            description="They will be signed out immediately and cannot use Donjo until reactivated."
            confirmLabel="Suspend"
            destructive
            reasonLabel="Reason"
            reasonRequired
            onConfirm={async (reason) => { await setStatus({ userId: detail.id, status: 'suspended', reason }); toast.success('Account suspended'); }}
          />
          <ConfirmDialog
            open={confirm === 'reactivate'}
            onOpenChange={(o) => !o && setConfirm(null)}
            title="Reactivate account"
            description="The user will be able to sign in and use Donjo again."
            confirmLabel="Reactivate"
            onConfirm={async () => { await setStatus({ userId: detail.id, status: 'active' }); toast.success('Account reactivated'); }}
          />
          <ConfirmDialog
            open={confirm === 'revoke'}
            onOpenChange={(o) => !o && setConfirm(null)}
            title="Revoke admin access"
            description="This account becomes a regular applicant account. This is recorded in the audit log."
            confirmLabel="Revoke"
            destructive
            onConfirm={async () => { await revokeAdmin({ userId: detail.id }); toast.success('Admin access revoked'); }}
          />
        </div>
      )}
    </Drawer>
  );
}

function GrantAdminDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const grant = useMutation(api.adminUsers.grantAdmin);
  const [email, setEmail] = useState('');
  useEffect(() => { if (open) setEmail(''); }, [open]);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Grant admin access"
      description={
        <div className="space-y-3">
          <p>The person must already have a Donjo account. They will get full access to this console.</p>
          <Field label="Account email" required>
            <Input type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
      }
      confirmLabel="Grant admin"
      onConfirm={async () => {
        if (!email.trim()) throw new Error('Enter an email address');
        await grant({ email });
        toast.success('Admin access granted');
      }}
    />
  );
}

export default function Users() {
  useDocumentTitle('Users · Admin');
  const data = useUsersData();
  const [params, setParams] = useSearchParams();
  const [grantOpen, setGrantOpen] = useState(false);
  const openId = params.get('open') as Id<'users'> | null;

  const columns: Column<UserRow>[] = [
    {
      key: 'name', header: 'User', sortValue: (r) => (r.name ?? r.email ?? '').toLowerCase(),
      cell: (r) => (<div className="min-w-0"><p className="truncate font-medium">{r.name ?? 'Unnamed'}</p><p className="truncate text-xs text-muted-foreground">{r.email}</p></div>),
      csv: (r) => r.name,
    },
    { key: 'role', header: 'Role', sortValue: (r) => r.role, cell: (r) => roleLabel(r.role), csv: (r) => r.role },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, cell: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>, csv: (r) => r.status },
    { key: 'location', header: 'Location', sortValue: (r) => r.county ?? r.country ?? '', cell: (r) => r.county ?? r.country ?? '-', csv: (r) => r.county ?? r.country },
    { key: 'joined', header: 'Joined', sortValue: (r) => r.createdAt, cell: (r) => formatDate(r.createdAt), csv: (r) => new Date(r.createdAt).toISOString() },
    { key: 'seen', header: 'Last seen', sortValue: (r) => r.lastSeenAt ?? 0, cell: (r) => timeAgo(r.lastSeenAt), csv: (r) => (r.lastSeenAt ? new Date(r.lastSeenAt).toISOString() : '') },
    { key: 'email-csv', header: 'Email', cell: () => null, csv: (r) => r.email, csvOnly: true },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone with an account. Open a user to edit them, reset their password, change their role, suspend or delete them."
        actions={<Button variant="outline" onClick={() => setGrantOpen(true)} className="pointer-events-auto"><ShieldPlus className="mr-2 h-4 w-4" aria-hidden="true" />Grant admin</Button>}
      />
      {data?.capped && <p role="status" className="mb-3 rounded-xl bg-amber-100 px-4 py-2.5 text-sm text-amber-900">Showing the 1,000 most recent accounts.</p>}
      <DataTable
        caption="Users"
        rows={data?.rows}
        columns={columns}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.name ?? ''} ${r.email ?? ''} ${r.county ?? ''} ${r.country ?? ''}`}
        searchLabel="Search users"
        filters={[
          { key: 'role', label: 'All roles', options: ['talent', 'employer', 'founder', 'investor', 'judge', 'admin', 'unassigned'].map((r) => ({ value: r, label: roleLabel(r) })), match: (r, v) => r.role === v },
          { key: 'status', label: 'Any status', options: [{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }], match: (r, v) => r.status === v },
        ]}
        pageSize={25}
        exportName="donjo-users"
        onRowClick={(r) => setParams({ open: r.id })}
        emptyTitle="No users yet"
        emptyBody="Accounts will appear here as people sign up."
      />
      <UserDrawer userId={openId} onClose={() => setParams({})} />
      <GrantAdminDialog open={grantOpen} onOpenChange={setGrantOpen} />
    </>
  );
}
