import { Board } from './Board';
import { MillDetector } from './MillDetector';
import { MoveValidator } from './MoveValidator';
import { WinDetector } from './WinDetector';
import { DrawDetector } from './DrawDetector';
import {
  GameState,
  Move,
  MoveHistoryEntry,
  MoveResult,
  PlayerColor,
  VariantConfig,
} from './types';
import { getVariantConfig } from '../variants';

export class GameEngine {
  readonly config: VariantConfig;
  private board: Board;
  private state: GameState;
  private history: MoveHistoryEntry[] = [];
  private positionHistory: string[] = [];

  constructor(variantConfig: VariantConfig | GameState['variant']) {
    if (typeof variantConfig === 'string') {
      this.config = getVariantConfig(variantConfig);
    } else {
      this.config = variantConfig;
    }

    this.board = new Board(this.config.pointCount);
    this.state = this.createInitialState();
    this.recordPosition();
  }

  private createInitialState(): GameState {
    const initialState: GameState = {
      variant: this.config.variant,
      status: 'PLACING',
      phase: 'PLACING',
      currentPlayer: 'WHITE',
      board: this.board.toArray(),
      piecesPlaced: { WHITE: 0, BLACK: 0 },
      piecesRemaining: {
        WHITE: this.config.piecesPerPlayer,
        BLACK: this.config.piecesPerPlayer,
      },
      capturedPieces: { WHITE: 0, BLACK: 0 },
      winner: null,
      winReason: null,
      moveNumber: 1,
      turnNumber: 1,
      legalMoves: [],
      lastMove: null,
      lastMillPoints: null,
      halfMoveClock: 0,
    };

    initialState.legalMoves = MoveValidator.getLegalMoves(initialState, this.config, this.board);
    return initialState;
  }

  private recordPosition(): void {
    const hash = `${this.board.toHash()}:${this.state.currentPlayer}:${this.state.status}`;
    this.positionHistory.push(hash);
  }

  getState(): GameState {
    return {
      ...this.state,
      board: this.board.toArray(),
      legalMoves: [...this.state.legalMoves],
    };
  }

  getBoard(): Board {
    return this.board.clone();
  }

  getLegalMoves(): Move[] {
    return [...this.state.legalMoves];
  }

  isLegalMove(move: Move): boolean {
    const validation = MoveValidator.validateMove(this.state, move, this.config, this.board);
    return validation.valid;
  }

  getHistory(): MoveHistoryEntry[] {
    return [...this.history];
  }

  getVariant() {
    return this.config.variant;
  }

  getFEN(): string {
    return `${this.board.toHash()}:${this.state.currentPlayer}:${this.state.status}`;
  }

