import { GameVariant } from '@/lib/types';

export type PlayerColor = 'WHITE' | 'BLACK';

export type GamePhase = 'PLACING' | 'MOVING' | 'FLYING';

export type GameStatus =
  | 'WAITING'
  | 'PLACING'
  | 'MOVING'
  | 'CAPTURE_PENDING'
  | 'FLYING'
  | 'FINISHED'
  | 'DRAW'
  | 'RESIGNED'
  | 'TIMEOUT'
  | 'ABANDONED';

export type MoveType = 'PLACE' | 'MOVE' | 'FLY' | 'CAPTURE';

export interface Move {
  type: MoveType;
  from?: number;
  to?: number;
  capturedPoint?: number;
}

export type PlayerMove = Move;

export interface GameState {
  variant: GameVariant;
  status: GameStatus;
  phase: GamePhase;
  currentPlayer: PlayerColor;
  board: (PlayerColor | null)[];
  piecesPlaced: Record<PlayerColor, number>;
  piecesRemaining: Record<PlayerColor, number>;
  capturedPieces: Record<PlayerColor, number>;
  winner: PlayerColor | null;
  winReason: string | null;
  moveNumber: number;
  turnNumber: number;
  legalMoves: Move[];
  lastMove: Move | null;
  lastMillPoints: number[] | null;
  halfMoveClock: number; // Half-moves since last capture (for 50-move draw rule)
}

export interface MoveResult {
  success: boolean;
  error?: string;
  state: GameState;
  formedMill?: boolean;
}

export interface MoveHistoryEntry {
  moveNumber: number;
  player: PlayerColor;
  move: Move;
  notation: string;
  boardSnapshot: (PlayerColor | null)[];
  timestamp: number;
}

export interface VariantConfig {
  variant: GameVariant;
  name: string;
  piecesPerPlayer: number;
  pointCount: number;
  adjacency: Record<number, number[]>;
  mills: number[][];
  coordinates: Record<number, { x: number; y: number }>;
  allowsFlying: boolean;
  flyingPieceThreshold: number;
  instantWinOnMill: boolean;
}
