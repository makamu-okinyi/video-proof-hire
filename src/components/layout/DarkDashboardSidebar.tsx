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
  Menu,
  X,
  ClipboardList,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';

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

const adminMenuItems: NavGroup = {
  title: 'Admin Panel',
  items: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/feed' },
    { icon: ClipboardList, label: 'Review Queue', path: '/admin/review' },
    { icon: Users, label: 'Cohort Management', path: '/admin/cohorts' },
  ],
};

const ventureItems: NavGroup = {
  title: 'Ventures',
  items: [
    { icon: Rocket, label: 'All Ventures', path: '/ventures' },
    { icon: Trophy, label: 'Challenges', path: '/challenges' },
  ],
};

const communicationItems: NavGroup = {
  title: 'Communication',
  items: [
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ],
};

const settingsItems: NavGroup = {
  title: 'Settings',
  items: [
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/employer/settings' },
  ],
};

export function DarkDashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Admin Panel', 'Ventures']);

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
    adminMenuItems,
    ventureItems,
    communicationItems,
    settingsItems,
  ];

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);
    
    return (
      <button
        onClick={() => handleNavigation(item.path)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
          active
            ? "bg-white/20 text-white"
            : "text-white/60 hover:text-white hover:bg-white/10",
          isCollapsed && "justify-center px-2"
        )}
      >
        <item.icon className={cn(
          "h-5 w-5 flex-shrink-0",
          active ? "text-primary" : "text-white/60"
        )} />
        {!isCollapsed && (
          <>
            <span className="transition-opacity duration-300">{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-primary text-white text-xs px-2 py-0.5 rounded-full">
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
          <div className="h-12 w-12 bg-primary/20 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-300">
              <h1 className="text-lg font-bold text-white">Donjo</h1>
              <p className="text-xs text-white/50">Venture Engine</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle - Desktop Only */}
      <div className="hidden lg:flex justify-end px-4 mb-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-white/60" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-white/60" />
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
                className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider hover:text-white/60 transition-colors duration-200"
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
            {isCollapsed && <div className="my-4 border-t border-white/10" />}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className={cn("p-4 border-t border-white/10", isCollapsed && "p-2")}>
        <div className={cn("bg-white/10 backdrop-blur-sm border border-white/10 p-4 rounded-2xl", isCollapsed && "p-2")}>
          <div className={cn("flex items-center gap-3 mb-3", isCollapsed && "flex-col mb-2")}>
            <div className={cn(
              "bg-white/20 rounded-full flex items-center justify-center flex-shrink-0",
              isCollapsed ? "h-8 w-8" : "h-10 w-10"
            )}>
              <User className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.username || 'Admin User'}
                </p>
                <p className="text-xs text-white/50 capitalize">
                  Program Manager
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className={cn(
              "w-full justify-start text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-300",
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
        className="fixed top-4 left-4 z-50 lg:hidden bg-black/50 backdrop-blur-xl border border-white/10 p-3 rounded-2xl"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Mobile Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-72 bg-black/80 backdrop-blur-xl border-r border-white/10 z-50 transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar - Desktop Fixed */}
      <aside 
        className={cn(
          "hidden lg:block fixed left-0 top-0 h-full bg-black/60 backdrop-blur-xl border-r border-white/10 z-40 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
