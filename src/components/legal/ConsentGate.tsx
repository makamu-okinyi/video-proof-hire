import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { LEGAL_VERSION } from '@/data/legal';

const EXEMPT = ['/auth', '/admin', '/terms', '/privacy', '/cookies'];

/**
 * Asks signed-in users to (re)accept the Terms of Use and Privacy Policy when they have never
 * accepted, or when LEGAL_VERSION has changed since they did. Acceptance is recorded on the
 * server (profile.termsAcceptedAt / termsVersion).
 */
export function ConsentGate() {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const profile = useQuery(api.profiles.getMyProfile, isAuthenticated ? {} : 'skip');
  const accept = useMutation(api.profiles.acceptTerms);
  const [busy, setBusy] = useState(false);

  const exempt = EXEMPT.some((p) => pathname.startsWith(p));
  const needs = isAuthenticated && !exempt && !!profile && !!profile.userType && profile.status !== 'suspended' && profile.termsVersion !== LEGAL_VERSION;
  const isUpdate = !!profile?.termsVersion;

  return (
    <Dialog.Root open={needs}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60" />
        <Dialog.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-[110] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-6 shadow-2xl outline-none"
        >
          <Dialog.Title className="text-lg font-semibold">{isUpdate ? 'We updated our terms' : 'Before you continue'}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
            Please review and accept the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline">Terms of Use</a> and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline">Privacy Policy</a>{' '}
            to keep using Donjo.
          </Dialog.Description>
          <Button
            className="pointer-events-auto mt-6 w-full rounded-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await accept({ version: LEGAL_VERSION });
              } catch {
                toast.error('Could not record your acceptance. Please try again.');
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            I agree
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
