import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { authService } from '@/services/auth/authService';
import { UserProfile, UserRating } from '@/lib/types';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  ratings: UserRating | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = async (userId: string) => {
    const res = await authService.getProfile(userId);
    if (res.data) {
      setProfile(res.data);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_MOCK === 'true') {
        const demoUser: AuthUser = { id: 'dev_mock_user', email: 'dev@mills.local' };
        setUser(demoUser);
        loadUserProfile(demoUser.id).finally(() => setIsLoading(false));
      } else {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
      return;
    }

    // Check active session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        loadUserProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await authService.signIn(email, password);
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.data) {
      setUser(res.data);
      await loadUserProfile(res.data.id);
    }
    return { success: true };
  };

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    const res = await authService.signUp(email, password, username, displayName);
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.data) {
      setUser(res.data);
      await loadUserProfile(res.data.id);
    }
    return { success: true };
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        ratings: profile?.ratings || null,
        isLoading,
        isConfigured: isSupabaseConfigured(),
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
