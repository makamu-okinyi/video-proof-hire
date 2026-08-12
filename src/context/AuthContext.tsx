import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

interface Profile {
  id: string;
  username?: string | null;
  user_type?: string;
  skill_category?: string;
  is_verified?: boolean;
  bio?: string | null;
  skills?: string[] | null;
  avatar?: string | null;
  banner_url?: string | null;
  company_name?: string | null;
  industry?: string | null;
  full_name?: string | null;
}

interface SyntheticUser {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
}

interface AuthContextType {
  user: SyntheticUser | null;
  session: null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: string, redirectTo?: string) => Promise<{ error: Error | null; url?: string | null }>;
  signInWithWebAuthn: () => Promise<{ error: Error | null }>;
  registerWebAuthn: () => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  const convexProfile = useQuery(
    api.profiles.getMyProfile,
    isAuthenticated ? {} : "skip"
  );
  const myUserId = useQuery(
    api.profiles.getMyUserId,
    isAuthenticated ? {} : "skip"
  );

  const upsertProfile = useMutation(api.profiles.upsertProfile);

  const isLoading =
    authLoading ||
    (isAuthenticated && (myUserId === undefined || convexProfile === undefined));

  const user: SyntheticUser | null =
    isAuthenticated && myUserId
      ? {
          id: myUserId,
          user_metadata: {
            username: convexProfile?.username,
            user_type: convexProfile?.userType,
          },
        }
      : null;

  const profile: Profile | null =
    isAuthenticated && myUserId && convexProfile !== undefined
      ? convexProfile
        ? {
            id: myUserId,
            username: convexProfile.username,
            user_type: convexProfile.userType,
            skill_category: convexProfile.skillCategory,
            is_verified: convexProfile.isVerified,
            bio: convexProfile.bio,
            skills: convexProfile.skills,
            avatar: convexProfile.avatar,
            banner_url: convexProfile.bannerUrl,
            company_name: convexProfile.companyName,
            industry: convexProfile.industry,
            full_name: convexProfile.fullName,
          }
        : null
      : null;

  const login = async (email: string, password: string) => {
    try {
      await signIn("password", { email, password, flow: "signIn" });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signup = async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      await signIn("password", {
        email,
        password,
        flow: "signUp",
        name: (metadata?.username as string) || undefined,
      });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signInWithOAuth = async (provider: string, redirectTo?: string) => {
    try {
      await signIn("google", {
        redirectTo: redirectTo || `${window.location.origin}/auth`,
      });
      return { error: null, url: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error(String(err)),
        url: null,
      };
    }
  };

  const signInWithWebAuthn = async () => {
    return {
      error: new Error(
        "Biometric sign-in is not yet available. Please use email/password or Google."
      ),
    };
  };

  const registerWebAuthn = async () => {
    return {
      error: new Error(
        "Biometric registration is not yet available. Please use email/password or Google."
      ),
    };
  };

  const logout = async () => {
    await signOut();
  };

  const updateProfile = async (data: Partial<Profile>) => {
    await upsertProfile({
      username: data.username ?? undefined,
      skillCategory: data.skill_category ?? undefined,
      bio: data.bio ?? undefined,
      skills: data.skills ?? undefined,
      avatar: data.avatar ?? undefined,
      bannerUrl: data.banner_url ?? undefined,
      companyName: data.company_name ?? undefined,
      industry: data.industry ?? undefined,
      fullName: data.full_name ?? undefined,
    });
  };

  const refreshProfile = async () => {
    // Convex queries are reactive — no manual refresh needed
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: null,
        profile,
        isAuthenticated,
        isLoading,
        login,
        signup,
        signInWithOAuth,
        signInWithWebAuthn,
        registerWebAuthn,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within AuthProvider");
  return context;
}
