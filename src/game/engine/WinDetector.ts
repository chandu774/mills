import { Board } from './Board';
import { GameState, Move, PlayerColor, VariantConfig } from './types';

export interface WinEvaluation {
  isGameOver: boolean;
  winner: PlayerColor | null;
  reason: string | null;
}

export class WinDetector {
  /**
   * Evaluates win conditions after a move or capture.
   */
  static evaluate(
    state: GameState,
    _board: Board,
    config: VariantConfig,
    legalMovesForNextPlayer: Move[]
  ): WinEvaluation {
    const { piecesPlaced, piecesRemaining, currentPlayer } = state;
    const opponent: PlayerColor = currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE';

    // 1. Piece count condition (applies after placement is done)
    const isPlacingFinished =
      piecesPlaced.WHITE === config.piecesPerPlayer &&
      piecesPlaced.BLACK === config.piecesPerPlayer;

    if (isPlacingFinished && !config.instantWinOnMill) {
      if (piecesRemaining[opponent] < 3) {
        return {
          isGameOver: true,
          winner: currentPlayer,
          reason: `Opponent reduced to ${piecesRemaining[opponent]} pieces (less than 3).`,
        };
      }
      if (piecesRemaining[currentPlayer] < 3) {
        return {
          isGameOver: true,
          winner: opponent,
          reason: `Player reduced to ${piecesRemaining[currentPlayer]} pieces (less than 3).`,
        };
      }
    }

    // 2. Stalemate / Block condition:
    // If placing is finished and the player whose turn it is has no legal moves, they lose.
    if (isPlacingFinished && legalMovesForNextPlayer.length === 0) {
      // The player with 0 legal moves loses; the other player wins
      const blockedPlayer = state.currentPlayer; // Next player to act
      const winningPlayer: PlayerColor = blockedPlayer === 'WHITE' ? 'BLACK' : 'WHITE';
      return {
        isGameOver: true,
        winner: winningPlayer,
        reason: `${blockedPlayer} has no legal moves available (blocked).`,
      };
    }

    return {
      isGameOver: false,
      winner: null,
      reason: null,
    };
  }
}
