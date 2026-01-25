import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, Trash2, Send, Play, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ContactModal } from '@/components/video/ContactModal';

interface ShortlistedTalent {
  id: string;
  talent_id: string;
  video_id: string | null;
  created_at: string;
  talent_username: string | null;
  talent_avatar: string | null;
  talent_bio: string | null;
  talent_skills: string[] | null;
  talent_skill_category: string | null;
  talent_is_verified: boolean;
  video_url: string | null;
  video_thumbnail: string | null;
  video_title: string | null;
}

export default function MyShortlist() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [shortlist, setShortlist] = useState<ShortlistedTalent[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactTalent, setContactTalent] = useState<ShortlistedTalent | null>(null);

  // Redirect non-employers
  useEffect(() => {
    if (!authLoading && profile?.user_type !== 'employer') {
      navigate('/feed', { replace: true });
    }
  }, [profile, authLoading, navigate]);

  useEffect(() => {
    if (user && profile?.user_type === 'employer') {
      fetchShortlist();
    }
  }, [user, profile]);

  const fetchShortlist = async () => {
    try {
      // Try RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_shortlist');

      if (rpcError) {
        // Fallback: direct query
        const { data: directData, error: directError } = await supabase
          .from('shortlists')
          .select(`
            id,
            talent_id,
            video_id,
            created_at,
            profiles!shortlists_talent_id_fkey (
              username,
              avatar,
              bio,
              skills,
              skill_category,
              is_verified
            ),
            videos (
              video_url,
              thumbnail_url,
              title
            )
          `)
          .eq('recruiter_id', user?.id)
          .order('created_at', { ascending: false });

        if (!directError && directData) {
          const transformed = directData.map((item: any) => ({
            id: item.id,
            talent_id: item.talent_id,
            video_id: item.video_id,
            created_at: item.created_at,
            talent_username: item.profiles?.username,
            talent_avatar: item.profiles?.avatar,
            talent_bio: item.profiles?.bio,
            talent_skills: item.profiles?.skills,
            talent_skill_category: item.profiles?.skill_category,
            talent_is_verified: item.profiles?.is_verified || false,
            video_url: item.videos?.video_url,
            video_thumbnail: item.videos?.thumbnail_url,
            video_title: item.videos?.title,
          }));
          setShortlist(transformed);
        }
      } else {
        setShortlist((rpcData || []) as ShortlistedTalent[]);
      }
    } catch (error) {
      console.error('Error fetching shortlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (talentId: string) => {
    try {
      await supabase
        .from('shortlists')
        .delete()
        .eq('recruiter_id', user?.id)
        .eq('talent_id', talentId);

      setShortlist(prev => prev.filter(item => item.talent_id !== talentId));
      toast.success('Removed from shortlist');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/employer')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              My Shortlist
            </h1>
            <p className="text-sm text-muted-foreground">{shortlist.length} candidates saved</p>
          </div>
        </div>
      </div>

      {/* Shortlist */}
      <div className="p-4 space-y-4">
        {shortlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-semibold mb-2">No candidates shortlisted</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Browse the talent feed and tap the star icon to save candidates
            </p>
            <Button variant="coral" onClick={() => navigate('/feed')}>
              Browse Talent
            </Button>
          </div>
        ) : (
          shortlist.map((item) => (
            <div 
              key={item.id}
              className="bg-card border border-border rounded-2xl p-4 space-y-3"
            >
              {/* Talent Header */}
              <div className="flex items-start justify-between">
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/user/${item.talent_id}`)}
                >
                  {item.talent_avatar ? (
                    <img
                      src={item.talent_avatar}
                      alt={item.talent_username || 'User'}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">@{item.talent_username || 'user'}</p>
                      {item.talent_is_verified && (
                        <div className="h-4 w-4 rounded-full bg-coral flex items-center justify-center">
                          <svg className="h-2.5 w-2.5 text-background" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Added {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.talent_id)}
                  className="text-muted-foreground hover:text-destructive p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Bio */}
              {item.talent_bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{item.talent_bio}</p>
              )}

              {/* Skills */}
              {item.talent_skills && item.talent_skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.talent_skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {item.talent_skills.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{item.talent_skills.length - 4}
                    </Badge>
                  )}
                </div>
              )}

              {/* Video Preview */}
              {item.video_url && (
                <div 
                  className="relative aspect-video rounded-xl overflow-hidden bg-secondary cursor-pointer group"
                  onClick={() => navigate(`/feed?video=${item.video_id}`)}
                >
                  {item.video_thumbnail ? (
                    <img
                      src={item.video_thumbnail}
                      alt={item.video_title || 'Video'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.video_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-12 w-12 text-white" fill="white" />
                  </div>
                  {item.video_title && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-sm font-medium line-clamp-1 drop-shadow-lg">
                        {item.video_title}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/user/${item.talent_id}`)}
                >
                  View Profile
                </Button>
                <Button
                  variant="coral"
                  className="flex-1"
                  onClick={() => setContactTalent(item)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact Modal */}
      {contactTalent && (
        <ContactModal
          isOpen={!!contactTalent}
          onClose={() => setContactTalent(null)}
          talent={{
            id: contactTalent.talent_id,
            username: contactTalent.talent_username || 'user',
            avatar: contactTalent.talent_avatar || '',
          }}
          videoId={contactTalent.video_id || undefined}
        />
      )}
    </div>
  );
}
