import { MapPin, Clock, Building2 } from 'lucide-react';
import { Job } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case 'remote': return 'Remote';
      case 'hybrid': return 'Hybrid';
      case 'onsite': return 'On-site';
      default: return type;
    }
  };

  const getExperienceLabel = (level: string) => {
    switch (level) {
      case 'entry': return 'Entry Level';
      case 'mid': return 'Mid Level';
      case 'senior': return 'Senior Level';
      default: return level;
    }
  };

  const timeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  return (
    <Card className="p-5 border-border/50 hover:border-coral/30 transition-all duration-300 hover:shadow-md group">
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.companyName} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-coral transition-colors">
            {job.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{job.companyName}</p>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full",
              job.locationType === 'remote' && "bg-green-500/10 text-green-600",
              job.locationType === 'hybrid' && "bg-blue-500/10 text-blue-600",
              job.locationType === 'onsite' && "bg-amber-500/10 text-amber-600"
            )}>
              {getLocationTypeLabel(job.locationType)}
            </span>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {timeAgo(job.postedAt)}
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mt-4">
        {job.skills.slice(0, 4).map((skill) => (
          <Badge key={skill} variant="secondary" className="text-xs font-normal">
            {skill}
          </Badge>
        ))}
        {job.skills.length > 4 && (
          <Badge variant="secondary" className="text-xs font-normal">
            +{job.skills.length - 4}
          </Badge>
        )}
      </div>

      {/* Apply Button */}
      <Button 
        variant="default" 
        className="w-full mt-4"
        size="sm"
      >
        Apply with Video Profile
      </Button>
    </Card>
  );
}
