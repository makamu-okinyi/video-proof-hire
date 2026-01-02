import { useState, useRef, useEffect } from 'react';
import { VideoCard } from '@/components/video/VideoCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { Video } from '@/types';
import { mockVideos } from '@/data/mockData';

interface DbVideo {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  likes: number;
  created_at: string;
}

interface DbProfile {
  id: string;
  username: string | null;
  avatar: string | null;
  is_verified: boolean;
  skills: string[];
  skill_category: string;
}

export default function Feed() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [videos, setVideos] = useState<Video[]>(mockVideos);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id,
          user_id,
          title,
          description,
          video_url,
          thumbnail_url,
          views,
          likes,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      if (data && data.length > 0) {
        // Fetch profiles for video users
        const userIds = [...new Set(data.map(v => v.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar, is_verified, skills, skill_category')
          .in('id', userIds);

        const profileMap = new Map<string, DbProfile>();
        profiles?.forEach(p => profileMap.set(p.id, p as DbProfile));

        // Transform database videos to Video type
        const transformedVideos: Video[] = (data as DbVideo[]).map(v => {
          const profile = profileMap.get(v.user_id);
          return {
            id: v.id,
            userId: v.user_id,
            user: {
              id: v.user_id,
              username: profile?.username || 'User',
              email: '',
              userType: 'talent' as const,
              avatar: profile?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
              skills: profile?.skills || [],
              skillCategory: (profile?.skill_category || 'other') as 'tech' | 'design' | 'business' | 'other',
              isVerified: profile?.is_verified || false,
              createdAt: new Date(),
            },
            videoUrl: v.video_url,
            thumbnailUrl: v.thumbnail_url || v.video_url,
            caption: v.title || v.description || '',
            skills: profile?.skills || [],
            category: 'Project Demo',
            visibility: 'public' as const,
            likes: v.likes,
            comments: 0,
            views: v.views,
            createdAt: new Date(v.created_at),
          };
        });

        // Combine with mock videos for demo
        setVideos([...transformedVideos, ...mockVideos]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeIndex, videos.length]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-surface-darker flex items-center justify-center">
        <div className="text-background/60 animate-pulse">Loading videos...</div>
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