  /**
   * Core move execution. Handles placing, moving, flying, mill creation, captures, win/draw.
   */
  makeMove(move: Move): MoveResult {
    // 1. Validation
    const validation = MoveValidator.validateMove(this.state, move, this.config, this.board);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        state: this.getState(),
      };
    }

    const { currentPlayer } = this.state;
    const opponent: PlayerColor = currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE';
    let formedMill = false;
    let moveNotation = '';

    // 2. Handle Move by Type
    if (this.state.status === 'CAPTURE_PENDING' && move.type === 'CAPTURE') {
      const capturePoint = move.capturedPoint!;
      this.board.clear(capturePoint);
      this.state.piecesRemaining[opponent] -= 1;
      this.state.capturedPieces[currentPlayer] += 1;
      this.state.halfMoveClock = 0; // Reset 50-move clock on capture
      moveNotation = `x${capturePoint}`;

      // Check win condition after piece reduction
      const isPlacingFinished =
        this.state.piecesPlaced.WHITE === this.config.piecesPerPlayer &&
        this.state.piecesPlaced.BLACK === this.config.piecesPerPlayer;

      if (isPlacingFinished && !this.config.instantWinOnMill && this.state.piecesRemaining[opponent] < 3) {
        this.state.status = 'FINISHED';
        this.state.winner = currentPlayer;
        this.state.winReason = `Opponent reduced to ${this.state.piecesRemaining[opponent]} pieces (less than 3).`;
        this.finalizeTurn(move, moveNotation);
        return { success: true, state: this.getState(), formedMill: false };
      }

      // Check phase transition
      if (isPlacingFinished) {
        if (
          this.config.allowsFlying &&
          this.state.piecesRemaining[opponent] <= this.config.flyingPieceThreshold
        ) {
          this.state.phase = 'FLYING';
          this.state.status = 'FLYING';
        } else {
          this.state.phase = 'MOVING';
          this.state.status = 'MOVING';
        }
      } else {
        this.state.phase = 'PLACING';
        this.state.status = 'PLACING';
      }

      // Capture complete: pass turn to opponent
      this.state.currentPlayer = opponent;
      this.state.lastMillPoints = null;

    } else if (this.state.phase === 'PLACING' && move.type === 'PLACE') {
      const to = move.to!;
      this.board.set(to, currentPlayer);
      this.state.piecesPlaced[currentPlayer] += 1;
      moveNotation = `P${to}`;

      // Check if mill formed
      const formedMills = MillDetector.getFormedMillsAt(this.board, to, currentPlayer, this.config);
      if (formedMills.length > 0) {
        formedMill = true;
        this.state.lastMillPoints = Array.from(new Set(formedMills.flat()));

        if (this.config.instantWinOnMill) {
          // 3-Piece Mills instant win
          this.state.status = 'FINISHED';
          this.state.winner = currentPlayer;
          this.state.winReason = 'Formed a 3-piece mill (instant win).';
          this.finalizeTurn(move, moveNotation);
          return { success: true, state: this.getState(), formedMill: true };
        } else {
          // 6 or 9 piece: requires capturing opponent piece
          this.state.status = 'CAPTURE_PENDING';
          // Do NOT switch player yet
        }
      } else {
        this.state.lastMillPoints = null;
        // Did all pieces get placed?
        if (
          this.state.piecesPlaced.WHITE === this.config.piecesPerPlayer &&
          this.state.piecesPlaced.BLACK === this.config.piecesPerPlayer
        ) {
          this.state.phase = 'MOVING';
          this.state.status = 'MOVING';
        }
        // Switch turn to opponent
        this.state.currentPlayer = opponent;
      }

    } else if (
      (this.state.phase === 'MOVING' || this.state.phase === 'FLYING') &&
      (move.type === 'MOVE' || move.type === 'FLY')
    ) {
      const from = move.from!;
      const to = move.to!;
      this.board.clear(from);
      this.board.set(to, currentPlayer);
      this.state.halfMoveClock += 1;
      moveNotation = `${from}-${to}`;

      // Check if mill formed
      const formedMills = MillDetector.getFormedMillsAt(this.board, to, currentPlayer, this.config);
      if (formedMills.length > 0) {
        formedMill = true;
        this.state.lastMillPoints = Array.from(new Set(formedMills.flat()));

        if (this.config.instantWinOnMill) {
          // 3-Piece Mills instant win
          this.state.status = 'FINISHED';
          this.state.winner = currentPlayer;
          this.state.winReason = 'Formed a 3-piece mill (instant win).';
          this.finalizeTurn(move, moveNotation);
          return { success: true, state: this.getState(), formedMill: true };
        } else {
          // 6 or 9 piece: requires capturing opponent piece
          this.state.status = 'CAPTURE_PENDING';
          // Do NOT switch player yet
        }
      } else {
        this.state.lastMillPoints = null;
        // Switch turn to opponent
        this.state.currentPlayer = opponent;
        if (
          this.config.allowsFlying &&
          this.state.piecesRemaining[opponent] <= this.config.flyingPieceThreshold
        ) {
          this.state.phase = 'FLYING';
          this.state.status = 'FLYING';
        } else {
          this.state.phase = 'MOVING';
          this.state.status = 'MOVING';
        }
      }
    }

    this.finalizeTurn(move, moveNotation);
    return {
      success: true,
      state: this.getState(),
      formedMill,
    };
  }

  private finalizeTurn(move: Move, notation: string): void {
    this.state.board = this.board.toArray();
    this.state.lastMove = move;

    // Record in history log
    this.history.push({
      moveNumber: this.state.moveNumber,
      player: this.state.currentPlayer === 'WHITE' && this.state.status !== 'CAPTURE_PENDING' ? 'BLACK' : this.state.currentPlayer,
      move,
      notation,
      boardSnapshot: this.board.toArray(),
      timestamp: Date.now(),
    });

    this.state.moveNumber += 1;
    if (this.state.currentPlayer === 'WHITE') {
      this.state.turnNumber += 1;
    }

    // Generate legal moves for current player
    this.state.legalMoves = MoveValidator.getLegalMoves(this.state, this.config, this.board);

    // If game has not finished yet, evaluate win/draw conditions
    if (!['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(this.state.status)) {
      // 1. Evaluate Win (Blocked/Stalemate)
      const winEval = WinDetector.evaluate(
        this.state,
        this.board,
        this.config,
        this.state.legalMoves
      );

      if (winEval.isGameOver) {
        this.state.status = 'FINISHED';
        this.state.winner = winEval.winner;
        this.state.winReason = winEval.reason;
        this.state.legalMoves = [];
        return;
      }

      // 2. Evaluate Draw (Threefold repetition & 50-move rule)
      this.recordPosition();
      const drawEval = DrawDetector.evaluate(this.state, this.positionHistory);
      if (drawEval.isDraw) {
        this.state.status = 'DRAW';
        this.state.winner = null;
        this.state.winReason = drawEval.reason;
        this.state.legalMoves = [];
      }
    }
  }

  /**
   * Resignation by a player.
   */
  resign(player: PlayerColor): MoveResult {
    if (['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(this.state.status)) {
      return { success: false, error: 'Game is already over.', state: this.getState() };
    }
    const winner: PlayerColor = player === 'WHITE' ? 'BLACK' : 'WHITE';
    this.state.status = 'RESIGNED';
    this.state.winner = winner;
    this.state.winReason = `${player} resigned.`;
    this.state.legalMoves = [];
    return { success: true, state: this.getState() };
  }

  /**
   * Clock timeout by a player.
   */
  timeout(player: PlayerColor): MoveResult {
    if (['FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'].includes(this.state.status)) {
      return { success: false, error: 'Game is already over.', state: this.getState() };
    }
    const winner: PlayerColor = player === 'WHITE' ? 'BLACK' : 'WHITE';
    this.state.status = 'TIMEOUT';
    this.state.winner = winner;
    this.state.winReason = `${player} ran out of time.`;
    this.state.legalMoves = [];
    return { success: true, state: this.getState() };
  }

  /**
   * Replays game up to `targetMoveIndex` (0-indexed) without modifying the main game.
   */
  replayAt(targetMoveIndex: number): GameState {
    const replayEngine = new GameEngine(this.config);
    const count = Math.min(targetMoveIndex + 1, this.history.length);
    for (let i = 0; i < count; i++) {
      replayEngine.makeMove(this.history[i].move);
    }
    return replayEngine.getState();
  }

  /**
   * Serializes the engine state for storage.
   */
  serialize(): string {
    return JSON.stringify({
      config: this.config,
      state: this.state,
      history: this.history,
      positionHistory: this.positionHistory,
    });
  }

  /**
   * Deserializes and restores an engine instance from serialized JSON.
   */
  static deserialize(json: string): GameEngine {
    const data = JSON.parse(json);
    const engine = new GameEngine(data.config);
    engine.board = new Board(data.config.pointCount, data.state.board);
    engine.state = { ...data.state };
    engine.history = [...data.history];
    engine.positionHistory = [...data.positionHistory];
    engine.state.legalMoves = MoveValidator.getLegalMoves(engine.state, engine.config, engine.board);
    if (engine.positionHistory.length === 0) {
      engine.recordPosition();
    }
    return engine;
  }
}
