import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RocketLoader } from '@/components/ui/RocketLoader';
import { applicantDashboardPath, normaliseUsername } from '@/lib/username';
import FounderDashboard from '@/pages/FounderDashboard';
import NotFound from '@/pages/NotFound';

/** /founder: send applicants with a username to their own /<username> dashboard. */
export function FounderHomeRedirect() {
  const { profile } = useAuth();
  const target = applicantDashboardPath(profile?.username);
  if (target !== '/founder') return <Navigate to={target} replace />;
  return <FounderDashboard />;
}

/** /:username: the signed-in applicant's own dashboard; anything else is a normal 404. */
export default function ApplicantHome() {
  const { username } = useParams();
  const { profile, isLoading, isAuthenticated } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Loading..." />
      </div>
    );
  }
  const isOwn =
    isAuthenticated &&
    (profile?.user_type === 'talent' || profile?.user_type === 'founder') &&
    !!profile.username &&
    normaliseUsername(profile.username) === normaliseUsername(username ?? '');
  return isOwn ? <FounderDashboard /> : <NotFound />;
}
