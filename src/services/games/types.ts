import { GameVariant, TimeControl, GameMode } from '@/lib/types';
import { PlayerColor, PlayerMove } from '@/game/engine/types';

export type RoomStatus = 'WAITING' | 'ACTIVE' | 'FINISHED' | 'ABANDONED';

export interface RoomPlayer {
  id: string;
  displayName: string;
  rating?: number;
  avatarUrl?: string;
  color: PlayerColor;
  isOnline: boolean;
  connectedAt: number;
  lastSeen: number;
}

export interface GameRoom {
  id: string;
  code: string;
  variant: GameVariant;
  timeControl: TimeControl;
  mode: GameMode;
  status: RoomStatus;
  hostPlayer: RoomPlayer;
  guestPlayer?: RoomPlayer;
  spectatorCount: number;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  winner?: PlayerColor | null;
  winReason?: string;
  fen?: string;
  moveCount: number;
  whiteRatingChange?: number;
  blackRatingChange?: number;
}

export type MultiplayerPayload =
  | {
      type: 'PLAYER_JOIN';
      player: RoomPlayer;
    }
  | {
      type: 'MOVE';
      move: PlayerMove;
      fen: string;
      clocks?: { WHITE?: number; BLACK?: number };
      moveNumber: number;
    }
  | {
      type: 'RESIGN';
      player: PlayerColor;
      reason?: string;
    }
  | {
      type: 'TIMEOUT';
      player: PlayerColor;
    }
  | {
      type: 'DRAW_OFFER';
      from: PlayerColor;
    }
  | {
      type: 'DRAW_RESPONSE';
      accepted: boolean;
      by: PlayerColor;
    }
  | {
      type: 'REMATCH_OFFER';
      from: PlayerColor;
    }
  | {
      type: 'REMATCH_ACCEPT';
      newRoomId: string;
    }
  | {
      type: 'HEARTBEAT';
      playerId: string;
      timestamp: number;
    }
  | {
      type: 'CHAT';
      senderId: string;
      senderName: string;
      message: string;
      timestamp: number;
    }
  | {
      type: 'PLAYER_DISCONNECT';
      playerId: string;
      color: PlayerColor;
    };

export interface MultiplayerMessage {
  id: string;
  roomId: string;
  senderId: string;
  timestamp: number;
  payload: MultiplayerPayload;
}
