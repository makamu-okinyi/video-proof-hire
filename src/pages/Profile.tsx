import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Edit2, Share2, Grid3X3, Play, 
  Eye, Heart, Bookmark, LogOut, ChevronRight,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { mockVideos } from '@/data/mockData';
import { cn } from '@/lib/utils';

type Tab = 'videos' | 'saved';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('videos');

  const userVideos = mockVideos.filter(v => v.userId === '1');
  const stats = {
    views: userVideos.reduce((acc, v) => acc + v.views, 0),
    likes: userVideos.reduce((acc, v) => acc + v.likes, 0),
    videos: userVideos.length,
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">@{user.username || 'user'}</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon-sm">
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
              src={user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'} 
              alt={user.username}
              className="h-20 w-20 rounded-full object-cover border-2 border-coral"
            />
            {user.isVerified && (
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
          <p className="font-medium">{user.username || 'Your Name'}</p>
          <p className="text-sm text-muted-foreground">
            {user.bio || 'Add a bio to tell employers about yourself'}
          </p>
        </div>

        {/* Skills */}
        {user.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {user.skills.map((skill) => (
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
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border sticky top-12 z-10 bg-background">
        <div className="flex">
          <button
            onClick={() => setActiveTab('videos')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors",
              activeTab === 'videos' 
                ? "border-foreground text-foreground" 
                : "border-transparent text-muted-foreground"
            )}
          >
            <Grid3X3 className="h-5 w-5" />
            <span className="text-sm font-medium">Videos</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors",
              activeTab === 'saved' 
                ? "border-foreground text-foreground" 
                : "border-transparent text-muted-foreground"
            )}
          >
            <Bookmark className="h-5 w-5" />
            <span className="text-sm font-medium">Saved</span>
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="p-1">
        {activeTab === 'videos' && (
          <div className="grid grid-cols-3 gap-1">
            {userVideos.length > 0 ? (
              userVideos.map((video) => (
                <div 
                  key={video.id}
                  className="aspect-[9/16] relative bg-secondary rounded-lg overflow-hidden group cursor-pointer"
                >
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.caption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-8 w-8 text-background" fill="white" />
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-background text-xs">
                    <Eye className="h-3 w-3" />
                    {formatNumber(video.views)}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 py-16 text-center">
                <p className="text-muted-foreground">No videos yet</p>
                <Button 
                  variant="coral" 
                  className="mt-4"
                  onClick={() => navigate('/create')}
                >
                  Create your first video
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="py-16 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Saved videos will appear here</p>
          </div>
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
