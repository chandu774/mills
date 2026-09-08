import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile, UserRating } from '@/lib/types';

export interface AuthResponse<T> {
  data: T | null;
  error: string | null;
}

export const authService = {
  /**
   * Email and password sign up
   */
  async signUp(
    email: string,
    password: string,
    username?: string,
    displayName?: string
  ): Promise<AuthResponse<{ id: string; email: string }>> {
    if (!isSupabaseConfigured() || !supabase) {
      if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_MOCK === 'true') {
        return {
          data: { id: 'dev_mock_user', email },
          error: null,
        };
      }
      return {
        data: null,
        error: 'Database not connected. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const cleanUsername = username ? username.trim() : `player_${Math.random().toString(36).substring(2, 10)}`;
      const cleanDisplayName = displayName?.trim() || cleanUsername;
      const isCustomUsername = Boolean(username && /^[a-zA-Z0-9]{3,20}$/.test(username));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanDisplayName,
          },
        },
      });

      if (error) return { data: null, error: error.message };
      if (!data.user) return { data: null, error: 'User creation failed.' };

      // Ensure profile record exists in public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          username: cleanUsername,
          display_name: cleanDisplayName,
          is_username_set: isCustomUsername,
        }, { onConflict: 'id' });

      if (profileError) {
        console.warn('[authService] Profile upsert notice:', profileError.message);
      }

      // Ensure initial ratings exist for all 3 variants
      const variants = ['MILLS_3', 'MILLS_6', 'MILLS_9'];
      for (const v of variants) {
        await supabase
          .from('ratings')
          .upsert({
            user_id: data.user.id,
            variant: v,
            rating: 1200,
            games_played: 0,
            wins: 0,
            losses: 0,
            draws: 0,
          }, { onConflict: 'user_id,variant' });
      }

      return {
        data: { id: data.user.id, email: data.user.email || email },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Unexpected error during signup.' };
    }
  },

  /**
   * Email and password sign in
   */
  async signIn(email: string, password: string): Promise<AuthResponse<{ id: string; email: string }>> {
    if (!isSupabaseConfigured() || !supabase) {
      if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_MOCK === 'true') {
        return {
          data: { id: 'dev_mock_user', email },
          error: null,
        };
      }
      return {
        data: null,
        error: 'Database not connected. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { data: null, error: error.message };
      if (!data.user) return { data: null, error: 'Login failed.' };

      return {
        data: { id: data.user.id, email: data.user.email || email },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Unexpected error during login.' };
    }
  },

  /**
   * Real Google OAuth sign in
   */
  async signInWithGoogle(): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Database not connected.' };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      return { error: error ? error.message : null };
    } catch (err: any) {
      return { error: err.message || 'Failed to start Google sign in.' };
    }
  },

  /**
   * Check if a username is available (case-insensitive)
   */
  async checkUsernameAvailability(rawUsername: string): Promise<{
    available: boolean;
    error?: string;
    suggestions?: string[];
  }> {
    const clean = rawUsername.trim();

    // Client-side validation
    if (clean.length < 3 || clean.length > 20) {
      return { available: false, error: 'Username must be between 3 and 20 characters.' };
    }

    if (!/^[a-zA-Z0-9]+$/.test(clean)) {
      return { available: false, error: 'Only letters (A-Z, a-z) and numbers (0-9) are allowed.' };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return { available: true };
    }

    try {
      // 1. Try RPC check if function is installed
      const { data: rpcAvailable, error: rpcErr } = await supabase.rpc('check_username_available', {
        p_username: clean,
      });

      if (!rpcErr && typeof rpcAvailable === 'boolean') {
        if (rpcAvailable) {
          return { available: true };
        }
      } else {
        // Fallback: direct table query with case-insensitivity
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', clean)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.warn('[authService] Username check notice:', error.message);
        }

        if (!data) {
          return { available: true };
        }
      }

      // Username is taken; generate 3 smart suggestions
      const base = clean.slice(0, 16);
      const suggestions = [
        `${base}${Math.floor(100 + Math.random() * 900)}`,
        `${base}2026`,
        `${base}m`,
      ];

      return {
        available: false,
        error: 'Username already taken',
        suggestions,
      };
    } catch (err: any) {
      return { available: false, error: err.message || 'Error checking username availability.' };
    }
  },

  /**
   * Set and save username for authenticated user
   */
  async setUsername(userId: string, username: string): Promise<{ success: boolean; error?: string }> {
    const clean = username.trim();

    if (clean.length < 3 || clean.length > 20) {
      return { success: false, error: 'Username must be between 3 and 20 characters.' };
    }

    if (!/^[a-zA-Z0-9]+$/.test(clean)) {
      return { success: false, error: 'Only letters and numbers are allowed.' };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return { success: true };
    }

    try {
      // Try atomic RPC first
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('set_user_username', {
        p_username: clean,
      });

      if (!rpcErr && rpcRes) {
        if (rpcRes.success) return { success: true };
        return { success: false, error: rpcRes.error || 'Username already taken.' };
      }

      // Direct update fallback
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          username: clean,
          display_name: clean,
          is_username_set: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateErr) {
        if (updateErr.message.includes('unique') || updateErr.code === '23505') {
          return { success: false, error: 'Username already taken.' };
        }
        return { success: false, error: updateErr.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to set username.' };
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Database not connected.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send reset email.' };
    }
  },

  /**
   * User sign out
   */
  async signOut(): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? error.message : null };
    } catch (err: any) {
      return { error: err.message || 'Signout failed.' };
    }
  },

  /**
   * Fetch authenticated user's profile and ratings
   */
  async getProfile(userId: string): Promise<AuthResponse<UserProfile>> {
    if (!isSupabaseConfigured() || !supabase) {
      if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_MOCK === 'true') {
        return {
          data: {
            id: userId,
            username: 'DevPlayer',
            displayName: 'Dev User',
            bio: 'Local development mock player',
            isUsernameSet: true,
            createdAt: 'Today',
            ratings: { mills3: 1200, mills6: 1200, mills9: 1200 },
            stats: { gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
          },
          error: null,
        };
      }
      return {
        data: null,
        error: 'Database not connected.',
      };
    }

    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) return { data: null, error: profileErr.message };

      if (!profileData) {
        // Profile hasn't been created yet (e.g. fresh OAuth user)
        return {
          data: {
            id: userId,
            username: '',
            displayName: 'Player',
            isUsernameSet: false,
            createdAt: 'Joined today',
            ratings: { mills3: 1200, mills6: 1200, mills9: 1200 },
            stats: { gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
          },
          error: null,
        };
      }

      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', userId);

      const ratingsMap: UserRating = {
        mills3: 1200,
        mills6: 1200,
        mills9: 1200,
      };

      let totalGames = 0;
      let totalWins = 0;
      let totalLosses = 0;
      let totalDraws = 0;

      ratingsData?.forEach((r) => {
        if (r.variant === 'MILLS_3') ratingsMap.mills3 = r.rating;
        if (r.variant === 'MILLS_6') ratingsMap.mills6 = r.rating;
        if (r.variant === 'MILLS_9') ratingsMap.mills9 = r.rating;
        totalGames += r.games_played || 0;
        totalWins += r.wins || 0;
        totalLosses += r.losses || 0;
        totalDraws += r.draws || 0;
      });

      const isUsernameSet = Boolean(
        profileData.is_username_set === true ||
        (profileData.username &&
         !profileData.username.startsWith('player_') &&
         /^[a-zA-Z0-9]{3,20}$/.test(profileData.username))
      );

      return {
        data: {
          id: profileData.id,
          username: profileData.username || '',
          displayName: profileData.display_name || profileData.username || 'Player',
          avatarUrl: profileData.avatar_url,
          bio: profileData.bio,
          isUsernameSet,
          createdAt: new Date(profileData.created_at).toLocaleDateString(),
          ratings: ratingsMap,
          stats: {
            gamesPlayed: totalGames,
            wins: totalWins,
            losses: totalLosses,
            draws: totalDraws,
          },
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Error fetching user profile.' };
    }
  },

  /**
   * Update profile fields
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: null };
    }

    try {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.displayName) payload.display_name = updates.displayName;
      if (updates.bio !== undefined) payload.bio = updates.bio;
      if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId);

      return { error: error ? error.message : null };
    } catch (err: any) {
      return { error: err.message || 'Failed to update profile.' };
    }
  },
};
