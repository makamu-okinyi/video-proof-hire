import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { StatCard, MiniBarChart } from '@/components/dashboard/StatCard';
import { PixelatedChart } from '@/components/dashboard/PixelatedChart';
import { 
  Users, FileText, UserCheck, XCircle, 
  Play, CheckCircle, X, Eye, ChevronDown,
  Calendar, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const chartData = [4, 7, 5, 9, 6, 8, 10, 7, 6, 9, 11, 8];

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

// Mock applications for review queue
const mockApplications = [
  { id: '1', founderName: 'Amara Obi', venture: 'EcoTrack', stage: 'mvp', industry: 'CleanTech', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', status: 'pending', submittedAt: '2026-02-08' },
  { id: '2', founderName: 'Kevin Mwangi', venture: 'PayFast', stage: 'prototype', industry: 'FinTech', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', status: 'pending', submittedAt: '2026-02-07' },
  { id: '3', founderName: 'Fatima Hassan', venture: 'MediLink', stage: 'idea', industry: 'HealthTech', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', status: 'pending', submittedAt: '2026-02-06' },
  { id: '4', founderName: 'David Njoroge', venture: 'AgriFlow', stage: 'mvp', industry: 'AgriTech', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', status: 'shortlisted', submittedAt: '2026-02-04' },
  { id: '5', founderName: 'Grace Wanjiku', venture: 'EduPlatform', stage: 'prototype', industry: 'EdTech', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', status: 'rejected', submittedAt: '2026-02-03' },
];

const mentors = [
  { id: '1', name: 'Dr. Sarah Kimani', specialty: 'Strategy', available: true },
  { id: '2', name: 'James Ochieng', specialty: 'Engineering', available: true },
  { id: '3', name: 'Aisha Mohamed', specialty: 'Product', available: false },
];

type Tab = 'overview' | 'review' | 'mentors' | 'cohorts';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [applications, setApplications] = useState(mockApplications);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/auth');
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <div className="neo-pressed px-8 py-4 rounded-2xl text-cool-grey animate-pulse">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const shortlistedCount = applications.filter(a => a.status === 'shortlisted').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  const handleAction = (id: string, action: 'shortlisted' | 'rejected') => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: action } : a));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'review', label: `Review Queue (${pendingCount})` },
    { id: 'mentors', label: 'Mentors' },
    { id: 'cohorts', label: 'Cohorts' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-charcoal mb-1">Venture Engine</h1>
          <p className="text-cool-grey text-sm">Program management & application review dashboard.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id ? 'neo-pressed text-charcoal' : 'neo-flat text-cool-grey hover:text-charcoal'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="PENDING REVIEW" value={String(pendingCount)} change={0} changeLabel="this week" chart={<MiniBarChart data={chartData} className="h-8" />} />
              <StatCard title="TOTAL APPLICATIONS" value={String(applications.length)} change={0.12} changeLabel="this month" chart={<MiniBarChart data={chartData} className="h-8" />} />
              <StatCard title="SHORTLISTED" value={String(shortlistedCount)} change={0.08} changeLabel="this month" chart={<MiniBarChart data={chartData} className="h-8" />} />
              <StatCard title="REJECTED" value={String(rejectedCount)} change={-0.05} changeLabel="this month" chart={<MiniBarChart data={chartData} className="h-8" />} />
            </div>

            <NeoCard className="p-5 lg:p-8">
              <NeoCardHeader className="flex-row items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-1">Application Intake & Cohort Velocity</p>
                  <NeoCardTitle className="text-xl">Total: <span className="font-bold">{applications.length}</span></NeoCardTitle>
                </div>
                <div className="flex gap-2">
                  {(['weekly', 'monthly', 'yearly'] as const).map(tf => (
                    <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1.5 rounded-xl text-xs capitalize transition-all duration-300 ${timeframe === tf ? 'neo-pressed text-charcoal font-medium' : 'neo-flat text-cool-grey'}`}>
                      {tf}
                    </button>
                  ))}
                </div>
              </NeoCardHeader>
              <NeoCardContent className="mt-4">
                <PixelatedChart data={applicationData} maxValue={60} pixelSize={8} activeIndex={5} />
              </NeoCardContent>
            </NeoCard>
          </div>
        )}

        {/* Review Queue Tab */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            {applications.filter(a => a.status === 'pending').length === 0 && (
              <NeoCard className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-charcoal font-semibold">All caught up!</p>
                <p className="text-cool-grey text-sm">No pending applications to review.</p>
              </NeoCard>
            )}
            {applications.map(app => (
              <NeoCard key={app.id} className="p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 neo-pressed rounded-2xl flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal">{app.venture}</p>
                      <p className="text-cool-grey text-sm">by {app.founderName} · {app.industry} · {app.stage}</p>
                      <p className="text-cool-grey/60 text-xs">Submitted {app.submittedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`capitalize ${
                      app.status === 'shortlisted' ? 'bg-green-500/10 text-green-600' : 
                      app.status === 'rejected' ? 'bg-red-500/10 text-red-600' : 
                      'bg-amber-500/10 text-amber-600'
                    }`}>
                      {app.status}
                    </Badge>
                    <Button size="sm" variant="outline" className="neo-extruded border-none" onClick={() => setSelectedVideo(app.videoUrl)}>
                      <Play className="h-4 w-4 mr-1" /> Watch Pitch
                    </Button>
                    {app.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(app.id, 'shortlisted')}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Shortlist
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(app.id, 'rejected')}>
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </NeoCard>
            ))}
          </div>
        )}

        {/* Mentors Tab */}
        {activeTab === 'mentors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map(m => (
              <NeoCard key={m.id} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 neo-pressed rounded-2xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal">{m.name}</p>
                    <p className="text-cool-grey text-sm">{m.specialty}</p>
                  </div>
                </div>
                <Badge className={m.available ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
                  {m.available ? 'Available' : 'Busy'}
                </Badge>
              </NeoCard>
            ))}
          </div>
        )}

        {/* Cohorts Tab */}
        {activeTab === 'cohorts' && (
          <div className="space-y-4">
            <NeoCard className="p-5 lg:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 neo-pressed rounded-2xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-charcoal text-lg">Cohort 3 — 2026</p>
                  <p className="text-cool-grey text-sm">Active · 12 ventures · Demo Day: March 15</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="neo-subtle rounded-2xl p-3 text-center">
                  <p className="text-2xl font-bold text-charcoal">12</p>
                  <p className="text-xs text-cool-grey">Ventures</p>
                </div>
                <div className="neo-subtle rounded-2xl p-3 text-center">
                  <p className="text-2xl font-bold text-charcoal">8</p>
                  <p className="text-xs text-cool-grey">Mentors</p>
                </div>
                <div className="neo-subtle rounded-2xl p-3 text-center">
                  <p className="text-2xl font-bold text-charcoal">35d</p>
                  <p className="text-xs text-cool-grey">To Demo Day</p>
                </div>
              </div>
            </NeoCard>
          </div>
        )}

        {/* Video Modal */}
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>Founder Pitch Video</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <div className="aspect-[9/16] max-h-[70vh] bg-black rounded-2xl overflow-hidden">
                {selectedVideo && (
                  <video src={selectedVideo} controls autoPlay className="w-full h-full object-contain" />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
