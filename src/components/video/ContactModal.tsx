import { useState } from 'react';
import { X, Send, Loader2, CheckCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  talent: {
    id: string;
    username: string;
    avatar: string;
  };
  videoId?: string;
}

export function ContactModal({ isOpen, onClose, talent, videoId }: ContactModalProps) {
  const { user, profile } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!user) return;

    setSending(true);
    try {
      // For now, just show success - this would integrate with messaging system
      setSent(true);
      toast.success(`Interest sent to @${talent.username}!`);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
        setSent(false);
        setMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error sending contact request:', error);
      toast.error('Failed to send contact request');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-2xl w-full max-w-md overflow-hidden animate-scale-up shadow-2xl">
        {sent ? (
          // Success state
          <div className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Request Sent!</h2>
            <p className="text-muted-foreground">
              @{talent.username} will be notified of your interest
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-lg">Contact Talent</h2>
              <button 
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Talent Info */}
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <img
                  src={talent.avatar}
                  alt={talent.username}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">@{talent.username}</p>
                  <p className="text-sm text-muted-foreground">Will receive your contact request</p>
                </div>
              </div>

              {/* Company Badge */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Contacting as <strong className="text-foreground">{profile?.username || 'Your Company'}</strong></span>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Add a message (optional)</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi! I saw your video and I'm impressed with your skills. I'd love to discuss a potential opportunity..."
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
              </div>

              {/* Info */}
              <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm p-3 rounded-xl">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="text-xs space-y-1 text-amber-600 dark:text-amber-400/80">
                  <li>• {talent.username} will receive a notification</li>
                  <li>• If they accept, you can start a conversation</li>
                  <li>• Their contact details remain private until they choose to share</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <Button
                variant="coral"
                className="w-full"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Contact Request
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}