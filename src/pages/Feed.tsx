import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { VideoCard } from '@/components/video/VideoCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { Video } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Video as VideoIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface PublicVideo {
  id: string;
  title: string | null;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  likes: number;
  created_at: string;
  creator_id: string;
  creator_username: string | null;
  creator_avatar: string | null;
  creator_is_verified: boolean;
  creator_skills: string[] | null;
  creator_skill_category: string | null;
}

const PAGE_SIZE = 20;

export default function Feed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, isLoading } = useAuth();
  const targetVideoId = searchParams.get('video');

  // Redirect employers to their dashboard
  useEffect(() => {
    if (!isLoading && profile?.user_type === 'employer') {
      navigate('/employer', { replace: true });
    }
  }, [profile, isLoading, navigate]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const transformVideo = (v: PublicVideo): Video => ({
    id: v.id,
    userId: v.creator_id,
    user: {
      id: v.creator_id,
      username: v.creator_username || 'User',
      email: '',
      userType: 'talent' as const,
      avatar: v.creator_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      skills: v.creator_skills || [],
      skillCategory: (v.creator_skill_category || 'other') as 'tech' | 'design' | 'business' | 'other',
      isVerified: v.creator_is_verified || false,
      createdAt: new Date(),
    },
    videoUrl: v.video_url,
    thumbnailUrl: v.thumbnail_url || v.video_url,
    caption: v.title || v.description || '',
    skills: v.creator_skills || [],
    category: 'Project Demo',
    visibility: 'public' as const,
    likes: v.likes,
    comments: 0,
    views: v.views,
    createdAt: new Date(v.created_at),
  });

  const fetchVideos = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { data, error } = await supabase
        .rpc('get_public_videos', {
          page_size: PAGE_SIZE,
          page_offset: pageNum * PAGE_SIZE
        });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      if (data) {
        const transformedVideos = (data as PublicVideo[]).map(transformVideo);
        
        // Check if we have more videos to load
        if (transformedVideos.length < PAGE_SIZE) {
          setHasMore(false);
        }

        if (isInitial) {
          setVideos(transformedVideos);
          
          // If we have a target video ID, find its index and scroll to it
          if (targetVideoId) {
            const targetIndex = transformedVideos.findIndex(v => v.id === targetVideoId);
            if (targetIndex !== -1) {
              setActiveIndex(targetIndex);
              // Scroll to the video after render
              setTimeout(() => {
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    top: targetIndex * window.innerHeight,
                    behavior: 'instant',
                  });
                }
              }, 100);
            }
          }
        } else {
          setVideos(prev => [...prev, ...transformedVideos]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(0, true);
  }, [fetchVideos]);

  // Handle scroll for active video tracking and infinite scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const videoHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / videoHeight);
      
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < videos.length) {
        setActiveIndex(newIndex);
      }

      // Load more when approaching the end (3 videos before the last)
      const scrollBottom = container.scrollHeight - scrollTop - container.clientHeight;
      const loadMoreThreshold = videoHeight * 3;
      
      if (scrollBottom < loadMoreThreshold && hasMore && !loadingMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchVideos(nextPage, false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeIndex, videos.length, hasMore, loadingMore, loading, page, fetchVideos]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-surface-darker flex items-center justify-center">
        <div className="text-background/60 animate-pulse">Loading videos...</div>
      </div>
    );
  }

  // Empty state when no videos
  if (videos.length === 0) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-6">
          <VideoIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-center mb-2">No videos yet</h2>
        <p className="text-muted-foreground text-center mb-6">
          Be the first to share your skills! Create a video to showcase your work.
        </p>
        <Button variant="coral" size="lg" onClick={() => navigate('/create')}>
          <Plus className="h-5 w-5 mr-2" />
          Create Video
        </Button>
        
        {/* Logo */}
        <div className="fixed top-4 left-4 z-30">
          <h1 className="text-2xl font-bold drop-shadow-lg">donjo</h1>
        </div>
        
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-surface-darker overflow-hidden">
      {/* Video Feed */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {videos.map((video, index) => (
          <div 
            key={video.id} 
            className="h-screen w-full snap-start snap-always"
          >
            <VideoCard video={video} isActive={index === activeIndex} />
          </div>
        ))}
        
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="h-20 flex items-center justify-center">
            <div className="text-background/60 animate-pulse">Loading more...</div>
          </div>
        )}
      </div>

      {/* Logo */}
      <div className="fixed top-4 left-4 z-30">
        <h1 className="text-2xl font-bold text-background drop-shadow-lg">donjo</h1>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
