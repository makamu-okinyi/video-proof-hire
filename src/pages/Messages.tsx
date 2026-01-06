import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ConversationList } from "@/components/messaging/ConversationList";
import { MessageThread } from "@/components/messaging/MessageThread";
import { BottomNav } from "@/components/layout/BottomNav";
import { MessageCircle } from "lucide-react";

interface Conversation {
  id: string;
  employer_id: string;
  candidate_id: string;
  job_application_id: string | null;
  created_at: string;
  updated_at: string;
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

    // Fetch other user profiles and last messages
    const enrichedConversations = await Promise.all(
      convos.map(async (convo) => {
        const otherUserId = convo.employer_id === user.id ? convo.candidate_id : convo.employer_id;
        
        const [profileResult, messagesResult, unreadResult] = await Promise.all([
          supabase.from('profiles').select('username, avatar').eq('id', otherUserId).single(),
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

        return {
          ...convo,
          other_user: profileResult.data || { username: null, avatar: null },
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to view messages</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-4 border-b border-border">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : selectedConversation ? (
          <div className="h-[calc(100vh-180px)]">
            <button
              onClick={() => setSelectedConversation(null)}
              className="p-4 text-sm text-primary hover:underline"
            >
              ← Back to conversations
            </button>
            <div className="h-[calc(100%-56px)]">
              <MessageThread
                conversationId={selectedConversation.id}
                currentUserId={user.id}
                otherUser={selectedConversation.other_user}
              />
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
            <p className="text-muted-foreground">
              {profile?.user_type === 'employer'
                ? 'Shortlist candidates to start a conversation'
                : 'When employers shortlist you, they can message you here'}
            </p>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id || null}
            onSelect={setSelectedConversation}
            currentUserId={user.id}
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
