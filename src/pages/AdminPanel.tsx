import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  Users, FileText, Play, CheckCircle, X,
  Calendar, Award, Loader2, AlertCircle, ArrowRight, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PitchVideoModal } from '@/components/PitchVideoModal';
import { useAdminVentures } from '@/hooks/useAdminVentures';
import { formatStage } from '@/lib/stageDisplay';
import { toast } from 'sonner';
import { SystemHealthGauge, EngagementFluxChart, MetricCard } from '@/components/admin/MedicalChicAnalytics';
import { SystemHealthGauge, EngagementFluxChart, MetricCard } from '@/components/admin/MedicalChicAnalytics';

const mentors = [
  { id: '1', name: 'Dr. Sarah Kimani', specialty: 'Strategy', available: true },
  { id: '2', name: 'James Ochieng', specialty: 'Engineering', available: true },
  { id: '3', name: 'Aisha Mohamed', specialty: 'Product', available: false },
];

type Tab = 'overview' | 'analytics' | 'review' | 'mentors' | 'cohorts';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildApplicationChartData(ventures: { created_at?: string }[]) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const currentYear = new Date().getFullYear();
  const safeVentures = Array.isArray(ventures) ? ventures : [];
  const byMonth = months.map((_, i) => {
    const count = safeVentures.filter((v) => {
      const ts = v?.created_at;
      if (!ts) return false;
      const d = new Date(ts);
      return !isNaN(d.getTime()) && d.getMonth() === i && d.getFullYear() === currentYear;
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
  const [removedVentureIds, setRemovedVentureIds] = useState<Set<string>>(new Set());

  const {
    pendingVentures,
    allVentures,
    isLoading,
    error,
    updateStatus,
    isUpdating,
  } = useAdminVentures();

  const baseQueueItems = (pendingVentures ?? []).filter((v) => v?.review_status === 'pending' || v?.review_status === 'submitted');
  const reviewQueueItems = baseQueueItems.filter((v) => !removedVentureIds.has(v.id));
  const pendingCount = reviewQueueItems.length;

  useEffect(() => {
    const baseIds = new Set(baseQueueItems.map((v) => v.id));
    setRemovedVentureIds((prev) => {
      const next = new Set(prev);
      next.forEach((id) => { if (!baseIds.has(id)) next.delete(id); });
      return next.size === prev.size ? prev : next;
    });
  }, [baseQueueItems.length, baseQueueItems.map((v) => v.id).join(',')]);
  const shortlistedCount = allVentures?.filter((v) => v?.review_status === 'shortlisted').length ?? 0;
  const rejectedCount = allVentures?.filter((v) => v?.review_status === 'rejected').length ?? 0;
  const applicationChartData = buildApplicationChartData(allVentures ?? []);

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const pendingLongCount = (allVentures ?? []).filter(
    (v) => (v?.review_status === 'pending' || v?.review_status === 'submitted') && new Date(v.created_at) < fiveDaysAgo
  ).length;

  const currentMonthIdx = new Date().getMonth();
  const thisMonthApps = applicationChartData[currentMonthIdx]?.applications ?? 0;
  const lastMonthApps = applicationChartData[currentMonthIdx - 1]?.applications ?? 0;
  const monthOverMonthChange = lastMonthApps > 0 ? (thisMonthApps - lastMonthApps) / lastMonthApps : 0;

  const handleAction = (venture: { id: string; name: string; founder_id?: string | null }, action: 'shortlisted' | 'rejected') => {
    setRemovedVentureIds((prev) => new Set(prev).add(venture.id));
    updateStatus(
      { ventureId: venture.id, status: action, founderId: venture.founder_id ?? undefined, ventureName: venture.name },
      { onError: () => setRemovedVentureIds((prev) => { const n = new Set(prev); n.delete(venture.id); return n; }) }
    );
  };

  const [pdfLoading, setPdfLoading] = useState(false);
  const handleDownloadDossier = async () => {
    setPdfLoading(true);
    try {
      const applicants = (allVentures ?? []).map((v) => ({
        applicantName: v.founder_name || 'Unknown',
        jobRole: v.name,
        videoPortfolioUrl: v.pitch_video_url,
      }));
      const [{ pdf }, { ApplicantDossierPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/admin/ApplicantDossierPDF'),
      ]);
      const blob = await pdf(<ApplicantDossierPDF applicants={applicants} title="Applicant Dossier — Venture Engine" />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applicant-dossier-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Applicant dossier downloaded');
    } catch (err) {
      toast.error('Failed to generate dossier');
    } finally {
      setPdfLoading(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-charcoal mb-1">Venture Engine</h1>
            <p className="text-cool-grey text-sm">Program management & application review dashboard.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="neo-extruded border-none shrink-0"
            onClick={handleDownloadDossier}
            disabled={pdfLoading || !allVentures?.length}
          >
            {pdfLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download Applicant Dossier
          </Button>
        </div>

        {/* Tabs - unmistakable active state */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-[2px] text-sm font-semibold whitespace-nowrap transition-all duration-300 pointer-events-auto ${
                activeTab === tab.id
                  ? 'neo-pressed text-charcoal ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'neo-flat text-cool-grey hover:text-charcoal'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Urgency banner - product intelligence */}
        {pendingLongCount > 0 && activeTab !== 'review' && (
          <NeoCard className="p-4 border-l-4 border-l-amber-500 bg-amber-500/5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-semibold text-charcoal">
                    {pendingLongCount} application{pendingLongCount !== 1 ? 's' : ''} pending 5+ days
                  </p>
                  <p className="text-sm text-cool-grey">Review now to keep applicants engaged.</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setActiveTab('review')} className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
                Review Queue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </NeoCard>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <GolfBallLoader indeterminate label="Loading overview..." />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="PENDING REVIEW" value={String(pendingCount)} />
                  <StatCard
                    title="TOTAL APPLICATIONS"
                    value={String(allVentures.length)}
                    change={monthOverMonthChange}
                    changeLabel="vs last month"
                  />
                  <StatCard title="SHORTLISTED" value={String(shortlistedCount)} />
                  <StatCard title="REJECTED" value={String(rejectedCount)} />
                </div>

                {applicationChartData.some(d => d.applications > 0) && (
                  <NeoCard className="p-5 lg:p-8 rounded-[2px]">
                    <NeoCardHeader>
                      <div>
                        <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-1">Applications by month (this year)</p>
                        <NeoCardTitle className="text-xl">Monthly intake trend</NeoCardTitle>
                      </div>
                    </NeoCardHeader>
                    <NeoCardContent className="mt-4">
                      <div className="flex items-end gap-1 h-24">
                        {applicationChartData.map((d, i) => (
                          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full max-w-[24px] bg-primary/80 rounded-t transition-all"
                              style={{ height: `${Math.max(4, (d.applications / Math.max(1, ...applicationChartData.map(x => x.applications))) * 100)}%` }}
                            />
                            <span className="text-[10px] text-cool-grey">{d.label}</span>
                          </div>
                        ))}
                      </div>
                    </NeoCardContent>
                  </NeoCard>
                )}
              </>
            )}
          </div>
        )}

        {/* Analytics Tab - Medical-Chic */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <GolfBallLoader indeterminate label="Loading analytics..." />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <NeoCard className="p-6 rounded-[2px]">
                    <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-4">System Health</p>
                    <SystemHealthGauge
                      value={(allVentures?.length ? (shortlistedCount / allVentures.length) * 10 : 0)}
                      max={10}
                      label="Application Success Rate"
                    />
                  </NeoCard>
                  <NeoCard className="p-6 rounded-[2px]">
                    <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-4">Engagement Flux</p>
                    <p className="text-sm text-cool-grey mb-2">Daily Active Applicants</p>
                    <EngagementFluxChart
                      data={(() => {
                        const days = 7;
                        const now = new Date();
                        return Array.from({ length: days }, (_, i) => {
                          const d = new Date(now);
                          d.setDate(d.getDate() - (days - 1 - i));
                          return {
                            date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                            applicants: (allVentures ?? []).filter((v) =>
                              new Date(v.created_at).toDateString() === d.toDateString()
                            ).length,
                          };
                        });
                      })()}
                    />
                  </NeoCard>
                </div>
                <NeoCard className="p-6 rounded-[2px]">
                  <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-4">Metric Cards</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                    <MetricCard
                      label="Profile Completion"
                      value={allVentures?.filter((v) => v.founder_name && v.pitch_video_url).length ?? 0}
                      max={allVentures?.length ?? 1}
                      change={12.2}
                    />
                    <MetricCard
                      label="Video Quality Score"
                      value={shortlistedCount * 10}
                      max={(allVentures?.length ?? 0) * 10 || 100}
                      change={-2.4}
                    />
                  </div>
                </NeoCard>
              </>
            )}
          </div>
        )}

        {/* Review Queue Tab */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <GolfBallLoader indeterminate label="Loading review queue..." />
              </div>
            ) : pendingCount === 0 ? (
              <NeoCard className="p-8 lg:p-12 text-center">
                <div className="h-16 w-16 neo-pressed rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-charcoal font-semibold text-lg mb-1">All caught up</p>
                <p className="text-cool-grey text-sm mb-4 max-w-sm mx-auto">
                  Every application has been reviewed. New submissions will appear here when founders apply.
                </p>
                <p className="text-xs text-cool-grey">Review Queue is empty — you're ready for the next cohort.</p>
              </NeoCard>
            ) : (
              reviewQueueItems.map((venture) => (
                <NeoCard key={venture.id} className="p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 neo-pressed rounded-2xl flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-charcoal">{venture.name}</p>
                        <p className="text-cool-grey text-sm">by {venture.founder_name || 'Unknown'} · {(venture.industry || []).join(', ') || '—'} · {formatStage(venture.stage)}</p>
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
                            onClick={() => handleAction(venture, 'shortlisted')}
                            disabled={isUpdating}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Shortlist
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleAction(venture, 'rejected')}
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

        {/* Video Modal - custom to avoid zoom animation that caused centering flash */}
        <PitchVideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo || ''}
          title="Applicant Pitch Video"
        />
      </div>
    </DashboardLayout>
  );
}
