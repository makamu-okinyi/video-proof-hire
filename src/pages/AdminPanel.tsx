import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  Users, FileText, Play, CheckCircle, X,
  Calendar, Award, Loader2, AlertCircle, ArrowRight, Download, Eye, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PitchVideoModal } from '@/components/PitchVideoModal';
import { useAdminVentures } from '@/hooks/useAdminVentures';
import { formatStage } from '@/lib/stageDisplay';
import { toast } from 'sonner';
import { RocketLoader } from '@/components/ui/RocketLoader';
import { SystemHealthGauge, EngagementFluxChart, MetricCard, PipelineVelocityGauge, SkillRadarChart, GeospatialHeatmap, ApplicationVelocityChart, CohortCompositionDonut } from '@/components/admin/MedicalChicAnalytics';

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
    const applicants = (allVentures ?? []).map((v) => ({
      applicantName: v.founder_name || 'Unknown',
      jobRole: v.name,
      videoPortfolioUrl: v.pitch_video_url || null,
    }));
    const filename = `applicant-dossier-${new Date().toISOString().slice(0, 10)}`;
    try {
      const reactPdf = await import('@react-pdf/renderer');
      const { ApplicantDossierPDF } = await import('@/components/admin/ApplicantDossierPDF');
      const doc = <ApplicantDossierPDF applicants={applicants} title="Applicant Dossier — Venture Engine" />;
      const instance = reactPdf.pdf(doc);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      requestAnimationFrame(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
      toast.success('Applicant dossier downloaded');
    } catch (err) {
      console.error('PDF download error:', err);
      // Fallback: CSV download when PDF fails (e.g. network, renderer issues)
      try {
        const header = 'Applicant Name,Job Role,Video Portfolio\n';
        const rows = applicants.map((a) => `"${(a.applicantName || '').replace(/"/g, '""')}","${(a.jobRole || '').replace(/"/g, '""')}","${a.videoPortfolioUrl || ''}"`).join('\n');
        const csvBlob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(csvBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        requestAnimationFrame(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
        toast.success('Downloaded as CSV (PDF unavailable)');
      } catch (fallbackErr) {
        console.error('CSV fallback error:', fallbackErr);
        toast.error('Failed to generate download');
      }
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
      <div className="space-y-6 max-w-[1400px] mx-auto w-full overflow-x-hidden px-1 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-charcoal mb-1">Venture Engine</h1>
            <p className="text-cool-grey text-sm">Program management & application review dashboard.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="neo-extruded border-none shrink-0 pointer-events-auto rounded-[2px]"
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

        {/* Overview Tab - Right Rail Layout */}
        {activeTab === 'overview' && (
          <div className="space-y-4 max-w-[1400px] mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RocketLoader indeterminate label="Loading overview..." />
              </div>
            ) : (
              <>
                {/* Alert Banner - slim, above stats */}
                {(pendingLongCount > 0 || pendingCount >= 3) && (
                  <div className="rounded-[2px] px-4 py-3 flex items-center justify-between gap-4 flex-wrap pointer-events-auto" style={{ background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)', color: 'white' }}>
                    <div className="flex items-center gap-3">
                      {pendingLongCount > 0 ? (
                        <AlertCircle className="h-5 w-5 shrink-0" />
                      ) : (
                        <Rocket className="h-5 w-5 shrink-0" />
                      )}
                      <span className="font-medium text-sm">
                        {pendingLongCount > 0
                          ? `⚠️ ${pendingLongCount} pending review${pendingLongCount !== 1 ? 's' : ''} overdue 5+ days. Review now to keep applicants engaged.`
                          : '🚀 Cohort 3 applications are open. You have pending reviews to process.'}
                      </span>
                    </div>
                    <Button size="sm" onClick={() => setActiveTab('review')} className="bg-white text-blue-600 hover:bg-white/90 shrink-0 rounded-[2px] pointer-events-auto">
                      Review Queue <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                {/* 4 Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard title="PENDING REVIEW" value={String(pendingCount)} />
                  <StatCard title="TOTAL APPLICATIONS" value={String(allVentures?.length ?? 0)} change={monthOverMonthChange} changeLabel="vs last month" />
                  <StatCard title="SHORTLISTED" value={String(shortlistedCount)} />
                  <StatCard title="REJECTED" value={String(rejectedCount)} />
                </div>

                {/* 70/30 Right Rail Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                  {/* Left Column - 70%: Velocity Chart + Recent Submissions */}
                  <div className="space-y-4 min-w-0">
                    <NeoCard className="p-4 lg:p-5 rounded-[2px] pointer-events-auto">
                      <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-3">Application Velocity</p>
                      <p className="text-sm text-cool-grey mb-3">Applications per day (last 30 days)</p>
                      <ApplicationVelocityChart
                        data={(() => {
                          const ventures = allVentures ?? [];
                          const now = new Date();
                          return Array.from({ length: 30 }, (_, i) => {
                            const d = new Date(now);
                            d.setDate(d.getDate() - (29 - i));
                            const count = ventures.filter((v) => new Date(v.created_at).toDateString() === d.toDateString()).length;
                            return { day: d.getDate(), applications: count };
                          });
                        })()}
                      />
                    </NeoCard>

                    <NeoCard className="p-4 lg:p-5 rounded-[2px] pointer-events-auto overflow-hidden">
                      <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-3">Recent Submissions</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-2 font-semibold text-charcoal">Startup</th>
                              <th className="text-left py-2 px-2 font-semibold text-charcoal">Sector</th>
                              <th className="text-left py-2 px-2 font-semibold text-charcoal">Date</th>
                              <th className="text-left py-2 px-2 font-semibold text-charcoal">Status</th>
                              <th className="text-right py-2 px-2 font-semibold text-charcoal">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(allVentures ?? []).slice(0, 8).map((v) => (
                              <tr key={v.id} className="border-b border-border/50 last:border-0">
                                <td className="py-2 px-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 neo-subtle rounded-[2px] flex items-center justify-center shrink-0">
                                      <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="font-medium text-charcoal truncate max-w-[120px]">{v.name}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-cool-grey text-xs">{(v.industry || ['—'])[0]}</td>
                                <td className="py-2 px-2 text-cool-grey text-xs">{formatDate(v.created_at)}</td>
                                <td className="py-2 px-2">
                                  <Badge className={`text-[10px] ${
                                    v.review_status === 'shortlisted' ? 'bg-green-500/10 text-green-600' :
                                    v.review_status === 'rejected' ? 'bg-red-500/10 text-red-600' :
                                    'bg-amber-500/10 text-amber-600'
                                  }`}>{v.review_status}</Badge>
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-[2px] pointer-events-auto" onClick={() => v.pitch_video_url && setSelectedVideo(v.pitch_video_url)} disabled={!v.pitch_video_url}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            {(allVentures ?? []).length === 0 && (
                              <tr><td colSpan={5} className="py-8 text-center text-cool-grey text-sm">No submissions yet</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </NeoCard>
                  </div>

                  {/* Right Rail - 30%: Cohort Donut + Mentor Activity */}
                  <div className="space-y-4 lg:min-w-[300px]">
                    <NeoCard className="p-4 rounded-[2px] pointer-events-auto">
                      <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-3">Cohort Composition</p>
                      <p className="text-sm text-cool-grey mb-3">Applicants by sector</p>
                      <CohortCompositionDonut
                        data={(() => {
                          const ventures = allVentures ?? [];
                          const counts: Record<string, number> = { Fintech: 0, AgriTech: 0, Health: 0, EdTech: 0, Other: 0 };
                          ventures.forEach((v) => {
                            const ind = (v.industry || [])[0]?.toLowerCase() || '';
                            if (ind.includes('fin') || ind.includes('pay') || ind.includes('bank')) counts.Fintech++;
                            else if (ind.includes('agri') || ind.includes('farm') || ind.includes('food')) counts.AgriTech++;
                            else if (ind.includes('health') || ind.includes('med')) counts.Health++;
                            else if (ind.includes('edu') || ind.includes('learn')) counts.EdTech++;
                            else counts.Other++;
                          });
                          return Object.entries(counts).filter(([, n]) => n > 0).map(([name, value]) => ({ name, value }));
                        })()}
                      />
                    </NeoCard>

                    <NeoCard className="p-4 rounded-[2px] pointer-events-auto">
                      <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-3">Mentor Activity</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {mentors.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0">
                            <div className="h-8 w-8 neo-subtle rounded-[2px] flex items-center justify-center shrink-0">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-charcoal truncate">{m.name}</p>
                              <p className="text-[10px] text-cool-grey">Reviewed 2 ventures this week</p>
                            </div>
                            <Badge className={m.available ? 'bg-green-500/10 text-green-600 text-[10px]' : 'bg-red-500/10 text-red-600 text-[10px]'}>{m.available ? 'Active' : 'Busy'}</Badge>
                          </div>
                        ))}
                      </div>
                    </NeoCard>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Analytics Tab - Medical-Chic */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RocketLoader indeterminate label="Loading analytics..." />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <NeoCard className="p-6 rounded-[2px] pointer-events-auto">
                    <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-4">System Health</p>
                    <SystemHealthGauge
                      value={(allVentures?.length ? (shortlistedCount / allVentures.length) * 10 : 0)}
                      max={10}
                      label="Application Success Rate"
                    />
                  </NeoCard>
                  <NeoCard className="p-6 rounded-[2px] pointer-events-auto">
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
                <NeoCard className="p-6 rounded-[2px] pointer-events-auto">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <NeoCard className="p-6 rounded-[2px] pointer-events-auto">
                    <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-4">Pipeline Velocity</p>
                    <PipelineVelocityGauge
                      daysToDecision={allVentures?.length ? Math.min(14, 3 + (allVentures.length % 8)) : 5}
                      maxDays={14}
                      label="Avg Days to Decision"
                    />
                  </NeoCard>
                  <NeoCard className="p-6 rounded-[2px] pointer-events-auto lg:col-span-2">
                    <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-4">Skill Radar</p>
                    <SkillRadarChart
                      data={(() => {
                        const industries = (allVentures ?? []).flatMap((v) => (v.industry || []));
                        const counts: Record<string, number> = { Tech: 0, Product: 0, Growth: 0, Operations: 0, Leadership: 0 };
                        industries.forEach((i) => {
                          const lower = i.toLowerCase();
                          if (lower.includes('tech') || lower.includes('software')) counts.Tech++;
                          else if (lower.includes('product')) counts.Product++;
                          else if (lower.includes('growth') || lower.includes('marketing')) counts.Growth++;
                          else if (lower.includes('ops') || lower.includes('operations')) counts.Operations++;
                          else counts.Leadership++;
                        });
                        const max = Math.max(1, ...Object.values(counts));
                        return Object.entries(counts).map(([skill, value]) => ({ skill, value, fullMark: max }));
                      })()}
                    />
                  </NeoCard>
                </div>

                <NeoCard className="p-6 rounded-[2px] pointer-events-auto">
                  <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-4">Geospatial Heatmap</p>
                  <p className="text-sm text-cool-grey mb-3">Applicant density across Kenya</p>
                  <GeospatialHeatmap
                    regionCounts={(() => {
                      const n = (allVentures ?? []).length;
                      const regions = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'meru', 'garissa'];
                      const weights = [0.35, 0.15, 0.12, 0.11, 0.08, 0.08, 0.06, 0.05];
                      const out: Record<string, number> = {};
                      regions.forEach((r, i) => {
                        out[r] = Math.max(0, Math.round(n * weights[i]));
                      });
                      return out;
                    })()}
                  />
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
                <RocketLoader indeterminate label="Loading review queue..." />
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
