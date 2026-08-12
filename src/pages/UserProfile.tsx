import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Eye, Play, BadgeCheck, Globe, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const profile = useQuery(
    api.profiles.getPublicProfile,
    userId ? { userId } : 'skip'
  );
  const videos = useQuery(
    api.videos.getUserVideos,
    userId ? { userId } : 'skip'
  );

  const loading = profile === undefined || videos === undefined;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/feed?video=${videoId}`);
  };

  const videoList = videos ?? [];

  const stats = {
    views: videoList.reduce((acc, v) => acc + (v.views || 0), 0),
    likes: videoList.reduce((acc, v) => acc + (v.likes || 0), 0),
    videos: videoList.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profile not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">@{profile.username || 'user'}</h1>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            {profile.avatar
              ? <img src={profile.avatar} alt={profile.username || 'User'} className="h-20 w-20 rounded-full object-cover border-2 border-coral" onError={e => { e.currentTarget.style.display = 'none'; }} />
              : <div className="h-20 w-20 rounded-full bg-secondary border-2 border-border flex items-center justify-center"><User className="h-9 w-9 text-muted-foreground" /></div>
            }
            {profile.isVerified && (
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
          <p className="font-medium">{profile.username || 'User'}</p>
          {profile.bio && (
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          )}
        </div>

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Videos Section */}
      <div className="border-t border-border">
        <div className="flex items-center justify-center gap-1.5 py-3 border-b border-foreground">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">Videos</span>
        </div>

        <div className="p-1">
          {videoList.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {videoList.map((video) => (
                <div
                  key={video._id}
                  onClick={() => handleVideoClick(video._id)}
                  className="aspect-[9/16] relative bg-secondary rounded-lg overflow-hidden group cursor-pointer"
                >
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title || 'Video'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={video.videoUrl}
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
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground mt-3">No videos yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
