import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Briefcase, Trophy, Users, Eye, 
  ChevronRight, MoreHorizontal, Edit2, Trash2, LogOut, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface JobPosting {
  id: string;
  title: string;
  company_name: string | null;
  location: string | null;
  job_type: string;
  is_active: boolean;
  views: number;
  applications_count: number;
  created_at: string;
}

interface Challenge {
  id: string;
  title: string;
  prize_amount: number | null;
  deadline: string | null;
  is_active: boolean;
  is_featured: boolean;
  participants_count: number;
  created_at: string;
}

type Tab = 'jobs' | 'challenges';

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('jobs');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [jobsRes, challengesRes] = await Promise.all([
        supabase
          .from('job_postings')
          .select('id, title, company_name, location, job_type, is_active, views, applications_count, created_at')
          .eq('employer_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('challenges')
          .select('id, title, prize_amount, deadline, is_active, is_featured, participants_count, created_at')
          .eq('employer_id', user?.id)
          .order('created_at', { ascending: false }),
      ]);

      if (jobsRes.data) setJobs(jobsRes.data);
      if (challengesRes.data) setChallenges(challengesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const { error } = await supabase.from('job_postings').delete().eq('id', jobId);
    if (!error) {
      setJobs(jobs.filter(j => j.id !== jobId));
      toast.success('Job posting deleted');
    } else {
      toast.error('Failed to delete job posting');
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    const { error } = await supabase.from('challenges').delete().eq('id', challengeId);
    if (!error) {
      setChallenges(challenges.filter(c => c.id !== challengeId));
      toast.success('Challenge deleted');
    } else {
      toast.error('Failed to delete challenge');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!user || profile?.user_type !== 'employer') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Employer Access Only</h2>
          <p className="text-muted-foreground">This page is for employer accounts only.</p>
          <Button onClick={() => navigate('/feed')}>Go to Feed</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile?.avatar ? (
              <img 
                src={profile.avatar} 
                alt="Company logo" 
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold">{profile?.username || 'Company'}</h1>
              <p className="text-xs text-muted-foreground">Employer Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/employer/settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button 
              variant="coral" 
              size="sm"
              onClick={() => navigate(activeTab === 'jobs' ? '/employer/jobs/create' : '/employer/challenges/create')}
            >
              <Plus className="h-4 w-4 mr-1" />
              New {activeTab === 'jobs' ? 'Job' : 'Challenge'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-4">
        <div className="bg-secondary rounded-xl p-4 text-center">
          <Briefcase className="h-5 w-5 mx-auto text-coral mb-1" />
          <p className="text-2xl font-bold">{jobs.length}</p>
          <p className="text-xs text-muted-foreground">Active Jobs</p>
        </div>
        <div className="bg-secondary rounded-xl p-4 text-center">
          <Trophy className="h-5 w-5 mx-auto text-coral mb-1" />
          <p className="text-2xl font-bold">{challenges.length}</p>
          <p className="text-xs text-muted-foreground">Challenges</p>
        </div>
        <div className="bg-secondary rounded-xl p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-coral mb-1" />
          <p className="text-2xl font-bold">
            {jobs.reduce((acc, j) => acc + j.applications_count, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Applicants</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mx-4">
        <button
          onClick={() => setActiveTab('jobs')}
          className={cn(
            "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'jobs'
              ? "border-coral text-foreground"
              : "border-transparent text-muted-foreground"
          )}
        >
          <Briefcase className="h-4 w-4 inline mr-2" />
          Job Postings
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={cn(
            "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'challenges'
              ? "border-coral text-foreground"
              : "border-transparent text-muted-foreground"
          )}
        >
          <Trophy className="h-4 w-4 inline mr-2" />
          Challenges
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">
            Loading...
          </div>
        ) : activeTab === 'jobs' ? (
          jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No job postings yet</p>
              <Button variant="coral" onClick={() => navigate('/employer/jobs/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Job Posting
              </Button>
            </div>
          ) : (
            jobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-secondary rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}>
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {job.company_name} • {job.location || 'Remote'}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant={job.is_active ? 'default' : 'secondary'}>
                        {job.is_active ? 'Active' : 'Closed'}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {job.views}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {job.applications_count}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}>
                        <Users className="h-4 w-4 mr-2" />
                        View Applicants
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )
        ) : (
          challenges.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No challenges yet</p>
              <Button variant="coral" onClick={() => navigate('/employer/challenges/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </div>
          ) : (
            challenges.map((challenge) => (
              <div 
                key={challenge.id} 
                className="bg-secondary rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => navigate(`/employer/challenges/${challenge.id}/submissions`)}>
                    <h3 className="font-semibold">{challenge.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {challenge.prize_amount && (
                        <Badge variant="outline" className="text-coral border-coral">
                          ${challenge.prize_amount} Prize
                        </Badge>
                      )}
                      {challenge.is_featured && (
                        <Badge>Featured</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {challenge.deadline 
                          ? `Ends ${formatDate(challenge.deadline)}`
                          : 'No deadline'}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> {challenge.participants_count}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/employer/challenges/${challenge.id}/submissions`)}>
                        <Users className="h-4 w-4 mr-2" />
                        View Submissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/employer/challenges/${challenge.id}/edit`)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteChallenge(challenge.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Logout Section */}
      <div className="px-4 py-6 border-t border-border mt-8">
        <button 
          onClick={async () => {
            await logout();
            navigate('/auth');
          }}
          className="w-full flex items-center justify-between py-3 text-destructive hover:bg-destructive/5 rounded-xl px-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </div>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}