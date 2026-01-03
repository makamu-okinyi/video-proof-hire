import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Video } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VideoCardProps {
  video: Video;
  isActive?: boolean;
}

export function VideoCard({ video, isActive = false }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(video.likes);
  const [showPlayButton, setShowPlayButton] = useState(true);

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

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
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

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20">
        {/* Profile */}
        <button className="relative">
          <img 
            src={video.user.avatar} 
            alt={video.user.username}
            className="h-12 w-12 rounded-full border-2 border-background object-cover"
          />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-coral flex items-center justify-center">
            <span className="text-xs text-background font-bold">+</span>
          </div>
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
        <button className="flex flex-col items-center gap-1">
          <div className="h-11 w-11 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-background" />
          </div>
          <span className="text-xs text-background font-medium">{formatNumber(video.comments)}</span>
        </button>

        {/* Save */}
        <button 
          className="flex flex-col items-center gap-1"
          onClick={() => setIsSaved(!isSaved)}
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
        <button className="flex flex-col items-center gap-1">
          <div className="h-11 w-11 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-6 w-6 text-background" />
          </div>
          <span className="text-xs text-background font-medium">Share</span>
        </button>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-20 left-0 right-16 px-4 z-20">
        {/* Username & Verified */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-background font-semibold">@{video.user.username}</span>
          {video.user.isVerified && (
            <div className="h-4 w-4 rounded-full bg-coral flex items-center justify-center">
              <svg className="h-2.5 w-2.5 text-background" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

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
          {video.skills.length > 3 && (
            <Badge 
              variant="secondary" 
              className="bg-background/15 backdrop-blur-sm text-background border-0 text-xs"
            >
              +{video.skills.length - 3}
            </Badge>
          )}
        </div>
      </div>

      {/* Volume Control */}
      <button 
        className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center"
        onClick={toggleMute}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4 text-background" />
        ) : (
          <Volume2 className="h-4 w-4 text-background" />
        )}
      </button>
    </div>
  );
}
