import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Briefcase, Trophy, Users, Eye, 
  ChevronRight, MoreHorizontal, Edit2, Trash2, LogOut, Settings,
  Star, MessageCircle, Video, TrendingUp, Clock, CheckCircle,
  XCircle, Calendar, DollarSign, MapPin, Building2, Bell,
  ArrowUpRight, Sparkles, Target, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
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

interface HiringLead {
  id: string;
  talent_id: string;
  status: string;
  created_at: string;
  talent_username: string | null;
  talent_avatar: string | null;
}

interface ShortlistedTalent {
  id: string;
  talent_id: string;
  created_at: string;
  talent_username: string | null;
  talent_avatar: string | null;
  talent_skills: string[] | null;
}

type Tab = 'overview' | 'jobs' | 'challenges' | 'pipeline';

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leads, setLeads] = useState<HiringLead[]>([]);
  const [shortlisted, setShortlisted] = useState<ShortlistedTalent[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [jobsRes, challengesRes, leadsRes, shortlistRes, notifRes] = await Promise.all([
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
        // Fetch hiring leads
        supabase
          .from('hiring_leads')
          .select(`
            id,
            talent_id,
            status,
            created_at,
            profiles!hiring_leads_talent_id_fkey (
              username,
              avatar
            )
          `)
          .eq('recruiter_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10),
        // Fetch shortlisted talent
        supabase
          .from('shortlists')
          .select(`
            id,
            talent_id,
            created_at,
            profiles!shortlists_talent_id_fkey (
              username,
              avatar,
              skills
            )
          `)
          .eq('recruiter_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(5),
        // Fetch unread notifications count
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user?.id)
          .eq('is_read', false),
      ]);

      if (jobsRes.data) setJobs(jobsRes.data);
      if (challengesRes.data) setChallenges(challengesRes.data);
      if (leadsRes.data) {
        setLeads(leadsRes.data.map((l: any) => ({
          id: l.id,
          talent_id: l.talent_id,
          status: l.status,
          created_at: l.created_at,
          talent_username: l.profiles?.username,
          talent_avatar: l.profiles?.avatar,
        })));
      }
      if (shortlistRes.data) {
        setShortlisted(shortlistRes.data.map((s: any) => ({
          id: s.id,
          talent_id: s.talent_id,
          created_at: s.created_at,
          talent_username: s.profiles?.username,
          talent_avatar: s.profiles?.avatar,
          talent_skills: s.profiles?.skills,
        })));
      }
      if (notifRes.count) setUnreadNotifications(notifRes.count);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-500 bg-green-500/10';
      case 'pending': return 'text-amber-500 bg-amber-500/10';
      case 'declined': return 'text-red-500 bg-red-500/10';
      case 'interview_scheduled': return 'text-blue-500 bg-blue-500/10';
      case 'hired': return 'text-emerald-500 bg-emerald-500/10';
      default: return 'text-muted-foreground bg-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'declined': return <XCircle className="h-3 w-3" />;
      case 'interview_scheduled': return <Calendar className="h-3 w-3" />;
      case 'hired': return <Sparkles className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Calculate stats
  const totalViews = jobs.reduce((acc, j) => acc + j.views, 0);
  const totalApplicants = jobs.reduce((acc, j) => acc + j.applications_count, 0);
  const pendingLeads = leads.filter(l => l.status === 'pending').length;
  const acceptedLeads = leads.filter(l => l.status === 'accepted').length;

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
                className="h-11 w-11 rounded-xl object-cover border-2 border-coral/20"
              />
            ) : (
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-coral to-coral/60 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-background" />
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
              className="relative"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-coral text-background text-xs flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/employer/settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="bg-gradient-to-r from-coral/10 via-coral/5 to-transparent p-4 border-b border-coral/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-coral/20 flex items-center justify-center">
                <Eye className="h-4 w-4 text-coral" />
              </div>
              <div>
                <p className="text-lg font-bold">{totalViews}</p>
                <p className="text-xs text-muted-foreground">Views</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{totalApplicants}</p>
                <p className="text-xs text-muted-foreground">Applicants</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Target className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{shortlisted.length}</p>
                <p className="text-xs text-muted-foreground">Shortlisted</p>
              </div>
            </div>
          </div>
          <Button variant="coral" size="sm" onClick={() => navigate('/feed')}>
            <Video className="h-4 w-4 mr-1" />
            Find Talent
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'jobs', label: 'Jobs', icon: Briefcase, count: jobs.length },
          { id: 'challenges', label: 'Challenges', icon: Trophy, count: challenges.length },
          { id: 'pipeline', label: 'Pipeline', icon: Target, count: leads.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-coral text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-secondary text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">
            Loading...
          </div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-coral" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/employer/jobs/create')}
                  className="bg-gradient-to-br from-coral to-coral/80 text-background rounded-xl p-4 text-left hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-6 w-6 mb-2" />
                  <p className="font-semibold">Post a Job</p>
                  <p className="text-xs opacity-80">Reach thousands of talents</p>
                </button>
                <button
                  onClick={() => navigate('/employer/challenges/create')}
                  className="bg-gradient-to-br from-amber-500 to-amber-600 text-background rounded-xl p-4 text-left hover:opacity-90 transition-opacity"
                >
                  <Trophy className="h-6 w-6 mb-2" />
                  <p className="font-semibold">Create Challenge</p>
                  <p className="text-xs opacity-80">Test skills with contests</p>
                </button>
                <button
                  onClick={() => navigate('/feed')}
                  className="bg-secondary rounded-xl p-4 text-left hover:bg-secondary/80 transition-colors"
                >
                  <Video className="h-6 w-6 mb-2 text-coral" />
                  <p className="font-semibold">Browse Talent</p>
                  <p className="text-xs text-muted-foreground">Watch video portfolios</p>
                </button>
                <button
                  onClick={() => navigate('/employer/shortlist')}
                  className="bg-secondary rounded-xl p-4 text-left hover:bg-secondary/80 transition-colors"
                >
                  <Star className="h-6 w-6 mb-2 text-amber-500" />
                  <p className="font-semibold">My Shortlist</p>
                  <p className="text-xs text-muted-foreground">{shortlisted.length} candidates saved</p>
                </button>
              </div>
            </div>

            {/* Recent Shortlisted */}
            {shortlisted.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Recently Shortlisted
                  </h2>
                  <button 
                    onClick={() => navigate('/employer/shortlist')}
                    className="text-sm text-coral flex items-center gap-1"
                  >
                    View All <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {shortlisted.map((talent) => (
                    <button
                      key={talent.id}
                      onClick={() => navigate(`/user/${talent.talent_id}`)}
                      className="flex-shrink-0 bg-secondary rounded-xl p-3 text-center min-w-[100px] hover:bg-secondary/80 transition-colors"
                    >
                      <img
                        src={talent.talent_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                        alt={talent.talent_username || 'User'}
                        className="h-12 w-12 rounded-full object-cover mx-auto mb-2"
                      />
                      <p className="text-sm font-medium truncate">@{talent.talent_username || 'user'}</p>
                      {talent.talent_skills && talent.talent_skills[0] && (
                        <p className="text-xs text-muted-foreground truncate">{talent.talent_skills[0]}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hiring Pipeline Summary */}
            {leads.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-coral" />
                    Hiring Pipeline
                  </h2>
                  <button 
                    onClick={() => setActiveTab('pipeline')}
                    className="text-sm text-coral flex items-center gap-1"
                  >
                    View All <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-amber-500/10 rounded-xl p-3 text-center">
                    <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-amber-500">{pendingLeads}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-3 text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-500">{acceptedLeads}</p>
                    <p className="text-xs text-muted-foreground">Accepted</p>
                  </div>
                  <div className="bg-coral/10 rounded-xl p-3 text-center">
                    <Send className="h-5 w-5 text-coral mx-auto mb-1" />
                    <p className="text-2xl font-bold text-coral">{leads.length}</p>
                    <p className="text-xs text-muted-foreground">Total Sent</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Jobs */}
            {jobs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-coral" />
                    Your Job Postings
                  </h2>
                  <button 
                    onClick={() => setActiveTab('jobs')}
                    className="text-sm text-coral flex items-center gap-1"
                  >
                    View All <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {jobs.slice(0, 3).map((job) => (
                    <button
                      key={job.id}
                      onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}
                      className="w-full bg-secondary rounded-xl p-3 text-left hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {job.location || 'Remote'}
                            <span>•</span>
                            <Users className="h-3 w-3" />
                            {job.applications_count} applicants
                          </div>
                        </div>
                        <Badge variant={job.is_active ? 'default' : 'secondary'}>
                          {job.is_active ? 'Active' : 'Closed'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {jobs.length === 0 && challenges.length === 0 && (
              <div className="text-center py-8 bg-secondary/50 rounded-2xl">
                <div className="h-16 w-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-coral" />
                </div>
                <h3 className="font-semibold mb-2">Welcome to Donjo!</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                  Start by posting a job or creating a challenge to attract talented candidates.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="coral" onClick={() => navigate('/employer/jobs/create')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Post a Job
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/feed')}>
                    Browse Talent
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'jobs' ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
              <Button variant="coral" size="sm" onClick={() => navigate('/employer/jobs/create')}>
                <Plus className="h-4 w-4 mr-1" />
                New Job
              </Button>
            </div>
            {jobs.length === 0 ? (
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
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}>
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
            )}
          </div>
        ) : activeTab === 'challenges' ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{challenges.length} challenge{challenges.length !== 1 ? 's' : ''} created</p>
              <Button variant="coral" size="sm" onClick={() => navigate('/employer/challenges/create')}>
                <Plus className="h-4 w-4 mr-1" />
                New Challenge
              </Button>
            </div>
            {challenges.length === 0 ? (
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
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/employer/challenges/${challenge.id}/submissions`)}>
                      <h3 className="font-semibold">{challenge.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {challenge.prize_amount && (
                          <Badge variant="outline" className="text-coral border-coral">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {challenge.prize_amount} Prize
                          </Badge>
                        )}
                        {challenge.is_featured && (
                          <Badge>Featured</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {challenge.deadline 
                            ? `Ends ${formatDate(challenge.deadline)}`
                            : 'No deadline'}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {challenge.participants_count} participants
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
            )}
          </div>
        ) : activeTab === 'pipeline' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{leads.length} contact request{leads.length !== 1 ? 's' : ''} sent</p>
              <Button variant="coral" size="sm" onClick={() => navigate('/feed')}>
                <Video className="h-4 w-4 mr-1" />
                Find More Talent
              </Button>
            </div>

            {/* Pipeline Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { status: 'pending', label: 'Pending', color: 'amber' },
                { status: 'accepted', label: 'Accepted', color: 'green' },
                { status: 'interview_scheduled', label: 'Interview', color: 'blue' },
                { status: 'hired', label: 'Hired', color: 'emerald' },
              ].map((item) => (
                <div 
                  key={item.status}
                  className={cn(
                    "rounded-xl p-3 text-center",
                    `bg-${item.color}-500/10`
                  )}
                >
                  <p className={cn("text-xl font-bold", `text-${item.color}-500`)}>
                    {leads.filter(l => l.status === item.status).length}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            {leads.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-2">No leads yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse talent videos and tap "Contact" to start your hiring pipeline
                </p>
                <Button variant="coral" onClick={() => navigate('/feed')}>
                  <Video className="h-4 w-4 mr-2" />
                  Browse Talent
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {leads.map((lead) => (
                  <div 
                    key={lead.id}
                    className="bg-secondary rounded-xl p-4 flex items-center gap-3"
                  >
                    <img
                      src={lead.talent_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                      alt={lead.talent_username || 'User'}
                      className="h-12 w-12 rounded-full object-cover cursor-pointer"
                      onClick={() => navigate(`/user/${lead.talent_id}`)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">@{lead.talent_username || 'user'}</p>
                      <p className="text-xs text-muted-foreground">
                        Contacted {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5",
                      getStatusColor(lead.status)
                    )}>
                      {getStatusIcon(lead.status)}
                      <span className="capitalize">{lead.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
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
