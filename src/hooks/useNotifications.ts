import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export interface DbNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  _creationTime: number;
}

export function useNotifications() {
  const rawNotifications = useQuery(api.notifications.getMyNotifications, {});
  const unreadCount = useQuery(api.notifications.getUnreadCount, {});

  const markReadMutation = useMutation(api.notifications.markRead);
  const markAllReadMutation = useMutation(api.notifications.markAllRead);

  const notifications: DbNotification[] = (rawNotifications ?? []).map((n) => ({
    _id: n._id,
    type: n.type,
    title: n.title,
    message: n.message,
    actionUrl: n.actionUrl ?? null,
    isRead: n.isRead,
    _creationTime: n._creationTime,
  }));

  return {
    notifications,
    unreadCount: unreadCount ?? 0,
    isLoading: rawNotifications === undefined,
    markRead: (id: string) =>
      markReadMutation({ notificationId: id as Id<"notifications"> }),
    markAllRead: () => markAllReadMutation({}),
  };
}
