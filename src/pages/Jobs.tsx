import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin, Briefcase, X, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobCard } from '@/components/jobs/JobCard';
import { BottomNav } from '@/components/layout/BottomNav';
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
  const [activeTab, setActiveTab] = useState<'jobs' | 'challenges'>('jobs');
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Jobs</h1>
          <Button 
            variant={showFilters ? "default" : "outline"} 
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(hasActiveFilters && !showFilters && "border-coral text-coral")}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          if (v === 'challenges') {
            navigate('/challenges');
          }
          setActiveTab(v as 'jobs' | 'challenges');
        }} className="mt-3">
          <TabsList className="w-full">
            <TabsTrigger value="jobs" className="flex-1">Job Listings</TabsTrigger>
            <TabsTrigger value="challenges" className="flex-1">
              <Trophy className="h-3 w-3 mr-1" />
              Challenges
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Active Filters Preview */}
        {hasActiveFilters && !showFilters && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {jobType !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                <Briefcase className="h-3 w-3" />
                {jobType}
                <button onClick={() => setJobType('all')}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {experienceLevel !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                {experienceLevel}
                <button onClick={() => setExperienceLevel('all')}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {selectedSkills.map(skill => (
              <Badge key={skill} variant="secondary" className="flex items-center gap-1 shrink-0">
                {skill}
                <button onClick={() => toggleSkill(skill)}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            ))}
            <button 
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card border-b border-border px-4 py-4 space-y-5 animate-slide-down">
          {/* Job Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Job Type
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'full-time', 'part-time', 'contract', 'internship'] as JobType[]).map((type) => (
                <Button
                  key={type}
                  variant={jobType === type ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setJobType(type)}
                  className="capitalize"
                >
                  {type === 'all' ? 'All' : type.replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Experience Level</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'entry', 'mid', 'senior'] as ExperienceLevel[]).map((level) => (
                <Button
                  key={level}
                  variant={experienceLevel === level ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setExperienceLevel(level)}
                  className="capitalize"
                >
                  {level === 'all' ? 'All Levels' : level}
                </Button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Skills</label>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill) => (
                <Button
                  key={skill}
                  variant={selectedSkills.includes(skill) ? "default" : "secondary"}
                  size="sm"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </Button>
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
      <div className="px-4 py-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
        </p>
        
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading jobs...
          </div>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              hasApplied={userApplications.includes(job.id)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No jobs match your criteria</p>
            <Button variant="link" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}