import { useState, useRef } from 'react';
import { X, Send, Heart, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  onCommentsCountChange?: (count: number) => void;
}

export function CommentsSheet({ isOpen, onClose, videoId, onCommentsCountChange }: CommentsSheetProps) {
  const { user, isAuthenticated, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const comments = useQuery(
    api.videos.getComments,
    isOpen ? { videoId: videoId as Id<'videos'> } : 'skip'
  );
  const addCommentMutation = useMutation(api.videos.addComment);

  const loading = comments === undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await addCommentMutation({
        videoId: videoId as Id<'videos'>,
        content: newComment.trim(),
      });
      setNewComment('');
      onCommentsCountChange?.((comments?.length ?? 0) + 1);
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const commentList = comments ?? [];

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
          <h2 className="font-semibold text-lg">{commentList.length} Comments</h2>
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
          ) : commentList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to comment!</p>
            </div>
          ) : (
            commentList.map((comment) => (
              <div key={comment._id} className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      @{comment.userId.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment._creationTime), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 text-foreground/90">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Heart className="h-3.5 w-3.5" />
                    </button>
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
              profile?.avatar
                ? <img src={profile.avatar} alt="You" className="h-8 w-8 rounded-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                : <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-muted-foreground" /></div>
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
