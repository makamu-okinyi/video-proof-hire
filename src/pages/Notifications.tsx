import { Bell } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard } from '@/components/ui/neo-card';

export default function Notifications() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Notifications</h1>
          <p className="text-cool-grey text-sm">Stay updated on your activity</p>
        </div>

        <NeoCard className="p-8 text-center">
          <div className="h-20 w-20 neo-pressed rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-charcoal mb-2">No notifications yet</h2>
          <p className="text-cool-grey">You're all caught up!</p>
        </NeoCard>
      </div>
    </DashboardLayout>
  );
}
