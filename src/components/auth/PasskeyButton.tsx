import { useMemo } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isPasskeySupported } from '@/lib/webauthn';
import { cn } from '@/lib/utils';

interface PasskeyButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'outline' | 'secondary' | 'default';
  label?: string;
}

/** "Sign in with a passkey" - disabled with an explanation when the browser lacks WebAuthn. */
export function PasskeyButton({
  onClick,
  loading = false,
  disabled = false,
  className,
  variant = 'outline',
  label = 'Sign in with a passkey',
}: PasskeyButtonProps) {
  const supported = useMemo(() => isPasskeySupported(), []);

  return (
    <div className="w-full">
      <Button
        type="button"
        variant={variant}
        size="lg"
        className={cn('w-full rounded-full', className)}
        onClick={onClick}
        disabled={!supported || loading || disabled}
        aria-label={label}
        title={supported ? 'Use your fingerprint, face, or device PIN' : 'Passkeys are not supported in this browser'}
      >
        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Fingerprint className="mr-2 h-5 w-5" />}
        {loading ? 'Waiting for your device...' : label}
      </Button>
      {!supported && (
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Passkeys are not supported in this browser. Use your password instead.
        </p>
      )}
    </div>
  );
}
