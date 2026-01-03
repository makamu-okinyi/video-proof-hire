import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Play, Eye, Trophy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Submission {
  id: string;
  status: string;
  created_at: string;
  user: {
    id: string;
    username: string | null;
    avatar: string | null;
    is_verified: boolean;
  };
  video: {
    id: string;
    title: string | null;
    thumbnail_url: string | null;
    video_url: string;
    views: number;
    likes: number;
  };
}

interface Challenge {
  id: string;
  title: string;
  prize_amount: number | null;
}

export default function ChallengeSubmissions() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [challengeId]);

  const fetchData = async () => {
    try {
      // Fetch challenge details
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('id, title, prize_amount')
        .eq('id', challengeId)
        .maybeSingle();

      if (challengeData) setChallenge(challengeData);

      // Fetch submissions with user and video data
      const { data: submissionData } = await supabase
        .from('challenge_submissions')
        .select(`
          id, status, created_at,
          user:profiles!challenge_submissions_user_id_fkey(
            id, username, avatar, is_verified
          ),
          video:videos!challenge_submissions_video_id_fkey(
            id, title, thumbnail_url, video_url, views, likes
          )
        `)
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false });

      if (submissionData) {
        setSubmissions(submissionData as unknown as Submission[]);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsWinner = async (submissionId: string) => {
    const { error } = await supabase
      .from('challenge_submissions')
      .update({ status: 'winner' })
      .eq('id', submissionId);

    if (!error) {
      setSubmissions(submissions.map(s => 
        s.id === submissionId ? { ...s, status: 'winner' } : s
      ));
      toast.success('Winner selected!');
    } else {
      toast.error('Failed to update status');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading submissions...</p>
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
            <h1 className="font-semibold">{challenge?.title || 'Challenge'}</h1>
            <p className="text-xs text-muted-foreground">{submissions.length} submissions</p>
          </div>
        </div>
      </div>

      {/* Submissions Grid */}
      <div className="p-4">
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No submissions yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {submissions.map((submission) => (
              <div 
                key={submission.id}
                className="bg-secondary rounded-xl overflow-hidden"
              >
                {/* Video Thumbnail */}
                <div 
                  className="aspect-[9/16] relative bg-muted cursor-pointer group"
                  onClick={() => navigate(`/feed?video=${submission.video.id}`)}
                >
                  {submission.video.thumbnail_url ? (
                    <img 
                      src={submission.video.thumbnail_url}
                      alt={submission.video.title || 'Video'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video 
                      src={submission.video.video_url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-10 w-10 text-white" fill="white" />
                  </div>
                  
                  {/* Winner Badge */}
                  {submission.status === 'winner' && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-coral text-white gap-1">
                        <Trophy className="h-3 w-3" /> Winner
                      </Badge>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 text-white text-xs">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {submission.video.views}
                    </span>
                  </div>
                </div>

                {/* Submission Info */}
                <div className="p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <img 
                      src={submission.user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                      alt={submission.user.username || 'User'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate">
                          @{submission.user.username || 'user'}
                        </p>
                        {submission.user.is_verified && (
                          <CheckCircle className="h-3 w-3 text-coral flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(submission.created_at)}
                      </p>
                    </div>
                  </div>

                  {submission.status !== 'winner' && (
                    <Button 
                      variant="coral" 
                      size="sm"
                      className="w-full"
                      onClick={() => markAsWinner(submission.id)}
                    >
                      <Trophy className="h-4 w-4 mr-1" />
                      Select as Winner
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}