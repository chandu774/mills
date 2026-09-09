import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { authService } from '@/services/auth/authService';
import { AuthModal } from '@/components/auth/AuthModal';
import { AuthProvider } from '@/context/AuthContext';
import { getAuthRedirectUrl, getCleanUrlWithoutAuthParams } from '@/lib/auth/redirect';
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

describe('Phase 4: Username Setup Migration & Security Specifications', () => {
  const fixMigrationPath = path.resolve(
    __dirname,
    '../supabase/migrations/20260908183000_fix_username_setup_rpcs.sql'
  );
  const fixSqlContent = fs.readFileSync(fixMigrationPath, 'utf8');

  it('includes is_username_set column addition on public.profiles', () => {
    expect(fixSqlContent).toContain('ADD COLUMN IF NOT EXISTS is_username_set BOOLEAN NOT NULL DEFAULT false;');
  });

  it('includes case-insensitive unique index on LOWER(username)', () => {
    expect(fixSqlContent).toContain('CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower');
    expect(fixSqlContent).toContain('ON public.profiles (LOWER(username))');
  });

  it('defines check_username_available RPC function with 3-20 char alphanumeric rules', () => {
    expect(fixSqlContent).toContain('CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT)');
    expect(fixSqlContent).toContain('char_length(v_clean) < 3 OR char_length(v_clean) > 20');
    expect(fixSqlContent).toContain("v_clean ~ '^[a-zA-Z0-9]+$'");
    expect(fixSqlContent).toContain('LOWER(username) = LOWER(v_clean)');
  });

  it('defines set_user_username RPC enforcing auth.uid() without trusting client ID', () => {
    expect(fixSqlContent).toContain('CREATE OR REPLACE FUNCTION public.set_user_username(p_username TEXT)');
    expect(fixSqlContent).toContain('v_user_id := auth.uid();');
    expect(fixSqlContent).toContain('pg_advisory_xact_lock');
    expect(fixSqlContent).toContain('UPDATE public.profiles');
    expect(fixSqlContent).toContain('auth.users');
  });

  it('enforces username client-side validation rules correctly', async () => {
    // Under 3 chars
    const shortRes = await authService.checkUsernameAvailability('ab');
    expect(shortRes.available).toBe(false);
    expect(shortRes.error).toContain('between 3 and 20');

    // Over 20 chars
    const longRes = await authService.checkUsernameAvailability('a'.repeat(21));
    expect(longRes.available).toBe(false);
    expect(longRes.error).toContain('between 3 and 20');

    // Invalid symbols
    const symbolRes = await authService.checkUsernameAvailability('alex_smith!');
    expect(symbolRes.available).toBe(false);
    expect(symbolRes.error).toContain('Only letters (A-Z, a-z) and numbers (0-9)');

    // Spaces
    const spaceRes = await authService.checkUsernameAvailability('alex smith');
    expect(spaceRes.available).toBe(false);
    expect(spaceRes.error).toContain('Only letters (A-Z, a-z) and numbers (0-9)');
  });
});

describe('Phase 4: Dynamic OAuth Redirect URL Resolution for Mobile & Desktop', () => {
  it('resolves dynamic origin for localhost development', () => {
    // Mock window.location for laptop localhost on port 3000
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = new URL('http://localhost:3000/login');

    const url = getAuthRedirectUrl('/');
    expect(url).toBe('http://localhost:3000/');

    const customPathUrl = getAuthRedirectUrl('/play');
    expect(customPathUrl).toBe('http://localhost:3000/play');

    (window as any).location = originalLocation;
  });

  it('resolves dynamic origin for forwarded mobile tunnel (e.g. devtunnels.ms)', () => {
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = new URL('https://fv59b1k8-5173.inc1.devtunnels.ms/login');

    const url = getAuthRedirectUrl('/');
    expect(url).toBe('https://fv59b1k8-5173.inc1.devtunnels.ms/');

    (window as any).location = originalLocation;
  });

  it('resolves dynamic origin for other tunnel providers (e.g. ngrok, cloudflare, local IP)', () => {
    const originalLocation = window.location;
    delete (window as any).location;

    // ngrok
    (window as any).location = new URL('https://mills-app.ngrok-free.app/');
    expect(getAuthRedirectUrl('/')).toBe('https://mills-app.ngrok-free.app/');

    // Local WiFi IP
    (window as any).location = new URL('http://192.168.1.100:5173/');
    expect(getAuthRedirectUrl('/')).toBe('http://192.168.1.100:5173/');

    // Production domain
    (window as any).location = new URL('https://mills.app/login');
    expect(getAuthRedirectUrl('/')).toBe('https://mills.app/');

    (window as any).location = originalLocation;
  });

  it('cleans OAuth one-time code and error query parameters from URL', () => {
    const dirtyUrl = 'https://fv59b1k8-5173.inc1.devtunnels.ms/?code=secret_code_123&state=my_state';
    const cleaned = getCleanUrlWithoutAuthParams(dirtyUrl);
    expect(cleaned).toBe('/');

    const dirtyErrorUrl = 'https://mills.app/login?error=access_denied&error_description=User+cancelled';
    const cleanedError = getCleanUrlWithoutAuthParams(dirtyErrorUrl);
    expect(cleanedError).toBe('/login');
  });
});


