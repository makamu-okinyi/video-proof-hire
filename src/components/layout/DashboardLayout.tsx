import { ReactNode, useEffect } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopBar } from './DashboardTopBar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Theme sync: ensure light theme on mount to avoid loader/UI conflict during initial render
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);
  return (
    <div className="min-h-screen min-h-dvh flex relative overflow-x-hidden w-full max-w-full">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-72 transition-all duration-300 min-w-0 overflow-x-hidden">
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
