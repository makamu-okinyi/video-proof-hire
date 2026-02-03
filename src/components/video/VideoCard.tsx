import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Video } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { CommentsSheet } from './CommentsSheet';

interface VideoCardProps {
  video: Video;
  isActive?: boolean;
}

export function VideoCard({ video, isActive = false }: VideoCardProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(video.likes);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount] = useState(video.comments);

  // Auto-play when video becomes active
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          setShowPlayButton(false);
        }).catch(() => {
          setIsPlaying(false);
          setShowPlayButton(true);
        });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
        setShowPlayButton(true);
      }
    }
  }, [isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowPlayButton(true);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          setShowPlayButton(false);
        }).catch(() => {
          setIsPlaying(false);
          setShowPlayButton(true);
        });
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like videos');
      navigate('/auth');
      return;
    }

    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikes(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      // Use direct table operations with the likes table
      if (wasLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user?.id)
          .eq('video_id', video.id);
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: user?.id, video_id: video.id });
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked);
      setLikes(prev => wasLiked ? prev + 1 : prev - 1);
      toast.error('Failed to update like');
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save videos');
      navigate('/auth');
      return;
    }

    const wasSaved = isSaved;
    setIsSaved(!isSaved);
    toast.success(wasSaved ? 'Removed from saved' : 'Saved to collection');
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/feed?video=${video.id}`;
    const shareData = {
      title: video.caption || 'Check out this video on Donjo',
      text: `${video.user.username}'s video portfolio`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      }
    }
  };

  const handleProfileClick = () => {
    if (video.userId === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user/${video.userId}`);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="relative w-full h-full bg-surface-darker overflow-hidden">
      {/* Video Player */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        poster={video.thumbnailUrl}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

      {/* Play/Pause Overlay */}
      <button 
        className="absolute inset-0 flex items-center justify-center z-10"
        onClick={togglePlay}
      >
        {showPlayButton && !isPlaying && (
          <div className="h-20 w-20 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center animate-scale-up">
            <Play className="h-10 w-10 text-background ml-1" fill="white" />
          </div>
        )}
      </button>

      {/* Mute Button */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center z-20"
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5 text-background" />
        ) : (
          <Volume2 className="h-5 w-5 text-background" />
        )}
      </button>

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20">
        {/* Profile */}
        <button className="relative" onClick={handleProfileClick}>
          <img 
            src={video.user.avatar} 
            alt={video.user.username}
            className="h-12 w-12 rounded-full border-2 border-background object-cover"
          />
        </button>

        {/* Like */}
        <button 
          className="flex flex-col items-center gap-1"
          onClick={handleLike}
        >
          <div className={cn(
            "h-11 w-11 rounded-full flex items-center justify-center transition-all",
            isLiked ? "bg-coral/20" : "bg-background/10 backdrop-blur-sm"
          )}>
            <Heart 
              className={cn(
                "h-6 w-6 transition-all",
                isLiked ? "text-coral fill-coral scale-110" : "text-background"
              )} 
            />
          </div>
          <span className="text-xs text-background font-medium">{formatNumber(likes)}</span>
        </button>

        {/* Comment */}
        <button 
          className="flex flex-col items-center gap-1"
          onClick={() => setShowComments(true)}
        >
          <div className="h-11 w-11 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-background" />
          </div>
          <span className="text-xs text-background font-medium">{formatNumber(commentsCount)}</span>
        </button>

        {/* Save */}
        <button 
          className="flex flex-col items-center gap-1"
          onClick={handleSave}
        >
          <div className={cn(
            "h-11 w-11 rounded-full flex items-center justify-center transition-all",
            isSaved ? "bg-coral/20" : "bg-background/10 backdrop-blur-sm"
          )}>
            <Bookmark 
              className={cn(
                "h-6 w-6 transition-all",
                isSaved ? "text-coral fill-coral" : "text-background"
              )} 
            />
          </div>
          <span className="text-xs text-background font-medium">Save</span>
        </button>

        {/* Share */}
        <button 
          className="flex flex-col items-center gap-1"
          onClick={handleShare}
        >
          <div className="h-11 w-11 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-6 w-6 text-background" />
          </div>
          <span className="text-xs text-background font-medium">Share</span>
        </button>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-20 left-0 right-16 px-4 z-20">
        {/* Username & Verified */}
        <button 
          className="flex items-center gap-2 mb-2"
          onClick={handleProfileClick}
        >
          <span className="text-background font-semibold">@{video.user.username}</span>
          {video.user.isVerified && (
            <div className="h-4 w-4 rounded-full bg-coral flex items-center justify-center">
              <svg className="h-2.5 w-2.5 text-background" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        {/* Caption */}
        <p className="text-background/90 text-sm mb-3 line-clamp-2">{video.caption}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-2">
          {video.skills.slice(0, 3).map((skill) => (
            <Badge 
              key={skill} 
              variant="secondary" 
              className="bg-background/15 backdrop-blur-sm text-background border-0 text-xs"
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* Comments Sheet */}
      <CommentsSheet 
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        videoId={video.id}
      />
    </div>
  );
}