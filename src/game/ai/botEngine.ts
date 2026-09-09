import { GameEngine } from '../engine/GameEngine';
import { Board } from '../engine/Board';
import { MillDetector } from '../engine/MillDetector';
import { GameState, Move, PlayerColor, VariantConfig } from '../engine/types';

export type BotDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export interface BotProfile {
  id: string;
  username: string;
  displayName: string;
  rating: number;
  avatarUrl?: string;
  difficulty: BotDifficulty;
}

export function getBotProfile(difficulty: BotDifficulty): BotProfile {
  switch (difficulty) {
    case 'EASY':
      return {
        id: 'bot_easy',
        username: 'MillsBot-Easy',
        displayName: 'MillsBot (Easy)',
        rating: 800,
        difficulty: 'EASY',
      };
    case 'MEDIUM':
      return {
        id: 'bot_medium',
        username: 'MillsBot-Medium',
        displayName: 'MillsBot (Medium)',
        rating: 1200,
        difficulty: 'MEDIUM',
      };
    case 'HARD':
      return {
        id: 'bot_hard',
        username: 'MillsBot-Hard',
        displayName: 'MillsBot (Hard)',
        rating: 1600,
        difficulty: 'HARD',
      };
    case 'EXPERT':
      return {
        id: 'bot_expert',
        username: 'MillsBot-Expert',
        displayName: 'MillsBot (Expert)',
        rating: 2000,
        difficulty: 'EXPERT',
      };
  }
}

/**
 * Returns the best move for the bot based on difficulty level.
 */
