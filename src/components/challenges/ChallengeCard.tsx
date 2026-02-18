import { Trophy, Users, Clock, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, isPast, format } from 'date-fns';

interface Challenge {
  id: string;
  title: string;
  description: string;
  prize_amount: number | null;
  prize_description: string | null;
  deadline: string | null;
  is_featured: boolean;
  participants_count: number;
  skills_tags: string[] | null;
  video_prompt?: string | null;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onSubmit: () => void;
  hasSubmitted?: boolean;
}

export function ChallengeCard({ challenge, onSubmit, hasSubmitted }: ChallengeCardProps) {
  const isExpired = challenge.deadline ? isPast(new Date(challenge.deadline)) : false;

  return (
    <Card className="p-5 border-border/50 hover:border-amber-500/30 transition-all duration-300 hover:shadow-md group relative overflow-hidden">
      {challenge.is_featured && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        </div>
      )}

      <div className="space-y-3">
        {/* Title & Description */}
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-amber-600 transition-colors pr-20">
            {challenge.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {challenge.description}
          </p>
        </div>

        {/* Prize */}
        {(challenge.prize_amount || challenge.prize_description) && (
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">
              {challenge.prize_amount 
                ? `$${challenge.prize_amount.toLocaleString()}`
                : challenge.prize_description
              }
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {challenge.participants_count} participant{challenge.participants_count !== 1 ? 's' : ''}
          </span>
          {challenge.deadline && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {isExpired 
                ? 'Ended' 
                : `Ends ${formatDistanceToNow(new Date(challenge.deadline), { addSuffix: true })}`
              }
            </span>
          )}
        </div>

        {/* Skills */}
        {challenge.skills_tags && challenge.skills_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {challenge.skills_tags.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs font-normal">
                {skill}
              </Badge>
            ))}
            {challenge.skills_tags.length > 4 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{challenge.skills_tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button 
          variant={hasSubmitted ? "secondary" : "default"}
          className="w-full mt-2"
          size="sm"
          onClick={onSubmit}
          disabled={isExpired}
        >
          {isExpired 
            ? 'Challenge Ended' 
            : hasSubmitted 
              ? 'Already Submitted' 
              : 'Submit Entry'
          }
        </Button>
      </div>
    </Card>
  );
}