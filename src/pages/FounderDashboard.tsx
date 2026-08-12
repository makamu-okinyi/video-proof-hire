import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useFounderVentures, FounderVenture } from '@/hooks/useFounderVenture';
import { useApplicantJobApplications } from '@/hooks/useApplicantJobApplications';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { 
  Rocket, FileText, Users, Calendar, Bell, Briefcase,
  Clock, CheckCircle, AlertCircle,
  Video
} from 'lucide-react';
import { RocketLoader } from '@/components/ui/RocketLoader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; message: string }> = {
  pending: { label: 'Under Review', color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-4 w-4" />, message: 'Update: Your application is currently under review.' },
  submitted: { label: 'Under Review', color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-4 w-4" />, message: 'Update: Your application is currently under review.' },
  shortlisted: { label: "Congratulations! You've been Shortlisted", color: 'bg-green-500/10 text-green-600', icon: <CheckCircle className="h-4 w-4" />, message: 'Update: Your application has been shortlisted for the next stage.' },
  rejected: { label: 'Application Rejected', color: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400', icon: <AlertCircle className="h-4 w-4" />, message: 'We are sorry, your application has been rejected at this time.' },
  accepted: { label: 'Accepted', color: 'bg-primary/10 text-primary', icon: <CheckCircle className="h-4 w-4" />, message: 'Update: Your application has been shortlisted for the next stage.' },
  reviewed: { label: 'Reviewed', color: 'bg-blue-500/10 text-blue-600', icon: <CheckCircle className="h-4 w-4" />, message: 'Update: Your application has been reviewed.' },
};

import { formatStage } from '@/lib/stageDisplay';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getJobStatusConfig(status: string) {
  return statusConfig[status] || statusConfig.pending;
}

function VentureCard({ venture, navigate }: { venture: FounderVenture; navigate: ReturnType<typeof useNavigate> }) {
  const currentStatus = statusConfig[venture.review_status] || statusConfig.submitted;

  return (
    <NeoCard className="p-5 lg:p-8">
      <NeoCardHeader className="pb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 neo-pressed rounded-2xl flex items-center justify-center">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <NeoCardTitle className="text-xl">{venture.name}</NeoCardTitle>
              <p className="text-cool-grey text-sm">{formatStage(venture.stage)} stage · Submitted {formatDate(venture.created_at)}</p>
            </div>
          </div>
          <Badge className={`${currentStatus.color} flex items-center gap-1.5 px-3 py-1.5`}>
            {currentStatus.icon}
            {currentStatus.label}
          </Badge>
        </div>
        <p className="text-sm text-cool-grey mt-3">{currentStatus.message}</p>
      </NeoCardHeader>
      <NeoCardContent>
        {venture.pitch_video_url && (
          <div className="mb-6 flex flex-col items-center justify-center w-full text-center">
            <p className="text-sm font-medium text-cool-grey mb-2">Your Pitch Video</p>
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden mt-2">
              <video
                src={venture.pitch_video_url}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="neo-subtle rounded-2xl p-4 text-center">
            <Video className="h-5 w-5 mx-auto mb-2 text-green-600" />
            <p className="text-xs text-cool-grey">Pitch Video</p>
            <p className={`text-sm font-semibold ${venture.pitch_video_url ? 'text-green-600' : 'text-cool-grey'}`}>
              {venture.pitch_video_url ? 'Uploaded ✓' : 'Not uploaded'}
            </p>
          </div>
          <div className="neo-subtle rounded-2xl p-4 text-center">
            <FileText className="h-5 w-5 mx-auto mb-2 text-green-600" />
            <p className="text-xs text-cool-grey">Pitch Deck</p>
            <p className={`text-sm font-semibold ${venture.pitch_deck_count > 0 ? 'text-green-600' : 'text-cool-grey'}`}>
              {venture.pitch_deck_count > 0 ? 'Uploaded ✓' : 'Not uploaded'}
            </p>
          </div>
          <div className="neo-subtle rounded-2xl p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-xs text-cool-grey">Mentors</p>
            <p className="text-sm font-semibold text-charcoal">—</p>
          </div>
          <div className="neo-subtle rounded-2xl p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-xs text-cool-grey">Next Session</p>
            <p className="text-sm font-semibold text-charcoal">—</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <Button onClick={() => navigate(`/apply?edit=${venture.id}`)} className="neo-extruded border-none">
            <FileText className="h-4 w-4 mr-2" />
            Edit Application
          </Button>
        </div>
      </NeoCardContent>
    </NeoCard>
  );
}

export default function FounderDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const emailPrefix = user?.email ? user.email.split('@')[0] : null;
  const displayName = profile?.username
    || (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0]
    || (user?.user_metadata?.name as string | undefined)?.split(' ')[0]
    || (emailPrefix ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) : 'there');
  const { data: ventures, isLoading } = useFounderVentures(user?.id);
  const { data: jobApplications } = useApplicantJobApplications(user?.id);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto w-full overflow-x-hidden px-1 sm:px-0">
        {/* Welcome */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-charcoal mb-1">
            Welcome, {displayName}
          </h1>
          <p className="text-cool-grey text-sm lg:text-base">Track your venture application and upcoming sessions.</p>
        </div>

        {/* Venture Status Cards */}
        {isLoading ? (
          <NeoCard className="p-5 lg:p-8">
            <div className="flex items-center justify-center py-12">
              <RocketLoader indeterminate label="Loading..." />
            </div>
          </NeoCard>
        ) : !ventures || ventures.length === 0 ? (
          <NeoCard className="p-5 lg:p-8">
            <div className="text-center py-8">
              <p className="text-cool-grey mb-4">You haven&apos;t submitted a venture yet.</p>
              <Button onClick={() => navigate('/apply')} className="neo-extruded border-none">
                <Rocket className="h-4 w-4 mr-2" />
                Apply to Program
              </Button>
            </div>
          </NeoCard>
        ) : (
          ventures.map(venture => (
            <VentureCard key={venture.id} venture={venture} navigate={navigate} />
          ))
        )}

        {/* My Applications */}
        <NeoCard className="p-5 lg:p-6">
          <NeoCardHeader>
            <NeoCardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              My Applications
            </NeoCardTitle>
            <p className="text-cool-grey text-sm mt-1">Track your venture and job applications</p>
          </NeoCardHeader>
          <NeoCardContent className="space-y-4 mt-4">
            {ventures && ventures.length > 0 && ventures.map(venture => {
              const cfg = statusConfig[venture.review_status] || statusConfig.submitted;
              return (
                <div key={venture.id} className="neo-subtle rounded-2xl p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 neo-pressed rounded-xl flex items-center justify-center">
                        <Rocket className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-charcoal">{venture.name}</p>
                        <p className="text-xs text-cool-grey">Venture Application · {formatDate(venture.created_at)}</p>
                      </div>
                    </div>
                    <Badge className={`${cfg.color} flex items-center gap-1.5 px-3 py-1`}>
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-cool-grey mt-3">{cfg.message}</p>
                </div>
              );
            })}
            {jobApplications && jobApplications.length > 0 ? (
              jobApplications.map((app) => {
                const cfg = getJobStatusConfig(app.status);
                return (
                  <div key={app.id} className="neo-subtle rounded-2xl p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 neo-pressed rounded-xl flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-charcoal">{app.job?.title || 'Job'}</p>
                          <p className="text-xs text-cool-grey">{app.job?.company_name || 'Company'} · {formatDate(app.created_at)}</p>
                        </div>
                      </div>
                      <Badge className={`${cfg.color} flex items-center gap-1.5 px-3 py-1`}>
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-cool-grey mt-3">{cfg.message}</p>
                  </div>
                );
              })
            ) : null}
            {(!ventures || ventures.length === 0) && (!jobApplications || jobApplications.length === 0) && (
              <p className="text-cool-grey text-sm text-center py-4">No applications yet. Apply to a venture or job to get started.</p>
            )}
            {ventures && ventures.length > 0 && (!jobApplications || jobApplications.length === 0) && (
              <div className="text-center">
                <Button variant="outline" size="sm" onClick={() => navigate('/jobs')} className="neo-extruded border-none">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Button>
              </div>
            )}
          </NeoCardContent>
        </NeoCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mentor Sessions */}
          <NeoCard className="p-5 lg:p-6">
            <NeoCardHeader>
              <NeoCardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Mentor Sessions
              </NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent className="mt-4">
              <p className="text-cool-grey text-sm text-center py-6">No sessions scheduled yet. Sessions will appear here once assigned.</p>
            </NeoCardContent>
          </NeoCard>

          {/* Announcements */}
          <NeoCard className="p-5 lg:p-6">
            <NeoCardHeader>
              <NeoCardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Cohort Announcements
              </NeoCardTitle>
            </NeoCardHeader>
            <NeoCardContent className="mt-4">
              <p className="text-cool-grey text-sm text-center py-6">No announcements at this time. Check back for program updates.</p>
            </NeoCardContent>
          </NeoCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
