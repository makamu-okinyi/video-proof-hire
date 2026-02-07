import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
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
import { SquircleIcon, navIconVariants } from '@/components/ui/SquircleIcon';

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

const mainMenuItems: NavGroup = {
  title: 'Main Menu',
  items: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/feed' },
    { icon: Rocket, label: 'Ventures', path: '/ventures' },
    { icon: Briefcase, label: 'Jobs', path: '/jobs' },
    { icon: Trophy, label: 'Challenges', path: '/challenges' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
  ],
};

const founderItems: NavGroup = {
  title: 'Founders',
  items: [
    { icon: Plus, label: 'Apply to Program', path: '/apply' },
    { icon: Rocket, label: 'My Ventures', path: '/ventures' },
  ],
};

const investorItems: NavGroup = {
  title: 'Investors',
  items: [
    { icon: TrendingUp, label: 'Deal Flow', path: '/invest' },
    { icon: Bookmark, label: 'Saved Ventures', path: '/invest/saved' },
  ],
};

const employerItems: NavGroup = {
  title: 'Employer Hub',
  items: [
    { icon: Building, label: 'Employer Dashboard', path: '/employer' },
    { icon: Plus, label: 'Post a Job', path: '/employer/jobs/create' },
    { icon: Trophy, label: 'Create Challenge', path: '/employer/challenges/create' },
    { icon: Bookmark, label: 'My Shortlist', path: '/employer/shortlist' },
  ],
};

const managementItems: NavGroup = {
  title: 'Management',
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

  const navGroups = [
    mainMenuItems,
    founderItems,
    investorItems,
    employerItems,
    managementItems,
  ];

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);
    const iconVariant = navIconVariants[item.path] || 'default';
    
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
        <SquircleIcon 
          icon={item.icon} 
          variant={active ? iconVariant : 'default'}
          size="sm"
          isActive={active}
        />
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
          <SquircleIcon 
            icon={Rocket} 
            variant="coral" 
            size="lg"
          />
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
                  <NavLink key={item.path} item={item} />
                ))}
              </div>
            )}
            {isCollapsed && <div className="my-4 border-t border-border/30" />}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className={cn("p-4 border-t border-border/30", isCollapsed && "p-2")}>
        <div className={cn("neo-subtle p-4 rounded-2xl", isCollapsed && "p-2")}>
          <div className={cn("flex items-center gap-3 mb-3", isCollapsed && "flex-col mb-2")}>
            <SquircleIcon 
              icon={User} 
              variant="blue" 
              size={isCollapsed ? "sm" : "md"}
            />
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
          "fixed left-0 top-0 h-full w-72 bg-background z-50 transition-transform duration-300 ease-in-out lg:hidden",
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
