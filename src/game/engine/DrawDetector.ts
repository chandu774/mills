import { GameState } from './types';

export interface DrawEvaluation {
  isDraw: boolean;
  reason: string | null;
}

export class DrawDetector {
  /**
   * Checks if the position has occurred 3 times with the same player to move.
   */
  static isThreefoldRepetition(positionHistory: string[]): boolean {
    const counts: Record<string, number> = {};
    for (const pos of positionHistory) {
      counts[pos] = (counts[pos] || 0) + 1;
      if (counts[pos] >= 3) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if the 50-move rule (100 half-moves without capture) has been met.
   */
  static isFiftyMoveRule(halfMoveClock: number): boolean {
    return halfMoveClock >= 100;
  }

  /**
   * Full draw evaluation.
   */
  static evaluate(state: GameState, positionHistory: string[]): DrawEvaluation {
    if (this.isThreefoldRepetition(positionHistory)) {
      return {
        isDraw: true,
        reason: 'Draw by threefold repetition of position.',
      };
    }

    if (this.isFiftyMoveRule(state.halfMoveClock)) {
      return {
        isDraw: true,
        reason: 'Draw by 50-move rule (no captures made in 50 consecutive moves).',
      };
    }

    return {
      isDraw: false,
      reason: null,
    };
  }
}
