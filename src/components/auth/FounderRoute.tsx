import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const FOUNDER_ROLES = ['founder', 'talent'] as const;

function isFounderRole(userType?: string): boolean {
  return !!userType && FOUNDER_ROLES.includes(userType as typeof FOUNDER_ROLES[number]);
}

interface FounderRouteProps {
  children: React.ReactNode;
}

export function FounderRoute({ children }: FounderRouteProps) {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!isFounderRole(profile?.user_type)) {
      navigate('/feed');
    }
  }, [profile, isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="neo-pressed px-8 py-4 rounded-2xl text-cool-grey animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isFounderRole(profile?.user_type)) {
    return null;
  }

  return <>{children}</>;
}
