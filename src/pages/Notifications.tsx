import { Eye, Heart, MessageCircle, Briefcase, Calendar, FileCheck } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { mockNotifications } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Notification } from '@/types';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'view': return Eye;
    case 'like': return Heart;
    case 'comment': return MessageCircle;
    case 'match': return Briefcase;
    case 'interview': return Calendar;
    case 'application': return FileCheck;
    default: return Eye;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'view': return 'bg-blue-500/10 text-blue-500';
    case 'like': return 'bg-coral/10 text-coral';
    case 'comment': return 'bg-green-500/10 text-green-500';
    case 'match': return 'bg-purple-500/10 text-purple-500';
    case 'interview': return 'bg-amber-500/10 text-amber-500';
    case 'application': return 'bg-cyan-500/10 text-cyan-500';
    default: return 'bg-muted text-muted-foreground';
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function Notifications() {
  const unreadCount = mockNotifications.filter(n => !n.read).length;
  const today = mockNotifications.filter(n => {
    const now = new Date();
    return n.createdAt.toDateString() === now.toDateString();
  });
  const earlier = mockNotifications.filter(n => {
    const now = new Date();
    return n.createdAt.toDateString() !== now.toDateString();
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="text-sm text-coral font-medium">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-border/50">
        {/* Today */}
        {today.length > 0 && (
          <div>
            <div className="px-4 py-3 bg-secondary/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today</span>
            </div>
            {today.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);
              
              return (
                <div 
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 px-4 py-4 hover:bg-secondary/30 transition-colors cursor-pointer",
                    !notification.read && "bg-coral/5"
                  )}
                >
                  <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn("font-medium", !notification.read && "text-foreground")}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="h-2.5 w-2.5 rounded-full bg-coral flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Earlier */}
        {earlier.length > 0 && (
          <div>
            <div className="px-4 py-3 bg-secondary/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Earlier</span>
            </div>
            {earlier.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);
              
              return (
                <div 
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 px-4 py-4 hover:bg-secondary/30 transition-colors cursor-pointer",
                    !notification.read && "bg-coral/5"
                  )}
                >
                  <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn("font-medium", !notification.read && "text-foreground")}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="h-2.5 w-2.5 rounded-full bg-coral flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {mockNotifications.length === 0 && (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
