import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { GameRoom, RoomPlayer } from './types';
import { GameVariant, TimeControl, GameMode } from '@/lib/types';
import { PlayerColor, PlayerMove } from '@/game/engine/types';

const ROOM_STORAGE_PREFIX = 'mills_room_';

export class GameService {
  /**
   * Generates a concise 6-character room code like "MILLS-8K2J" or "8K2J4N"
   */
  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Creates a new game room
   */
  public async createRoom(params: {
    variant: GameVariant;
    timeControl: TimeControl;
    mode: GameMode;
    hostPlayer: Omit<RoomPlayer, 'color' | 'isOnline' | 'connectedAt' | 'lastSeen'> & {
      preferredColor?: PlayerColor;
    };
  }): Promise<GameRoom> {
    // `games.id` is a UUID in Supabase, so keep the local room id database-compatible.
    const roomId = crypto.randomUUID();
    const code = this.generateRoomCode();
    const hostColor = params.hostPlayer.preferredColor || 'WHITE';

    const fullHost: RoomPlayer = {
      ...params.hostPlayer,
      color: hostColor,
      isOnline: true,
      connectedAt: Date.now(),
      lastSeen: Date.now(),
    };

    const room: GameRoom = {
      id: roomId,
      code,
      variant: params.variant,
      timeControl: params.timeControl,
      mode: params.mode,
      status: 'WAITING',
      hostPlayer: fullHost,
      spectatorCount: 0,
      createdAt: Date.now(),
      moveCount: 0,
    };

    // Store locally / in-memory
    this.saveLocalRoom(room);

    // Save to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const databaseMode = ['CASUAL', 'RANKED', 'FRIEND', 'PRIVATE'].includes(params.mode)
          ? params.mode
          : 'CASUAL';
        const { error } = await supabase.from('games').insert({
          id: roomId,
          variant: params.variant,
          mode: databaseMode,
          time_control: params.timeControl,
          status: 'WAITING',
          current_fen: '',
          moves_count: 0,
          white_player_id: hostColor === 'WHITE' ? fullHost.id : null,
          black_player_id: hostColor === 'BLACK' ? fullHost.id : null,
        });
        if (error) {
          console.warn('[GameService] Supabase room insert notice:', error.message);
        } else {
          const { error: playerError } = await supabase.from('game_players').insert({
            game_id: roomId,
            user_id: fullHost.id,
            color: hostColor,
          });
          if (playerError) console.warn('[GameService] Supabase host player insert notice:', playerError.message);
        }
      } catch (err) {
        console.warn('[GameService] Supabase unavailable:', err);
      }
    }

    return room;
  }

  /**
   * Retrieves a game room by ID or 6-character Code
   */
  public async getRoom(roomIdOrCode: string): Promise<GameRoom | null> {
    // 1. Query Supabase FIRST if configured (database authoritative)
    if (isSupabaseConfigured() && supabase) {
      try {
        const isUuid = roomIdOrCode.includes('-');
        const query = supabase
          .from('games')
          .select('*, white:white_player_id(id, username, display_name), black:black_player_id(id, username, display_name)');

        const { data, error } = isUuid
          ? await query.eq('id', roomIdOrCode).maybeSingle()
          : await query.or(`id.eq.${roomIdOrCode}`).maybeSingle();

        if (data && !error) {
          const hostColor = data.white_player_id ? 'WHITE' : 'BLACK';
          const hostInfo = hostColor === 'WHITE' ? data.white : data.black;
          const guestInfo = hostColor === 'WHITE' ? data.black : data.white;
          const guestColor: PlayerColor = hostColor === 'WHITE' ? 'BLACK' : 'WHITE';

          return {
            id: data.id,
            code: data.id.substring(0, 6).toUpperCase(),
            variant: data.variant,
            timeControl: data.time_control,
            mode: data.mode,
            status: data.status,
            hostPlayer: {
              id: hostInfo?.id || 'host',
              displayName: hostInfo?.display_name || hostInfo?.username || 'Player 1',
              color: hostColor,
              isOnline: true,
              connectedAt: new Date(data.created_at).getTime(),
              lastSeen: Date.now(),
            },
            guestPlayer: guestInfo ? {
              id: guestInfo.id,
              displayName: guestInfo.display_name || guestInfo.username || 'Player 2',
              color: guestColor,
              isOnline: true,
              connectedAt: Date.now(),
              lastSeen: Date.now(),
            } : undefined,
            spectatorCount: 0,
            createdAt: new Date(data.created_at).getTime(),
            moveCount: data.moves_count || 0,
            fen: data.current_fen || undefined,
            winner: data.winner_id ? (data.winner_id === data.white_player_id ? 'WHITE' : 'BLACK') : null,
            winReason: data.win_reason || undefined,
            whiteRatingChange: data.white_rating_change ?? undefined,
            blackRatingChange: data.black_rating_change ?? undefined,
          };
        }
      } catch (err) {
        console.warn('[GameService] Failed to query Supabase room:', err);
      }
    }

    // 2. Check local/in-memory storage for offline / dev mock games
    const local = this.getLocalRoom(roomIdOrCode);
    if (local) return local;

    return null;
  }

  /**
   * Joins an existing game room as guest
   */
  public async joinRoom(
    roomIdOrCode: string,
    guestPlayer: Omit<RoomPlayer, 'color' | 'isOnline' | 'connectedAt' | 'lastSeen'>
  ): Promise<{ success: boolean; room?: GameRoom; error?: string }> {
    const room = await this.getRoom(roomIdOrCode);
    if (!room) {
      return { success: false, error: 'Game room not found.' };
    }

    // If room is already active or finished
    if (room.status !== 'WAITING') {
      // If rejoining as same player
      if (room.hostPlayer.id === guestPlayer.id || room.guestPlayer?.id === guestPlayer.id) {
        return { success: true, room };
      }
      return { success: false, error: 'This room already has 2 active players.' };
    }

    // Prevent joining against yourself unless in dev demo mode
    if (room.hostPlayer.id === guestPlayer.id && import.meta.env.PROD) {
      return { success: false, error: 'Cannot join your own room as opponent.' };
    }

    // Assign opposite color
    const guestColor: PlayerColor = room.hostPlayer.color === 'WHITE' ? 'BLACK' : 'WHITE';
    const fullGuest: RoomPlayer = {
      ...guestPlayer,
      color: guestColor,
      isOnline: true,
      connectedAt: Date.now(),
      lastSeen: Date.now(),
    };

    room.guestPlayer = fullGuest;
    room.status = 'ACTIVE';
    room.startedAt = Date.now();

    this.saveLocalRoom(room);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error: playerError } = await supabase.from('game_players').insert({
          game_id: room.id,
          user_id: fullGuest.id,
          color: guestColor,
        });
        if (playerError) {
          console.warn('[GameService] Supabase guest player insert notice:', playerError.message);
        }

        const { error } = await supabase
          .from('games')
          .update({
            // ACTIVE is a client-only room state. The database constraint uses
            // PLACING for a game that has just started.
            status: 'PLACING',
            started_at: new Date().toISOString(),
            [guestColor === 'WHITE' ? 'white_player_id' : 'black_player_id']: fullGuest.id,
          })
          .eq('id', room.id);
        if (error) console.warn('[GameService] Supabase room join update notice:', error.message);
      } catch (err) {
        console.warn('[GameService] Failed updating joined player to Supabase:', err);
      }
    }

    return { success: true, room };
  }

  /**
   * Records a move to the game history
   */
  public async recordMove(params: {
    roomId: string;
    playerColor: PlayerColor;
    move: PlayerMove;
    notation: string;
    fen: string;
    moveNumber: number;
  }): Promise<void> {
    const room = await this.getRoom(params.roomId);
    if (room) {
      room.fen = params.fen;
      room.moveCount = params.moveNumber;
      this.saveLocalRoom(room);
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error: moveError } = await supabase.from('game_moves').insert({
          game_id: params.roomId,
          move_number: params.moveNumber,
          player_color: params.playerColor,
          move_type: params.move.type,
          from_point: 'from' in params.move ? params.move.from : null,
          to_point: 'to' in params.move ? params.move.to : null,
          captured_point: 'capturedPoint' in params.move ? params.move.capturedPoint : null,
          notation: params.notation,
          board_snapshot: { fen: params.fen },
        });
        if (moveError) console.warn('[GameService] Supabase move insert notice:', moveError.message);

        const { error: gameError } = await supabase
          .from('games')
          .update({
            current_fen: params.fen,
            moves_count: params.moveNumber,
          })
          .eq('id', params.roomId);
        if (gameError) console.warn('[GameService] Supabase move update notice:', gameError.message);
      } catch (err) {
        console.warn('[GameService] Error recording move to Supabase:', err);
      }
    }
  }

  /**
   * Finalizes the game outcome atomically
   */
  public async finishGame(params: {
    roomId: string;
    winner: PlayerColor | null;
    reason: string;
    finalFen?: string;
  }): Promise<{ whiteChange?: number; blackChange?: number }> {
    const room = await this.getRoom(params.roomId);
    if (room) {
      room.status = 'FINISHED';
      room.winner = params.winner;
      room.winReason = params.reason;
      room.endedAt = Date.now();
      if (params.finalFen) room.fen = params.finalFen;
      this.saveLocalRoom(room);
    }

    let whiteChange: number | undefined;
    let blackChange: number | undefined;

    if (isSupabaseConfigured() && supabase) {
      try {
        // Try atomic finish_game_and_update_ratings RPC
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('finish_game_and_update_ratings', {
          p_game_id: params.roomId,
          p_winner: params.winner,
          p_reason: params.reason,
        });

        if (!rpcErr && rpcRes && rpcRes.success) {
          whiteChange = rpcRes.white_change;
          blackChange = rpcRes.black_change;
          if (room) {
            room.whiteRatingChange = whiteChange;
            room.blackRatingChange = blackChange;
            this.saveLocalRoom(room);
          }
          return { whiteChange, blackChange };
        }

        // Direct table update fallback
        const winnerId =
          params.winner === 'WHITE'
            ? room?.hostPlayer.color === 'WHITE'
              ? room.hostPlayer.id
              : room?.guestPlayer?.id
            : params.winner === 'BLACK'
              ? room?.hostPlayer.color === 'BLACK'
                ? room.hostPlayer.id
                : room?.guestPlayer?.id
              : null;

        await supabase
          .from('games')
          .update({
            status: 'FINISHED',
            winner_id: winnerId,
            win_reason: params.reason,
            ended_at: new Date().toISOString(),
          })
          .eq('id', params.roomId);
      } catch (err) {
        console.warn('[GameService] Error finalizing game in Supabase:', err);
      }
    }

    return { whiteChange, blackChange };
  }

  // --- Local/Memory Storage Helpers ---

  private saveLocalRoom(room: GameRoom): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(ROOM_STORAGE_PREFIX + room.id, JSON.stringify(room));
        window.localStorage.setItem(ROOM_STORAGE_PREFIX + room.code, JSON.stringify(room));
      } catch {
        // storage quota exceeded or disabled
      }
    }
    // Also save in static map for test environments
    GameService.inMemoryRooms.set(room.id, room);
    GameService.inMemoryRooms.set(room.code, room);
  }

  private getLocalRoom(idOrCode: string): GameRoom | null {
    if (GameService.inMemoryRooms.has(idOrCode)) {
      return GameService.inMemoryRooms.get(idOrCode)!;
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const data = window.localStorage.getItem(ROOM_STORAGE_PREFIX + idOrCode);
        if (data) return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  }

  private static inMemoryRooms = new Map<string, GameRoom>();
}

export const gameService = new GameService();
