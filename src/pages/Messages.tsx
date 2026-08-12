import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ConversationList } from "@/components/messaging/ConversationList";
import { MessageThread } from "@/components/messaging/MessageThread";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NeoCard } from "@/components/ui/neo-card";
import { MessageCircle, ArrowLeft } from "lucide-react";

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

export default function Messages() {
  const { user, profile } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const rawConversations = useQuery(api.messages.getMyConversations, user ? {} : 'skip');
  const loading = !!user && rawConversations === undefined;
  const conversations: Conversation[] = (rawConversations ?? []).map((c) => ({
    id: c._id,
    employer_id: c.employerId,
    candidate_id: c.candidateId,
    job_application_id: c.jobApplicationId ?? null,
    created_at: new Date(c._creationTime).toISOString(),
    updated_at: new Date(c._creationTime).toISOString(),
    other_user_id: c.employerId === user?.id ? c.candidateId : c.employerId,
    other_user: {
      username: c.otherProfile?.username ?? null,
      avatar: c.otherProfile?.avatar ?? null,
    },
    last_message: c.lastMessage
      ? {
          content: c.lastMessage.content,
          created_at: new Date(c.lastMessage._creationTime).toISOString(),
          is_read: c.lastMessage.isRead,
          sender_id: c.lastMessage.senderId,
        }
      : undefined,
    unread_count: c.unreadCount,
  }));

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-cool-grey">Please log in to view messages</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Messages</h1>
          <p className="text-cool-grey text-sm">Your conversations</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="neo-pressed px-6 py-3 rounded-2xl inline-block text-cool-grey animate-pulse">
              Loading...
            </div>
          </div>
        ) : selectedConversation ? (
          <NeoCard className="p-0 overflow-hidden">
            <button
              onClick={() => setSelectedConversation(null)}
              className="flex items-center gap-2 p-4 text-sm text-primary hover:bg-secondary/50 w-full text-left border-b border-border/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to conversations
            </button>
            <div className="h-[calc(100vh-300px)]">
              <MessageThread
                conversationId={selectedConversation.id}
                currentUserId={user.id}
                otherUserId={selectedConversation.other_user_id}
                otherUser={selectedConversation.other_user}
              />
            </div>
          </NeoCard>
        ) : conversations.length === 0 ? (
          <NeoCard className="p-8 text-center">
            <div className="h-16 w-16 neo-pressed rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-cool-grey" />
            </div>
            <h2 className="text-xl font-semibold text-charcoal mb-2">No messages yet</h2>
            <p className="text-cool-grey">
              {profile?.user_type === 'employer'
                ? 'Shortlist candidates to start a conversation'
                : 'When employers shortlist you, they can message you here'}
            </p>
          </NeoCard>
        ) : (
          <NeoCard className="p-0 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id || null}
              onSelect={setSelectedConversation}
              currentUserId={user.id}
            />
          </NeoCard>
        )}
      </div>
    </DashboardLayout>
  );
}
