import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Briefcase, Plus, Trophy, TrendingUp, Edit2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/context/AuthContext';
import { useEmployerAnalytics } from '@/hooks/useEmployerAnalytics';
import { supabase } from '@/integrations/supabase/client';

const chartData = [4, 7, 5, 9, 6, 8, 10, 7, 6, 9, 11, 8];

interface EmployerJob { id: string; title: string; company_name: string | null; is_active: boolean }
interface EmployerChallenge { id: string; title: string; is_active: boolean }

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { data: analytics } = useEmployerAnalytics(user?.id ?? profile?.id);
  const [myJobs, setMyJobs] = useState<EmployerJob[]>([]);
  const [myChallenges, setMyChallenges] = useState<EmployerChallenge[]>([]);

  useEffect(() => {
    const uid = user?.id ?? profile?.id;
    if (!uid) return;
    const load = async () => {
      const { data: jobs } = await supabase.from('job_postings').select('id, title, company_name, is_active').eq('employer_id', uid).order('created_at', { ascending: false });
      setMyJobs(jobs ?? []);
      const { data: challenges } = await supabase.from('challenges').select('id, title, is_active').eq('employer_id', uid).order('created_at', { ascending: false });
      setMyChallenges(challenges ?? []);
    };
    load();
  }, [user?.id, profile?.id]);
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">
              Welcome, {profile?.username || 'Employer'}
            </h1>
            <p className="text-cool-grey">Manage your hiring pipeline</p>
          </div>
          <button 
            onClick={() => navigate('/employer/settings')}
            className="neo-extruded p-3 rounded-2xl hover:shadow-neo-pressed transition-all"
          >
            <Settings className="h-5 w-5 text-cool-grey" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Active Jobs" value={String(analytics?.activeJobs ?? 0)} />
          <StatCard title="Total Applicants" value={String(analytics?.totalApplicants ?? 0)} />
          <StatCard title="Challenges" value={String(analytics?.challenges ?? 0)} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NeoCard className="p-6">
            <NeoCardHeader>
              <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center mb-2">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <NeoCardTitle>Post a Job</NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent>
              <p className="text-cool-grey text-sm mb-4">
                Create a new job listing to attract top talent from our community.
              </p>
              <Button 
                className="w-full"
                onClick={() => navigate('/employer/jobs/create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Job Posting
              </Button>
            </NeoCardContent>
          </NeoCard>

          <NeoCard className="p-6">
            <NeoCardHeader>
              <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <NeoCardTitle>Create Challenge</NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent>
              <p className="text-cool-grey text-sm mb-4">
                Launch a skill challenge to discover hidden gems in our talent pool.
              </p>
              <Button 
                variant="outline"
                className="w-full neo-extruded border-none"
                onClick={() => navigate('/employer/challenges/create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </NeoCardContent>
          </NeoCard>
        </div>

        {/* My Jobs */}
        <NeoCard className="p-6">
          <NeoCardHeader className="flex-row items-center justify-between">
            <NeoCardTitle>My Jobs</NeoCardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/employer/jobs/create')}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </NeoCardHeader>
          <NeoCardContent>
            {myJobs.length === 0 ? (
              <p className="text-cool-grey text-sm text-center py-4">No jobs yet. Create one to get started.</p>
            ) : (
              <div className="space-y-3">
                {myJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-charcoal">{job.title}</p>
                      <p className="text-xs text-cool-grey">{job.company_name || '—'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/employer/jobs/${job.id}/applicants`)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NeoCardContent>
        </NeoCard>

        {/* My Challenges */}
        <NeoCard className="p-6">
          <NeoCardHeader className="flex-row items-center justify-between">
            <NeoCardTitle>My Challenges</NeoCardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/employer/challenges/create')}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </NeoCardHeader>
          <NeoCardContent>
            {myChallenges.length === 0 ? (
              <p className="text-cool-grey text-sm text-center py-4">No challenges yet. Create one to discover talent.</p>
            ) : (
              <div className="space-y-3">
                {myChallenges.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <p className="font-medium text-charcoal">{ch.title}</p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/employer/challenges/${ch.id}/submissions`)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/employer/challenges/${ch.id}/edit`)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NeoCardContent>
        </NeoCard>

        {/* Recent Activity */}
        <NeoCard className="p-6">
          <NeoCardHeader>
            <NeoCardTitle>Recent Activity</NeoCardTitle>
          </NeoCardHeader>
          <NeoCardContent>
            <div className="text-center py-12">
              <div className="h-16 w-16 neo-pressed rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-cool-grey" />
              </div>
              <p className="text-cool-grey">No recent activity</p>
              <p className="text-sm text-cool-grey mt-1">
                Start by posting a job or creating a challenge
              </p>
            </div>
          </NeoCardContent>
        </NeoCard>
      </div>
    </DashboardLayout>
  );
}
