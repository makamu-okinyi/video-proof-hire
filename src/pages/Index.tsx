import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Auth from './Auth';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/feed');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-2xl text-white/60 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return <Auth />;
};

export default Index;
