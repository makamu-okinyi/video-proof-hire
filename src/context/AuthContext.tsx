import React, { createContext, useEffect, useState, ReactNode } from "react";
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string | null;
  username?: string | null;
  user_type?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UserRole {
  role: 'talent' | 'employer';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profileError && profileData) {
      const userType = (roleData as UserRole)?.role || profileData.user_type;
      setProfile({ ...profileData, user_type: userType } as Profile);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    const handleInitialSession = async () => {
      try {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const hasOAuthParams =
          url.includes('access_token') ||
          url.includes('refresh_token') ||
          url.includes('provider_token') ||
          url.includes('error_description');

        if (hasOAuthParams && (supabase.auth as any).getSessionFromUrl) {
          const { data, error } = await (supabase.auth as any).getSessionFromUrl({ storeSession: true });
          if (!error && data?.session) {
            const session = data.session;
            setSession(session);
            setUser(session.user ?? null);
            if (session.user) {
              await fetchProfile(session.user.id);
            }
          }

          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        } else {
          const { data: sessData } = await supabase.auth.getSession();
          const currentSession = sessData.session;
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await fetchProfile(currentSession.user.id);
          }
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    handleInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signup = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (!error) setProfile((prev) => prev ? { ...prev, ...data } : null);
  };

  const refreshProfile = async () => { if (user) await fetchProfile(user.id); };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAuthenticated: !!session, isLoading, login, signup, logout, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { const context = React.useContext(AuthContext); if (context === undefined) throw new Error('useAuth must be used within AuthProvider'); return context; 
}
