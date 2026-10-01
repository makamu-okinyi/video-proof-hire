import { useState } from 'react';
import { useAction } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/input';

const MIN = 8;

/** Change the signed-in user's own password. Needs the current one; other devices are signed out. */
export function ChangePasswordPanel() {
  const changePassword = useAction(api.firstLogin.changePassword);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const tooShort = next.length > 0 && next.length < MIN;
  const mismatch = confirm.length > 0 && next !== confirm;
  const valid = current.length > 0 && next.length >= MIN && next === confirm && next !== current;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await changePassword({ current, next });
      toast.success('Password changed. Other devices have been signed out.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('Current password is incorrect')) toast.error('Your current password is incorrect.');
      else if (message.includes('RATE_LIMITED')) toast.error('Too many attempts. Please wait a few minutes.');
      else toast.error('Could not change the password. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Current password" required>
        <PasswordInput autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} disabled={busy} />
      </Field>
      <Field label="New password" required hint={`At least ${MIN} characters.`} error={tooShort ? `Use at least ${MIN} characters` : undefined}>
        <PasswordInput autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} disabled={busy} />
      </Field>
      <Field label="Confirm new password" required error={mismatch ? 'Passwords do not match' : undefined}>
        <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={busy} />
      </Field>
      <Button type="submit" disabled={!valid || busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        Change password
      </Button>
    </form>
  );
}
