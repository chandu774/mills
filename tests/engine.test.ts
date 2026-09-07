import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game/engine/GameEngine';
import { Board } from '@/game/engine/Board';
import { MillDetector } from '@/game/engine/MillDetector';
import { MILLS_6_CONFIG, MILLS_9_CONFIG } from '@/game/variants';

describe('3-Piece Mills Engine', () => {
  it('initializes correctly with 9 points and 3 pieces per player', () => {
    const engine = new GameEngine('MILLS_3');
    const state = engine.getState();

    expect(state.variant).toBe('MILLS_3');
    expect(state.status).toBe('PLACING');
    expect(state.phase).toBe('PLACING');
    expect(state.currentPlayer).toBe('WHITE');
    expect(state.piecesRemaining.WHITE).toBe(3);
    expect(state.piecesRemaining.BLACK).toBe(3);
    expect(state.legalMoves.length).toBe(9);
  });

  it('triggers an instant win upon forming a horizontal mill', () => {
    const engine = new GameEngine('MILLS_3');
    // White: 0, Black: 3
    engine.makeMove({ type: 'PLACE', to: 0 });
    engine.makeMove({ type: 'PLACE', to: 3 });
    // White: 1, Black: 4
    engine.makeMove({ type: 'PLACE', to: 1 });
    engine.makeMove({ type: 'PLACE', to: 4 });
    // White: 2 (completes mill 0-1-2!)
    const result = engine.makeMove({ type: 'PLACE', to: 2 });

    expect(result.success).toBe(true);
    expect(result.formedMill).toBe(true);
    expect(result.state.status).toBe('FINISHED');
    expect(result.state.winner).toBe('WHITE');
    expect(result.state.winReason).toContain('mill');
  });

  it('allows diagonal mills on 3-piece board', () => {
    const engine = new GameEngine('MILLS_3');
    // White: 0, Black: 1
    engine.makeMove({ type: 'PLACE', to: 0 });
    engine.makeMove({ type: 'PLACE', to: 1 });
    // White: 4 (center), Black: 2
    engine.makeMove({ type: 'PLACE', to: 4 });
    engine.makeMove({ type: 'PLACE', to: 2 });
    // White: 8 (completes diagonal 0-4-8!)
    const result = engine.makeMove({ type: 'PLACE', to: 8 });

    expect(result.success).toBe(true);
    expect(result.formedMill).toBe(true);
    expect(result.state.status).toBe('FINISHED');
    expect(result.state.winner).toBe('WHITE');
  });

  it('transitions to MOVING phase when all 6 pieces are placed without a mill', () => {
    const engine = new GameEngine('MILLS_3');
    // W0, B1, W2, B3, W5, B7
    engine.makeMove({ type: 'PLACE', to: 0 }); // W: 0
    engine.makeMove({ type: 'PLACE', to: 1 }); // B: 1
    engine.makeMove({ type: 'PLACE', to: 2 }); // W: 2
    engine.makeMove({ type: 'PLACE', to: 3 }); // B: 3
    engine.makeMove({ type: 'PLACE', to: 5 }); // W: 5
    const lastPlace = engine.makeMove({ type: 'PLACE', to: 7 }); // B: 7

    expect(lastPlace.state.status).toBe('MOVING');
    expect(lastPlace.state.phase).toBe('MOVING');
    expect(lastPlace.state.currentPlayer).toBe('WHITE');

    // White can move 0, 2, or 5 to adjacent open spots
    const legalMoves = engine.getLegalMoves();
    expect(legalMoves.length).toBeGreaterThan(0);
    expect(legalMoves.every((m) => m.type === 'MOVE')).toBe(true);
  });
});

