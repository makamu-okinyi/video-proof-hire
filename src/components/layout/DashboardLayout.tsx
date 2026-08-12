import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopBar } from './DashboardTopBar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Theme sync: ensure light theme on mount to avoid loader/UI conflict during initial render
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);
  return (
    <div className="min-h-screen min-h-dvh flex relative overflow-x-hidden w-full max-w-full">
      {/* Sidebar */}
      <DashboardSidebar isCollapsed={isCollapsed} onCollapsedChange={setIsCollapsed} />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col ml-0 transition-all duration-300 min-w-0 overflow-x-hidden",
          isCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}
      >
        {/* Top Bar */}
        <DashboardTopBar />

        {/* Page Content - mobile-first, safe-area, no horizontal scroll */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 safe-area-pb overflow-x-hidden w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
