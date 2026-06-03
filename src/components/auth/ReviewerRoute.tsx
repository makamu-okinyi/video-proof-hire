import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RocketLoader } from '@/components/ui/RocketLoader';

// Vetted reviewer roles that may view ventures + pitch decks (read scope the DB
// already grants). Broader than AdminRoute (which gates the full admin panel) but
// still excludes employer/talent/founder. All three roles are admin-assigned only.
const REVIEWER_ROLES = ['admin', 'investor', 'judge'] as const;

function isReviewerRole(userType?: string): boolean {
  return !!userType && REVIEWER_ROLES.includes(userType as typeof REVIEWER_ROLES[number]);
}

interface ReviewerRouteProps {
  children: React.ReactNode;
}

export function ReviewerRoute({ children }: ReviewerRouteProps) {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!isReviewerRole(profile?.user_type)) {
      navigate('/feed');
    }
  }, [profile, isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated || !isReviewerRole(profile?.user_type)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Redirecting..." />
      </div>
    );
  }

  return <>{children}</>;
}
