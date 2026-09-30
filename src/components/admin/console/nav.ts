import {
  BarChart3, ClipboardCheck, CreditCard, Gauge, LayoutDashboard, MapPin, ServerCog, ShieldAlert, Users,
  type LucideIcon,
} from 'lucide-react';

export interface ConsoleNavItem {
  to: string;
  label: string;
  title: string;
  icon: LucideIcon;
  end?: boolean;
}

export const CONSOLE_NAV: ConsoleNavItem[] = [
  { to: '/admin', label: 'Overview', title: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/analytics', label: 'Analytics', title: 'Analytics & traffic', icon: BarChart3 },
  { to: '/admin/users', label: 'Users', title: 'Users', icon: Users },
  { to: '/admin/review', label: 'Review', title: 'Venture review', icon: ClipboardCheck },
  { to: '/admin/geography', label: 'Geography', title: 'Geography', icon: MapPin },
  { to: '/admin/velocity', label: 'Velocity', title: 'Pipeline velocity', icon: Gauge },
  { to: '/admin/moderation', label: 'Moderation', title: 'Jobs & challenges', icon: ShieldAlert },
  { to: '/admin/plans', label: 'Plans', title: 'Plans & usage', icon: CreditCard },
  { to: '/admin/system', label: 'System', title: 'System & security', icon: ServerCog },
];
