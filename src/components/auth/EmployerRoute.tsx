import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RocketLoader } from '@/components/ui/RocketLoader';

const EMPLOYER_ROLES = ['employer', 'investor'] as const;

function isEmployerRole(userType?: string): boolean {
  return !!userType && EMPLOYER_ROLES.includes(userType as typeof EMPLOYER_ROLES[number]);
}

export function EmployerRoute() {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!isEmployerRole(profile?.user_type)) {
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

  if (!isAuthenticated || !isEmployerRole(profile?.user_type)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Redirecting..." />
      </div>
    );
  }

  return <Outlet />;
}
