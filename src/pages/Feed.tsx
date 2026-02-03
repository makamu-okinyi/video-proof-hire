import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { VideoCard } from '@/components/video/VideoCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { Video } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Video as VideoIcon, Plus, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo, LogoIcon } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const skillCategories = [
  { value: 'all', label: 'All', icon: '🌟' },
  { value: 'coding', label: 'Coding', icon: '💻' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'carpentry', label: 'Carpentry', icon: '🪚' },
  { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { value: 'welding', label: 'Welding', icon: '🔥' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'marketing', label: 'Marketing', icon: '📈' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'construction', label: 'Construction', icon: '🏗️' },
  { value: 'automotive', label: 'Automotive', icon: '🚗' },
  { value: 'culinary', label: 'Culinary', icon: '👨‍🍳' },
  { value: 'other', label: 'Other', icon: '📦' },
];

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
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

  const fetchVideos = useCallback(async (pageNum: number, isInitial: boolean = false, category: string = selectedCategory) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const categoryFilter = category === 'all' ? null : category;
      let videosData: PublicVideo[] = [];

      // Try RPC first
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_public_videos', {
          page_size: PAGE_SIZE,
          page_offset: pageNum * PAGE_SIZE,
          category_filter: categoryFilter
        });

      if (rpcError) {
        // Fallback: direct query to videos table with profile join
        let query = supabase
          .from('videos')
          .select(`
            id,
            title,
            description,
            video_url,
            thumbnail_url,
            views,
            likes,
            created_at,
            skill_category,
            user_id,
            profiles!videos_user_id_fkey (
              id,
              username,
              avatar,
              is_verified,
              skills,
              skill_category
            )
          `)
          .eq('is_private', false)
          .order('created_at', { ascending: false })
          .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (categoryFilter) {
          query = query.eq('skill_category', categoryFilter);
        }

        const { data: directData, error: directError } = await query as any;

        if (directError) {
          console.error('Error fetching videos:', directError);
          return;
        }

        if (directData) {
          videosData = directData.map((v: any) => ({
            id: v.id,
            title: v.title,
            description: v.description,
            video_url: v.video_url,
            thumbnail_url: v.thumbnail_url,
            views: v.views || 0,
            likes: v.likes || 0,
            created_at: v.created_at,
            creator_id: v.user_id,
            creator_username: v.profiles?.username,
            creator_avatar: v.profiles?.avatar,
            creator_is_verified: v.profiles?.is_verified || false,
            creator_skills: v.profiles?.skills,
            creator_skill_category: v.profiles?.skill_category,
          }));
        }
      } else if (rpcData) {
        videosData = rpcData as PublicVideo[];
      }

      if (videosData.length > 0) {
        const transformedVideos = videosData.map(transformVideo);
        
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
      } else if (isInitial) {
        setVideos([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchVideos(0, true);
  }, [fetchVideos]);

  // Refetch when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(0);
    setHasMore(true);
    setVideos([]);
    setActiveIndex(0);
    fetchVideos(0, true, category);
    setShowCategoryFilter(false);
  };

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
          <Logo size="lg" showText variant="default" />
        </div>
        
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-surface-darker overflow-hidden">
      {/* Category Filter Button */}
      <button
        onClick={() => setShowCategoryFilter(true)}
        className={cn(
          "fixed top-4 right-4 z-30 h-10 px-4 rounded-full backdrop-blur-sm flex items-center gap-2 transition-colors",
          selectedCategory !== 'all' 
            ? "bg-coral text-background" 
            : "bg-background/20 text-background"
        )}
      >
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">
          {selectedCategory === 'all' 
            ? 'Filter' 
            : skillCategories.find(c => c.value === selectedCategory)?.label}
        </span>
      </button>

      {/* Category Filter Modal */}
      {showCategoryFilter && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCategoryFilter(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl p-4 pb-8 animate-slide-up safe-area-pb">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Filter by Trade</h2>
              <button 
                onClick={() => setShowCategoryFilter(false)}
                className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {skillCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-colors",
                    selectedCategory === cat.value 
                      ? "bg-coral text-background" 
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
      <div className="fixed top-4 left-4 z-30 drop-shadow-lg">
        <LogoIcon className="h-9 w-9" variant="light" />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
