import { useState, useEffect } from 'react';
import { Play, Send, Video, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Video {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  video_url: string;
  description: string | null;
}

interface SubmitChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: {
    id: string;
    title: string;
    prize_amount: number | null;
    prize_description: string | null;
    video_prompt?: string | null;
  };
}

export function SubmitChallengeModal({ isOpen, onClose, challenge }: SubmitChallengeModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserVideos();
    }
  }, [isOpen, user]);

  const fetchUserVideos = async () => {
    if (!user) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, thumbnail_url, video_url, description')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to submit');
      return;
    }

    if (!selectedVideoId) {
      toast.error('Please select a video to submit');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('challenge_submissions')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
          video_id: selectedVideoId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already submitted to this challenge');
        } else {
          throw error;
        }
      } else {
        toast.success('Submission successful! Good luck!');
        onClose();
        setSelectedVideoId(null);
      }
    } catch (error) {
      console.error('Error submitting to challenge:', error);
      toast.error('Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            {challenge.title}
          </DialogTitle>
          <DialogDescription>
            Submit your video entry to this challenge
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Prize Info */}
          {(challenge.prize_amount || challenge.prize_description) && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Prize:
                {challenge.prize_amount && (
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
                    ${challenge.prize_amount.toLocaleString()}
                  </Badge>
                )}
              </p>
              {challenge.prize_description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {challenge.prize_description}
                </p>
              )}
            </div>
          )}

          {/* Video Guidance from Employer */}
          {challenge.video_prompt && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-1.5">
              <p className="text-sm font-medium text-blue-600 flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Submission Guidance
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{challenge.video_prompt}</p>
            </div>
          )}

          {/* Video Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Video className="h-4 w-4" />
              Select a Video to Submit
            </p>
            
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading your videos...
              </div>
            ) : videos.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg space-y-3">
                <Video className="h-10 w-10 mx-auto opacity-50" />
                <div>
                  <p className="font-medium">No videos yet</p>
                  <p className="text-xs">Create a video to participate in this challenge</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    onClose();
                    navigate('/create');
                  }}
                >
                  Create Video
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[240px]">
                <div className="grid grid-cols-3 gap-2 pr-4">
                  {videos.map((video) => (
                    <Card
                      key={video.id}
                      className={cn(
                        "relative aspect-[9/16] overflow-hidden cursor-pointer transition-all",
                        selectedVideoId === video.id
                          ? "ring-2 ring-primary"
                          : "hover:ring-1 hover:ring-border"
                      )}
                      onClick={() => setSelectedVideoId(video.id)}
                    >
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title || 'Video'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <Play className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      {selectedVideoId === video.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Play className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                      {video.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-[10px] text-white truncate">{video.title}</p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Submit Button */}
          {videos.length > 0 && (
            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedVideoId}
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Entry
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}