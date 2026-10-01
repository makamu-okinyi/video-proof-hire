import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * A signed-in account with no profile row (setup was interrupted) would see half-working pages.
 * Send it to /auth, which resumes onboarding.
 */
export function ProfileGate() {
  const { profileMissing } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!profileMissing) return;
    if (pathname === '/auth' || pathname.startsWith('/admin') || ['/privacy', '/terms', '/cookies'].includes(pathname)) return;
    navigate('/auth', { replace: true });
  }, [profileMissing, pathname, navigate]);
  return null;
}
