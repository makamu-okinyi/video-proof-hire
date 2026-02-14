import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DbNotification {
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

async function fetchNotifications(): Promise<DbNotification[]> {
  const { data, error } = await supabase.rpc('get_user_notifications', {
    page_size: 50,
    page_offset: 0,
  });
  if (error) {
    console.error('[useNotifications] fetch error:', error);
    return [];
  }
  return (data ?? []) as DbNotification[];
}

async function fetchUnreadCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_notification_count');
  if (error) {
    console.error('[useNotifications] unread count error:', error);
    return 0;
  }
  return Number(data ?? 0);
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('mark_notification_read', { notification_id: notificationId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  };
}
