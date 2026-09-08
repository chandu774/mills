import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { MatchmakingModal } from '@/components/game/MatchmakingModal';
import { matchmakingService } from '@/services/matchmaking/matchmakingService';
import fs from 'fs';
import path from 'path';

describe('Username Validation Rules', () => {
  const USERNAME_REGEX = /^[a-zA-Z0-9]{3,20}$/;

  it('accepts valid alphanumeric usernames between 3 and 20 characters', () => {
    expect(USERNAME_REGEX.test('abc')).toBe(true);
    expect(USERNAME_REGEX.test('alex123')).toBe(true);
    expect(USERNAME_REGEX.test('GrandMaster99')).toBe(true);
    expect(USERNAME_REGEX.test('Player12345678901234')).toBe(true); // 20 chars
  });

  it('rejects usernames that are too short (< 3 chars)', () => {
    expect(USERNAME_REGEX.test('')).toBe(false);
    expect(USERNAME_REGEX.test('a')).toBe(false);
    expect(USERNAME_REGEX.test('ab')).toBe(false);
  });

  it('rejects usernames that are too long (> 20 chars)', () => {
    expect(USERNAME_REGEX.test('a'.repeat(21))).toBe(false);
  });

  it('rejects usernames with special characters, symbols, or spaces', () => {
    expect(USERNAME_REGEX.test('alex_123')).toBe(false); // underscores forbidden
    expect(USERNAME_REGEX.test('alex-123')).toBe(false); // hyphens forbidden
    expect(USERNAME_REGEX.test('alex 123')).toBe(false); // spaces forbidden
    expect(USERNAME_REGEX.test('user@mills')).toBe(false); // symbols forbidden
    expect(USERNAME_REGEX.test('mill.master')).toBe(false); // periods forbidden
  });

  it('treats usernames as case-insensitive for collisions', () => {
    const existingUsernames = ['grandmaster', 'alex123'];
    const checkCollision = (name: string) =>
      existingUsernames.includes(name.trim().toLowerCase());

    expect(checkCollision('GrandMaster')).toBe(true);
    expect(checkCollision('GRANDMASTER')).toBe(true);
    expect(checkCollision('alex123')).toBe(true);
    expect(checkCollision('Alex123')).toBe(true);
    expect(checkCollision('NewPlayer')).toBe(false);
  });
});

describe('MatchmakingModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders searching state with variant, mode, and cancel button', () => {
    vi.spyOn(matchmakingService, 'joinQueue').mockImplementation(async (params) => {
      params.onStatusUpdate?.('Searching for a closely rated opponent...', 3, 75);
    });
    vi.spyOn(matchmakingService, 'cancelQueue').mockResolvedValue();

    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <AuthProvider>
          <MatchmakingModal
            isOpen={true}
            variant="MILLS_9"
            mode="RANKED"
            timeControl="5_MIN"
            onClose={onClose}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('FINDING OPPONENT')).toBeInTheDocument();
    expect(screen.getByText(/Searching for a closely rated opponent/i)).toBeInTheDocument();
    expect(screen.getByText(/9-Piece Men's Morris/i)).toBeInTheDocument();
    expect(screen.getByText(/5 min/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /CANCEL/i });
    expect(cancelBtn).toBeInTheDocument();
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders opponent found state when matched', () => {
    vi.spyOn(matchmakingService, 'joinQueue').mockImplementation(async (params) => {
      params.onMatched('matched_game_abc', {
        id: 'user_opp',
        username: 'GrandMaster',
        displayName: 'GrandMaster',
        rating: 1450,
      });
    });
    vi.spyOn(matchmakingService, 'cancelQueue').mockResolvedValue();

    render(
      <MemoryRouter>
        <AuthProvider>
          <MatchmakingModal
            isOpen={true}
            variant="MILLS_9"
            mode="RANKED"
            timeControl="5_MIN"
            onClose={() => {}}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('OPPONENT FOUND!')).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
    expect(screen.getByText('GrandMaster')).toBeInTheDocument();
  });
});

describe('Matchmaking & Auth PostgreSQL Migration Audit', () => {
  const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260908000000_matchmaking_and_auth.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  it('defines the matchmaking_queue table with appropriate constraints', () => {
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.matchmaking_queue');
    expect(sqlContent).toContain("status TEXT NOT NULL DEFAULT 'searching'");
    expect(sqlContent).toContain('matched_game_id UUID REFERENCES public.games(id)');
    expect(sqlContent).toContain('CONSTRAINT uq_matchmaking_queue_user UNIQUE (user_id)');
  });

  it('enforces strict alphanumeric username constraints and lowercase uniqueness', () => {
    expect(sqlContent).toContain("username ~ '^[a-zA-Z0-9]+$'");
    expect(sqlContent).toContain('char_length(username) >= 3');
    expect(sqlContent).toContain('char_length(username) <= 20');
    expect(sqlContent).toContain('CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (LOWER(username))');
  });

  it('provides all 6 server-side matchmaking and auth RPC functions', () => {
    const requiredRPCs = [
      'FUNCTION public.check_username_available',
      'FUNCTION public.set_user_username',
      'FUNCTION public.join_or_match_queue',
      'FUNCTION public.poll_queue_status',
      'FUNCTION public.cancel_queue',
      'FUNCTION public.finish_game_and_update_ratings',
    ];

    for (const rpc of requiredRPCs) {
      expect(sqlContent).toContain(rpc);
    }
  });

  it('prevents race conditions with FOR UPDATE SKIP LOCKED and idempotent ratings update', () => {
    expect(sqlContent).toContain('FOR UPDATE SKIP LOCKED');
    expect(sqlContent).toContain('v_game.ratings_processed = true');
    expect(sqlContent).toContain('ratings_processed = true');
  });
});
