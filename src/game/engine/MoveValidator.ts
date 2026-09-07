import { Board } from './Board';
import { MillDetector } from './MillDetector';
import { GameState, Move, PlayerColor, VariantConfig } from './types';

export class MoveValidator {
  /**
   * Generates all legal moves for the current player in the current state.
   */
  static getLegalMoves(state: GameState, config: VariantConfig, board: Board): Move[] {
    // If the game is already over, no moves are legal
    if (['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(state.status)) {
      return [];
    }

    const { currentPlayer, status, phase } = state;
    const opponent: PlayerColor = currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE';

    // 1. If waiting for capture after a mill
    if (status === 'CAPTURE_PENDING') {
      const eligiblePoints = MillDetector.getEligibleCapturePoints(board, opponent, config);
      return eligiblePoints.map((point) => ({
        type: 'CAPTURE',
        capturedPoint: point,
      }));
    }

    // 2. Placing Phase
    if (phase === 'PLACING') {
      const emptyPoints = board.getEmptyPoints();
      return emptyPoints.map((to) => ({
        type: 'PLACE',
        to,
      }));
    }

    // 3. Flying Phase (for 9-piece when player has flyingPieceThreshold pieces remaining)
    const isPlacingFinished =
      state.piecesPlaced.WHITE === config.piecesPerPlayer &&
      state.piecesPlaced.BLACK === config.piecesPerPlayer;

    const playerPieces = board.getPlayerPoints(currentPlayer);
    const isFlying =
      config.allowsFlying &&
      isPlacingFinished &&
      playerPieces.length <= config.flyingPieceThreshold;

    if (isFlying) {
      const emptyPoints = board.getEmptyPoints();
      const moves: Move[] = [];
      for (const from of playerPieces) {
        for (const to of emptyPoints) {
          moves.push({
            type: 'FLY',
            from,
            to,
          });
        }
      }
      return moves;
    }

    // 4. Standard Moving Phase
    const moves: Move[] = [];
    for (const from of playerPieces) {
      const neighbors = config.adjacency[from] || [];
      for (const to of neighbors) {
        if (board.isEmpty(to)) {
          moves.push({
            type: 'MOVE',
            from,
            to,
          });
        }
      }
    }

    return moves;
  }

  /**
   * Validates if a proposed move is strictly legal.
   */
  static validateMove(
    state: GameState,
    move: Move,
    config: VariantConfig,
    board: Board
  ): { valid: boolean; error?: string } {
    if (['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(state.status)) {
      return { valid: false, error: 'Game has already ended.' };
    }

    if (state.status === 'CAPTURE_PENDING') {
      if (move.type !== 'CAPTURE') {
        return { valid: false, error: 'Must capture an opponent piece after forming a mill.' };
      }
      if (move.capturedPoint === undefined) {
        return { valid: false, error: 'Target capture point must be specified.' };
      }
      return MillDetector.canCapturePoint(board, move.capturedPoint, state.currentPlayer, config);
    }

    if (move.type === 'CAPTURE') {
      return { valid: false, error: 'Cannot capture unless in CAPTURE_PENDING state.' };
    }

    if (state.phase === 'PLACING') {
      if (move.type !== 'PLACE') {
        return { valid: false, error: 'Must place pieces during the placing phase.' };
      }
      if (move.to === undefined || move.to < 0 || move.to >= config.pointCount) {
        return { valid: false, error: 'Invalid destination point index.' };
      }
      if (!board.isEmpty(move.to)) {
        return { valid: false, error: 'Target point is already occupied.' };
      }
      return { valid: true };
    }

    // Phase is MOVING or FLYING
    if (move.from === undefined || move.to === undefined) {
      return { valid: false, error: 'Both from and to points must be provided.' };
    }

    if (move.from < 0 || move.from >= config.pointCount || move.to < 0 || move.to >= config.pointCount) {
      return { valid: false, error: 'Point index is out of bounds.' };
    }

    if (board.get(move.from) !== state.currentPlayer) {
      return { valid: false, error: 'Cannot move a piece that does not belong to you.' };
    }

    if (!board.isEmpty(move.to)) {
      return { valid: false, error: 'Destination point is already occupied.' };
    }

    const isPlacingFinished =
      state.piecesPlaced.WHITE === config.piecesPerPlayer &&
      state.piecesPlaced.BLACK === config.piecesPerPlayer;

    const playerPieces = board.getPlayerPoints(state.currentPlayer);
    const isFlying =
      config.allowsFlying &&
      isPlacingFinished &&
      playerPieces.length <= config.flyingPieceThreshold;

    if (isFlying) {
      if (move.type !== 'FLY' && move.type !== 'MOVE') {
        return { valid: false, error: 'Invalid move type for flying phase.' };
      }
      return { valid: true };
    }

    // Standard Move: must be adjacent
    if (move.type !== 'MOVE') {
      return { valid: false, error: 'Must execute standard adjacent move in this phase.' };
    }

    const neighbors = config.adjacency[move.from] || [];
    if (!neighbors.includes(move.to)) {
      return { valid: false, error: 'Destination point is not adjacent along a grid line.' };
    }

    return { valid: true };
  }
}
