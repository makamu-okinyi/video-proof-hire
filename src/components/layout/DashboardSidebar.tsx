import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  Briefcase,
  Trophy,
  Plus,
  Bell,
  User,
  Settings,
  MessageSquare,
  Rocket,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Building,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const baseMenuItems = [
  { icon: Rocket, label: 'Ventures', path: '/ventures' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
];

const founderItems: NavGroup = {
  title: 'Applicant Hub',
  items: [
    { icon: LayoutDashboard, label: 'My Dashboard', path: '/founder' },
    { icon: Plus, label: 'Apply to Program', path: '/apply' },
    { icon: Briefcase, label: 'Jobs', path: '/jobs' },
    { icon: Rocket, label: 'My Ventures', path: '/ventures' },
  ],
};

const adminItems: NavGroup = {
  title: 'Program Admin',
  items: [
    { icon: TrendingUp, label: 'Venture Engine', path: '/admin' },
    { icon: Building, label: 'Employer Hub', path: '/employer' },
    { icon: Plus, label: 'Post a Job', path: '/employer/jobs/create' },
    { icon: Trophy, label: 'Challenges', path: '/challenges' },
    { icon: Bookmark, label: 'Shortlist', path: '/employer/shortlist' },
  ],
};

const managementItems: NavGroup = {
  title: 'Account',
  items: [
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/employer/settings' },
  ],
};

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Main Menu', 'Management']);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev =>
      prev.includes(title)
        ? prev.filter(g => g !== title)
        : [...prev, title]
    );
  };

  const isActive = (path: string) => {
    if (path === '/feed' && location.pathname === '/') return true;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const isAdmin = profile?.user_type === 'employer' || profile?.user_type === 'investor';
  const isFounder = profile?.user_type === 'founder' || profile?.user_type === 'talent';

  const dashboardPath = isAdmin ? '/admin' : isFounder ? '/founder' : '/feed';
  const mainMenuItems: NavGroup = {
    title: 'Main Menu',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', path: dashboardPath }, ...baseMenuItems],
  };

  const navGroups = [
    mainMenuItems,
    ...(isFounder ? [founderItems] : []),
    ...(isAdmin ? [adminItems] : []),
    managementItems,
  ];

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);
    
    return (
      <button
        onClick={() => handleNavigation(item.path)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300",
          active
            ? "neo-pressed text-charcoal"
            : "text-cool-grey hover:text-charcoal hover:bg-secondary/50",
          isCollapsed && "justify-center px-2"
        )}
      >
        <item.icon className={cn(
          "h-5 w-5 flex-shrink-0",
          active ? "text-primary" : "text-cool-grey"
        )} />
        {!isCollapsed && (
          <>
            <span className="transition-opacity duration-300">{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className={cn("p-6 pb-4", isCollapsed && "p-4 pb-2")}>
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="h-12 w-12 neo-extruded rounded-2xl flex items-center justify-center flex-shrink-0">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-300">
              <h1 className="text-lg font-bold text-charcoal">Donjo</h1>
              <p className="text-xs text-cool-grey">Venture Engine</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle - Desktop Only */}
      <div className="hidden lg:flex justify-end px-4 mb-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="neo-subtle p-2 rounded-xl hover:neo-pressed transition-all duration-300"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-cool-grey" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-cool-grey" />
          )}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!isCollapsed && (
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-cool-grey uppercase tracking-wider hover:text-charcoal transition-colors duration-200"
              >
                {group.title}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    expandedGroups.includes(group.title) && "rotate-180"
                  )}
                />
              </button>
            )}
            {(isCollapsed || expandedGroups.includes(group.title)) && (
              <div className={cn("space-y-1", !isCollapsed && "mt-1")}>
                {group.items.map((item) => (
                  <NavLink key={item.path + item.label} item={item} />
                ))}
              </div>
            )}
            {isCollapsed && <div className="my-4 border-t border-border/30" />}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className={cn("p-4 border-t border-border/30 relative", isCollapsed && "p-2")}>
        {/* Adidas stripes - athletic Venture accent */}
        <div
          className="absolute bottom-0 left-0 right-0 h-12 opacity-[0.12] pointer-events-none bg-repeat-x bg-center"
          style={{ backgroundImage: 'url(/images/adidas-stripes.png)', backgroundSize: 'auto 100%' }}
        />
        <div className={cn("neo-subtle p-4 rounded-2xl relative z-10", isCollapsed && "p-2")}>
          <div className={cn("flex items-center gap-3 mb-3", isCollapsed && "flex-col mb-2")}>
            <div
              className={cn(
                "neo-pressed rounded-full flex items-center justify-center flex-shrink-0",
                isCollapsed ? "h-8 w-8" : "h-10 w-10"
              )}
            >
              <User className="h-5 w-5 text-cool-grey" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">
                  {profile?.username || 'Guest User'}
                </p>
                <p className="text-xs text-cool-grey capitalize">
                  {profile?.user_type || 'visitor'}
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className={cn(
              "w-full justify-start text-cool-grey hover:text-destructive transition-colors duration-300",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden neo-extruded p-3 rounded-2xl"
      >
        <Menu className="h-5 w-5 text-charcoal" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Mobile Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-72 neo-extruded z-50 transition-transform duration-300 ease-in-out lg:hidden rounded-r-3xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          boxShadow: isOpen ? '8px 0 24px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-cool-grey hover:text-charcoal transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar - Desktop Fixed */}
      <aside 
        className={cn(
          "hidden lg:block fixed left-0 top-0 h-full neo-extruded rounded-none rounded-r-3xl z-40 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
