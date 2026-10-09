import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Flat bordered surface used across the console. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-border bg-card p-5 sm:p-6', className)}>
      {(title || action) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-[hsl(var(--muted))]', className)} aria-hidden="true" />;
}

export function EmptyState({
  title,
  children,
  icon,
  action,
  className,
}: {
  title: string;
  children?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg px-6 py-10 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-muted-foreground">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {children && <p className="mt-1 max-w-md text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const TONES: Record<Tone, string> = {
  neutral: 'bg-[hsl(var(--muted))] text-foreground',
  success: 'bg-emerald-100 text-emerald-900',
  warning: 'bg-amber-100 text-amber-900',
  danger: 'bg-red-100 text-red-900',
  info: 'bg-sky-100 text-sky-900',
  brand: 'bg-orange-100 text-orange-900',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case 'active': case 'shortlisted': case 'sign_in': return 'success';
    case 'submitted': case 'pending': return 'warning';
    case 'suspended': case 'rejected': case 'sign_in_denied': return 'danger';
    default: return 'neutral';
  }
}

/** Segmented control (used for range pickers and tab-like filters). */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: NoInfer<T>) => void;
  options: { value: NoInfer<T>; label: string }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-xl bg-[hsl(var(--muted))] p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            o.value === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