describe('6-Piece Mills Engine', () => {
  it('enters CAPTURE_PENDING when a mill is formed in placing phase', () => {
    const engine = new GameEngine('MILLS_6');
    // White: 0, Black: 8
    engine.makeMove({ type: 'PLACE', to: 0 });
    engine.makeMove({ type: 'PLACE', to: 8 });
    // White: 1, Black: 9
    engine.makeMove({ type: 'PLACE', to: 1 });
    engine.makeMove({ type: 'PLACE', to: 9 });
    // White: 2 -> forms outer edge mill [0, 1, 2]
    const millRes = engine.makeMove({ type: 'PLACE', to: 2 });

    expect(millRes.success).toBe(true);
    expect(millRes.formedMill).toBe(true);
    expect(millRes.state.status).toBe('CAPTURE_PENDING');
    // Turn must still belong to WHITE to choose a capture
    expect(millRes.state.currentPlayer).toBe('WHITE');

    // Legal moves must only be CAPTURE of black pieces (8 or 9)
    const legalMoves = engine.getLegalMoves();
    expect(legalMoves.length).toBe(2);
    expect(legalMoves.every((m) => m.type === 'CAPTURE')).toBe(true);
  });

  it('protects pieces in active mills from capture unless all opponent pieces are in mills', () => {
    const board = new Board(16);
    // Black has mill at 8, 9, 10 and a free piece at 12
    board.set(8, 'BLACK');
    board.set(9, 'BLACK');
    board.set(10, 'BLACK');
    board.set(12, 'BLACK');

    const canCaptureMillPiece = MillDetector.canCapturePoint(board, 8, 'WHITE', MILLS_6_CONFIG);
    expect(canCaptureMillPiece.valid).toBe(false);

    const canCaptureFreePiece = MillDetector.canCapturePoint(board, 12, 'WHITE', MILLS_6_CONFIG);
    expect(canCaptureFreePiece.valid).toBe(true);

    // If black ONLY has 8, 9, 10 (all in mill), exception allows capturing any
    board.clear(12);
    const canCaptureNow = MillDetector.canCapturePoint(board, 8, 'WHITE', MILLS_6_CONFIG);
    expect(canCaptureNow.valid).toBe(true);
  });

  it('completes capture, decrements piece count, and passes turn', () => {
    const engine = new GameEngine('MILLS_6');
    engine.makeMove({ type: 'PLACE', to: 0 });
    engine.makeMove({ type: 'PLACE', to: 8 });
    engine.makeMove({ type: 'PLACE', to: 1 });
    engine.makeMove({ type: 'PLACE', to: 9 });
    engine.makeMove({ type: 'PLACE', to: 2 }); // Mill formed

    // Execute capture on point 8
    const captureRes = engine.makeMove({ type: 'CAPTURE', capturedPoint: 8 });
    expect(captureRes.success).toBe(true);
    expect(captureRes.state.status).toBe('PLACING');
    expect(captureRes.state.currentPlayer).toBe('BLACK');
    expect(captureRes.state.piecesRemaining.BLACK).toBe(5);
    expect(captureRes.state.capturedPieces.WHITE).toBe(1);
    expect(engine.getBoard().isEmpty(8)).toBe(true);
  });
});

