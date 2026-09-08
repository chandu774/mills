-- =============================================================================
-- MILLS GAMING PLATFORM - INITIAL DATABASE SCHEMA & ROW LEVEL SECURITY
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. PROFILES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  is_username_set BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT username_length_check CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT username_format_check CHECK (username ~ '^[a-zA-Z0-9]+$')
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username));

-- =============================================================================
-- 2. RATINGS TABLE (Separate rating per variant: MILLS_3, MILLS_6, MILLS_9)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('MILLS_3', 'MILLS_6', 'MILLS_9')),
  rating INTEGER NOT NULL DEFAULT 1200 CHECK (rating >= 100 AND rating <= 3500),
  rd INTEGER NOT NULL DEFAULT 350, -- Rating deviation for Glicko / provisional
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
  draws INTEGER NOT NULL DEFAULT 0 CHECK (draws >= 0),
  peak_rating INTEGER NOT NULL DEFAULT 1200,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_variant_rating UNIQUE (user_id, variant)
);

CREATE INDEX IF NOT EXISTS idx_ratings_variant_rating ON public.ratings(variant, rating DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);

-- =============================================================================
-- 3. RATING HISTORY TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.rating_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id UUID,
  variant TEXT NOT NULL CHECK (variant IN ('MILLS_3', 'MILLS_6', 'MILLS_9')),
  rating_before INTEGER NOT NULL,
  rating_change INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rating_history_user ON public.rating_history(user_id, created_at DESC);

-- =============================================================================
-- 4. FRIENDSHIPS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_friendship_not_self CHECK (user_id != friend_id),
  CONSTRAINT uq_friendship_pair UNIQUE (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id, status);

-- =============================================================================
-- 5. FRIEND CHALLENGES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.friend_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('MILLS_3', 'MILLS_6', 'MILLS_9')),
  mode TEXT NOT NULL DEFAULT 'RANKED' CHECK (mode IN ('RANKED', 'CASUAL')),
  time_control TEXT NOT NULL CHECK (time_control IN ('UNTIMED', '3_MIN', '5_MIN', '10_MIN')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'started', 'cancelled')),
  game_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  CONSTRAINT chk_challenge_not_self CHECK (sender_id != receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_challenges_receiver ON public.friend_challenges(receiver_id, status);

-- =============================================================================
-- 6. GAMES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant TEXT NOT NULL CHECK (variant IN ('MILLS_3', 'MILLS_6', 'MILLS_9')),
  mode TEXT NOT NULL DEFAULT 'RANKED' CHECK (mode IN ('RANKED', 'CASUAL', 'FRIEND', 'PRIVATE')),
  time_control TEXT NOT NULL CHECK (time_control IN ('UNTIMED', '3_MIN', '5_MIN', '10_MIN')),
  status TEXT NOT NULL DEFAULT 'WAITING' CHECK (status IN (
    'WAITING', 'PLACING', 'MOVING', 'CAPTURE_PENDING', 'FLYING',
    'FINISHED', 'DRAW', 'RESIGNED', 'TIMEOUT', 'ABANDONED'
  )),
  white_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  black_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  current_player TEXT NOT NULL DEFAULT 'WHITE' CHECK (current_player IN ('WHITE', 'BLACK')),
  board JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_fen TEXT,
  move_number INTEGER NOT NULL DEFAULT 1 CHECK (move_number >= 1),
  moves_count INTEGER NOT NULL DEFAULT 0 CHECK (moves_count >= 0),
  turn_number INTEGER NOT NULL DEFAULT 1 CHECK (turn_number >= 1),
  white_time_remaining INTEGER,
  black_time_remaining INTEGER,
  last_move_at TIMESTAMPTZ,
  winner TEXT CHECK (winner IN ('WHITE', 'BLACK', NULL)),
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  win_reason TEXT,
  ratings_processed BOOLEAN NOT NULL DEFAULT false,
  white_rating_change INTEGER,
  black_rating_change INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON public.games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_white_player ON public.games(white_player_id);
CREATE INDEX IF NOT EXISTS idx_games_black_player ON public.games(black_player_id);

-- =============================================================================
-- 7. GAME PLAYERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  color TEXT NOT NULL CHECK (color IN ('WHITE', 'BLACK')),
  rating_before INTEGER,
  rating_change INTEGER DEFAULT 0,
  rating_after INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_game_color UNIQUE (game_id, color),
  CONSTRAINT uq_game_user UNIQUE (game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_players_user ON public.game_players(user_id, created_at DESC);

-- =============================================================================
-- 8. GAME MOVES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.game_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  player_color TEXT NOT NULL CHECK (player_color IN ('WHITE', 'BLACK')),
  move_type TEXT NOT NULL CHECK (move_type IN ('PLACE', 'MOVE', 'FLY', 'CAPTURE')),
  from_point INTEGER,
  to_point INTEGER,
  captured_point INTEGER,
  notation TEXT NOT NULL,
  board_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_game_move_number UNIQUE (game_id, move_number)
);

CREATE INDEX IF NOT EXISTS idx_game_moves_game ON public.game_moves(game_id, move_number ASC);

-- =============================================================================
-- 9. TOURNAMENTS & PARTICIPANTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  variant TEXT NOT NULL CHECK (variant IN ('MILLS_3', 'MILLS_6', 'MILLS_9')),
  time_control TEXT NOT NULL CHECK (time_control IN ('UNTIMED', '3_MIN', '5_MIN', '10_MIN')),
  type TEXT NOT NULL DEFAULT 'ARENA' CHECK (type IN ('ARENA', 'SWISS', 'SINGLE_ELIM')),
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'REGISTRATION', 'LIVE', 'FINISHED', 'CANCELLED')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 128,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
  draws INTEGER NOT NULL DEFAULT 0 CHECK (draws >= 0),
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_tournament_player UNIQUE (tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_players_score ON public.tournament_players(tournament_id, score DESC);

-- =============================================================================
-- 10. NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('challenge', 'friend_request', 'tournament', 'system')),
  action_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- =============================================================================