export function getBestBotMove(
  engine: GameEngine,
  difficulty: BotDifficulty = 'MEDIUM'
): Move | null {
  const state = engine.getState();
  const config = engine.config;
  const board = engine.getBoard();
  const legalMoves = engine.getLegalMoves();

  if (legalMoves.length === 0) return null;

  // 1. CAPTURE PHASE
  if (state.status === 'CAPTURE_PENDING') {
    return selectCaptureMove(board, state, config, legalMoves, difficulty);
  }

  // 2. EASY DIFFICULTY (Mostly random with slight mill awareness)
  if (difficulty === 'EASY') {
    if (Math.random() < 0.4) {
      const millMove = findMillCompletingMove(board, state, config, legalMoves);
      if (millMove) return millMove;
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // 3. MEDIUM DIFFICULTY (Tactical mill completion & blocking)
  if (difficulty === 'MEDIUM') {
    // A. Win / Form Mill immediately
    const millMove = findMillCompletingMove(board, state, config, legalMoves);
    if (millMove) return millMove;

    // B. Block Opponent's immediate mill threat
    const blockMove = findMillBlockingMove(board, state, config, legalMoves);
    if (blockMove) return blockMove;

    // C. Prefer high-connectivity points
    return pickBestPositionalMove(board, state, config, legalMoves);
  }

  // 4. HARD & EXPERT DIFFICULTY (Positional scoring + Minimax)
  return selectAdvancedMove(board, state, config, legalMoves, difficulty);
}

// ---------------------------------------------------------------------------
// CAPTURE STRATEGY
// ---------------------------------------------------------------------------

function selectCaptureMove(
  board: Board,
  state: GameState,
  config: VariantConfig,
  legalMoves: Move[],
  difficulty: BotDifficulty
): Move {
  if (difficulty === 'EASY') {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  const botColor = state.currentPlayer;
  const opponentColor: PlayerColor = botColor === 'WHITE' ? 'BLACK' : 'WHITE';

  // Prioritize opponent pieces that are about to form a mill (part of a 2-in-a-row)
  let bestScore = -Infinity;
  let bestMove = legalMoves[0];

  for (const move of legalMoves) {
    const point = move.capturedPoint;
    if (point === undefined) continue;

    let score = 0;

    // Threat detection: does opponent have 2 pieces in any mill line passing through this point?
    for (const mill of config.mills) {
      if (mill.includes(point)) {
        const oppCount = mill.filter((p) => board.get(p) === opponentColor).length;
        if (oppCount === 2) {
          score += 50; // High priority: breaks opponent's 2-piece setup!
        }
      }
    }

    // Degree of connectivity (blocking options)
    const neighbors = config.adjacency[point] || [];
    score += neighbors.length;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// ---------------------------------------------------------------------------
// TACTICAL DETECTORS
// ---------------------------------------------------------------------------

function findMillCompletingMove(
  board: Board,
  state: GameState,
  config: VariantConfig,
  legalMoves: Move[]
): Move | null {
  const player = state.currentPlayer;

  for (const move of legalMoves) {
    if (move.type === 'PLACE' && move.to !== undefined) {
      const simulatedBoard = board.clone();
      simulatedBoard.set(move.to, player);
      if (MillDetector.formsMillAt(simulatedBoard, move.to, player, config)) {
        return move;
      }
    } else if ((move.type === 'MOVE' || move.type === 'FLY') && move.to !== undefined && move.from !== undefined) {
      const simulatedBoard = board.clone();
      simulatedBoard.clear(move.from);
      simulatedBoard.set(move.to, player);
      if (MillDetector.formsMillAt(simulatedBoard, move.to, player, config)) {
        return move;
      }
    }
  }

  return null;
}

function findMillBlockingMove(
  board: Board,
  state: GameState,
  config: VariantConfig,
  legalMoves: Move[]
): Move | null {
  const botColor = state.currentPlayer;
  const opponentColor: PlayerColor = botColor === 'WHITE' ? 'BLACK' : 'WHITE';

  // Find empty points where opponent would form a mill
  const threateningPoints: number[] = [];
  const emptyPoints = board.getEmptyPoints();

  for (const p of emptyPoints) {
    const simulatedBoard = board.clone();
    simulatedBoard.set(p, opponentColor);
    if (MillDetector.formsMillAt(simulatedBoard, p, opponentColor, config)) {
      threateningPoints.push(p);
    }
  }

  if (threateningPoints.length === 0) return null;

  // Check if any legal move can occupy one of the threatening points
  for (const move of legalMoves) {
    if (move.to !== undefined && threateningPoints.includes(move.to)) {
      return move;
    }
  }

  return null;
}

function pickBestPositionalMove(
  board: Board,
  state: GameState,
  config: VariantConfig,
  legalMoves: Move[]
): Move {
  const player = state.currentPlayer;
  let bestScore = -Infinity;
  let bestMoves: Move[] = [legalMoves[0]];

  for (const move of legalMoves) {
    let score = 0;
    const targetPoint = move.to;
    if (targetPoint === undefined) continue;

    // Connections count (cross intersections are best)
    const neighbors = config.adjacency[targetPoint] || [];
    score += neighbors.length * 3;

    // Potential mill (does this point put us at 2 out of 3?)
    for (const mill of config.mills) {
      if (mill.includes(targetPoint)) {
        const playerCount = mill.filter((p) => p !== targetPoint && board.get(p) === player).length;
        const emptyCount = mill.filter((p) => p !== targetPoint && board.isEmpty(p)).length;
        if (playerCount === 1 && emptyCount === 1) {
          score += 15; // Setup future mill
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

// ---------------------------------------------------------------------------
// ADVANCED HEURISTIC SEARCH (Hard & Expert)
// ---------------------------------------------------------------------------

function selectAdvancedMove(
  board: Board,
  state: GameState,
  config: VariantConfig,
  legalMoves: Move[],
  _difficulty: BotDifficulty
): Move {
  // A. Win / Form Mill immediately
  const millMove = findMillCompletingMove(board, state, config, legalMoves);
  if (millMove) return millMove;

  // B. Block Opponent's immediate mill threat
  const blockMove = findMillBlockingMove(board, state, config, legalMoves);
  if (blockMove) return blockMove;

  const botColor = state.currentPlayer;
  const opponentColor: PlayerColor = botColor === 'WHITE' ? 'BLACK' : 'WHITE';

  let bestScore = -Infinity;
  let bestMove = legalMoves[0];

  for (const move of legalMoves) {
    const nextBoard = board.clone();
    if (move.type === 'PLACE' && move.to !== undefined) {
      nextBoard.set(move.to, botColor);
    } else if ((move.type === 'MOVE' || move.type === 'FLY') && move.from !== undefined && move.to !== undefined) {
      nextBoard.clear(move.from);
      nextBoard.set(move.to, botColor);
    }

    const score = evaluateBoardPosition(nextBoard, botColor, opponentColor, config);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function evaluateBoardPosition(
  board: Board,
  bot: PlayerColor,
  opponent: PlayerColor,
  config: VariantConfig
): number {
  let score = 0;

  // 1. Piece count difference
  const botPieces = board.getPlayerPoints(bot).length;
  const oppPieces = board.getPlayerPoints(opponent).length;
  score += (botPieces - oppPieces) * 100;

  // 2. Completed mills count
  let botMills = 0;
  let oppMills = 0;
  for (const mill of config.mills) {
    if (mill.every((p) => board.get(p) === bot)) botMills++;
    if (mill.every((p) => board.get(p) === opponent)) oppMills++;
  }
  score += (botMills - oppMills) * 40;

  // 3. 2-piece configurations with third open (potential mills)
  for (const mill of config.mills) {
    const botCount = mill.filter((p) => board.get(p) === bot).length;
    const oppCount = mill.filter((p) => board.get(p) === opponent).length;
    const emptyCount = mill.filter((p) => board.isEmpty(p)).length;

    if (botCount === 2 && emptyCount === 1) score += 18;
    if (oppCount === 2 && emptyCount === 1) score -= 25; // High penalty for opponent potential mill
  }

  // 4. Mobility / degrees of freedom
  const botPoints = board.getPlayerPoints(bot);
  for (const p of botPoints) {
    const freeNeighbors = (config.adjacency[p] || []).filter((n) => board.isEmpty(n)).length;
    score += freeNeighbors * 2;
  }

  return score;
}
