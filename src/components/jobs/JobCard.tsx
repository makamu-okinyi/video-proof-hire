import { useState } from 'react';
import { MapPin, Clock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ApplyJobModal } from './ApplyJobModal';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  company_name: string | null;
  company_logo: string | null;
  location: string | null;
  job_type: string;
  experience_level: string | null;
  skills_required: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  video_prompt?: string | null;
  created_at: string;
}

interface JobCardProps {
  job: JobPosting;
  hasApplied?: boolean;
}

export function JobCard({ job, hasApplied }: JobCardProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showApplyModal, setShowApplyModal] = useState(false);

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'full-time': return 'Full-time';
      case 'part-time': return 'Part-time';
      case 'contract': return 'Contract';
      case 'internship': return 'Internship';
      default: return type;
    }
  };

  const getExperienceLabel = (level: string | null) => {
    switch (level) {
      case 'entry': return 'Entry Level';
      case 'mid': return 'Mid Level';
      case 'senior': return 'Senior Level';
      default: return level || 'All Levels';
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setShowApplyModal(true);
  };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    if (job.salary_min && job.salary_max) {
      return `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`;
    }
    if (job.salary_min) return `From $${(job.salary_min / 1000).toFixed(0)}k`;
    if (job.salary_max) return `Up to $${(job.salary_max / 1000).toFixed(0)}k`;
  };

  const salary = formatSalary();

  return (
    <>
      <Card className="p-5 border-border/50 hover:border-coral/30 transition-all duration-300 hover:shadow-md group">
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
            {job.company_logo ? (
              <img src={job.company_logo} alt={job.company_name || 'Company'} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:text-coral transition-colors font-sans">
              {job.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{job.company_name || 'Company'}</p>
            
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {job.location && (
                <span className="flex items-center gap-1 font-sans">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-[2px] bg-secondary font-sans">
                {getJobTypeLabel(job.job_type)}
              </span>
              {salary && (
                <span className="text-foreground font-medium font-mono">{salary}</span>
              )}
            </div>
          </div>

          {/* Time - JetBrains Mono */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </div>
        </div>

        {/* Skills */}
        {job.skills_required && job.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {job.skills_required.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs font-normal">
                {skill}
              </Badge>
            ))}
            {job.skills_required.length > 4 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{job.skills_required.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Apply Button - pointer-events-auto z-50 for laptop responsiveness */}
        <Button 
          variant={hasApplied ? "secondary" : "default"}
          className={cn(
            "w-full mt-4 pointer-events-auto z-50 font-sans rounded-[2px]",
            !hasApplied && "bg-emerald-500 hover:bg-emerald-600"
          )}
          size="sm"
          onClick={handleApplyClick}
          disabled={hasApplied}
        >
          {hasApplied ? 'Already Applied' : 'Apply with Video Profile'}
        </Button>
      </Card>

      <ApplyJobModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        job={job}
      />
    </>
  );
}
