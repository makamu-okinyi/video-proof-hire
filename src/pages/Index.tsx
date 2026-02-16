import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { isAdminRole, isFounderRole } from '@/components/auth/ProtectedRoute';
import { RocketLoader } from '@/components/ui/RocketLoader';
import Auth from './Auth';

const Index = () => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && profile?.user_type) {
      if (isAdminRole(profile.user_type)) {
        navigate('/admin', { replace: true });
      } else if (isFounderRole(profile.user_type)) {
        navigate('/founder', { replace: true });
      } else {
        navigate('/feed', { replace: true });
      }
    } else if (!isLoading && isAuthenticated) {
      navigate('/feed', { replace: true });
    }
  }, [isAuthenticated, isLoading, profile?.user_type, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 rounded-2xl">
          <RocketLoader indeterminate label="Loading..." />
        </div>
      </div>
    );
  }

  return <Auth />;
};

export default Index;
