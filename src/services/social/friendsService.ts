import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export type FriendshipRelationState = 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';

export interface PlayerSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  ratings: {
    mills3: number;
    mills6: number;
    mills9: number;
  };
  relationship: FriendshipRelationState;
  friendshipId?: string;
}

export interface FriendItem {
  id: string;
  friendshipId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'in_game';
  ratings: {
    mills3: number;
    mills6: number;
    mills9: number;
  };
  createdAt: string;
}

export interface PendingRequestItem {
  friendshipId: string;
  senderId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export const friendsService = {
  /**
   * Searches for players by username and resolves friendship relationship relative to current user
   */
  async searchPlayers(query: string, currentUserId: string): Promise<PlayerSearchResult[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      // 1. Find matching profiles
      let profilesQuery = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${cleanQuery}%`)
        .limit(10);

      if (currentUserId) {
        profilesQuery = profilesQuery.neq('id', currentUserId);
      }

      const { data: profiles, error: profileErr } = await profilesQuery;
      if (profileErr || !profiles || profiles.length === 0) return [];

      const profileIds = profiles.map((p) => p.id);

      // 2. Fetch ratings for matched players
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('user_id, variant, rating')
        .in('user_id', profileIds);

      // 3. Fetch friendship status relative to current user
      let friendshipsData: any[] = [];
      if (currentUserId) {
        const { data: fData } = await supabase
          .from('friendships')
          .select('id, user_id, friend_id, status')
          .or(
            `and(user_id.eq.${currentUserId},friend_id.in.(${profileIds.join(',')})),and(friend_id.eq.${currentUserId},user_id.in.(${profileIds.join(',')}))`
          );
        friendshipsData = fData || [];
      }

      // 4. Map into results
      return profiles.map((profile) => {
        const pRatings = { mills3: 1200, mills6: 1200, mills9: 1200 };
        ratingsData?.forEach((r) => {
          if (r.user_id === profile.id) {
            if (r.variant === 'MILLS_3') pRatings.mills3 = r.rating;
            if (r.variant === 'MILLS_6') pRatings.mills6 = r.rating;
            if (r.variant === 'MILLS_9') pRatings.mills9 = r.rating;
          }
        });

        // Determine relationship
        let relationship: FriendshipRelationState = 'NONE';
        let friendshipId: string | undefined;

        const record = friendshipsData.find(
          (f) =>
            (f.user_id === currentUserId && f.friend_id === profile.id) ||
            (f.friend_id === currentUserId && f.user_id === profile.id)
        );

        if (record) {
          friendshipId = record.id;
          if (record.status === 'accepted') {
            relationship = 'FRIENDS';
          } else if (record.status === 'pending') {
            relationship = record.user_id === currentUserId ? 'REQUEST_SENT' : 'REQUEST_RECEIVED';
          }
        }

        return {
          id: profile.id,
          username: profile.username || 'player',
          displayName: profile.display_name || profile.username || 'Player',
          avatarUrl: profile.avatar_url,
          ratings: pRatings,
          relationship,
          friendshipId,
        };
      });
    } catch (err) {
      console.warn('[friendsService] Error searching players:', err);
      return [];
    }
  },

  /**
   * Retrieves all accepted friends for a user
   */
  async getFriends(currentUserId: string): Promise<FriendItem[]> {
    if (!isSupabaseConfigured() || !supabase || !currentUserId) {
      return [];
    }

    try {
      // Get all accepted friendships where user is participant
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('id, user_id, friend_id, created_at')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq('status', 'accepted');

      if (error || !friendships || friendships.length === 0) return [];

      const friendIds = friendships.map((f) =>
        f.user_id === currentUserId ? f.friend_id : f.user_id
      );

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', friendIds);

      // Fetch ratings
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('user_id, variant, rating')
        .in('user_id', friendIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      const result: FriendItem[] = [];
      for (const f of friendships) {
        const fid = f.user_id === currentUserId ? f.friend_id : f.user_id;
        const p = profileMap.get(fid);
        if (!p) continue;

        const pRatings = { mills3: 1200, mills6: 1200, mills9: 1200 };
        ratingsData?.forEach((r) => {
          if (r.user_id === fid) {
            if (r.variant === 'MILLS_3') pRatings.mills3 = r.rating;
            if (r.variant === 'MILLS_6') pRatings.mills6 = r.rating;
            if (r.variant === 'MILLS_9') pRatings.mills9 = r.rating;
          }
        });

        result.push({
          id: p.id,
          friendshipId: f.id,
          username: p.username || 'player',
          displayName: p.display_name || p.username || 'Player',
          avatarUrl: p.avatar_url || undefined,
          status: 'offline',
          ratings: pRatings,
          createdAt: new Date(f.created_at).toLocaleDateString(),
        });
      }
      return result;
    } catch (err) {
      console.warn('[friendsService] Error loading friends:', err);
      return [];
    }
  },

  /**
   * Retrieves pending incoming friend requests for the user
   */
  async getPendingRequests(currentUserId: string): Promise<PendingRequestItem[]> {
    if (!isSupabaseConfigured() || !supabase || !currentUserId) {
      return [];
    }

    try {
      const { data: requests, error } = await supabase
        .from('friendships')
        .select('id, user_id, created_at')
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');

      if (error || !requests || requests.length === 0) return [];

      const senderIds = requests.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', senderIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      const result: PendingRequestItem[] = [];
      for (const r of requests) {
        const p = profileMap.get(r.user_id);
        if (!p) continue;

        result.push({
          friendshipId: r.id,
          senderId: p.id,
          username: p.username || 'player',
          displayName: p.display_name || p.username || 'Player',
          avatarUrl: p.avatar_url || undefined,
          createdAt: new Date(r.created_at).toLocaleDateString(),
        });
      }
      return result;
    } catch (err) {
      console.warn('[friendsService] Error loading pending requests:', err);
      return [];
    }
  },

  /**
   * Sends a friend request to targetUserId
   */
  async sendFriendRequest(
    currentUserId: string,
    targetUserId: string
  ): Promise<{ success: boolean; error?: string; friendshipId?: string }> {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      return { success: false, error: 'Cannot send friend request to yourself.' };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Database not connected.' };
    }

    try {
      // Check if reciprocal request exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, user_id, friend_id, status')
        .or(
          `and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (existing) {
        if (existing.status === 'accepted') {
          return { success: true, friendshipId: existing.id };
        }
        if (existing.user_id === targetUserId && existing.status === 'pending') {
          // If the other player already sent a request, accept it
          return this.acceptFriendRequest(existing.id);
        }
        return { success: true, friendshipId: existing.id };
      }

      const { data, error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUserId,
          friend_id: targetUserId,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, friendshipId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send friend request.' };
    }
  },

  /**
   * Accepts a pending friend request
   */
  async acceptFriendRequest(friendshipId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Database not connected.' };
    }

    try {
      const { error } = await supabase
        .from('friendships')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', friendshipId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to accept friend request.' };
    }
  },

  /**
   * Declines a friend request or removes a friend
   */
  async declineOrRemoveFriend(friendshipId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Database not connected.' };
    }

    try {
      const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to remove friendship.' };
    }
  },
};
