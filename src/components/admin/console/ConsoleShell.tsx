import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Bell, ChevronsLeft, ChevronsRight, LogOut, Menu, X } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { SearchInput } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { CONSOLE_NAV } from './nav';
import { formatDate, roleLabel } from './format';

const RAIL_KEY = 'donjo-admin-rail-collapsed';

function RailLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin sections" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {CONSOLE_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400',
              collapsed && 'justify-center px-0',
              isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white',
            )
          }
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={cn('flex h-14 items-center gap-2 border-b border-white/10 px-5', collapsed && 'justify-center px-0')}>
      <span className="text-base font-semibold tracking-tight text-white">{collapsed ? 'D' : 'Donjo'}</span>
      {!collapsed && <span className="text-sm text-zinc-500">Admin</span>}
    </div>
  );
}

function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  const results = useQuery(api.adminOverview.search, debounced.trim().length >= 2 ? { q: debounced } : 'skip');
  const go = (to: string) => {
    setOpen(false);
    setQ('');
    navigate(to);
  };
  const empty = results && !results.users.length && !results.ventures.length && !results.jobs.length;

  return (
    <div ref={boxRef} className="relative w-full max-w-md" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <SearchInput
        value={q}
        onValueChange={(v) => { setQ(v); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search users, ventures, jobs"
        aria-label="Search the console"
        aria-expanded={open && q.trim().length >= 2}
        aria-controls="console-search-results"
      />
      {open && q.trim().length >= 2 && (
        <div id="console-search-results" className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-[hsl(var(--popover))] p-2 shadow-lg" role="region" aria-label="Search results" aria-live="polite">
          {results === undefined && <p className="px-3 py-2 text-sm text-muted-foreground">Searching...</p>}
          {empty && <p className="px-3 py-2 text-sm text-muted-foreground">No matches for "{q}".</p>}
          {results && results.users.length > 0 && (
            <div>
              <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Users</p>
              {results.users.map((u) => (
                <button key={u.id} type="button" onClick={() => go(`/admin/users?open=${u.id}`)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
                  <span className="min-w-0 truncate">{u.name ?? u.email}<span className="ml-2 text-muted-foreground">{u.name ? u.email : ''}</span></span>
                  <span className="shrink-0 text-xs text-muted-foreground">{roleLabel(u.role)}</span>
                </button>
              ))}
            </div>
          )}
          {results && results.ventures.length > 0 && (
            <div>
              <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ventures</p>
              {results.ventures.map((x) => (
                <button key={x.id} type="button" onClick={() => go(`/admin/review?open=${x.id}`)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
                  <span className="truncate">{x.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{x.status}</span>
                </button>
              ))}
            </div>
          )}
          {results && results.jobs.length > 0 && (
            <div>
              <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jobs</p>
              {results.jobs.map((j) => (
                <button key={j.id} type="button" onClick={() => go(`/admin/moderation?q=${encodeURIComponent(j.title)}`)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent">
                  <span className="truncate">{j.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{j.company ?? ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AttentionBell() {
  const stats = useQuery(api.adminOverview.stats, {});
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);
  const pending = stats?.attention.pendingReviews ?? 0;
  const over7 = stats?.attention.pendingOver7d ?? 0;
  const planReqs = stats?.attention.pendingPlanRequests ?? 0;
  const feedbackWaiting = stats?.attention.pendingFeedback ?? 0;
  const count = (pending > 0 ? 1 : 0) + (over7 > 0 ? 1 : 0) + (planReqs > 0 ? 1 : 0) + (feedbackWaiting > 0 ? 1 : 0);

  return (
    <div ref={ref} className="relative" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${count ? `, ${count} need attention` : ''}`}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {count > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[hsl(var(--brand-strong))] ring-2 ring-background" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-border bg-[hsl(var(--popover))] p-3 shadow-lg" role="region" aria-label="Items needing attention">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Needs attention</p>
          {count === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing is waiting on you.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {pending > 0 && (
                <li><Link to="/admin/review" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-accent">{pending} venture{pending === 1 ? '' : 's'} awaiting review</Link></li>
              )}
              {planReqs > 0 && (
                <li><Link to="/admin/plans" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-accent">{planReqs} plan request{planReqs === 1 ? '' : 's'} to handle</Link></li>
              )}
              {feedbackWaiting > 0 && (
                <li><Link to="/admin/feedback" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-accent">{feedbackWaiting} feedback item{feedbackWaiting === 1 ? '' : 's'} to review</Link></li>
              )}
              {over7 > 0 && (
                <li><Link to="/admin/review" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-accent">{over7} waiting over a week</Link></li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Breadcrumb trail: Admin / Section. */
function Crumbs() {
  const { pathname } = useLocation();
  const current = useMemo(() => CONSOLE_NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to))), [pathname]);
  return (
    <nav aria-label="Breadcrumb" className="hidden text-sm sm:block">
      <ol className="flex items-center gap-2 text-muted-foreground">
        <li><Link to="/admin" className="hover:text-foreground">Admin</Link></li>
        {current && current.to !== '/admin' && (
          <>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-medium text-foreground">{current.label}</li>
          </>
        )}
      </ol>
    </nav>
  );
}

/**
 * The admin console frame: collapsible left rail (drawer on phones), top bar with global
 * search, attention bell and identity menu, breadcrumbs, and the routed page below.
 */
export function ConsoleShell() {
  const { logout } = useAuth();
  const me = useQuery(api.admin.me, {});
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(RAIL_KEY) === '1'; } catch { return false; }
  });
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    try { localStorage.setItem(RAIL_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed]);

  return (
    <div className="min-h-dvh bg-background">
      <a href="#console-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black">
        Skip to content
      </a>

      {/* Desktop rail */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col bg-zinc-900 text-zinc-100 transition-[width] duration-200 lg:flex',
          collapsed ? 'w-[4.5rem]' : 'w-64',
        )}
      >
        <Brand collapsed={collapsed} />
        <RailLinks collapsed={collapsed} />
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400', collapsed && 'justify-center px-0')}
          >
            {collapsed ? <ChevronsRight className="h-5 w-5" aria-hidden="true" /> : <ChevronsLeft className="h-5 w-5" aria-hidden="true" />}
            <span className={cn(collapsed && 'sr-only')}>Collapse</span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Dialog.Root open={drawer} onOpenChange={setDrawer}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50 lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-[70] flex w-72 max-w-[85vw] flex-col bg-zinc-900 text-zinc-100 shadow-2xl outline-none lg:hidden">
            <Dialog.Title className="sr-only">Admin navigation</Dialog.Title>
            <Dialog.Description className="sr-only">Sections of the admin console</Dialog.Description>
            <div className="flex items-center justify-between">
              <Brand />
              <Dialog.Close aria-label="Close navigation" className="mr-3 rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" aria-hidden="true" />
              </Dialog.Close>
            </div>
            <RailLinks collapsed={false} onNavigate={() => setDrawer(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64')}>
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open navigation"
              className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <Crumbs />
            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
              <GlobalSearch />
              <AttentionBell />
              <div className="hidden min-w-0 text-right leading-tight md:block">
                <p className="truncate text-sm font-medium text-foreground">{me?.name ?? me?.email ?? 'Admin'}</p>
                <p className="truncate text-xs text-muted-foreground">{me?.name ? me.email : formatDate(Date.now())}</p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>
        <main id="console-main" tabIndex={-1} className="mx-auto w-full max-w-[1400px] px-4 py-6 outline-none sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
