import { cn } from '@/lib/utils';

/**
 * Google / Apple sign-in placeholders. They are intentionally inert ("Coming soon"):
 * no click handler reaches the backend and nothing can throw. To enable them, follow
 * the TODO in convex/auth.ts, then replace `aria-disabled` with a real onClick.
 */

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AppleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M17.05 12.04c-.03-2.75 2.25-4.07 2.35-4.13-1.28-1.87-3.27-2.13-3.98-2.16-1.69-.17-3.3 1-4.16 1-.86 0-2.18-.98-3.58-.95-1.84.03-3.54 1.07-4.49 2.72-1.92 3.32-.49 8.24 1.37 10.94.91 1.32 2 2.8 3.42 2.75 1.37-.05 1.89-.89 3.55-.89 1.66 0 2.13.89 3.58.86 1.48-.03 2.41-1.34 3.31-2.67 1.04-1.53 1.47-3.01 1.5-3.09-.03-.01-2.87-1.1-2.9-4.38zM14.32 3.94c.76-.92 1.27-2.2 1.13-3.47-1.09.04-2.41.73-3.19 1.64-.7.81-1.32 2.11-1.15 3.36 1.21.09 2.45-.62 3.21-1.53z" />
    </svg>
  );
}

interface PlaceholderProps {
  label: string;
  className?: string;
  children: React.ReactNode;
}

function Placeholder({ label, className, children }: PlaceholderProps) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Coming soon"
      aria-label={`${label} (coming soon)`}
      onClick={(e) => e.preventDefault()}
      className={cn(
        'relative flex h-12 w-full cursor-not-allowed select-none items-center justify-center gap-3 rounded-full px-5 text-sm font-semibold opacity-60',
        className,
      )}
    >
      {children}
      <span>{label}</span>
      <span className="absolute right-3 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
        Soon
      </span>
    </button>
  );
}

export function SocialAuthButtons() {
  return (
    <div className="w-full space-y-3">
      <div className="relative py-1">
        <span className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </span>
        <span className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or continue with</span>
        </span>
      </div>
      <Placeholder label="Continue with Google" className="border border-border bg-white text-slate-800">
        <GoogleMark className="h-5 w-5" />
      </Placeholder>
      <Placeholder label="Continue with Apple" className="bg-black text-white">
        <AppleMark className="h-5 w-5" />
      </Placeholder>
      <p className="text-center text-xs text-muted-foreground">Google and Apple sign-in are coming soon.</p>
    </div>
  );
}
