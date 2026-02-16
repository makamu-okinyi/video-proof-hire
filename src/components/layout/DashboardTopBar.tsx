import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/feed': 'Dashboard',
  '/ventures': 'Ventures',
  '/jobs': 'Jobs',
  '/challenges': 'Challenges',
  '/messages': 'Messages',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
  '/apply': 'Apply to Program',
  '/auth': 'Authentication',
  '/admin': 'Venture Engine',
  '/founder': 'Applicant Dashboard',
  '/employer': 'Employer Dashboard',
  '/employer/jobs/create': 'Post a Job',
  '/employer/challenges/create': 'Create Challenge',
  '/employer/settings': 'Settings',
  '/employer/settings/company': 'Company Profile',
  '/employer/settings/account': 'Account',
  '/employer/shortlist': 'My Shortlist',
  '/invest': 'Deal Flow',
};

function getBreadcrumbs(pathname: string): { label: string; path: string }[] {
  const parts = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; path: string }[] = [
    { label: 'Dashboard', path: '/feed' }
  ];

  if (pathname === '/' || pathname === '/feed') {
    breadcrumbs.push({ label: 'Overview', path: '/feed' });
    return breadcrumbs;
  }

  let currentPath = '';
  for (const part of parts) {
    currentPath += `/${part}`;
    const label = routeLabels[currentPath] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
    breadcrumbs.push({ label, path: currentPath });
  }

  return breadcrumbs;
}

export function DashboardTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-30 glass-panel">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm ml-14 lg:ml-0">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-cool-grey" />
              )}
              <span
                className={cn(
                  index === breadcrumbs.length - 1
                    ? "text-charcoal font-medium"
                    : "text-cool-grey"
                )}
              >
                {crumb.label}
              </span>
            </div>
          ))}
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          {/* Neomorphic Search */}
          <div className="hidden md:flex items-center gap-2 glass-panel px-4 py-2 rounded-2xl w-64">
            <Search className="h-4 w-4 text-cool-grey" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-charcoal placeholder:text-cool-grey"
            />
          </div>

          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="glass-panel p-3 rounded-2xl relative hover:opacity-90 transition-shadow"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="h-5 w-5 text-cool-grey" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
