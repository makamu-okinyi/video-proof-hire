import { ReactNode } from 'react';
import { DarkDashboardSidebar } from './DarkDashboardSidebar';
import { GlassBackground } from './GlassBackground';

interface DarkDashboardLayoutProps {
  children: ReactNode;
}

export function DarkDashboardLayout({ children }: DarkDashboardLayoutProps) {
  return (
    <div className="min-h-screen flex relative">
      {/* Abstract Background */}
      <GlassBackground variant="earth" />
      
      {/* Dark Sidebar */}
      <DarkDashboardSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-72 transition-all duration-300">
        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