-- 11. CHAT MESSAGES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_message_length CHECK (char_length(message) >= 1 AND char_length(message) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_game ON public.chat_messages(game_id, created_at ASC);

-- =============================================================================
-- 12. DATABASE FUNCTIONS & TRIGGERS
-- =============================================================================

-- Automatic Profile and Initial 1200 Rating Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_display_name TEXT;
BEGIN
  -- Extract or generate username
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'player_' || SUBSTRING(NEW.id::text, 1, 8)
  );

  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    v_username
  );

  -- Insert profile
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    v_username,
    v_display_name,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Insert baseline 1200 rating across all 3 variants
  INSERT INTO public.ratings (user_id, variant, rating, peak_rating)
  VALUES
    (NEW.id, 'MILLS_3', 1200, 1200),
    (NEW.id, 'MILLS_6', 1200, 1200),
    (NEW.id, 'MILLS_9', 1200, 1200);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atomic Server-Side ELO Rating Update after a Finished Ranked Game
CREATE OR REPLACE FUNCTION public.update_ratings_after_game(p_game_id UUID)
RETURNS VOID AS $$
DECLARE
  v_game RECORD;
  v_white RECORD;
  v_black RECORD;
  v_k CONSTANT INTEGER := 32; -- Standard ELO K-factor
  v_expected_white NUMERIC;
  v_expected_black NUMERIC;
  v_actual_white NUMERIC;
  v_actual_black NUMERIC;
  v_white_change INTEGER;
  v_black_change INTEGER;
