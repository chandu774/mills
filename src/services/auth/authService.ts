import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile, UserRating } from '@/lib/types';

export interface AuthResponse<T> {
  data: T | null;
  error: string | null;
}

export const authService = {
  async signUp(
    email: string,
    password: string,
    username: string,
    displayName: string
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
      const cleanUsername = username.toLowerCase().trim();
      const cleanDisplayName = displayName.trim();

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

  async getProfile(userId: string): Promise<AuthResponse<UserProfile>> {
    if (!isSupabaseConfigured() || !supabase) {
      if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_MOCK === 'true') {
        return {
          data: {
            id: userId,
            username: 'DevPlayer',
            displayName: 'Dev User',
            bio: 'Local development mock player',
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
        .single();

      if (profileErr) return { data: null, error: profileErr.message };

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

      return {
        data: {
          id: profileData.id,
          username: profileData.username,
          displayName: profileData.display_name,
          avatarUrl: profileData.avatar_url,
          bio: profileData.bio,
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
