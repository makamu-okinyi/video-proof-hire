import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ADMIN_ROLES = ['employer', 'investor'] as const;

function isAdminRole(userType?: string): boolean {
  return !!userType && ADMIN_ROLES.includes(userType as typeof ADMIN_ROLES[number]);
}

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!isAdminRole(profile?.user_type)) {
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

  if (!isAuthenticated || !isAdminRole(profile?.user_type)) {
    return null;
  }

  return <>{children}</>;
}
