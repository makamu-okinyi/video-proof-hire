import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    const { data: convos } = await supabase
      .from('conversations')
      .select('*')
      .or(`employer_id.eq.${user.id},candidate_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (!convos) {
      setLoading(false);
      return;
    }

    // Fetch other user profiles and last messages using secure RPC (excludes email)
    const enrichedConversations = await Promise.all(
      convos.map(async (convo) => {
        const otherUserId = convo.employer_id === user.id ? convo.candidate_id : convo.employer_id;
        
        const [profileResult, messagesResult, unreadResult] = await Promise.all([
          supabase.rpc('get_public_profile', { profile_id: otherUserId }),
          supabase.from('messages')
            .select('content, created_at, is_read, sender_id')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase.from('messages')
            .select('id', { count: 'exact' })
            .eq('conversation_id', convo.id)
            .eq('is_read', false)
            .neq('sender_id', user.id)
        ]);

        const profileData = profileResult.data?.[0];
        return {
          ...convo,
          other_user_id: otherUserId,
          other_user: profileData ? { username: profileData.username, avatar: profileData.avatar } : { username: null, avatar: null },
          last_message: messagesResult.data?.[0],
          unread_count: unreadResult.count || 0
        };
      })
    );

    setConversations(enrichedConversations);
    setLoading(false);
  };

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
