import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DarkDashboardLayout } from '@/components/layout/DarkDashboardLayout';
import { DarkStatCard, MiniSparkline } from '@/components/dashboard/DarkStatCard';
import { DarkPixelatedChart } from '@/components/dashboard/DarkPixelatedChart';
import { ReviewQueue } from '@/components/admin/ReviewQueue';
import { GlassPanel } from '@/components/ui/glass-card';
import { Rocket, ClipboardList, CheckCircle, XCircle, Users } from 'lucide-react';

const chartData = [4, 7, 5, 9, 6, 8, 10, 7, 6, 9, 11, 8];

// Venture Engine chart data - realistic application trends
const applicationData = [
  { label: 'JAN', applications: 45 },
  { label: 'FEB', applications: 52 },
  { label: 'MAR', applications: 38 },
  { label: 'APR', applications: 61 },
  { label: 'MAY', applications: 55 },
  { label: 'JUN', applications: 72 },
  { label: 'JUL', applications: 48 },
  { label: 'AUG', applications: 65 },
  { label: 'SEP', applications: 58 },
  { label: 'OCT', applications: 44 },
  { label: 'NOV', applications: 51 },
  { label: 'DEC', applications: 67 },
];

export default function Feed() {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated } = useAuth();
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <DarkDashboardLayout>
        <div className="h-full flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-2xl text-white/60 animate-pulse">
            Loading...
          </div>
        </div>
      </DarkDashboardLayout>
    );
  }

  // Calculate totals for stats
  const totalApplications = applicationData.reduce((sum, d) => sum + d.applications, 0);
  const pendingReview = 23;
  const shortlisted = 12;
  const rejected = 8;

  return (
    <DarkDashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {profile?.username || 'Admin'}
          </h1>
          <p className="text-white/60">
            Startup Garage program overview and cohort health metrics.
          </p>
        </div>

        {/* Stats Row - Updated Donjo Labels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DarkStatCard
            title="Total Applications Received"
            value={totalApplications}
            change={0.18}
            changeLabel="vs last month"
            icon={<ClipboardList className="h-4 w-4 text-primary" />}
            chart={<MiniSparkline data={chartData} color="primary" />}
          />
          <DarkStatCard
            title="Applications Pending Review"
            value={pendingReview}
            change={-0.05}
            changeLabel="vs last week"
            icon={<Users className="h-4 w-4 text-yellow-400" />}
            chart={<MiniSparkline data={[3, 5, 4, 6, 8, 7, 5]} color="primary" />}
          />
          <DarkStatCard
            title="Founders Shortlisted"
            value={shortlisted}
            change={0.25}
            changeLabel="this cohort"
            icon={<CheckCircle className="h-4 w-4 text-green-400" />}
            chart={<MiniSparkline data={[2, 3, 4, 5, 6, 8, 12]} color="green" />}
          />
          <DarkStatCard
            title="Rejected Applications"
            value={rejected}
            change={-0.12}
            changeLabel="vs last cohort"
            icon={<XCircle className="h-4 w-4 text-red-400" />}
            chart={<MiniSparkline data={[5, 4, 6, 3, 4, 2, 3]} color="red" />}
          />
        </div>

        {/* Main Chart Area - Application Intake */}
        <GlassPanel className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                Application Intake & Cohort Velocity
              </p>
              <h2 className="text-2xl font-bold text-white">
                Total Applications: <span className="text-primary">{totalApplications}</span>
              </h2>
            </div>
            <div className="flex gap-2">
              {(['weekly', 'monthly', 'yearly'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`
                    px-4 py-2 rounded-xl text-sm capitalize transition-all duration-300
                    ${timeframe === tf 
                      ? 'bg-white/20 text-white font-medium' 
                      : 'text-white/40 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          {/* Pixelated Bar Chart - Dark Theme */}
          <DarkPixelatedChart 
            data={applicationData}
            maxValue={80}
            pixelSize={8}
            activeIndex={5}
          />
        </GlassPanel>

        {/* Review Queue Preview */}
        <ReviewQueue />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/ventures')}
            className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-left hover:bg-white/20 transition-all duration-300 group"
          >
            <div className="h-12 w-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-white mb-1">View All Ventures</h3>
            <p className="text-sm text-white/50">Browse active startups</p>
          </button>
          
          <button 
            onClick={() => navigate('/admin/review')}
            className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-left hover:bg-white/20 transition-all duration-300 group"
          >
            <div className="h-12 w-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ClipboardList className="h-6 w-6 text-yellow-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Review Applications</h3>
            <p className="text-sm text-white/50">{pendingReview} pending review</p>
          </button>
          
          <button 
            onClick={() => navigate('/admin/cohorts')}
            className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-left hover:bg-white/20 transition-all duration-300 group"
          >
            <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Manage Cohorts</h3>
            <p className="text-sm text-white/50">Configure programs</p>
          </button>
          
          <button 
            onClick={() => navigate('/challenges')}
            className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-left hover:bg-white/20 transition-all duration-300 group"
          >
            <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Rocket className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Create Challenge</h3>
            <p className="text-sm text-white/50">Launch a new challenge</p>
          </button>
        </div>
      </div>
    </DarkDashboardLayout>
  );
}
