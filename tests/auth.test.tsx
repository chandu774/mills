import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { authService } from '@/services/auth/authService';
import { AuthModal } from '@/components/auth/AuthModal';
import { AuthProvider } from '@/context/AuthContext';
import fs from 'fs';
import path from 'path';

describe('Phase 4: Authentication Service', () => {
  it('explicitly reports database not connected on sign in when unconfigured', async () => {
    const res = await authService.signIn('player@mills.online', 'password123');
    expect(res.error).toContain('Database not connected');
    expect(res.data).toBeNull();
  });

  it('explicitly reports database not connected on sign up when unconfigured', async () => {
    const res = await authService.signUp(
      'newplayer@mills.online',
      'password123',
      'new_player',
      'New Player'
    );
    expect(res.error).toContain('Database not connected');
    expect(res.data).toBeNull();
  });

  it('reports database not connected when fetching profile without database', async () => {
    const res = await authService.getProfile('demo_user_1');
    expect(res.error).toBe('Database not connected.');
    expect(res.data).toBeNull();
  });
});

describe('Phase 4: AuthModal Component', () => {
  it('renders sign in modal and switches between tabs', () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={() => {}} defaultTab="signin" />
      </AuthProvider>
    );

    expect(screen.getByText('Sign In to Mills')).toBeInTheDocument();

    // Switch to Create Account tab
    const createTab = screen.getByRole('tab', { name: /Create Account/i });
    fireEvent.click(createTab);

    expect(screen.getByText('Create Mills Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. mill_master/i)).toBeInTheDocument();
  });

  it('shows error when submitting mismatched passwords on signup', async () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={() => {}} defaultTab="signup" />
      </AuthProvider>
    );

    // Modal rendered in signup mode by default
    expect(screen.getByText('Create Mills Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. mill_master/i)).toBeInTheDocument();

    // Fill in form with mismatched passwords
    fireEvent.change(screen.getByPlaceholderText(/e.g. mill_master/i), {
      target: { value: 'valid_user' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e.g. Alex Chen/i), {
      target: { value: 'Valid Name' },
    });
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'valid@example.com' },
    });

    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/i);
    fireEvent.change(passwordInputs[0], { target: { value: 'secret123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'different123' } });

    const submitBtn = screen.getByRole('button', { name: /Create Account/i, hidden: false });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });
});

describe('Phase 4: Supabase PostgreSQL Schema & Security Audit', () => {
  const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260907000000_init_schema.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  it('verifies all required core tables are created in migration', () => {
    const requiredTables = [
      'public.profiles',
      'public.ratings',
      'public.rating_history',
      'public.friendships',
      'public.friend_challenges',
      'public.games',
      'public.game_players',
      'public.game_moves',
      'public.tournaments',
      'public.tournament_players',
      'public.notifications',
      'public.chat_messages',
    ];

    for (const table of requiredTables) {
      expect(sqlContent).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  it('verifies Row Level Security (RLS) is explicitly enabled on all tables', () => {
    const rlsTables = [
      'public.profiles',
      'public.ratings',
      'public.rating_history',
      'public.friendships',
      'public.friend_challenges',
      'public.games',
      'public.game_players',
      'public.game_moves',
      'public.tournaments',
      'public.tournament_players',
      'public.notifications',
      'public.chat_messages',
    ];

    for (const table of rlsTables) {
      expect(sqlContent).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it('verifies automated trigger and server-side atomic rating update function exist', () => {
    expect(sqlContent).toContain('CREATE OR REPLACE FUNCTION public.handle_new_user()');
    expect(sqlContent).toContain('CREATE TRIGGER on_auth_user_created');
    expect(sqlContent).toContain('CREATE OR REPLACE FUNCTION public.update_ratings_after_game');
  });
});
