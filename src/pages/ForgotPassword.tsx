import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
import { ArrowLeft, ArrowRight, KeyRound, Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Logo } from '@/components/ui/Logo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNoIndex } from '@/hooks/useNoIndex';

type Step = 'email' | 'code';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function describeResetError(err: unknown, step: Step): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (/EMAIL_NOT_CONFIGURED|EMAIL_SEND_FAILED/i.test(raw)) {
    return 'We could not send the email right now. Please try again shortly, or contact the Donjo team.';
  }
  if (/TooManyFailedAttempts|rate limit|too many/i.test(raw)) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (/network|failed to fetch/i.test(raw)) return 'Network error. Please check your connection and try again.';
  if (step === 'code') return 'That code is wrong or has expired. Check it, or request a new one.';
  return 'Something went wrong. Please try again.';
}

/** Dedicated password-reset flow: ask for email, then enter the emailed code and a new password. */
export default function ForgotPassword() {
  useDocumentTitle('Reset your password');
  useNoIndex();
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const address = email.trim().toLowerCase();
    if (!EMAIL.test(address)) {
      toast.error('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      await signIn('password', { email: address, flow: 'reset' });
      setStep('code');
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      // Unknown accounts get the same screen as known ones, so this form cannot be used to
      // discover who has an account.
      if (/InvalidAccountId/i.test(raw)) setStep('code');
      else toast.error(describeResetError(err, 'email'));
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{8}$/.test(code.trim())) {
      toast.error('Enter the 8-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      toast.error('Your new password needs at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await signIn('password', {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword: password,
        flow: 'reset-verification',
      });
      toast.success('Password updated. You are signed in.');
      navigate('/auth', { replace: true });
    } catch (err) {
      toast.error(describeResetError(err, 'code'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size="xl" />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            {step === 'email' ? <KeyRound className="h-6 w-6" aria-hidden="true" /> : <MailCheck className="h-6 w-6" aria-hidden="true" />}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {step === 'email' ? 'Reset your password' : 'Check your email'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 'email'
              ? 'Enter the email you signed up with and we will send you a code to set a new password.'
              : `If an account exists for ${email.trim()}, we sent an 8-digit code. It expires in 15 minutes.`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={requestCode} className="space-y-4">
            <Field label="Email">
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoFocus maxLength={200} />
            </Field>
            <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy || !email}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Send reset code <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </form>
        ) : (
          <form onSubmit={confirmReset} className="space-y-4">
            <Field label="8-digit code">
              <Input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="12345678" autoFocus />
            </Field>
            <Field label="New password" hint="At least 8 characters.">
              <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={200} />
            </Field>
            <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy || !code || !password}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Set new password'}
            </Button>
            <button type="button" onClick={() => requestCode()} disabled={busy} className="w-full text-center text-sm text-muted-foreground hover:text-foreground pointer-events-auto">
              Did not get it? Send a new code
            </button>
          </form>
        )}

        <Link to="/auth" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground pointer-events-auto">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to log in
        </Link>
      </div>
    </div>
  );
}
