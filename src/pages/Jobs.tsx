import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin, Briefcase, X, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobCard } from '@/components/jobs/JobCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

type JobType = 'all' | 'full-time' | 'part-time' | 'contract' | 'internship';
type ExperienceLevel = 'all' | 'entry' | 'mid' | 'senior';

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
  created_at: string;
}

const skillsList = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'Node.js',
  'Figma', 'UI/UX', 'Product Management', 'Data Science',
  'Machine Learning'
];

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [jobType, setJobType] = useState<JobType>('all');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('all');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [userApplications, setUserApplications] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile, isLoading: authLoading } = useAuth();

  // Redirect employers to their dashboard
  useEffect(() => {
    if (!authLoading && profile?.user_type === 'employer') {
      navigate('/employer', { replace: true });
    }
  }, [profile, authLoading, navigate]);

  useEffect(() => {
    fetchJobs();
    if (user) {
      fetchUserApplications();
    }
  }, [user]);

  const fetchJobs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setJobs(data);
    }
    setIsLoading(false);
  };

  const fetchUserApplications = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('job_applications')
      .select('job_id')
      .eq('applicant_id', user.id);

    if (!error && data) {
      setUserApplications(data.map(a => a.job_id));
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (job.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesJobType = jobType === 'all' || job.job_type === jobType;
    const matchesExperience = experienceLevel === 'all' || job.experience_level === experienceLevel;
    const matchesSkills = selectedSkills.length === 0 || 
                         selectedSkills.some(skill => job.skills_required?.includes(skill));
    return matchesSearch && matchesJobType && matchesExperience && matchesSkills;
  });

  const clearFilters = () => {
    setSelectedSkills([]);
    setJobType('all');
    setExperienceLevel('all');
  };

  const hasActiveFilters = selectedSkills.length > 0 || jobType !== 'all' || experienceLevel !== 'all';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">Jobs</h1>
            <p className="text-cool-grey text-sm">Find your next opportunity</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/challenges')}
              variant="outline"
              className="neo-extruded border-none"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Challenges
            </Button>
            <Button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "neo-extruded border-none",
                hasActiveFilters && "text-primary"
              )}
              variant="outline"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="neo-pressed px-4 py-3 rounded-2xl flex items-center gap-3">
          <Search className="h-5 w-5 text-cool-grey" />
          <input
            placeholder="Search jobs, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-charcoal placeholder:text-cool-grey"
          />
        </div>

        {/* Active Filters Preview */}
        {hasActiveFilters && !showFilters && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {jobType !== 'all' && (
              <Badge variant="secondary" className="neo-flat flex items-center gap-1 shrink-0">
                <Briefcase className="h-3 w-3" />
                {jobType}
                <button onClick={() => setJobType('all')}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {experienceLevel !== 'all' && (
              <Badge variant="secondary" className="neo-flat flex items-center gap-1 shrink-0">
                {experienceLevel}
                <button onClick={() => setExperienceLevel('all')}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {selectedSkills.map(skill => (
              <Badge key={skill} variant="secondary" className="neo-flat flex items-center gap-1 shrink-0">
                {skill}
                <button onClick={() => toggleSkill(skill)}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            ))}
            <button 
              onClick={clearFilters}
              className="text-xs text-cool-grey hover:text-charcoal shrink-0"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="neo-extruded rounded-3xl p-6 space-y-5 animate-scale-up">
            {/* Job Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-charcoal flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Job Type
              </label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'full-time', 'part-time', 'contract', 'internship'] as JobType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setJobType(type)}
                    className={cn(
                      "px-4 py-2 rounded-2xl text-sm font-medium capitalize transition-all",
                      jobType === type ? "neo-pressed text-charcoal" : "neo-flat text-cool-grey hover:text-charcoal"
                    )}
                  >
                    {type === 'all' ? 'All' : type.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-charcoal">Experience Level</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'entry', 'mid', 'senior'] as ExperienceLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setExperienceLevel(level)}
                    className={cn(
                      "px-4 py-2 rounded-2xl text-sm font-medium capitalize transition-all",
                      experienceLevel === level ? "neo-pressed text-charcoal" : "neo-flat text-cool-grey hover:text-charcoal"
                    )}
                  >
                    {level === 'all' ? 'All Levels' : level}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-charcoal">Skills</label>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      "px-4 py-2 rounded-2xl text-sm font-medium transition-all",
                      selectedSkills.includes(skill) ? "neo-pressed text-charcoal" : "neo-flat text-cool-grey hover:text-charcoal"
                    )}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="ghost" onClick={clearFilters} className="flex-1">
                Clear All
              </Button>
              <Button onClick={() => setShowFilters(false)} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Job List */}
        <div className="space-y-4">
          <p className="text-sm text-cool-grey">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </p>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="neo-pressed px-6 py-3 rounded-2xl inline-block text-cool-grey animate-pulse">
                Loading jobs...
              </div>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="neo-extruded rounded-3xl overflow-hidden">
                  <JobCard 
                    job={job} 
                    hasApplied={userApplications.includes(job.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 neo-extruded rounded-3xl">
              <p className="text-cool-grey">No jobs match your criteria</p>
              <Button variant="link" onClick={clearFilters} className="text-primary">
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
