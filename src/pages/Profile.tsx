import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Edit2, Share2, 
  Eye, Bookmark, LogOut, ChevronRight,
  BadgeCheck, Lock, Globe, Play, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface UserVideo {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  views: number;
  likes: number;
  is_private?: boolean;
  created_at: string;
}

interface SavedVideo {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  views: number;
  likes: number;
  created_at: string;
  creator_id: string;
  creator_username: string | null;
  creator_avatar: string | null;
}

type Tab = 'private' | 'public' | 'saved';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('public');
  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserVideos();
    }
  }, [user?.id]);

  // Refresh stats when page becomes visible (user returns to profile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        fetchUserVideos();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'saved' && user?.id && savedVideos.length === 0) {
      fetchSavedVideos();
    }
  }, [activeTab, user?.id]);

  const fetchUserVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, video_url, thumbnail_url, title, description, views, likes, is_private, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      setUserVideos((data || []) as UserVideo[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const refreshStats = () => {
    if (user?.id) {
      fetchUserVideos();
      if (activeTab === 'saved') {
        fetchSavedVideos();
      }
    }
  };

  const fetchSavedVideos = async () => {
    setLoadingSaved(true);
    try {
      const { data, error } = await supabase.rpc('get_saved_videos');

      if (error) {
        console.error('Error fetching saved videos:', error);
        return;
      }

      setSavedVideos((data || []) as SavedVideo[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const publicVideos = userVideos.filter(v => !v.is_private);
  const privateVideos = userVideos.filter(v => v.is_private);
  
  const stats = {
    views: userVideos.reduce((acc, v) => acc + (v.views || 0), 0),
    likes: userVideos.reduce((acc, v) => acc + (v.likes || 0), 0),
    videos: userVideos.length,
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Profile link copied!",
      description: "Share your profile with employers",
    });
  };

  const handleSettings = () => {
    toast({
      title: "Settings",
      description: "Settings page coming soon",
    });
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/feed?video=${videoId}`);
  };

  if (!user) {
    navigate('/');
    return null;
  }

  const renderVideoGrid = (videos: UserVideo[], emptyMessage: string, emptyIcon: React.ReactNode) => {
    if (loading) {
      return (
        <div className="py-16 text-center">
          <p className="text-muted-foreground animate-pulse">Loading videos...</p>
        </div>
      );
    }

    if (videos.length > 0) {
      return (
        <div className="grid grid-cols-3 gap-1">
          {videos.map((video) => (
            <div 
              key={video.id}
              onClick={() => handleVideoClick(video.id)}
              className="aspect-[9/16] relative bg-secondary rounded-lg overflow-hidden group cursor-pointer"
            >
              {video.thumbnail_url ? (
                <img 
                  src={video.thumbnail_url} 
                  alt={video.title || 'Video'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={video.video_url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="h-8 w-8 text-background" fill="white" />
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-background text-xs">
                <Eye className="h-3 w-3" />
                {formatNumber(video.views || 0)}
              </div>
              {video.is_private && (
                <div className="absolute top-2 right-2">
                  <Lock className="h-3 w-3 text-background" />
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="py-16 text-center">
        {emptyIcon}
        <p className="text-muted-foreground mt-3">{emptyMessage}</p>
        <Button 
          variant="coral" 
          className="mt-4"
          onClick={() => navigate('/create')}
        >
          Create a video
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">@{profile?.username || 'user'}</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={refreshStats} title="Refresh stats">
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleSettings}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <img 
              src={profile?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'} 
              alt={profile?.username || 'User'}
              className="h-20 w-20 rounded-full object-cover border-2 border-coral"
            />
            {profile?.is_verified && (
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-coral flex items-center justify-center border-2 border-background">
                <BadgeCheck className="h-4 w-4 text-background" />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1 flex items-center justify-around">
            <div className="text-center">
              <p className="text-xl font-bold">{stats.videos}</p>
              <p className="text-xs text-muted-foreground">Videos</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{formatNumber(stats.views)}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{formatNumber(stats.likes)}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4 space-y-2">
          <p className="font-medium">{profile?.username || 'Your Name'}</p>
          <p className="text-sm text-muted-foreground">
            {profile?.bio || 'Add a bio to tell employers about yourself'}
          </p>
        </div>

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {/* Edit Profile Button */}
        <Button 
          variant="outline" 
          className="w-full mt-4"
          size="lg"
          onClick={() => navigate('/profile/edit')}
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border sticky top-12 z-10 bg-background">
        <div className="flex">
          <button
            onClick={() => setActiveTab('public')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 transition-colors",
              activeTab === 'public' 
                ? "border-foreground text-foreground" 
                : "border-transparent text-muted-foreground"
            )}
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium">Projects</span>
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 transition-colors",
              activeTab === 'private' 
                ? "border-foreground text-foreground" 
                : "border-transparent text-muted-foreground"
            )}
          >
            <Lock className="h-4 w-4" />
            <span className="text-xs font-medium">Private</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 transition-colors",
              activeTab === 'saved' 
                ? "border-foreground text-foreground" 
                : "border-transparent text-muted-foreground"
            )}
          >
            <Bookmark className="h-4 w-4" />
            <span className="text-xs font-medium">Saved</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-1">
        {activeTab === 'public' && renderVideoGrid(
          publicVideos,
          "No public projects yet",
          <Globe className="h-12 w-12 text-muted-foreground mx-auto" />
        )}

        {activeTab === 'private' && renderVideoGrid(
          privateVideos,
          "No private videos yet",
          <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
        )}

        {activeTab === 'saved' && (
          loadingSaved ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground animate-pulse">Loading saved videos...</p>
            </div>
          ) : savedVideos.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {savedVideos.map((video) => (
                <div 
                  key={video.id}
                  onClick={() => handleVideoClick(video.id)}
                  className="aspect-[9/16] relative bg-secondary rounded-lg overflow-hidden group cursor-pointer"
                >
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title || 'Video'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video 
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-8 w-8 text-background" fill="white" />
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-background text-xs">
                    <Eye className="h-3 w-3" />
                    {formatNumber(video.views || 0)}
                  </div>
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 rounded px-1.5 py-0.5">
                    <span className="text-background text-[10px]">@{video.creator_username || 'user'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No saved videos yet</p>
              <p className="text-sm text-muted-foreground mt-1">Videos you save will appear here</p>
            </div>
          )
        )}
      </div>

      {/* Logout Section */}
      <div className="px-4 py-6 border-t border-border mt-8">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between py-3 text-destructive hover:bg-destructive/5 rounded-xl px-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </div>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
