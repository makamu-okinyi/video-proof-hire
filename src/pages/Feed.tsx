import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard, MiniBarChart } from '@/components/dashboard/StatCard';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { PixelatedChart } from '@/components/dashboard/PixelatedChart';
import { Rocket, Briefcase, Trophy, FileText } from 'lucide-react';

const chartData = [4, 7, 5, 9, 6, 8, 10, 7, 6, 9, 11, 8];

// Venture Engine chart data
const applicationData = [
  { label: 'JAN', applications: 20, velocity: 15 },
  { label: 'FEB', applications: 25, velocity: 18 },
  { label: 'MAR', applications: 15, velocity: 12 },
  { label: 'APR', applications: 30, velocity: 22 },
  { label: 'MAY', applications: 35, velocity: 28 },
  { label: 'JUN', applications: 38, velocity: 18 },
  { label: 'JUL', applications: 28, velocity: 20 },
  { label: 'AUG', applications: 32, velocity: 25 },
  { label: 'SEP', applications: 22, velocity: 16 },
  { label: 'OCT', applications: 26, velocity: 19 },
  { label: 'NOV', applications: 30, velocity: 22 },
  { label: 'DEC', applications: 28, velocity: 20 },
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
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <div className="neo-pressed px-8 py-4 rounded-2xl text-cool-grey animate-pulse">
            Loading...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user is admin/employer for the admin dashboard view
  const isAdmin = profile?.user_type === 'employer' || profile?.user_type === 'investor';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">
            Welcome back, {profile?.username || 'there'}
          </h1>
          <p className="text-cool-grey">
            {isAdmin 
              ? "Startup Garage program overview and cohort health metrics."
              : "Here's what's happening with your ventures today."
            }
          </p>
        </div>

        {/* Stats Row - Venture Engine Labels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="TOTAL APPLICATIONS"
            value="347"
            change={0.94}
            changeLabel="last year"
            chart={<MiniBarChart data={chartData} className="h-10" />}
          />
          <StatCard
            title="ACTIVE VENTURES"
            value="42 Active"
            change={0.94}
            changeLabel="last year"
            chart={<MiniBarChart data={chartData} className="h-10" />}
          />
          <StatCard
            title="MENTORS ENGAGED"
            value="128 Mentors"
            change={0.94}
            changeLabel="last year"
            chart={<MiniBarChart data={chartData} className="h-10" />}
          />
        </div>

        {/* Main Chart Area - Application Intake & Cohort Velocity */}
        <NeoCard className="p-8">
          <NeoCardHeader className="flex-row items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-1">
                Application Intake & Cohort Velocity
              </p>
              <NeoCardTitle className="text-2xl">
                Total Applications: <span className="font-bold">347</span>
              </NeoCardTitle>
            </div>
            <div className="flex gap-2">
              {(['weekly', 'monthly', 'yearly'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`
                    px-4 py-2 rounded-xl text-sm capitalize transition-all duration-300
                    ${timeframe === tf 
                      ? 'neo-pressed text-charcoal font-medium' 
                      : 'neo-flat text-cool-grey hover:text-charcoal'
                    }
                  `}
                >
                  {tf}
                </button>
              ))}
            </div>
          </NeoCardHeader>
          <NeoCardContent className="mt-6">
            {/* Pixelated Bar Chart */}
            <PixelatedChart 
              data={applicationData}
              maxValue={60}
              pixelSize={8}
              activeIndex={5}
            />
          </NeoCardContent>
        </NeoCard>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/ventures')}
            className="neo-extruded p-6 rounded-3xl text-left hover:shadow-neo-pressed transition-all duration-300 group"
          >
            <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center mb-4 group-hover:neo-pressed transition-all duration-300">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1">Explore Ventures</h3>
            <p className="text-sm text-cool-grey">Browse startup projects</p>
          </button>
          
          <button 
            onClick={() => navigate('/apply')}
            className="neo-extruded p-6 rounded-3xl text-left hover:shadow-neo-pressed transition-all duration-300 group"
          >
            <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center mb-4 group-hover:neo-pressed transition-all duration-300">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1">Apply as Founder</h3>
            <p className="text-sm text-cool-grey">Submit your venture</p>
          </button>
          
          <button 
            onClick={() => navigate('/jobs')}
            className="neo-extruded p-6 rounded-3xl text-left hover:shadow-neo-pressed transition-all duration-300 group"
          >
            <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center mb-4 group-hover:neo-pressed transition-all duration-300">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1">Find Jobs</h3>
            <p className="text-sm text-cool-grey">Browse opportunities</p>
          </button>
          
          <button 
            onClick={() => navigate('/challenges')}
            className="neo-extruded p-6 rounded-3xl text-left hover:shadow-neo-pressed transition-all duration-300 group"
          >
            <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center mb-4 group-hover:neo-pressed transition-all duration-300">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1">Challenges</h3>
            <p className="text-sm text-cool-grey">Win prizes & recognition</p>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