describe('9-Piece Men\'s Morris Engine', () => {
  it('detects midpoint cross connection mills like [1, 9, 17]', () => {
    const engine = new GameEngine('MILLS_9');
    // White: 1, Black: 0
    engine.makeMove({ type: 'PLACE', to: 1 });
    engine.makeMove({ type: 'PLACE', to: 0 });
    // White: 9, Black: 2
    engine.makeMove({ type: 'PLACE', to: 9 });
    engine.makeMove({ type: 'PLACE', to: 2 });
    // White: 17 -> completes cross mill [1, 9, 17]!
    const millRes = engine.makeMove({ type: 'PLACE', to: 17 });

    expect(millRes.success).toBe(true);
    expect(millRes.formedMill).toBe(true);
    expect(millRes.state.status).toBe('CAPTURE_PENDING');
  });

  it('enables flying phase when a player has only 3 pieces left in 9-piece variant', () => {
    const engine = new GameEngine('MILLS_9');
    // Manually test flying logic through GameEngine state inspection
    const board = engine.getBoard();
    board.set(0, 'WHITE');
    board.set(1, 'WHITE');
    board.set(2, 'WHITE');
    board.set(16, 'BLACK');
    board.set(17, 'BLACK');
    board.set(18, 'BLACK');

    // Simulate placing phase completed with 3 pieces for White
    const testEngine = GameEngine.deserialize(
      JSON.stringify({
        config: MILLS_9_CONFIG,
        state: {
          variant: 'MILLS_9',
          status: 'FLYING',
          phase: 'FLYING',
          currentPlayer: 'WHITE',
          board: board.toArray(),
          piecesPlaced: { WHITE: 9, BLACK: 9 },
          piecesRemaining: { WHITE: 3, BLACK: 3 },
          capturedPieces: { WHITE: 6, BLACK: 6 },
          winner: null,
          winReason: null,
          moveNumber: 25,
          turnNumber: 13,
          legalMoves: [],
          lastMove: null,
          lastMillPoints: null,
          halfMoveClock: 0,
        },
        history: [],
        positionHistory: [],
      })
    );

    const legalMoves = testEngine.getLegalMoves();
    // With 3 pieces and 18 empty spots, White should have 3 * 18 = 54 legal flying moves
    expect(legalMoves.length).toBe(3 * 18);
    expect(legalMoves[0].type).toBe('FLY');

    // Make a flying move from 0 to 20 (non-adjacent)
    const flyRes = testEngine.makeMove({ type: 'FLY', from: 0, to: 20 });
    expect(flyRes.success).toBe(true);
    expect(testEngine.getBoard().isEmpty(0)).toBe(true);
    expect(testEngine.getBoard().get(20)).toBe('WHITE');
  });

  it('declares victory when opponent is reduced to 2 pieces after placement', () => {
    // 9-Piece game in moving phase: Black has 3 pieces, White forms a mill and captures one
    const board = new Board(24);
    board.set(0, 'WHITE');
    board.set(1, 'WHITE');
    board.set(9, 'WHITE'); // Will move 9 to 2 to form mill [0, 1, 2]
    board.set(16, 'BLACK');
    board.set(17, 'BLACK');
    board.set(18, 'BLACK');

    const testEngine = GameEngine.deserialize(
      JSON.stringify({
        config: MILLS_9_CONFIG,
        state: {
          variant: 'MILLS_9',
          status: 'MOVING',
          phase: 'MOVING',
          currentPlayer: 'WHITE',
          board: board.toArray(),
          piecesPlaced: { WHITE: 9, BLACK: 9 },
          piecesRemaining: { WHITE: 3, BLACK: 3 },
          capturedPieces: { WHITE: 6, BLACK: 6 },
          winner: null,
          winReason: null,
          moveNumber: 30,
          turnNumber: 15,
          legalMoves: [],
          lastMove: null,
          lastMillPoints: null,
          halfMoveClock: 0,
        },
        history: [],
        positionHistory: [],
      })
    );

    // White moves 9-1 (wait, 1 is occupied) -> 0,1 are occupied, move to 2
    // Adjacent to 2 is 1 and 3. Let's move from 3 to 2 if 3 is White
    testEngine.getBoard(); // board check
    const moveRes = testEngine.makeMove({ type: 'FLY', from: 9, to: 2 });
    expect(moveRes.formedMill).toBe(true);
    expect(moveRes.state.status).toBe('CAPTURE_PENDING');

    // Capture Black piece at 16 (reduces Black to 2 pieces)
    const capRes = testEngine.makeMove({ type: 'CAPTURE', capturedPoint: 16 });
    expect(capRes.success).toBe(true);
    expect(capRes.state.status).toBe('FINISHED');
    expect(capRes.state.winner).toBe('WHITE');
    expect(capRes.state.piecesRemaining.BLACK).toBe(2);
  });

  it('detects draw by threefold repetition of position', () => {
    // In MOVING phase, repeatedly sliding back and forth
    const board = new Board(24);
    board.set(0, 'WHITE');
    board.set(4, 'WHITE');
    board.set(5, 'WHITE');
    board.set(6, 'WHITE');
    board.set(16, 'BLACK');
    board.set(18, 'BLACK');
    board.set(20, 'BLACK');
    board.set(22, 'BLACK');

    const engine = GameEngine.deserialize(
      JSON.stringify({
        config: MILLS_9_CONFIG,
        state: {
          variant: 'MILLS_9',
          status: 'MOVING',
          phase: 'MOVING',
          currentPlayer: 'WHITE',
          board: board.toArray(),
          piecesPlaced: { WHITE: 9, BLACK: 9 },
          piecesRemaining: { WHITE: 4, BLACK: 4 },
          capturedPieces: { WHITE: 5, BLACK: 5 },
          winner: null,
          winReason: null,
          moveNumber: 35,
          turnNumber: 18,
          legalMoves: [],
          lastMove: null,
          lastMillPoints: null,
          halfMoveClock: 0,
        },
        history: [],
        positionHistory: [],
      })
    );

    // White moves 0-1, Black moves 16-17, White moves 1-0, Black moves 17-16...
    // Repetition 1
    engine.makeMove({ type: 'MOVE', from: 0, to: 1 });
    engine.makeMove({ type: 'MOVE', from: 16, to: 17 });
    engine.makeMove({ type: 'MOVE', from: 1, to: 0 });
    engine.makeMove({ type: 'MOVE', from: 17, to: 16 });

    // Repetition 2
    engine.makeMove({ type: 'MOVE', from: 0, to: 1 });
    engine.makeMove({ type: 'MOVE', from: 16, to: 17 });
    engine.makeMove({ type: 'MOVE', from: 1, to: 0 });
    const finalMove = engine.makeMove({ type: 'MOVE', from: 17, to: 16 });

    expect(finalMove.state.status).toBe('DRAW');
    expect(finalMove.state.winReason).toContain('threefold repetition');
  });

  it('handles resignation correctly', () => {
    const engine = new GameEngine('MILLS_9');
    const result = engine.resign('WHITE');

    expect(result.success).toBe(true);
    expect(result.state.status).toBe('RESIGNED');
    expect(result.state.winner).toBe('BLACK');
    expect(result.state.winReason).toBe('WHITE resigned.');
  });

  it('handles timeout correctly', () => {
    const engine = new GameEngine('MILLS_9');
    const result = engine.timeout('BLACK');

    expect(result.success).toBe(true);
    expect(result.state.status).toBe('TIMEOUT');
    expect(result.state.winner).toBe('WHITE');
    expect(result.state.winReason).toBe('BLACK ran out of time.');
  });

  it('allows replaying games step-by-step from move history', () => {
    const engine = new GameEngine('MILLS_3');
    engine.makeMove({ type: 'PLACE', to: 0 });
    engine.makeMove({ type: 'PLACE', to: 3 });
    engine.makeMove({ type: 'PLACE', to: 1 });
    engine.makeMove({ type: 'PLACE', to: 4 });
    engine.makeMove({ type: 'PLACE', to: 2 }); // Mill & game over

    expect(engine.getHistory().length).toBe(5);

    // Replay at move 0 (only first move)
    const replay0 = engine.replayAt(0);
    expect(replay0.board[0]).toBe('WHITE');
    expect(replay0.board[3]).toBeNull();
    expect(replay0.currentPlayer).toBe('BLACK');

    // Replay at move 2
    const replay2 = engine.replayAt(2);
    expect(replay2.board[0]).toBe('WHITE');
    expect(replay2.board[3]).toBe('BLACK');
    expect(replay2.board[1]).toBe('WHITE');
  });
});
