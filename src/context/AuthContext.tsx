import React, { createContext, useEffect, useState, ReactNode } from "react";
import { supabase } from '@/integrations/supabase/client';
import type { Session, User, Provider } from '@supabase/supabase-js';
import * as webauthn from '@/lib/webauthn';

interface Profile {
  id: string;
  username?: string | null;
  user_type?: string;
  skill_category?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  bio?: string | null;
  skills?: string[] | null;
  avatar?: string | null;
}

/** Matches Supabase app_role enum */
type AppRole = 'talent' | 'employer' | 'founder' | 'investor' | 'judge';

interface UserRoleRow {
  role: AppRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: Provider, redirectTo?: string) => Promise<{ error: Error | null; url?: string | null }>;
  signInWithWebAuthn: () => Promise<{ error: Error | null }>;
  registerWebAuthn: () => Promise<{ error: Error | null }>;
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
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!profileError && profileData) {
      const userType = (roleData as UserRoleRow | null)?.role || profileData.user_type;
      setProfile({ ...profileData, user_type: userType } as Profile);
    }
  };

  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Use setTimeout to avoid Supabase deadlock issues
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }

      // Handle OAuth callback - clean up URL after successful sign in
      if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
        const url = window.location.href;
        if (url.includes('#access_token') || url.includes('?code=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    });

    // Get initial session
    const handleInitialSession = async () => {
      try {
        // Check for OAuth callback in URL hash (implicit flow) or code (PKCE flow)
        const hashParams = window.location.hash;
        const searchParams = window.location.search;
        const hasOAuthCallback = hashParams.includes('access_token') || searchParams.includes('code=');

        if (hasOAuthCallback) {
          // Let Supabase handle the OAuth callback automatically via detectSessionInUrl
          // Just wait a moment for it to process
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Get the current session (will be set if OAuth callback was processed)
        const { data: sessData, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        const currentSession = sessData?.session;
        setSession(currentSession ?? null);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
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

  const signInWithWebAuthn = async () => {
    const result = await webauthn.authenticateWebAuthn();
    if (!result.ok || !result.assertion) return { error: new Error('Biometric auth failed or cancelled') };
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const fnUrl = `${supabaseUrl}/functions/v1/webauthn-verify`;
    try {
      const payload = {
        credentialId: result.credentialId,
        clientDataJSON: result.clientDataJSON ? btoa(String.fromCharCode(...new Uint8Array(result.clientDataJSON))) : null,
        authenticatorData: result.authenticatorData ? btoa(String.fromCharCode(...new Uint8Array(result.authenticatorData))) : null,
        signature: result.signature ? btoa(String.fromCharCode(...new Uint8Array(result.signature))) : null,
        userHandle: result.userHandle ? btoa(String.fromCharCode(...new Uint8Array(result.userHandle))) : null,
      };
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || 'Verification failed') };
      if (data.access_token && data.refresh_token) {
        await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
        return { error: null };
      }
      return { error: new Error('No session returned') };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Biometric sign-in failed') };
    }
  };

  const registerWebAuthn = async () => {
    if (!user?.id || !user?.email) return { error: new Error('Not logged in') };
    const result = await webauthn.registerWebAuthn(user.id, user.email);
    return result.ok ? { error: null } : { error: new Error(result.error) };
  };

  const signInWithOAuth = async (provider: Provider, redirectTo?: string) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error, url: data?.url };
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
    <AuthContext.Provider value={{ user, session, profile, isAuthenticated: !!session, isLoading, login, signup, signInWithOAuth, signInWithWebAuthn, registerWebAuthn, logout, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { const context = React.useContext(AuthContext); if (context === undefined) throw new Error('useAuth must be used within AuthProvider'); return context; 
}
