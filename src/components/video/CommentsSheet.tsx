import { useState, useEffect, useRef } from 'react';
import { X, Send, Heart, MoreHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  username: string | null;
  avatar: string | null;
  is_verified: boolean;
  parent_id: string | null;
}

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  onCommentsCountChange?: (count: number) => void;
}

export function CommentsSheet({ isOpen, onClose, videoId, onCommentsCountChange }: CommentsSheetProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && videoId) {
      fetchComments();
    }
  }, [isOpen, videoId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_video_comments', { target_video_id: videoId });
      
      if (error) throw error;
      
      setComments((data || []) as Comment[]);
      onCommentsCountChange?.(data?.length || 0);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('add_video_comment', {
        target_video_id: videoId,
        comment_content: newComment.trim(),
        comment_parent_id: null,
      });

      if (error) throw error;

      setNewComment('');
      fetchComments(); // Refresh comments
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('video_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      onCommentsCountChange?.(comments.length - 1);
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl max-h-[70vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-lg">{comments.length} Comments</h2>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img
                  src={comment.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                  alt={comment.username || 'User'}
                  className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      @{comment.username || 'user'}
                    </span>
                    {comment.is_verified && (
                      <div className="h-3.5 w-3.5 rounded-full bg-coral flex items-center justify-center">
                        <svg className="h-2 w-2 text-background" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 text-foreground/90">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Heart className="h-3.5 w-3.5" />
                      {comment.likes_count > 0 && comment.likes_count}
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-foreground">
                      Reply
                    </button>
                    {comment.user_id === user?.id && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-destructive hover:text-destructive/80"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border safe-area-pb">
          <div className="flex items-center gap-3">
            {user && (
              <img
                src={user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                alt="You"
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isAuthenticated ? "Add a comment..." : "Sign in to comment"}
                disabled={!isAuthenticated || submitting}
                className="pr-12"
              />
              <button
                type="submit"
                disabled={!isAuthenticated || !newComment.trim() || submitting}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                  newComment.trim() ? "bg-coral text-background" : "bg-secondary text-muted-foreground"
                )}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