BEGIN
  -- Fetch finished game
  SELECT * INTO v_game FROM public.games WHERE id = p_game_id AND status = 'FINISHED' AND mode = 'RANKED';
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Fetch White and Black player records
  SELECT gp.*, r.rating, r.games_played, r.wins, r.losses, r.draws, r.peak_rating
  INTO v_white
  FROM public.game_players gp
  JOIN public.ratings r ON r.user_id = gp.user_id AND r.variant = v_game.variant
  WHERE gp.game_id = p_game_id AND gp.color = 'WHITE';

  SELECT gp.*, r.rating, r.games_played, r.wins, r.losses, r.draws, r.peak_rating
  INTO v_black
  FROM public.game_players gp
  JOIN public.ratings r ON r.user_id = gp.user_id AND r.variant = v_game.variant
  WHERE gp.game_id = p_game_id AND gp.color = 'BLACK';

  IF v_white.id IS NULL OR v_black.id IS NULL THEN
    RETURN;
  END IF;

  -- Calculate expected scores
  v_expected_white := 1.0 / (1.0 + POWER(10.0, (v_black.rating - v_white.rating)::NUMERIC / 400.0));
  v_expected_black := 1.0 - v_expected_white;

  -- Determine actual scores based on game result
  IF v_game.winner = 'WHITE' THEN
    v_actual_white := 1.0;
    v_actual_black := 0.0;
  ELSIF v_game.winner = 'BLACK' THEN
    v_actual_white := 0.0;
    v_actual_black := 1.0;
  ELSE
    v_actual_white := 0.5;
    v_actual_black := 0.5;
  END IF;

  -- Compute integer rating change
  v_white_change := ROUND(v_k * (v_actual_white - v_expected_white));
  v_black_change := ROUND(v_k * (v_actual_black - v_expected_black));

  -- Update game_players records
  UPDATE public.game_players
  SET rating_before = v_white.rating, rating_change = v_white_change, rating_after = v_white.rating + v_white_change
  WHERE game_id = p_game_id AND color = 'WHITE';

  UPDATE public.game_players
  SET rating_before = v_black.rating, rating_change = v_black_change, rating_after = v_black.rating + v_black_change
  WHERE game_id = p_game_id AND color = 'BLACK';

  -- Update ratings table for White
  UPDATE public.ratings
  SET
    rating = rating + v_white_change,
    games_played = games_played + 1,
    wins = wins + CASE WHEN v_game.winner = 'WHITE' THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN v_game.winner = 'BLACK' THEN 1 ELSE 0 END,
    draws = draws + CASE WHEN v_game.winner IS NULL THEN 1 ELSE 0 END,
    peak_rating = GREATEST(peak_rating, rating + v_white_change),
    updated_at = now()
  WHERE user_id = v_white.user_id AND variant = v_game.variant;

  -- Update ratings table for Black
  UPDATE public.ratings
  SET
    rating = rating + v_black_change,
    games_played = games_played + 1,
    wins = wins + CASE WHEN v_game.winner = 'BLACK' THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN v_game.winner = 'WHITE' THEN 1 ELSE 0 END,
    draws = draws + CASE WHEN v_game.winner IS NULL THEN 1 ELSE 0 END,
    peak_rating = GREATEST(peak_rating, rating + v_black_change),
    updated_at = now()
  WHERE user_id = v_black.user_id AND variant = v_game.variant;

  -- Record rating history
  INSERT INTO public.rating_history (user_id, game_id, variant, rating_before, rating_change, rating_after)
  VALUES
    (v_white.user_id, p_game_id, v_game.variant, v_white.rating, v_white_change, v_white.rating + v_white_change),
    (v_black.user_id, p_game_id, v_game.variant, v_black.rating, v_black_change, v_black.rating + v_black_change);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Ratings Policies (Public read, triggers update only)
CREATE POLICY "Ratings are publicly readable"
  ON public.ratings FOR SELECT
  USING (true);

-- Rating History Policies
CREATE POLICY "Rating history is publicly readable"
  ON public.rating_history FOR SELECT
  USING (true);

-- Friendships Policies
CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friend requests"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend Challenges Policies
CREATE POLICY "Users can view challenges they sent or received"
  ON public.friend_challenges FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send challenges"
  ON public.friend_challenges FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Participants can update challenge status"
  ON public.friend_challenges FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Games Policies
CREATE POLICY "Public games and completed games are readable by all"
  ON public.games FOR SELECT
  USING (mode != 'PRIVATE' OR status = 'FINISHED' OR EXISTS (
    SELECT 1 FROM public.game_players gp WHERE gp.game_id = games.id AND gp.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create games"
  ON public.games FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Game players can update active games"
  ON public.games FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.game_players gp WHERE gp.game_id = games.id AND gp.user_id = auth.uid()
  ));

-- Game Players Policies
CREATE POLICY "Game players are readable by all"
  ON public.game_players FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join games as players"
  ON public.game_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Game Moves Policies
