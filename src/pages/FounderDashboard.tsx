import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useFounderVenture } from '@/hooks/useFounderVenture';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { 
  Rocket, FileText, Users, Calendar, Bell, 
  Clock, CheckCircle, AlertCircle,
  Video, MessageSquare, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const mentorSessions = [
  { id: '1', mentorName: 'Dr. Sarah Kimani', topic: 'Go-to-Market Strategy', date: '2026-02-12', time: '10:00 AM', status: 'upcoming' },
  { id: '2', mentorName: 'James Ochieng', topic: 'Technical Architecture Review', date: '2026-02-15', time: '2:00 PM', status: 'upcoming' },
  { id: '3', mentorName: 'Aisha Mohamed', topic: 'Pitch Deck Feedback', date: '2026-02-05', time: '11:00 AM', status: 'completed' },
];

const announcements = [
  { id: '1', title: 'Demo Day Scheduled', message: 'Cohort 3 Demo Day is set for March 15, 2026. Prepare your 5-minute pitch.', date: '2026-02-08', priority: 'high' },
  { id: '2', title: 'Mentor Office Hours', message: 'Weekly office hours now available every Wednesday 2-4 PM.', date: '2026-02-06', priority: 'normal' },
  { id: '3', title: 'Workshop: Fundraising 101', message: 'Join us for an intensive workshop on raising your first round.', date: '2026-02-04', priority: 'normal' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Under Review', color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-4 w-4" /> },
  submitted: { label: 'Under Review', color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-4 w-4" /> },
  shortlisted: { label: 'Shortlisted', color: 'bg-green-500/10 text-green-600', icon: <CheckCircle className="h-4 w-4" /> },
  rejected: { label: 'Not Selected', color: 'bg-red-500/10 text-red-600', icon: <AlertCircle className="h-4 w-4" /> },
  accepted: { label: 'Accepted', color: 'bg-primary/10 text-primary', icon: <CheckCircle className="h-4 w-4" /> },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FounderDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: venture, isLoading } = useFounderVenture(user?.id);

  const currentStatus = venture ? (statusConfig[venture.review_status] || statusConfig.submitted) : statusConfig.submitted;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto w-full overflow-x-hidden px-1 sm:px-0">
        {/* Welcome */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-charcoal mb-1">
            Welcome, {profile?.username || 'Founder'} 🚀
          </h1>
          <p className="text-cool-grey text-sm lg:text-base">Track your venture application and upcoming sessions.</p>
        </div>

        {/* Venture Status Card */}
        <NeoCard className="p-5 lg:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cool-grey" />
            </div>
          ) : !venture ? (
            <div className="text-center py-8">
              <p className="text-cool-grey mb-4">You haven&apos;t submitted a venture yet.</p>
              <Button onClick={() => navigate('/apply')} className="neo-extruded border-none">
                <Rocket className="h-4 w-4 mr-2" />
                Apply to Program
              </Button>
            </div>
          ) : (
            <>
              <NeoCardHeader className="pb-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 neo-pressed rounded-2xl flex items-center justify-center">
                      <Rocket className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <NeoCardTitle className="text-xl">{venture.name}</NeoCardTitle>
                      <p className="text-cool-grey text-sm capitalize">{venture.stage} stage · Submitted {formatDate(venture.created_at)}</p>
                    </div>
                  </div>
                  <Badge className={`${currentStatus.color} flex items-center gap-1.5 px-3 py-1.5`}>
                    {currentStatus.icon}
                    {currentStatus.label}
                  </Badge>
                </div>
              </NeoCardHeader>
              <NeoCardContent>
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
                  <Button onClick={() => navigate('/apply')} className="neo-extruded border-none">
                    <FileText className="h-4 w-4 mr-2" />
                    Update Application
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/messages')} className="neo-extruded border-none">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Mentor
                  </Button>
                </div>
              </NeoCardContent>
            </>
          )}
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
            <NeoCardContent className="space-y-3 mt-4">
              {mentorSessions.map(session => (
                <div key={session.id} className={`neo-subtle rounded-2xl p-4 ${session.status === 'completed' ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-charcoal text-sm">{session.mentorName}</p>
                    <Badge variant={session.status === 'completed' ? 'secondary' : 'default'} className="text-xs capitalize">
                      {session.status}
                    </Badge>
                  </div>
                  <p className="text-cool-grey text-xs">{session.topic}</p>
                  <p className="text-cool-grey text-xs mt-1">{session.date} · {session.time}</p>
                </div>
              ))}
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
            <NeoCardContent className="space-y-3 mt-4">
              {announcements.map(ann => (
                <div key={ann.id} className="neo-subtle rounded-2xl p-4">
                  <div className="flex items-start gap-2 mb-1">
                    {ann.priority === 'high' && <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-medium text-charcoal text-sm">{ann.title}</p>
                      <p className="text-cool-grey text-xs mt-1">{ann.message}</p>
                      <p className="text-cool-grey/60 text-xs mt-1">{ann.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </NeoCardContent>
          </NeoCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
