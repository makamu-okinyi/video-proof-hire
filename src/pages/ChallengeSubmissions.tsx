import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Play, Eye, Trophy, CheckCircle, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';

export default function ChallengeSubmissions() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();

  const challenge = useQuery(
    api.challenges.getChallenge,
    challengeId ? { challengeId: challengeId as Id<'challenges'> } : 'skip'
  );
  const submissionsRaw = useQuery(
    api.challenges.getSubmissions,
    challengeId ? { challengeId: challengeId as Id<'challenges'> } : 'skip'
  );
  const submissions = submissionsRaw ?? [];
  const loading = challenge === undefined || submissionsRaw === undefined;
  const markSubmissionWinner = useMutation(api.challenges.markSubmissionWinner);

  const markAsWinner = async (submissionId: Id<'challengeSubmissions'>) => {
    try {
      await markSubmissionWinner({ submissionId });
      toast.success('Winner selected!');
    } catch (error) {
      console.error('Error marking winner:', error);
      toast.error('Failed to update status');
    }
  };

  const formatDate = (date: string | number) => {
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
                key={submission._id}
                className="bg-secondary rounded-xl overflow-hidden"
              >
                {/* Video Thumbnail */}
                <div
                  className="aspect-[9/16] relative bg-muted cursor-pointer group"
                  onClick={() => navigate(`/feed?video=${submission.video?._id}`)}
                >
                  {submission.video?.thumbnailUrl ? (
                    <img
                      src={submission.video.thumbnailUrl}
                      alt={submission.video.title || 'Video'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={submission.video?.videoUrl}
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
                      <Eye className="h-3 w-3" /> {submission.video?.views ?? 0}
                    </span>
                  </div>
                </div>

                {/* Submission Info */}
                <div className="p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    {submission.user?.avatar
                      ? <img src={submission.user.avatar} alt={submission.user.username || 'User'} className="h-8 w-8 rounded-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                      : <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0"><UserIcon className="h-4 w-4 text-muted-foreground" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate">
                          @{submission.user?.username || 'user'}
                        </p>
                        {submission.user?.isVerified && (
                          <CheckCircle className="h-3 w-3 text-coral flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(submission._creationTime)}
                      </p>
                    </div>
                  </div>

                  {submission.status !== 'winner' && (
                    <Button
                      variant="coral"
                      size="sm"
                      className="w-full"
                      onClick={() => markAsWinner(submission._id)}
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