CREATE POLICY "Game moves are readable by all viewers"
  ON public.game_moves FOR SELECT
  USING (true);

CREATE POLICY "Active player can record moves"
  ON public.game_moves FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.game_id = game_moves.game_id
      AND gp.user_id = auth.uid()
      AND gp.color = game_moves.player_color
  ));

-- Tournaments Policies
CREATE POLICY "Tournaments are publicly readable"
  ON public.tournaments FOR SELECT
  USING (true);

CREATE POLICY "Tournament standings are publicly readable"
  ON public.tournament_players FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can register for tournaments"
  ON public.tournament_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can leave registered tournaments before start"
  ON public.tournament_players FOR DELETE
  USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can read their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications (mark read)"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Chat Messages Policies
CREATE POLICY "Game players can view their game chat"
  ON public.chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.game_players gp WHERE gp.game_id = chat_messages.game_id AND gp.user_id = auth.uid()
  ));

CREATE POLICY "Game players can post chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.game_players gp WHERE gp.game_id = chat_messages.game_id AND gp.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 14. MATCHMAKING QUEUE TABLE & POLICIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('MILLS_3', 'MILLS_6', 'MILLS_9')),
  mode TEXT NOT NULL DEFAULT 'RANKED' CHECK (mode IN ('RANKED', 'CASUAL')),
  time_control TEXT NOT NULL CHECK (time_control IN ('UNTIMED', '3_MIN', '5_MIN', '10_MIN')),
  rating INTEGER NOT NULL DEFAULT 1200,
  status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'cancelled')),
  matched_game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_matchmaking_queue_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_lookup
  ON public.matchmaking_queue (variant, mode, time_control, status, created_at);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_user
  ON public.matchmaking_queue (user_id);

ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own queue entry"
  ON public.matchmaking_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queue entry"
  ON public.matchmaking_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue entry"
  ON public.matchmaking_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue entry"
  ON public.matchmaking_queue FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 15. RPC FUNCTIONS FOR USERNAME & MATCHMAKING
-- =============================================================================

-- A. Check username availability (case-insensitive)
CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_clean TEXT;
BEGIN
  IF p_username IS NULL THEN
    RETURN false;
  END IF;

  v_clean := TRIM(p_username);
  IF char_length(v_clean) < 3 OR char_length(v_clean) > 20 THEN
    RETURN false;
  END IF;

  IF NOT (v_clean ~ '^[a-zA-Z0-9]+$') THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(v_clean)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Set username for authenticated user
CREATE OR REPLACE FUNCTION public.set_user_username(p_username TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_clean TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_clean := TRIM(p_username);
  IF char_length(v_clean) < 3 OR char_length(v_clean) > 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username must be between 3 and 20 characters.');
  END IF;

  IF NOT (v_clean ~ '^[a-zA-Z0-9]+$') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username can only contain letters A-Z and numbers 0-9.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE LOWER(username) = LOWER(v_clean) AND id != v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username already taken');
  END IF;

  UPDATE public.profiles
  SET username = v_clean,
      display_name = COALESCE(NULLIF(display_name, ''), v_clean),
      is_username_set = true,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'username', v_clean);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Atomic Matchmaking Queue Joining and Match Pair Creation
