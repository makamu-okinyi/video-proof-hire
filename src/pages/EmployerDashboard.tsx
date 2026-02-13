import { useNavigate } from 'react-router-dom';
import { Settings, Briefcase, Plus, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { StatCard, MiniBarChart } from '@/components/dashboard/StatCard';
import { useAuth } from '@/context/AuthContext';
import { useEmployerAnalytics } from '@/hooks/useEmployerAnalytics';

const chartData = [4, 7, 5, 9, 6, 8, 10, 7, 6, 9, 11, 8];

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  // #region agent log
  if (user) fetch('http://127.0.0.1:7242/ingest/b7445b92-2b1f-49fa-93e9-b6a4f91b1bfc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EmployerDashboard:render',message:'user id for analytics',data:{userId:user?.id,profileId:profile?.id},timestamp:Date.now(),hypothesisId:'K'})}).catch(()=>{});
  // #endregion
  const { data: analytics } = useEmployerAnalytics(user?.id);
  
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
          <StatCard
            title="Active Jobs"
            value={String(analytics?.activeJobs ?? 0)}
            change={0}
            changeLabel="this month"
            chart={<MiniBarChart data={chartData} className="h-10" />}
          />
          <StatCard
            title="Total Applicants"
            value={String(analytics?.totalApplicants ?? 0)}
            change={0}
            changeLabel="this month"
            chart={<MiniBarChart data={chartData} className="h-10" />}
          />
          <StatCard
            title="Challenges"
            value={String(analytics?.challenges ?? 0)}
            change={0}
            changeLabel="this month"
            chart={<MiniBarChart data={chartData} className="h-10" />}
          />
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
