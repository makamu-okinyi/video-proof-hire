import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard, MiniBarChart } from '@/components/dashboard/StatCard';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { Rocket, Users, TrendingUp, Briefcase, Trophy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const chartData = [4, 7, 5, 9, 6, 8, 10, 7, 6, 9, 11, 8];
const barChartData = [
  { month: 'JAN', newUser: 20, existingUser: 15 },
  { month: 'FEB', newUser: 25, existingUser: 18 },
  { month: 'MAR', newUser: 15, existingUser: 12 },
  { month: 'APR', newUser: 30, existingUser: 22 },
  { month: 'MAY', newUser: 35, existingUser: 28 },
  { month: 'JUN', newUser: 38, existingUser: 18 },
  { month: 'JUL', newUser: 28, existingUser: 20 },
  { month: 'AUG', newUser: 32, existingUser: 25 },
  { month: 'SEP', newUser: 22, existingUser: 16 },
  { month: 'OCT', newUser: 26, existingUser: 19 },
  { month: 'NOV', newUser: 30, existingUser: 22 },
  { month: 'DEC', newUser: 28, existingUser: 20 },
];

export default function Feed() {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated } = useAuth();

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">
            Welcome back, {profile?.username || 'there'}
          </h1>
          <p className="text-cool-grey">Here's what's happening with your ventures today.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Ventures"
            value="42"
            change={0.94}
            changeLabel="last year"
            chart={<MiniBarChart data={chartData} className="h-10" />}
          />
          <StatCard
            title="Active Applications"
            value="128"
            change={0.94}
            changeLabel="last year"
            chart={<MiniBarChart data={chartData} className="h-10" />}
          />
          <StatCard
            title="New Founders"
            value="2,847"
            change={0.94}
            changeLabel="last year"
            chart={<MiniBarChart data={chartData} className="h-10" />}
          />
        </div>

        {/* Main Chart Area */}
        <NeoCard className="p-8">
          <NeoCardHeader className="flex-row items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-1">
                Application Trend
              </p>
              <NeoCardTitle className="text-2xl">
                Total Revenue: <span className="font-bold">$20,320</span>
              </NeoCardTitle>
            </div>
            <div className="flex gap-2">
              <button className="neo-flat px-4 py-2 rounded-xl text-sm text-cool-grey hover:text-charcoal transition-colors">
                Weekly
              </button>
              <button className="neo-pressed px-4 py-2 rounded-xl text-sm text-charcoal font-medium">
                Monthly
              </button>
              <button className="neo-flat px-4 py-2 rounded-xl text-sm text-cool-grey hover:text-charcoal transition-colors">
                Yearly
              </button>
            </div>
          </NeoCardHeader>
          <NeoCardContent>
            {/* Pixelated Bar Chart */}
            <div className="mt-8 h-64 flex items-end justify-between gap-2 px-4">
              {barChartData.map((data, index) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-0.5">
                    {/* Stacked bars with pixel effect */}
                    <div 
                      className="w-full bg-foreground/80 rounded-t"
                      style={{ height: `${data.newUser * 4}px` }}
                    />
                    <div 
                      className="w-full bg-foreground/30"
                      style={{ height: `${data.existingUser * 3}px` }}
                    />
                  </div>
                  <span className={`text-xs mt-2 ${index === 5 ? 'font-bold text-charcoal' : 'text-cool-grey'}`}>
                    {data.month}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-6 mt-6 justify-center">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-foreground/80 rounded-sm" />
                <span className="text-sm text-cool-grey">New User</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-foreground/30 rounded-sm" />
                <span className="text-sm text-cool-grey">Existing User</span>
              </div>
            </div>
          </NeoCardContent>
        </NeoCard>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/ventures')}
            className="neo-extruded p-6 rounded-3xl text-left hover:shadow-neo-pressed transition-all group"
          >
            <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center mb-4 group-hover:neo-pressed transition-all">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1">Explore Ventures</h3>
            <p className="text-sm text-cool-grey">Browse startup projects</p>
          </button>
          
          <button 
            onClick={() => navigate('/apply')}
            className="neo-extruded p-6 rounded-3xl text-left hover:shadow-neo-pressed transition-all group"
          >
            <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center mb-4 group-hover:neo-pressed transition-all">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1">Apply as Founder</h3>
            <p className="text-sm text-cool-grey">Submit your venture</p>
          </button>
          
          <button 
            onClick={() => navigate('/jobs')}
            className="neo-extruded p-6 rounded-3xl text-left hover:shadow-neo-pressed transition-all group"
          >
            <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center mb-4 group-hover:neo-pressed transition-all">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-charcoal mb-1">Find Jobs</h3>
            <p className="text-sm text-cool-grey">Browse opportunities</p>
          </button>
          
          <button 
            onClick={() => navigate('/challenges')}
            className="neo-extruded p-6 rounded-3xl text-left hover:shadow-neo-pressed transition-all group"
          >
            <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center mb-4 group-hover:neo-pressed transition-all">
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