CREATE OR REPLACE FUNCTION public.join_or_match_queue(
  p_variant TEXT,
  p_mode TEXT,
  p_time_control TEXT,
  p_rating_tolerance INTEGER DEFAULT 75
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_rating INTEGER;
  v_opponent RECORD;
  v_game_id UUID;
  v_white_id UUID;
  v_black_id UUID;
  v_white_rating INTEGER;
  v_black_rating INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Not authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id, username, display_name, is_username_set)
    VALUES (v_user_id, 'player_' || SUBSTRING(v_user_id::text, 1, 8), 'Player', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  SELECT rating INTO v_user_rating
  FROM public.ratings
  WHERE user_id = v_user_id AND variant = p_variant;

  IF v_user_rating IS NULL THEN
    v_user_rating := 1200;
    INSERT INTO public.ratings (user_id, variant, rating, peak_rating)
    VALUES (v_user_id, p_variant, 1200, 1200)
    ON CONFLICT (user_id, variant) DO NOTHING;
  END IF;

  SELECT matched_game_id INTO v_game_id
  FROM public.matchmaking_queue
  WHERE user_id = v_user_id AND status = 'matched' AND matched_game_id IS NOT NULL;

  IF v_game_id IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'matched', 'game_id', v_game_id);
  END IF;

  SELECT * INTO v_opponent
  FROM public.matchmaking_queue
  WHERE variant = p_variant
    AND mode = p_mode
    AND time_control = p_time_control
    AND status = 'searching'
    AND user_id != v_user_id
    AND (p_mode = 'CASUAL' OR ABS(rating - v_user_rating) <= p_rating_tolerance)
    AND updated_at > now() - INTERVAL '60 seconds'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_opponent.id IS NOT NULL THEN
    IF random() < 0.5 THEN
      v_white_id := v_user_id;
      v_white_rating := v_user_rating;
      v_black_id := v_opponent.user_id;
      v_black_rating := v_opponent.rating;
    ELSE
      v_white_id := v_opponent.user_id;
      v_white_rating := v_opponent.rating;
      v_black_id := v_user_id;
      v_black_rating := v_user_rating;
    END IF;

    INSERT INTO public.games (
      variant, mode, time_control, status,
      white_player_id, black_player_id, current_player,
      started_at, created_at
    )
    VALUES (
      p_variant, p_mode, p_time_control, 'PLACING',
      v_white_id, v_black_id, 'WHITE',
      now(), now()
    )
    RETURNING id INTO v_game_id;

    INSERT INTO public.game_players (game_id, user_id, color, rating_before)
    VALUES
      (v_game_id, v_white_id, 'WHITE', v_white_rating),
      (v_game_id, v_black_id, 'BLACK', v_black_rating)
    ON CONFLICT DO NOTHING;

    UPDATE public.matchmaking_queue
    SET status = 'matched', matched_game_id = v_game_id, updated_at = now()
    WHERE id = v_opponent.id;

    INSERT INTO public.matchmaking_queue (
      user_id, variant, mode, time_control, rating, status, matched_game_id, updated_at
    )
    VALUES (
      v_user_id, p_variant, p_mode, p_time_control, v_user_rating, 'matched', v_game_id, now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET status = 'matched', matched_game_id = v_game_id, updated_at = now();

    RETURN jsonb_build_object(
      'status', 'matched',
      'game_id', v_game_id,
      'opponent_id', v_opponent.user_id
    );
  END IF;

  INSERT INTO public.matchmaking_queue (
    user_id, variant, mode, time_control, rating, status, updated_at
  )
  VALUES (
    v_user_id, p_variant, p_mode, p_time_control, v_user_rating, 'searching', now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET variant = p_variant,
      mode = p_mode,
      time_control = p_time_control,
      rating = v_user_rating,
      status = 'searching',
      matched_game_id = NULL,
      updated_at = now();

  RETURN jsonb_build_object(
    'status', 'searching',
    'rating', v_user_rating,
    'tolerance', p_rating_tolerance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Poll Queue Status
CREATE OR REPLACE FUNCTION public.poll_queue_status()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_entry RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Not authenticated');
  END IF;

  SELECT * INTO v_entry
  FROM public.matchmaking_queue
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'idle');
  END IF;

  IF v_entry.status = 'searching' THEN
    UPDATE public.matchmaking_queue
    SET updated_at = now()
    WHERE user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'status', v_entry.status,
    'game_id', v_entry.matched_game_id,
    'variant', v_entry.variant,
    'mode', v_entry.mode
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Cancel Queue
CREATE OR REPLACE FUNCTION public.cancel_queue()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  DELETE FROM public.matchmaking_queue
  WHERE user_id = v_user_id AND status = 'searching';

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- F. Atomic & Idempotent Game Finalization with ELO Update
CREATE OR REPLACE FUNCTION public.finish_game_and_update_ratings(
  p_game_id UUID,
  p_winner TEXT,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_game RECORD;
  v_white RECORD;
  v_black RECORD;
  v_k CONSTANT INTEGER := 32;
  v_expected_white NUMERIC;
  v_expected_black NUMERIC;
  v_actual_white NUMERIC;
  v_actual_black NUMERIC;
  v_white_change INTEGER := 0;
  v_black_change INTEGER := 0;
BEGIN
  SELECT * INTO v_game
  FROM public.games
  WHERE id = p_game_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Game not found');
  END IF;

  IF v_game.ratings_processed = true THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Already processed',
      'ratings_processed', true
    );
  END IF;

  UPDATE public.games
  SET status = 'FINISHED',
      winner = p_winner,
      winner_id = CASE
        WHEN p_winner = 'WHITE' THEN white_player_id
        WHEN p_winner = 'BLACK' THEN black_player_id
        ELSE NULL
      END,
      win_reason = p_reason,
      ended_at = now(),
      ratings_processed = true
  WHERE id = p_game_id;

  DELETE FROM public.matchmaking_queue
  WHERE matched_game_id = p_game_id;

  IF v_game.mode = 'RANKED' AND v_game.white_player_id IS NOT NULL AND v_game.black_player_id IS NOT NULL THEN
    SELECT * INTO v_white
    FROM public.ratings
    WHERE user_id = v_game.white_player_id AND variant = v_game.variant
    FOR UPDATE;

    SELECT * INTO v_black
    FROM public.ratings
    WHERE user_id = v_game.black_player_id AND variant = v_game.variant
    FOR UPDATE;

    IF v_white.id IS NOT NULL AND v_black.id IS NOT NULL THEN
      v_expected_white := 1.0 / (1.0 + POWER(10.0, (v_black.rating - v_white.rating)::NUMERIC / 400.0));
      v_expected_black := 1.0 - v_expected_white;

      IF p_winner = 'WHITE' THEN
        v_actual_white := 1.0;
        v_actual_black := 0.0;
      ELSIF p_winner = 'BLACK' THEN
        v_actual_white := 0.0;
        v_actual_black := 1.0;
      ELSE
        v_actual_white := 0.5;
        v_actual_black := 0.5;
      END IF;

      v_white_change := ROUND(v_k * (v_actual_white - v_expected_white));
      v_black_change := ROUND(v_k * (v_actual_black - v_expected_black));

      UPDATE public.ratings
      SET rating = rating + v_white_change,
          games_played = games_played + 1,
          wins = wins + CASE WHEN p_winner = 'WHITE' THEN 1 ELSE 0 END,
          losses = losses + CASE WHEN p_winner = 'BLACK' THEN 1 ELSE 0 END,
          draws = draws + CASE WHEN p_winner IS NULL THEN 1 ELSE 0 END,
          peak_rating = GREATEST(peak_rating, rating + v_white_change),
          updated_at = now()
      WHERE id = v_white.id;

      UPDATE public.ratings
      SET rating = rating + v_black_change,
          games_played = games_played + 1,
          wins = wins + CASE WHEN p_winner = 'BLACK' THEN 1 ELSE 0 END,
          losses = losses + CASE WHEN p_winner = 'WHITE' THEN 1 ELSE 0 END,
          draws = draws + CASE WHEN p_winner IS NULL THEN 1 ELSE 0 END,
          peak_rating = GREATEST(peak_rating, rating + v_black_change),
          updated_at = now()
      WHERE id = v_black.id;

      INSERT INTO public.rating_history (user_id, game_id, variant, rating_before, rating_change, rating_after)
      VALUES
        (v_game.white_player_id, p_game_id, v_game.variant, v_white.rating, v_white_change, v_white.rating + v_white_change),
        (v_game.black_player_id, p_game_id, v_game.variant, v_black.rating, v_black_change, v_black.rating + v_black_change);

      UPDATE public.game_players
      SET rating_before = v_white.rating, rating_change = v_white_change, rating_after = v_white.rating + v_white_change
      WHERE game_id = p_game_id AND color = 'WHITE';

      UPDATE public.game_players
      SET rating_before = v_black.rating, rating_change = v_black_change, rating_after = v_black.rating + v_black_change
      WHERE game_id = p_game_id AND color = 'BLACK';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'game_id', p_game_id,
    'winner', p_winner,
    'white_change', v_white_change,
    'black_change', v_black_change
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

