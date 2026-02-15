import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Play, Eye, CheckCircle, XCircle, Clock, User, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StartConversationButton } from '@/components/messaging/StartConversationButton';
import { RocketLoader } from '@/components/ui/RocketLoader';
interface Applicant {
  id: string;
  status: string;
  cover_message: string | null;
  created_at: string;
  applicant: {
    id: string;
    username: string | null;
    avatar: string | null;
    skills: string[] | null;
    skill_category: string;
    is_verified: boolean;
  };
  videos: {
    id: string;
    title: string | null;
    thumbnail_url: string | null;
    video_url: string;
    views: number;
  }[];
}

interface Job {
  id: string;
  title: string;
  company_name: string | null;
}

export default function JobApplicants() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      // Fetch job details
      const { data: jobData } = await supabase
        .from('job_postings')
        .select('id, title, company_name')
        .eq('id', jobId)
        .maybeSingle();

      if (jobData) setJob(jobData);

      // Fetch applications with applicant profiles
      const { data: applications } = await supabase
        .from('job_applications')
        .select(`
          id, status, cover_message, created_at,
          applicant:profiles!job_applications_applicant_id_fkey(
            id, username, avatar, skills, skill_category, is_verified
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (applications) {
        // Fetch videos for each applicant
        const applicantsWithVideos: Applicant[] = await Promise.all(
          applications.map(async (app: any) => {
            // Use RPC function to access public videos (respects RLS via SECURITY DEFINER)
            const { data: videos } = await supabase
              .rpc('get_user_public_videos', { target_user_id: app.applicant.id });

            return {
              ...app,
              videos: (videos || []).slice(0, 6),
            };
          })
        );
        setApplicants(applicantsWithVideos);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (applicationId: string, status: string, applicantId: string) => {
    const { error } = await supabase.rpc('update_job_application_status', {
      p_application_id: applicationId,
      p_status: status,
    });

    if (!error) {
      setApplicants(applicants.map(a =>
        a.id === applicationId ? { ...a, status } : a
      ));
      toast.success(`Application ${status}`, { icon: null });

      // In-app notification + auto-message + email (fire and forget)
      supabase.functions.invoke('notify-status-change', {
        body: {
          type: 'job_status',
          recipientId: applicantId,
          status,
          data: {
            jobApplicationId: applicationId,
            jobId: job?.id,
            jobTitle: job?.title,
            companyName: job?.company_name,
          },
        },
      }).catch(console.error);
      supabase.functions.invoke('send-notification', {
        body: {
          type: 'application_status',
          recipientId: applicantId,
          data: {
            jobTitle: job?.title,
            companyName: job?.company_name,
            status,
          },
        },
      }).catch(console.error);
    } else {
      console.error('[JobApplicants] updateStatus error:', error.code, error.message);
      toast.error(error.message?.includes('policy') || error.message?.includes('permission')
        ? 'Permission denied. Ensure you own this job.'
        : `Failed to update: ${error.message}`, { icon: null });
      fetchData(); // Refetch to ensure UI matches DB
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDownloadDossier = async () => {
    setPdfLoading(true);
    const rows = applicants.map((a) => ({
      applicantName: `@${a.applicant.username || 'user'}`,
      jobRole: job?.title || '—',
      videoPortfolioUrl: a.videos[0]?.video_url ?? null,
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
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50">
        <div className="absolute inset-0 bg-slate-100/80" />
        <div className="relative z-10">
          <RocketLoader indeterminate label="Loading applicants..." />
        </div>
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
              key={applicant.id}
              className="bg-secondary rounded-xl p-4 space-y-4"
            >
              {/* Applicant Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={applicant.applicant.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                    alt={applicant.applicant.username || 'User'}
                    className="h-12 w-12 rounded-full object-cover cursor-pointer"
                    onClick={() => navigate(`/user/${applicant.applicant.id}`)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 
                        className="font-semibold cursor-pointer hover:underline"
                        onClick={() => navigate(`/user/${applicant.applicant.id}`)}
                      >
                        @{applicant.applicant.username || 'user'}
                      </h3>
                      {applicant.applicant.is_verified && (
                        <CheckCircle className="h-4 w-4 text-coral" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Applied {formatDate(applicant.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/user/${applicant.applicant.id}`)}
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
              {applicant.applicant.skills && applicant.applicant.skills.length > 0 && (
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
                        key={video.id}
                        className="aspect-[9/16] relative bg-muted rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => navigate(`/feed?video=${video.id}`)}
                      >
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url}
                            alt={video.title || 'Video'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video 
                            src={video.video_url}
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
              {applicant.cover_message && (
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Cover Message</p>
                  <p className="text-sm">{applicant.cover_message}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateStatus(applicant.id, 'shortlisted', applicant.applicant.id)}
                  disabled={applicant.status === 'shortlisted'}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Shortlist
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateStatus(applicant.id, 'reviewed', applicant.applicant.id)}
                  disabled={applicant.status === 'reviewed'}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Reviewed
                </Button>
                {applicant.status === 'shortlisted' && user && (
                  <StartConversationButton
                    candidateId={applicant.applicant.id}
                    employerId={user.id}
                    jobApplicationId={applicant.id}
                  />
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => updateStatus(applicant.id, 'rejected', applicant.applicant.id)}
                  disabled={applicant.status === 'rejected'}
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