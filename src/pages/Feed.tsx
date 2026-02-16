import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRoleBasedRedirect } from '@/components/auth/ProtectedRoute';
import { useFeedStats } from '@/hooks/useFeedStats';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RocketLoader } from '@/components/ui/RocketLoader';
import { Rocket, Briefcase, Trophy, FileText } from 'lucide-react';


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
          <RocketLoader indeterminate label="Loading..." />
        </div>
      </DashboardLayout>
    );
  }

  const totalApps = stats?.totalApplications ?? 0;
  const activeVentures = stats?.activeVentures ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 max-w-4xl mx-auto w-full overflow-x-hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal mb-2">
            {profile?.username || 'there'}
          </h1>
          <p className="text-cool-grey text-sm sm:text-base">
            {isAdmin
              ? 'Program overview and cohort metrics.'
              : totalApps > 0 || activeVentures > 0
                ? 'Your venture metrics and next actions.'
                : 'Apply to the program or explore opportunities below.'}
          </p>
        </div>

        {statsLoading ? (
          <div className="flex justify-center py-8"><RocketLoader indeterminate label="Loading stats..." /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <StatCard title="TOTAL APPLICATIONS" value={String(totalApps)} />
            <StatCard title="ACTIVE VENTURES" value={`${activeVentures}`} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/ventures')}
            className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-left hover:opacity-90 transition-all duration-300 group min-w-0 text-[#1e293b]"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/60 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-white/80 transition-all duration-300">
              <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1 text-sm sm:text-base">Explore Ventures</h3>
            <p className="text-xs sm:text-sm text-cool-grey">Browse startup projects</p>
          </button>

          <button
            onClick={() => navigate('/apply')}
            className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-left hover:opacity-90 transition-all duration-300 group min-w-0 text-[#1e293b]"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/60 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-white/80 transition-all duration-300">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1 text-sm sm:text-base">Apply as Applicant</h3>
            <p className="text-xs sm:text-sm text-cool-grey">Submit your video portfolio to find your next hire</p>
          </button>

          <button
            onClick={() => navigate('/jobs')}
            className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-left hover:opacity-90 transition-all duration-300 group min-w-0 text-[#1e293b]"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/60 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-white/80 transition-all duration-300">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1 text-sm sm:text-base">Find Jobs</h3>
            <p className="text-xs sm:text-sm text-cool-grey">Browse opportunities</p>
          </button>

          <button
            onClick={() => navigate('/challenges')}
            className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-left hover:opacity-90 transition-all duration-300 group min-w-0 text-[#1e293b]"
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/60 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-white/80 transition-all duration-300">
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
