import { useState, useEffect } from 'react';
import { Play, Send, X, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Video {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  video_url: string;
  description: string | null;
}

interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    company_name: string | null;
  };
}

export function ApplyJobModal({ isOpen, onClose, job }: ApplyJobModalProps) {
  const { user, profile } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [coverMessage, setCoverMessage] = useState('');
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

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideoIds(prev => 
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to apply');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          applicant_id: user.id,
          cover_message: coverMessage || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already applied to this job');
        } else {
          throw error;
        }
      } else {
        toast.success('Application submitted successfully!');
        onClose();
        setCoverMessage('');
        setSelectedVideoIds([]);
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      toast.error('Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to {job.title}</DialogTitle>
          <DialogDescription>
            {job.company_name && `at ${job.company_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Video Portfolio Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Your Video Portfolio
            </Label>
            
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading your videos...
              </div>
            ) : videos.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No videos yet. Create videos to showcase your skills!</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="grid grid-cols-3 gap-2 pr-4">
                  {videos.map((video) => (
                    <Card
                      key={video.id}
                      className={cn(
                        "relative aspect-[9/16] overflow-hidden cursor-pointer transition-all",
                        selectedVideoIds.includes(video.id)
                          ? "ring-2 ring-primary"
                          : "hover:ring-1 hover:ring-border"
                      )}
                      onClick={() => toggleVideoSelection(video.id)}
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
                      {selectedVideoIds.includes(video.id) && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Play className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {videos.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedVideoIds.length} video(s) selected • Your profile acts as your application
              </p>
            )}
          </div>

          {/* Cover Message */}
          <div className="space-y-2">
            <Label htmlFor="cover-message">Cover Message (Optional)</Label>
            <Textarea
              id="cover-message"
              placeholder="Write a brief message to the employer..."
              value={coverMessage}
              onChange={(e) => setCoverMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {coverMessage.length}/500
            </p>
          </div>

          {/* Profile Preview */}
          {profile && (
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">Applying as:</p>
              <div className="flex items-center gap-2">
                {profile.avatar && (
                  <img 
                    src={profile.avatar} 
                    alt={profile.username || 'Profile'} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-medium">{profile.username || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.skills?.slice(0, 3).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Apply with Video Profile
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}