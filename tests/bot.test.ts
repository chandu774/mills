import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/game/engine/GameEngine';
import { getBestBotMove, getBotProfile, BotDifficulty } from '@/game/ai/botEngine';

describe('Bot Engine: Profiles & Tiers', () => {
  it('returns appropriate bot profile metadata for each difficulty tier', () => {
    const easy = getBotProfile('EASY');
    expect(easy.rating).toBe(800);
    expect(easy.displayName).toContain('Easy');

    const medium = getBotProfile('MEDIUM');
    expect(medium.rating).toBe(1200);
    expect(medium.displayName).toContain('Medium');

    const hard = getBotProfile('HARD');
    expect(hard.rating).toBe(1600);
    expect(hard.displayName).toContain('Hard');

    const expert = getBotProfile('EXPERT');
    expect(expert.rating).toBe(2000);
    expect(expert.displayName).toContain('Expert');
  });
});

describe('Bot Engine: Move Generation & Strategy', () => {
  const difficulties: BotDifficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];

  difficulties.forEach((diff) => {
    it(`generates valid legal placement moves for difficulty: ${diff}`, () => {
      const engine = new GameEngine('MILLS_9');
      const move = getBestBotMove(engine, diff);
      expect(move).not.toBeNull();
      expect(move?.type).toBe('PLACE');
      expect(typeof move?.to).toBe('number');
      expect(engine.isLegalMove(move!)).toBe(true);
    });
  });

  it('detects and executes immediate mill completion in MEDIUM/HARD/EXPERT', () => {
    const engine = new GameEngine('MILLS_9');
    // Setup 2 white pieces on points 0 and 1 (mill is [0, 1, 2])
    engine.makeMove({ type: 'PLACE', to: 0 }); // White (turn 1)
    engine.makeMove({ type: 'PLACE', to: 9 }); // Black
    engine.makeMove({ type: 'PLACE', to: 1 }); // White (turn 2)
    engine.makeMove({ type: 'PLACE', to: 10 }); // Black

    // Now White has points 0 and 1. Point 2 completes the mill!
    const bestMove = getBestBotMove(engine, 'MEDIUM');
    expect(bestMove).not.toBeNull();
    expect(bestMove?.type).toBe('PLACE');
    expect(bestMove?.to).toBe(2);
  });

  it('detects and blocks opponent mill threat in MEDIUM/HARD/EXPERT', () => {
    const engine = new GameEngine('MILLS_9');
    // White places 0
    engine.makeMove({ type: 'PLACE', to: 0 });
    // Black places somewhere neutral
    engine.makeMove({ type: 'PLACE', to: 21 });
    // White places 1 -> White threatens point 2!
    engine.makeMove({ type: 'PLACE', to: 1 });

    // Now it's Black's turn. Black should block at point 2!
    const bestMove = getBestBotMove(engine, 'MEDIUM');
    expect(bestMove).not.toBeNull();
    expect(bestMove?.type).toBe('PLACE');
    expect(bestMove?.to).toBe(2);
  });

  it('selects a valid capture move when CAPTURE_PENDING', () => {
    const engine = new GameEngine('MILLS_9');
    // Form a mill for White
    engine.makeMove({ type: 'PLACE', to: 0 });
    engine.makeMove({ type: 'PLACE', to: 9 });
    engine.makeMove({ type: 'PLACE', to: 1 });
    engine.makeMove({ type: 'PLACE', to: 10 });
    const millRes = engine.makeMove({ type: 'PLACE', to: 2 }); // White forms mill [0,1,2]
    expect(millRes.formedMill).toBe(true);
    expect(millRes.state.status).toBe('CAPTURE_PENDING');

    const captureMove = getBestBotMove(engine, 'HARD');
    expect(captureMove).not.toBeNull();
    expect(captureMove?.type).toBe('CAPTURE');
    expect([9, 10]).toContain(captureMove?.capturedPoint);

    const capRes = engine.makeMove(captureMove!);
    expect(capRes.success).toBe(true);
  });
});
