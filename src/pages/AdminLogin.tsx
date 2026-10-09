import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { Eye, EyeOff, Fingerprint, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/context/AuthContext';
import { useNoIndex } from '@/hooks/useNoIndex';
import { ADMIN_NOTICE_KEY, touchAdminActivity } from '@/hooks/useIdleSignOut';
import { isPasskeySupported } from '@/lib/webauthn';

const GENERIC_FAILURE = 'Sign-in failed. Check your details and try again.';
const NOT_AUTHORISED = 'You are not authorised to access this console.';
const IDLE_NOTICE = 'You were signed out after 30 minutes of inactivity. Please sign in again.';

type Method = 'password' | 'passkey';

/** Peek at the one-shot notice left by AdminRoute (denied / idle); cleared in an effect. */
function peekNotice(): string | null {
  try {
    const n = sessionStorage.getItem(ADMIN_NOTICE_KEY);
    if (n === 'denied') return NOT_AUTHORISED;
    if (n === 'idle') return IDLE_NOTICE;
  } catch {
    /* storage unavailable */
  }
  return null;
}

/**
 * Dedicated, sober sign-in for the admin console. No sign-up, no social sign-in, no role
 * chooser, and errors never reveal whether an email exists.
 */
export default function AdminLogin() {
  useDocumentTitle('Admin sign in');
  useNoIndex();
  const navigate = useNavigate();
  const { login, logout, signInWithWebAuthn, isAuthenticated, isLoading } = useAuth();
  const recordAdminSignIn = useMutation(api.admin.recordAdminSignIn);
  const isAdmin = useQuery(api.admin.amIAdmin, isAuthenticated ? {} : 'skip');
  const loginStep = useMutation(api.firstLogin.loginStep);
  const completeFirstLogin = useAction(api.firstLogin.completeFirstLogin);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'email' | 'secret'>('email');
  const [mode, setMode] = useState<'password' | 'activate'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<Method | null>(null);
  const [notice] = useState<string | null>(() => peekNotice());
  const [error, setError] = useState<string | null>(null);
  const pendingMethod = useRef<Method | null>(null);
  const handled = useRef(false);
  const passkeysOk = isPasskeySupported();

  useEffect(() => {
    try {
      sessionStorage.removeItem(ADMIN_NOTICE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Once a session exists, verify the admin role on the server and either enter or bail out.
  useEffect(() => {
    if (isLoading || !isAuthenticated || isAdmin === undefined || handled.current) return;
    handled.current = true;
    const method = pendingMethod.current;
    (async () => {
      try {
        if (method) {
          // Fresh sign-in on this page: server verifies the role and writes the audit log.
          const res = await recordAdminSignIn({ method, userAgent: navigator.userAgent });
          if (res.ok) {
            touchAdminActivity();
            navigate('/admin', { replace: true });
            return;
          }
        } else if (isAdmin) {
          // Already signed in as an admin: straight to the console.
          touchAdminActivity();
          navigate('/admin', { replace: true });
          return;
        }
      } catch {
        /* fall through to sign-out */
      }
      await logout();
      pendingMethod.current = null;
      setBusy(null);
      setError(NOT_AUTHORISED);
      handled.current = false;
    })();
  }, [isLoading, isAuthenticated, isAdmin, recordAdminSignIn, navigate, logout]);

  const fail = (message: string) => {
    pendingMethod.current = null;
    setBusy(null);
    setError(message);
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const address = email.trim().toLowerCase();
    if (step === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address)) {
        setError('Enter a valid email address.');
        return;
      }
      setBusy('password');
      try {
        setMode((await loginStep({ email: address })) === 'activate' ? 'activate' : 'password');
        setStep('secret');
      } catch {
        setError('Too many attempts. Please wait a few minutes and try again.');
      }
      setBusy(null);
      return;
    }
    if (!password) {
      setError(GENERIC_FAILURE);
      return;
    }
    if (mode === 'activate' && (password.length < 8 || password !== confirm)) {
      setError('Use at least 8 characters, and make sure both passwords match.');
      return;
    }
    setBusy('password');
    pendingMethod.current = 'password';
    handled.current = false;
    if (mode === 'activate') {
      try {
        await completeFirstLogin({ email: address, password });
      } catch {
        fail(GENERIC_FAILURE);
        return;
      }
    }
    const { error: err } = await login(address, password);
    if (err) fail(GENERIC_FAILURE);
    // On success the effect above takes over once the session is live.
  };

  const backToEmail = () => {
    setStep('email');
    setMode('password');
    setPassword('');
    setConfirm('');
    setError(null);
  };

  const handlePasskeySignIn = async () => {
    if (busy) return;
    setError(null);
    setBusy('passkey');
    pendingMethod.current = 'passkey';
    handled.current = false;
    const { error: err } = await signInWithWebAuthn(email.trim() ? { email: email.trim() } : undefined);
    if (err) fail(GENERIC_FAILURE);
  };

  // Skip the form flash for someone who is already signed in (the effect will route them).
  if (!isLoading && isAuthenticated && isAdmin === undefined) {
    return <div className="min-h-screen bg-slate-950" aria-busy="true" />;
  }

  const inputClass =
    'h-12 w-full !rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-60';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">
            <ShieldCheck className="h-7 w-7 text-amber-500" aria-hidden="true" />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">Secure console</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">Donjo Admin</h1>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          {(notice || error) && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-200"
              data-testid="admin-login-error"
            >
              {error ?? notice}
            </div>
          )}

          <form onSubmit={handlePasswordSignIn} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy !== null || step === 'secret'}
                className={inputClass}
              />
            </div>
            {step === 'secret' && (
            <>
            {mode === 'activate' && (
              <p className="text-sm text-slate-400">First time here. Create the password you will use to sign in.</p>
            )}
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {mode === 'activate' ? 'Create your password' : 'Password'}
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  autoComplete={mode === 'activate' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy !== null}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {mode === 'activate' && (
              <div className="space-y-1.5">
                <label htmlFor="admin-confirm" className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Confirm password
                </label>
                <input
                  id="admin-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={busy !== null}
                  className={inputClass}
                />
              </div>
            )}
            </>
            )}

            <button
              type="submit"
              disabled={busy !== null}
              className="flex h-12 w-full items-center justify-center gap-2 !rounded-xl bg-amber-500 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === 'password' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {busy === 'password' ? 'Verifying...' : step === 'email' ? 'Continue' : mode === 'activate' ? 'Create password and sign in' : 'Sign in'}
            </button>
          </form>

          {step === 'secret' && (
            <button type="button" onClick={backToEmail} className="mt-5 block w-full text-center text-xs text-slate-400 underline underline-offset-4 hover:text-slate-200">
              Use a different email
            </button>
          )}

          {step === 'email' && (
          <>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
            <span className="h-px flex-1 bg-slate-800" /> or <span className="h-px flex-1 bg-slate-800" />
          </div>

          <button
            type="button"
            onClick={handlePasskeySignIn}
            disabled={!passkeysOk || busy !== null}
            title={passkeysOk ? undefined : 'Passkeys are not supported in this browser'}
            className="flex h-12 w-full items-center justify-center gap-2 !rounded-xl border border-slate-700 bg-slate-950 text-sm font-medium text-slate-100 transition-colors hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === 'passkey' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
            {busy === 'passkey' ? 'Waiting for your device...' : 'Sign in with a passkey'}
          </button>
          {!passkeysOk && (
            <p className="mt-2 text-center text-xs text-slate-500">Passkeys are not supported in this browser.</p>
          )}
          </>
          )}
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
          Authorised personnel only. Sign-ins and actions on this console are logged.
        </p>
      </div>
    </main>
  );
}
