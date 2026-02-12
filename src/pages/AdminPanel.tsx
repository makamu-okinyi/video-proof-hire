import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { StatCard, MiniBarChart } from '@/components/dashboard/StatCard';
import { PixelatedChart } from '@/components/dashboard/PixelatedChart';
import { 
  Users, FileText, Play, CheckCircle, X,
  Calendar, Award, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminVentures } from '@/hooks/useAdminVentures';
import { toast } from 'sonner';


const mentors = [
  { id: '1', name: 'Dr. Sarah Kimani', specialty: 'Strategy', available: true },
  { id: '2', name: 'James Ochieng', specialty: 'Engineering', available: true },
  { id: '3', name: 'Aisha Mohamed', specialty: 'Product', available: false },
];

type Tab = 'overview' | 'review' | 'mentors' | 'cohorts';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildApplicationChartData(ventures: { created_at: string }[]) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const currentYear = new Date().getFullYear();
  const byMonth = months.map((_, i) => {
    const count = ventures.filter(v => {
      const d = new Date(v.created_at);
      return d.getMonth() === i && d.getFullYear() === currentYear;
    }).length;
    return {
      label: months[i],
      applications: count,
      velocity: count * 2,
    };
  });
  return byMonth;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const {
    pendingVentures,
    allVentures,
    isLoading,
    error,
    updateStatus,
    isUpdating,
  } = useAdminVentures();

  const pendingCount = pendingVentures.length;
  const shortlistedCount = allVentures.filter(v => v.review_status === 'shortlisted').length;
  const rejectedCount = allVentures.filter(v => v.review_status === 'rejected').length;
  const applicationChartData = buildApplicationChartData(allVentures);

  const handleAction = async (ventureId: string, action: 'shortlisted' | 'rejected') => {
    try {
      await updateStatus({ ventureId, status: action });
      toast.success(action === 'shortlisted' ? 'Venture shortlisted' : 'Venture rejected');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'review', label: `Review Queue (${pendingCount})` },
    { id: 'mentors', label: 'Mentors' },
    { id: 'cohorts', label: 'Cohorts' },
  ];

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <p className="text-destructive">Failed to load ventures. Please try again.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto w-full overflow-x-hidden px-1 sm:px-0">
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cool-grey" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="PENDING REVIEW" value={String(pendingCount)} change={0} changeLabel="this week" chart={<MiniBarChart data={applicationChartData.map(d => d.applications)} className="h-8" />} />
                  <StatCard title="TOTAL APPLICATIONS" value={String(allVentures.length)} change={0.12} changeLabel="this month" chart={<MiniBarChart data={applicationChartData.map(d => d.applications)} className="h-8" />} />
                  <StatCard title="SHORTLISTED" value={String(shortlistedCount)} change={0.08} changeLabel="this month" chart={<MiniBarChart data={applicationChartData.map(d => d.applications)} className="h-8" />} />
                  <StatCard title="REJECTED" value={String(rejectedCount)} change={-0.05} changeLabel="this month" chart={<MiniBarChart data={applicationChartData.map(d => d.applications)} className="h-8" />} />
                </div>

                <NeoCard className="p-5 lg:p-8">
                  <NeoCardHeader className="flex-row items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-1">Application Intake & Cohort Velocity</p>
                      <NeoCardTitle className="text-xl">Total: <span className="font-bold">{allVentures.length}</span></NeoCardTitle>
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
                    <PixelatedChart data={applicationChartData} maxValue={Math.max(...applicationChartData.map(d => d.applications), 5)} pixelSize={8} activeIndex={new Date().getMonth()} />
                  </NeoCardContent>
                </NeoCard>
              </>
            )}
          </div>
        )}

        {/* Review Queue Tab */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cool-grey" />
              </div>
            ) : pendingCount === 0 ? (
              <NeoCard className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-charcoal font-semibold">All caught up!</p>
                <p className="text-cool-grey text-sm">No pending applications to review.</p>
              </NeoCard>
            ) : (
              pendingVentures.map(venture => (
                <NeoCard key={venture.id} className="p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 neo-pressed rounded-2xl flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal">{venture.name}</p>
                        <p className="text-cool-grey text-sm">by {venture.founder_name || 'Unknown'} · {(venture.industry || []).join(', ') || '—'} · {venture.stage}</p>
                        <p className="text-cool-grey/60 text-xs">Submitted {formatDate(venture.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`capitalize ${
                        venture.review_status === 'shortlisted' ? 'bg-green-500/10 text-green-600' : 
                        venture.review_status === 'rejected' ? 'bg-red-500/10 text-red-600' : 
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {venture.review_status}
                      </Badge>
                      {venture.pitch_video_url && (
                        <Button size="sm" variant="outline" className="neo-extruded border-none" onClick={() => setSelectedVideo(venture.pitch_video_url!)}>
                          <Play className="h-4 w-4 mr-1" /> Watch Pitch
                        </Button>
                      )}
                      {(venture.review_status === 'pending' || venture.review_status === 'submitted') && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white" 
                            onClick={() => handleAction(venture.id, 'shortlisted')}
                            disabled={isUpdating}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Shortlist
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleAction(venture.id, 'rejected')}
                            disabled={isUpdating}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </NeoCard>
              ))
            )}
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
                  <p className="text-cool-grey text-sm">Active · {shortlistedCount} ventures · Demo Day: March 15</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="neo-subtle rounded-2xl p-3 text-center">
                  <p className="text-2xl font-bold text-charcoal">{shortlistedCount}</p>
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
