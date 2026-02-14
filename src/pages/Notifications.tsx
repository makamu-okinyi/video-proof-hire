import { Bell, CheckCircle, Briefcase, Rocket, MessageCircle, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard } from '@/components/ui/neo-card';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ElementType> = {
  job_shortlisted: Briefcase,
  job_rejected: Briefcase,
  pitch_shortlisted: Rocket,
  pitch_rejected: Rocket,
  application: Briefcase,
  message: MessageCircle,
  like: Bell,
  comment: Bell,
  view: Bell,
  match: Bell,
  interview: Bell,
  follow: Bell,
};

const typeColors: Record<string, string> = {
  job_shortlisted: 'text-green-500 bg-green-500/10',
  job_rejected: 'text-amber-500 bg-amber-500/10',
  pitch_shortlisted: 'text-green-500 bg-green-500/10',
  pitch_rejected: 'text-amber-500 bg-amber-500/10',
};

export default function Notifications() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (n: { id: string; is_read: boolean; action_url?: string | null }) => {
    if (!n.is_read) markRead(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">Notifications</h1>
            <p className="text-cool-grey text-sm">Job and pitch review updates</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead()} className="neo-extruded border-none">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <NeoCard className="p-8 text-center">
            <div className="animate-pulse text-cool-grey">Loading notifications...</div>
          </NeoCard>
        ) : notifications.length === 0 ? (
          <NeoCard className="p-8 text-center">
            <div className="h-20 w-20 neo-pressed rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-charcoal mb-2">No notifications yet</h2>
            <p className="text-cool-grey">You&apos;re all caught up! Updates will appear here.</p>
          </NeoCard>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type] || Bell;
              const colorClass = typeColors[n.type] || 'text-primary bg-primary/10';
              return (
                <NeoCard
                  key={n.id}
                  className={cn(
                    'p-4 cursor-pointer transition-all hover:neo-pressed',
                    !n.is_read && 'ring-1 ring-primary/30'
                  )}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                        colorClass
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-charcoal">{n.title}</p>
                      <p className="text-sm text-cool-grey mt-0.5">{n.message}</p>
                      <p className="text-xs text-cool-grey/70 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {n.action_url && (
                      <ChevronRight className="h-5 w-5 text-cool-grey shrink-0" />
                    )}
                  </div>
                </NeoCard>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
