import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { GameVariant, GameMode, TimeControl } from '@/lib/types';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface OpponentInfo {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  rating: number;
}

export interface JoinQueueParams {
  variant: GameVariant;
  mode: GameMode;
  timeControl: TimeControl;
  userId: string;
  userRating: number;
  onMatched: (gameId: string, opponent?: OpponentInfo) => void;
  onError: (error: string) => void;
  onStatusUpdate?: (statusText: string, elapsedSeconds: number, tolerance: number) => void;
}

class MatchmakingService {
  private activeChannel: RealtimeChannel | null = null;
  private pollInterval: any = null;
  private timerInterval: any = null;
  private isSearching = false;

  public async joinQueue(params: JoinQueueParams): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      params.onError('Online ranked matchmaking requires an active database connection.');
      return;
    }

    this.cancelQueue(); // Clean up any lingering queue sessions
    this.isSearching = true;

    let elapsedSeconds = 0;
    let currentTolerance = 75;

    // Helper to calculate tolerance based on time elapsed
    const getTolerance = (sec: number) => {
      if (sec < 10) return 75;
      if (sec < 25) return 150;
      return 300;
    };

    const getStatusText = (tolerance: number) => {
      if (params.mode === 'CASUAL') {
        return 'Searching for any available casual player...';
      }
      if (tolerance <= 75) {
        return 'Searching for a closely rated opponent (±75)...';
      }
      if (tolerance <= 150) {
        return 'Widening rating search range (±150)...';
      }
      return 'Expanding search to all active players (±300)...';
    };

    const fetchOpponentInfo = async (gameId: string, myUserId: string): Promise<OpponentInfo | undefined> => {
      try {
        const { data: game } = await supabase!
          .from('games')
          .select('*, white:white_player_id(id, username, display_name, avatar_url), black:black_player_id(id, username, display_name, avatar_url)')
          .eq('id', gameId)
          .maybeSingle();

        if (game) {
          const isWhite = game.white_player_id === myUserId;
          const oppUser = isWhite ? game.black : game.white;
          const oppId = isWhite ? game.black_player_id : game.white_player_id;

          if (oppId) {
            // Fetch rating
            const { data: ratingRow } = await supabase!
              .from('ratings')
              .select('rating')
              .eq('user_id', oppId)
              .eq('variant', params.variant)
              .maybeSingle();

            return {
              id: oppId,
              username: oppUser?.username || 'Opponent',
              displayName: oppUser?.display_name || oppUser?.username || 'Opponent',
              avatarUrl: oppUser?.avatar_url,
              rating: ratingRow?.rating || 1200,
            };
          }
        }
      } catch (e) {
        console.warn('[MatchmakingService] Error fetching opponent info:', e);
      }
      return undefined;
    };

    const handleMatchSuccess = async (gameId: string) => {
      if (!this.isSearching) return;
      this.cleanup();

      const opponent = await fetchOpponentInfo(gameId, params.userId);
      params.onMatched(gameId, opponent);
    };

    // 1. Initial Matchmaking Attempt
    try {
      const { data: matchResult, error } = await supabase.rpc('join_or_match_queue', {
        p_variant: params.variant,
        p_mode: params.mode,
        p_time_control: params.timeControl,
        p_rating_tolerance: currentTolerance,
      });

      if (error) {
        console.error('[MatchmakingService] Initial queue error:', error);
        params.onError(error.message || 'Failed to join matchmaking queue.');
        this.cleanup();
        return;
      }

      if (matchResult && matchResult.status === 'matched' && matchResult.game_id) {
        await handleMatchSuccess(matchResult.game_id);
        return;
      }
    } catch (err: any) {
      params.onError(err.message || 'Unexpected matchmaking error.');
      this.cleanup();
      return;
    }

    // 2. Realtime Listener on matchmaking_queue for our user_id
    try {
      this.activeChannel = supabase
        .channel(`mm_user_${params.userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matchmaking_queue',
            filter: `user_id=eq.${params.userId}`,
          },
          async (payload: any) => {
            const newRecord = payload.new;
            if (newRecord && newRecord.status === 'matched' && newRecord.matched_game_id) {
              await handleMatchSuccess(newRecord.matched_game_id);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[MatchmakingService] Realtime channel setup warning:', err);
    }

    // 3. Second-by-Second Search Timer
    params.onStatusUpdate?.(getStatusText(currentTolerance), 0, currentTolerance);

    this.timerInterval = setInterval(() => {
      if (!this.isSearching) return;
      elapsedSeconds += 1;
      currentTolerance = getTolerance(elapsedSeconds);
      params.onStatusUpdate?.(getStatusText(currentTolerance), elapsedSeconds, currentTolerance);
    }, 1000);

    // 4. Polling & Heartbeat Safety Net (Runs every 2.5 seconds)
    this.pollInterval = setInterval(async () => {
      if (!this.isSearching) return;
      try {
        const { data: pollResult, error: pollErr } = await supabase!.rpc('join_or_match_queue', {
          p_variant: params.variant,
          p_mode: params.mode,
          p_time_control: params.timeControl,
          p_rating_tolerance: currentTolerance,
        });

        if (!pollErr && pollResult) {
          if (pollResult.status === 'matched' && pollResult.game_id) {
            await handleMatchSuccess(pollResult.game_id);
          }
        }
      } catch (err) {
        console.warn('[MatchmakingService] Polling check notice:', err);
      }
    }, 2500);
  }

  public async cancelQueue(): Promise<void> {
    this.cleanup();
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.rpc('cancel_queue');
      } catch (err) {
        console.warn('[MatchmakingService] Error during cancel queue:', err);
      }
    }
  }

  private cleanup(): void {
    this.isSearching = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.activeChannel && supabase) {
      supabase.removeChannel(this.activeChannel);
      this.activeChannel = null;
    }
  }
}

export const matchmakingService = new MatchmakingService();
