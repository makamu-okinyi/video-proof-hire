import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Heart, MessageCircle, Briefcase, Calendar, FileCheck, UserPlus, Bell, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  related_user_username: string | null;
  related_user_avatar: string | null;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'view': return Eye;
    case 'like': return Heart;
    case 'comment': return MessageCircle;
    case 'match': return Briefcase;
    case 'interview': return Calendar;
    case 'application': return FileCheck;
    case 'follow': return UserPlus;
    case 'message': return MessageCircle;
    default: return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'view': return 'bg-blue-500/10 text-blue-500';
    case 'like': return 'bg-coral/10 text-coral';
    case 'comment': return 'bg-green-500/10 text-green-500';
    case 'match': return 'bg-purple-500/10 text-purple-500';
    case 'interview': return 'bg-amber-500/10 text-amber-500';
    case 'application': return 'bg-cyan-500/10 text-cyan-500';
    case 'follow': return 'bg-pink-500/10 text-pink-500';
    case 'message': return 'bg-indigo-500/10 text-indigo-500';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function Notifications() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user, isAuthenticated, authLoading]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_notifications', {
        page_size: 50,
        page_offset: 0,
      });

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data, error } = await supabase.rpc('get_unread_notification_count');
      if (error) throw error;
      setUnreadCount(data || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.rpc('mark_notification_read', { notification_id: notificationId });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.rpc('mark_all_notifications_read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const today = notifications.filter(n => {
    const notifDate = new Date(n.created_at);
    const now = new Date();
    return notifDate.toDateString() === now.toDateString();
  });

  const earlier = notifications.filter(n => {
    const notifDate = new Date(n.created_at);
    const now = new Date();
    return notifDate.toDateString() !== now.toDateString();
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <button 
              onClick={markAllAsRead}
              className="text-sm text-coral font-medium"
            >
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
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex items-start gap-4 px-4 py-4 hover:bg-secondary/30 transition-colors cursor-pointer",
                    !notification.is_read && "bg-coral/5"
                  )}
                >
                  {notification.related_user_avatar ? (
                    <img 
                      src={notification.related_user_avatar}
                      alt=""
                      className="h-11 w-11 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn("font-medium", !notification.is_read && "text-foreground")}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {!notification.is_read && (
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
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex items-start gap-4 px-4 py-4 hover:bg-secondary/30 transition-colors cursor-pointer",
                    !notification.is_read && "bg-coral/5"
                  )}
                >
                  {notification.related_user_avatar ? (
                    <img 
                      src={notification.related_user_avatar}
                      alt=""
                      className="h-11 w-11 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn("font-medium", !notification.is_read && "text-foreground")}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2.5 w-2.5 rounded-full bg-coral flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When someone likes your video or applies to your job, you'll see it here
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
