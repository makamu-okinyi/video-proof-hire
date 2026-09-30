import { useCallback, useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/context/AuthContext';
import { useNoIndex } from '@/hooks/useNoIndex';
import {
  ADMIN_IDLE_MINUTES,
  ADMIN_NOTICE_KEY,
  clearAdminActivity,
  useIdleSignOut,
} from '@/hooks/useIdleSignOut';

interface AdminRouteProps {
  children: React.ReactNode;
}

function ConsoleSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950" role="status" aria-label="Checking access">
      <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
    </div>
  );
}

function setNotice(value: 'denied' | 'idle') {
  try {
    sessionStorage.setItem(ADMIN_NOTICE_KEY, value);
  } catch {
    /* storage unavailable */
  }
}

/**
 * Guards /admin/*. The role is verified by the server (api.admin.amIAdmin), never inferred
 * from client state. Unauthenticated visitors go to /admin/login; authenticated non-admins
 * are signed out and sent to /admin/login with a generic "not authorised" message. Nothing
 * from the admin UI renders until the server has confirmed the admin role.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  useNoIndex();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, isAuthenticated, logout } = useAuth();
  const isAdmin = useQuery(api.admin.amIAdmin, isAuthenticated ? {} : 'skip');
  const logSessionEvent = useMutation(api.admin.logSessionEvent);
  const signingOut = useRef(false);

  // Authenticated but not an admin: end that session and bounce to the admin login.
  useEffect(() => {
    if (isLoading || !isAuthenticated || isAdmin !== false || signingOut.current) return;
    signingOut.current = true;
    setNotice('denied');
    void logout().finally(() => navigate('/admin/login', { replace: true }));
  }, [isLoading, isAuthenticated, isAdmin, logout, navigate]);

  const handleIdle = useCallback(async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    try {
      await logSessionEvent({ action: 'idle_signout', userAgent: navigator.userAgent });
    } catch {
      /* best effort */
    }
    clearAdminActivity();
    setNotice('idle');
    await logout();
    navigate('/admin/login', { replace: true });
  }, [logSessionEvent, logout, navigate]);

  useIdleSignOut({
    minutes: ADMIN_IDLE_MINUTES,
    enabled: isAuthenticated && isAdmin === true,
    onWarn: () => toast.warning('You will be signed out in 1 minute due to inactivity.'),
    onIdle: handleIdle,
  });

  if (isLoading) return <ConsoleSpinner />;
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  if (isAdmin !== true) return <ConsoleSpinner />; // undefined (verifying) or false (signing out)

  return <>{children}</>;
}
