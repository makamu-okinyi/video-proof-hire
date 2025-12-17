import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserType, SkillCategory } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userType: UserType) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Mock login - in production, this would call your API
    setUser({
      id: '1',
      username: 'demo_user',
      email,
      userType: 'talent',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'Full-stack developer passionate about building great products',
      skills: ['React', 'TypeScript', 'Node.js', 'Python'],
      skillCategory: 'tech',
      isVerified: true,
      createdAt: new Date(),
    });
  };

  const signup = async (email: string, password: string, userType: UserType) => {
    setUser({
      id: '1',
      username: '',
      email,
      userType,
      skills: [],
      skillCategory: 'other',
      isVerified: false,
      createdAt: new Date(),
    });
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
