import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Play, Eye, CheckCircle, XCircle, Clock, User, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StartConversationButton } from '@/components/messaging/StartConversationButton';
import { RocketLoader } from '@/components/ui/RocketLoader';

type Applicant = {
  _id: Id<'jobApplications'>;
  _creationTime: number;
  status: string;
  coverMessage?: string;
  applicant: {
    userId: string;
    username?: string;
    avatar?: string;
    skills?: string[];
    isVerified?: boolean;
  } | null;
  videos: {
    _id: Id<'videos'>;
    title?: string;
    thumbnailUrl?: string;
    videoUrl: string;
    views: number;
  }[];
};

export default function JobApplicants() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const job = useQuery(api.jobs.getJob, jobId ? { jobId: jobId as Id<'jobPostings'> } : 'skip');
  const applicantsRaw = useQuery(
    api.jobs.getJobApplicantsDetailed,
    jobId ? { jobId: jobId as Id<'jobPostings'> } : 'skip'
  );
  const applicants = (applicantsRaw ?? []) as Applicant[];
  const loading = job === undefined || applicantsRaw === undefined;
  const [pdfLoading, setPdfLoading] = useState(false);

  const updateApplicationStatus = useMutation(api.jobs.updateApplicationStatus);
  const notifyStatusChange = useAction(api.notifications.notifyStatusChange);
  const sendNotification = useAction(api.notifications.sendNotification);

  const updateStatus = async (applicationId: string, status: string, applicantId: string) => {
    try {
      await updateApplicationStatus({
        applicationId: applicationId as Id<'jobApplications'>,
        status,
      });
      toast.success(`Application ${status}`, { icon: null });

      if (status === 'shortlisted' || status === 'rejected') {
        // In-app notification + auto-message + email (fire and forget)
        notifyStatusChange({
          type: 'job_status',
          recipientId: applicantId,
          status,
          jobApplicationId: applicationId as Id<'jobApplications'>,
          jobId: job?._id,
          jobTitle: job?.title,
          companyName: job?.companyName,
        }).catch(console.error);
        sendNotification({
          type: 'application_status',
          recipientId: applicantId,
          jobTitle: job?.title,
          companyName: job?.companyName,
          status,
        }).catch(console.error);
      }
    } catch (error) {
      console.error('[JobApplicants] updateStatus error:', error);
      const message = error instanceof Error ? error.message : 'Failed to update';
      toast.error(message.includes('Not authorized')
        ? 'Permission denied. Ensure you own this job.'
        : `Failed to update: ${message}`, { icon: null });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted': return 'bg-green-500/10 text-green-500';
      case 'rejected': return 'bg-red-500/10 text-red-500';
      case 'reviewed': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (date: string | number) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDownloadDossier = async () => {
    setPdfLoading(true);
    const rows = applicants.map((a) => ({
      applicantName: `@${a.applicant?.username || 'user'}`,
      jobRole: job?.title || '—',
      videoPortfolioUrl: a.videos[0]?.videoUrl ?? null,
    }));
    const filename = `applicants-${job?.title?.replace(/\s+/g, '-') || 'job'}-${new Date().toISOString().slice(0, 10)}`;
    try {
      const reactPdf = await import('@react-pdf/renderer');
      const { ApplicantDossierPDF } = await import('@/components/admin/ApplicantDossierPDF');
      const doc = <ApplicantDossierPDF applicants={rows} title={`Applicants — ${job?.title || 'Job'}`} />;
      const blob = await reactPdf.pdf(doc).toBlob();
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
      try {
        const header = 'Applicant Name,Job Role,Video Portfolio\n';
        const csvRows = rows.map((r) => `"${(r.applicantName || '').replace(/"/g, '""')}","${(r.jobRole || '').replace(/"/g, '""')}","${r.videoPortfolioUrl || ''}"`).join('\n');
        const csvBlob = new Blob([header + csvRows], { type: 'text/csv;charset=utf-8' });
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

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background">
        <RocketLoader indeterminate label="Loading applicants..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/employer')}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-semibold truncate">{job?.title || 'Job'}</h1>
              <p className="text-xs text-muted-foreground">{applicants.length} applicants</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadDossier}
            disabled={pdfLoading || applicants.length === 0}
            className="shrink-0 pointer-events-auto rounded-[2px]"
          >
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="hidden sm:inline ml-1">Download</span>
          </Button>
        </div>
      </div>

      {/* Applicants List */}
      <div className="p-4 space-y-4">
        {applicants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No applications yet</p>
          </div>
        ) : (
          applicants.map((applicant) => (
            <div
              key={applicant._id}
              className="bg-secondary rounded-xl p-4 space-y-4"
            >
              {/* Applicant Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {applicant.applicant?.avatar ? (
                    <img
                      src={applicant.applicant.avatar}
                      alt={applicant.applicant.username || 'User'}
                      className="h-12 w-12 rounded-full object-cover cursor-pointer"
                      onClick={() => navigate(`/user/${applicant.applicant?.userId}`)}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center cursor-pointer"
                      onClick={() => navigate(`/user/${applicant.applicant?.userId}`)}
                    >
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className="font-semibold cursor-pointer hover:underline"
                        onClick={() => navigate(`/user/${applicant.applicant?.userId}`)}
                      >
                        @{applicant.applicant?.username || 'user'}
                      </h3>
                      {applicant.applicant?.isVerified && (
                        <CheckCircle className="h-4 w-4 text-coral" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Applied {formatDate(applicant._creationTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/user/${applicant.applicant?.userId}`)}
                  >
                    <User className="h-4 w-4 mr-1" />
                    View Profile
                  </Button>
                  <Badge className={getStatusColor(applicant.status)}>
                    {applicant.status}
                  </Badge>
                </div>
              </div>

              {/* Skills */}
              {applicant.applicant?.skills && applicant.applicant.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {applicant.applicant.skills.slice(0, 4).map(skill => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Video Portfolio */}
              {applicant.videos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Video Portfolio</p>
                  <div className="grid grid-cols-3 gap-2">
                    {applicant.videos.slice(0, 3).map((video) => (
                      <div
                        key={video._id}
                        className="aspect-[9/16] relative bg-muted rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => navigate(`/feed?video=${video._id}`)}
                      >
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title || 'Video'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={video.videoUrl}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="h-8 w-8 text-white" fill="white" />
                        </div>
                        <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs">
                          <Eye className="h-3 w-3" /> {video.views}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Message */}
              {applicant.coverMessage && (
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Cover Message</p>
                  <p className="text-sm">{applicant.coverMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applicant.applicant && updateStatus(applicant._id, 'shortlisted', applicant.applicant.userId)}
                  disabled={applicant.status === 'shortlisted' || !applicant.applicant}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Shortlist
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applicant.applicant && updateStatus(applicant._id, 'reviewed', applicant.applicant.userId)}
                  disabled={applicant.status === 'reviewed' || !applicant.applicant}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Reviewed
                </Button>
                {applicant.status === 'shortlisted' && user && applicant.applicant && (
                  <StartConversationButton
                    candidateId={applicant.applicant.userId}
                    employerId={user.id}
                    jobApplicationId={applicant._id}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applicant.applicant && updateStatus(applicant._id, 'rejected', applicant.applicant.userId)}
                  disabled={applicant.status === 'rejected' || !applicant.applicant}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}