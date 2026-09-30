import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Fingerprint, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { defaultDeviceLabel, isPasskeySupported } from '@/lib/webauthn';

const HIDDEN_PREFIXES = ['/auth', '/admin', '/reset-password'];

/**
 * One-time, dismissible prompt to add a passkey. Shown after login to signed-in users who
 * have no passkey and have not dismissed it before (dismissal is stored on their profile).
 */
export function PasskeyNudge() {
  const { isAuthenticated, registerWebAuthn } = useAuth();
  const location = useLocation();
  const state = useQuery(api.passkeys.nudgeState, isAuthenticated ? {} : 'skip');
  const dismissNudge = useMutation(api.passkeys.dismissNudge);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const hiddenHere = HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p));
  const eligible =
    isAuthenticated &&
    !hiddenHere &&
    !!state &&
    state.hasProfile &&
    state.termsCurrent &&
    !state.hasPasskey &&
    !state.dismissed &&
    !state.isAdmin &&
    isPasskeySupported();

  useEffect(() => {
    if (!eligible) {
      setVisible(false);
      return;
    }
    let shownThisSession = false;
    try {
      shownThisSession = sessionStorage.getItem('donjo-passkey-nudge') === '1';
    } catch {
      /* storage unavailable */
    }
    if (shownThisSession) return;
    const t = setTimeout(() => {
      setVisible(true);
      try {
        sessionStorage.setItem('donjo-passkey-nudge', '1');
      } catch {
        /* ignore */
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [eligible]);

  const dismiss = async () => {
    setVisible(false);
    try {
      await dismissNudge({});
    } catch {
      /* non-critical */
    }
  };

  const add = async () => {
    setBusy(true);
    try {
      const { error } = await registerWebAuthn(defaultDeviceLabel());
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Passkey added. Next time, sign in with your fingerprint, face or PIN.');
      await dismiss();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Add a passkey"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm neo-extruded p-5 sm:left-auto sm:right-6 sm:bottom-6"
          data-testid="passkey-nudge"
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => void dismiss()}
            className="pointer-events-auto absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="squircle-icon h-11 w-11 shrink-0">
              <Fingerprint className="h-5 w-5 text-brand-strong" />
            </div>
            <div className="space-y-1 pr-4">
              <p className="font-semibold text-foreground">Add a passkey</p>
              <p className="text-sm text-muted-foreground">
                Sign in faster and more securely with your fingerprint, face or device PIN.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="pointer-events-auto flex-1 rounded-full" onClick={() => void add()} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add a passkey
            </Button>
            <Button size="sm" variant="ghost" className="pointer-events-auto" onClick={() => void dismiss()} disabled={busy}>
              Not now
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
