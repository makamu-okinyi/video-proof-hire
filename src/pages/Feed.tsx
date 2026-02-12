import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRoleBasedRedirect } from '@/components/auth/ProtectedRoute';
import { useFeedStats } from '@/hooks/useFeedStats';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard, MiniBarChart } from '@/components/dashboard/StatCard';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { PixelatedChart } from '@/components/dashboard/PixelatedChart';
import { Rocket, Briefcase, Trophy, FileText } from 'lucide-react';

function buildChartData(totalApps: number) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const currentMonth = new Date().getMonth();
  return months.map((label, i) => ({
    label,
    applications: i === currentMonth ? totalApps : 0,
    velocity: i === currentMonth ? totalApps * 2 : 0,
  }));
}

export default function Feed() {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated, user } = useAuth();
  useRoleBasedRedirect();
  const isAdmin = profile?.user_type === 'employer' || profile?.user_type === 'investor';
  const { data: stats, isLoading: statsLoading } = useFeedStats(user?.id, isAdmin);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const isFounder = profile?.user_type === 'founder' || profile?.user_type === 'talent';
  const shouldRedirectToDashboard = (isAdmin || isFounder) && !!profile;
  if (isLoading || shouldRedirectToDashboard) {
    return (
      <DashboardLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="neo-pressed px-8 py-4 rounded-2xl text-cool-grey animate-pulse">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  const totalApps = stats?.totalApplications ?? 0;
  const activeVentures = stats?.activeVentures ?? 0;
  const chartData = [4, 7, 5, 9, 6, 8, 10, 7, 6, 9, 11, 8];

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 max-w-4xl mx-auto w-full overflow-x-hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal mb-2">
            Welcome back, {profile?.username || 'there'}
          </h1>
          <p className="text-cool-grey text-sm sm:text-base">
            {isAdmin
              ? 'Startup Garage program overview and cohort health metrics.'
              : 'Here&apos;s what&apos;s happening with your ventures today.'}
          </p>
        </div>

        {statsLoading ? (
          <div className="neo-pressed px-8 py-6 rounded-2xl text-cool-grey animate-pulse">Loading stats...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <StatCard
                title="TOTAL APPLICATIONS"
                value={String(totalApps)}
                change={0}
                changeLabel="your submissions"
                chart={<MiniBarChart data={chartData} className="h-10" />}
              />
              <StatCard
                title="ACTIVE VENTURES"
                value={`${activeVentures} Active`}
                change={0}
                changeLabel="yours"
                chart={<MiniBarChart data={chartData} className="h-10" />}
              />
            </div>

            <NeoCard className="p-4 sm:p-6 lg:p-8">
              <NeoCardHeader className="flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-1">
                    Application Intake & Cohort Velocity
                  </p>
                  <NeoCardTitle className="text-xl sm:text-2xl">
                    Total Applications: <span className="font-bold">{totalApps}</span>
                  </NeoCardTitle>
                </div>
              </NeoCardHeader>
              <NeoCardContent className="mt-4">
                <PixelatedChart
                  data={buildChartData(totalApps)}
                  maxValue={Math.max(totalApps, 5)}
                  pixelSize={8}
                  activeIndex={new Date().getMonth()}
                />
              </NeoCardContent>
            </NeoCard>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/ventures')}
            className="neo-extruded p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-left hover:shadow-neo-pressed transition-all duration-300 group min-w-0"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 neo-subtle rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:neo-pressed transition-all duration-300">
              <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1 text-sm sm:text-base">Explore Ventures</h3>
            <p className="text-xs sm:text-sm text-cool-grey">Browse startup projects</p>
          </button>

          <button
            onClick={() => navigate('/apply')}
            className="neo-extruded p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-left hover:shadow-neo-pressed transition-all duration-300 group min-w-0"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 neo-subtle rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:neo-pressed transition-all duration-300">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1 text-sm sm:text-base">Apply as Founder</h3>
            <p className="text-xs sm:text-sm text-cool-grey">Submit your venture</p>
          </button>

          <button
            onClick={() => navigate('/jobs')}
            className="neo-extruded p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-left hover:shadow-neo-pressed transition-all duration-300 group min-w-0"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 neo-subtle rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:neo-pressed transition-all duration-300">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1 text-sm sm:text-base">Find Jobs</h3>
            <p className="text-xs sm:text-sm text-cool-grey">Browse opportunities</p>
          </button>

          <button
            onClick={() => navigate('/challenges')}
            className="neo-extruded p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-left hover:shadow-neo-pressed transition-all duration-300 group min-w-0"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 neo-subtle rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:neo-pressed transition-all duration-300">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1 text-sm sm:text-base">Challenges</h3>
            <p className="text-xs sm:text-sm text-cool-grey">Win prizes & recognition</p>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
