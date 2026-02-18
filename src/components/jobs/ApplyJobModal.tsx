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
    video_prompt?: string | null;
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

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
      const { error } = await supabase.from('job_applications').insert({
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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Light backdrop - left area stays interactive for context preservation */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
          {/* Side Drawer - Industrial-Chic: slate-950, 2px corners, 35% width */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-drawer-title"
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[35%] min-w-[320px] bg-slate-950 shadow-2xl flex flex-col rounded-l-[2px]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ willChange: 'transform' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
              <div>
                <h2 id="apply-drawer-title" className="text-lg font-semibold text-white font-sans">
                  Apply to {job.title}
                </h2>
                {job.company_name && (
                  <p className="text-sm text-slate-400 font-sans">{job.company_name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-[2px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2px] p-3 space-y-1.5">
                    <p className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video Pitch Guidance
                    </p>
                    <p className="text-sm text-slate-300 whitespace-pre-line">{job.video_prompt}</p>
                  </div>
                )}

                {/* Video Portfolio Section */}
                <div className="space-y-2 pointer-events-auto z-50 relative">
                  <Label className="flex items-center gap-2 text-slate-200 font-sans">
                    <Video className="h-4 w-4" />
                    Your Video Portfolio
                  </Label>

                  {isLoading ? (
                    <div className="text-sm text-slate-400 py-4 text-center font-sans">
                      Loading your videos...
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-700 rounded-[2px] font-sans">
                      <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No videos yet. Create videos to showcase your skills!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 pr-4">
                      {videos.map((video) => (
                        <Card
                          key={video.id}
                          className={cn(
                            'relative aspect-[9/16] overflow-hidden cursor-pointer transition-all rounded-[2px] border-slate-700 bg-slate-900',
                            selectedVideoIds.includes(video.id)
                              ? 'ring-2 ring-emerald-500'
                              : 'hover:ring-1 hover:ring-slate-600'
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
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                              <Play className="h-6 w-6 text-slate-500" />
                            </div>
                          )}
                          {selectedVideoIds.includes(video.id) && (
                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                              <div className="bg-emerald-500 text-white rounded-full p-1">
                                <Play className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}

                  {videos.length > 0 && (
                    <p className="text-xs text-slate-500 font-sans">
                      {selectedVideoIds.length} video(s) selected • Your profile acts as your
                      application
                    </p>
                  )}
                </div>

                {/* Cover Message - Inter placeholder */}
                <div className="space-y-2">
                  <Label htmlFor="cover-message" className="text-slate-200 font-sans">
                    Cover Message (Optional)
                  </Label>
                  <Textarea
                    id="cover-message"
                    placeholder="Write a brief message to the employer..."
                    value={coverMessage}
                    onChange={(e) => setCoverMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="rounded-[2px] border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 font-sans resize-none focus:ring-emerald-500/50"
                  />
                  <p className="text-xs text-slate-500 text-right font-mono">
                    {coverMessage.length}/500
                  </p>
                </div>

                {/* Profile Preview */}
                {profile && (
                  <div className="bg-slate-800/50 rounded-[2px] p-3 space-y-1">
                    <p className="text-sm font-medium text-slate-200 font-sans">Applying as:</p>
                    <div className="flex items-center gap-2">
                      {profile.avatar && (
                        <img
                          src={profile.avatar}
                          alt={profile.username || 'Profile'}
                          className="h-8 w-8 rounded-[2px] object-cover"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-white font-sans">
                          {profile.username || 'Anonymous'}
                        </p>
                        <p className="text-xs text-slate-400 font-sans">
                          {profile.skills?.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Apply Button - Emerald-500 primary */}
                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2px] pointer-events-auto z-50 font-sans"
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
