import { Board } from './Board';
import { PlayerColor, VariantConfig } from './types';

export class MillDetector {
  /**
   * Checks if placing/moving a piece to `point` forms at least one mill for `player`.
   */
  static formsMillAt(
    board: Board,
    point: number,
    player: PlayerColor,
    config: VariantConfig
  ): boolean {
    return this.getFormedMillsAt(board, point, player, config).length > 0;
  }

  /**
   * Returns all mills containing `point` where all points belong to `player`.
   */
  static getFormedMillsAt(
    board: Board,
    point: number,
    player: PlayerColor,
    config: VariantConfig
  ): number[][] {
    const formed: number[][] = [];
    for (const mill of config.mills) {
      if (mill.includes(point)) {
        const isComplete = mill.every((p) => board.get(p) === player);
        if (isComplete) {
          formed.push(mill);
        }
      }
    }
    return formed;
  }

  /**
   * Checks if the piece at `point` is currently part of any completed mill.
   */
  static isPointInMill(board: Board, point: number, config: VariantConfig): boolean {
    const player = board.get(point);
    if (!player) return false;

    for (const mill of config.mills) {
      if (mill.includes(point)) {
        const isMill = mill.every((p) => board.get(p) === player);
        if (isMill) return true;
      }
    }
    return false;
  }

  /**
   * Returns all points of an opponent that are eligible for capture.
   * Rule: Pieces in mills cannot be captured UNLESS all opponent pieces are in mills.
   */
  static getEligibleCapturePoints(
    board: Board,
    opponent: PlayerColor,
    config: VariantConfig
  ): number[] {
    const opponentPoints = board.getPlayerPoints(opponent);
    if (opponentPoints.length === 0) return [];

    // Filter points that are NOT in a mill
    const nonMillPoints = opponentPoints.filter(
      (p) => !this.isPointInMill(board, p, config)
    );

    // If there are non-mill pieces, only those can be captured
    if (nonMillPoints.length > 0) {
      return nonMillPoints;
    }

    // Exception rule: If ALL opponent pieces are in mills, ANY opponent piece may be captured
    return opponentPoints;
  }

  /**
   * Validates whether a specific point can be captured by `capturingPlayer`.
   */
  static canCapturePoint(
    board: Board,
    point: number,
    capturingPlayer: PlayerColor,
    config: VariantConfig
  ): { valid: boolean; error?: string } {
    const opponent: PlayerColor = capturingPlayer === 'WHITE' ? 'BLACK' : 'WHITE';
    const pieceOwner = board.get(point);

    if (!pieceOwner) {
      return { valid: false, error: 'Point is empty.' };
    }

    if (pieceOwner !== opponent) {
      return { valid: false, error: 'Cannot capture your own piece.' };
    }

    const eligiblePoints = this.getEligibleCapturePoints(board, opponent, config);
    if (!eligiblePoints.includes(point)) {
      return {
        valid: false,
        error: 'Cannot capture a piece that is part of an active mill when other pieces are available.',
      };
    }

    return { valid: true };
  }
}
