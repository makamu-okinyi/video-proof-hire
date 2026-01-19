import { Home, Briefcase, Bell, User, Plus, Trophy, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const applicantNavItems = [
  { icon: Home, label: 'Home', path: '/feed' },
  { icon: Briefcase, label: 'Jobs', path: '/jobs' },
  { icon: null, label: 'Create', path: '/create' },
  { icon: Bell, label: 'Alerts', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const employerNavItems = [
  { icon: Briefcase, label: 'Jobs', path: '/employer' },
  { icon: Trophy, label: 'Challenges', path: '/employer', tab: 'challenges' },
  { icon: null, label: 'Create', path: '/employer/jobs/create' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isEmployer = profile?.user_type === 'employer';
  const navItems = isEmployer ? employerNavItems : applicantNavItems;

  const isActiveRoute = (path: string) => {
    if (path === '/employer') {
      return location.pathname === '/employer' || location.pathname.startsWith('/employer/');
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-between h-14 max-w-md mx-auto px-1">
        {navItems.map((item, index) => {
          const isActive = isActiveRoute(item.path);
          const isCreate = item.label === 'Create';

          if (isCreate) {
            return (
              <Button
                key={item.label}
                variant="coral"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg -mt-4 pulse-glow"
                onClick={() => navigate(item.path)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            );
          }

          const Icon = item.icon!;
          
          return (
            <button
              key={`${item.label}-${index}`}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 min-w-0",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "scale-110")} />
              <span className="text-[9px] font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
