import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  employer_id: string;
  candidate_id: string;
  job_application_id: string | null;
  created_at: string;
  updated_at: string;
  other_user_id: string;
  other_user: {
    username: string | null;
    avatar: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
  };
  unread_count: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  currentUserId: string;
}

export function ConversationList({ conversations, selectedId, onSelect, currentUserId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conversation) => {
        const isUnread = conversation.last_message && 
          !conversation.last_message.is_read && 
          conversation.last_message.sender_id !== currentUserId;
        
        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={`w-full p-4 text-left transition-colors hover:bg-accent/50 ${
              selectedId === conversation.id ? 'bg-accent' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={conversation.other_user.avatar || undefined} />
                <AvatarFallback>
                  {conversation.other_user.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-medium truncate ${isUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                    {conversation.other_user.username || 'Unknown User'}
                  </span>
                  {conversation.last_message && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                {conversation.last_message && (
                  <p className={`text-sm truncate mt-1 ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {conversation.last_message.content}
                  </p>
                )}
                {conversation.unread_count > 0 && (
                  <Badge variant="default" className="mt-1 text-xs">
                    {conversation.unread_count} new
                  </Badge>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
