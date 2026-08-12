import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Send, X, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface VideoItem {
  _id: string;
  title?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  description?: string;
}

interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    company_name: string | null;
    video_prompt?: string | null;
  };
}

export function ApplyJobModal({ isOpen, onClose, job }: ApplyJobModalProps) {
  const { user, profile } = useAuth();
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [coverMessage, setCoverMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videosData = useQuery(api.videos.getMyVideos, {});
  const videos: VideoItem[] = videosData ?? [];
  const isLoading = videosData === undefined;

  const applyToJob = useMutation(api.jobs.applyToJob);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to apply');
      return;
    }

    setIsSubmitting(true);

    try {
      await applyToJob({
        jobId: job.id as Id<'jobPostings'>,
        coverMessage: coverMessage || undefined,
      });
      toast.success('Application submitted successfully!');
      onClose();
      setCoverMessage('');
      setSelectedVideoIds([]);
    } catch (error: unknown) {
      console.error('Error applying to job:', error);
      if (error instanceof Error && error.message.includes('Already applied')) {
        toast.error('You have already applied to this job');
      } else {
        toast.error('Failed to submit application');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-drawer-title"
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[35%] min-w-[320px] neo-extruded flex flex-col rounded-l-3xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ willChange: 'transform' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div>
                <h2 id="apply-drawer-title" className="text-lg font-semibold text-foreground">
                  Apply to {job.title}
                </h2>
                {job.company_name && (
                  <p className="text-sm text-muted-foreground">{job.company_name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content - scrollable */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                {/* Video Guidance from Employer */}
                {job.video_prompt && (
                  <div className="neo-pressed p-3 space-y-1.5">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video Pitch Guidance
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{job.video_prompt}</p>
                  </div>
                )}

                {/* Video Portfolio Section */}
                <div className="space-y-2 pointer-events-auto z-50 relative">
                  <Label className="flex items-center gap-2 text-foreground">
                    <Video className="h-4 w-4" />
                    Your Video Portfolio
                  </Label>

                  {isLoading ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">
                      Loading your videos...
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="neo-pressed text-sm text-muted-foreground py-6 text-center space-y-2">
                      <Video className="h-8 w-8 mx-auto opacity-40" />
                      <p>No videos yet. Create videos to showcase your skills!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 pr-4">
                      {videos.map((video) => (
                        <Card
                          key={video._id}
                          className={cn(
                            'relative aspect-[9/16] overflow-hidden cursor-pointer transition-all neo-extruded-sm border-0',
                            selectedVideoIds.includes(video._id)
                              ? 'ring-2 ring-brand'
                              : 'hover:ring-1 hover:ring-border'
                          )}
                          onClick={() => toggleVideoSelection(video._id)}
                        >
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title || 'Video'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          {selectedVideoIds.includes(video._id) && (
                            <div className="absolute inset-0 bg-brand/20 flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground rounded-full p-1">
                                <Play className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}

                  {videos.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedVideoIds.length} video(s) selected • Your profile acts as your application
                    </p>
                  )}
                </div>

                {/* Cover Message */}
                <div className="space-y-2">
                  <Label htmlFor="cover-message" className="text-foreground">
                    Cover Message (Optional)
                  </Label>
                  <Textarea
                    id="cover-message"
                    placeholder="Write a brief message to the employer..."
                    value={coverMessage}
                    onChange={(e) => setCoverMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right font-mono">
                    {coverMessage.length}/500
                  </p>
                </div>

                {/* Profile Preview */}
                {profile && (
                  <div className="neo-pressed p-3 space-y-1">
                    <p className="text-sm font-medium text-foreground">Applying as:</p>
                    <div className="flex items-center gap-2">
                      {profile.avatar && (
                        <img
                          src={profile.avatar}
                          alt={profile.username || 'Profile'}
                          className="h-8 w-8 rounded-xl object-cover"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {profile.username || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile.skills?.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full pointer-events-auto z-50"
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
            </ScrollArea>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
