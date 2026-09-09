-- =============================================================================
-- MILLS ONLINE MULTIPLAYER - MATCHMAKING QUEUE & AUTH MIGRATION
-- =============================================================================

-- 1. Ensure profiles table supports strict username onboarding and Google OAuth
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_username_set BOOLEAN NOT NULL DEFAULT false;

-- Update constraints for strict alphanumeric username (3 to 20 chars, NO symbols)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS username_length_check;
ALTER TABLE public.profiles ADD CONSTRAINT username_length_check CHECK (char_length(username) >= 3 AND char_length(username) <= 20);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS username_format_check;
ALTER TABLE public.profiles ADD CONSTRAINT username_format_check CHECK (username ~ '^[a-zA-Z0-9]+$' OR username LIKE 'player_%');

-- Case-insensitive unique index on LOWER(username)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (LOWER(username));

-- 2. Ensure games table supports player references and idempotent completion
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS white_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS black_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_fen TEXT,
  ADD COLUMN IF NOT EXISTS moves_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ratings_processed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS white_rating_change INTEGER,
  ADD COLUMN IF NOT EXISTS black_rating_change INTEGER;

CREATE INDEX IF NOT EXISTS idx_games_white_player ON public.games(white_player_id);
CREATE INDEX IF NOT EXISTS idx_games_black_player ON public.games(black_player_id);

-- 3. Matchmaking Queue Table
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

-- Enable RLS on matchmaking_queue
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own queue entry" ON public.matchmaking_queue;
CREATE POLICY "Users can view their own queue entry"
  ON public.matchmaking_queue FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own queue entry" ON public.matchmaking_queue;
CREATE POLICY "Users can insert their own queue entry"
  ON public.matchmaking_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own queue entry" ON public.matchmaking_queue;
CREATE POLICY "Users can update their own queue entry"
  ON public.matchmaking_queue FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own queue entry" ON public.matchmaking_queue;
CREATE POLICY "Users can delete their own queue entry"
  ON public.matchmaking_queue FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 4. SERVER-SIDE RPC FUNCTIONS
-- =============================================================================

-- A. Check if a username is available (case-insensitive)
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

  -- Ensure profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id, username, display_name, is_username_set)
    VALUES (v_user_id, 'player_' || SUBSTRING(v_user_id::text, 1, 8), 'Player', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Fetch user rating for variant
  SELECT rating INTO v_user_rating
  FROM public.ratings
  WHERE user_id = v_user_id AND variant = p_variant;

  IF v_user_rating IS NULL THEN
    v_user_rating := 1200;
    INSERT INTO public.ratings (user_id, variant, rating, peak_rating)
    VALUES (v_user_id, p_variant, 1200, 1200)
    ON CONFLICT (user_id, variant) DO NOTHING;
  END IF;

  -- Check if user is already matched in an existing entry
  SELECT matched_game_id INTO v_game_id
  FROM public.matchmaking_queue
  WHERE user_id = v_user_id AND status = 'matched' AND matched_game_id IS NOT NULL;

  IF v_game_id IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'matched', 'game_id', v_game_id);
  END IF;

  -- Attempt to find and atomically claim a waiting opponent
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

  -- If compatible opponent found, create game record atomically
  IF v_opponent.id IS NOT NULL THEN
    -- Assign colors randomly (50% chance)
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

    -- Record players in game_players table
    INSERT INTO public.game_players (game_id, user_id, color, rating_before)
    VALUES
      (v_game_id, v_white_id, 'WHITE', v_white_rating),
      (v_game_id, v_black_id, 'BLACK', v_black_rating)
    ON CONFLICT DO NOTHING;

    -- Update opponent queue entry as matched
    UPDATE public.matchmaking_queue
    SET status = 'matched', matched_game_id = v_game_id, updated_at = now()
    WHERE id = v_opponent.id;

    -- Update current user entry as matched
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

  -- No opponent found right now: register in queue
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

-- D. Poll Queue Status (Heartbeat & Match Confirmation)
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

  -- Keep searching entry alive
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
  -- Atomically claim game
  SELECT * INTO v_game
  FROM public.games
  WHERE id = p_game_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Game not found');
  END IF;

  -- Prevent duplicate rating updates (idempotent)
  IF v_game.ratings_processed = true THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Already processed',
      'ratings_processed', true,
      'white_change', COALESCE(v_game.white_rating_change, 0),
      'black_change', COALESCE(v_game.black_rating_change, 0)
    );
  END IF;

  -- Update game record
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

  -- Clean up matched queue entries
  DELETE FROM public.matchmaking_queue
  WHERE matched_game_id = p_game_id;

  -- If ranked game, update Elo ratings atomically
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

      -- Update White rating
      UPDATE public.ratings
      SET rating = rating + v_white_change,
          games_played = games_played + 1,
          wins = wins + CASE WHEN p_winner = 'WHITE' THEN 1 ELSE 0 END,
          losses = losses + CASE WHEN p_winner = 'BLACK' THEN 1 ELSE 0 END,
          draws = draws + CASE WHEN p_winner IS NULL THEN 1 ELSE 0 END,
          peak_rating = GREATEST(peak_rating, rating + v_white_change),
          updated_at = now()
      WHERE id = v_white.id;

      -- Update Black rating
      UPDATE public.ratings
      SET rating = rating + v_black_change,
          games_played = games_played + 1,
          wins = wins + CASE WHEN p_winner = 'BLACK' THEN 1 ELSE 0 END,
          losses = losses + CASE WHEN p_winner = 'WHITE' THEN 1 ELSE 0 END,
          draws = draws + CASE WHEN p_winner IS NULL THEN 1 ELSE 0 END,
          peak_rating = GREATEST(peak_rating, rating + v_black_change),
          updated_at = now()
      WHERE id = v_black.id;

      -- Insert into rating history
      INSERT INTO public.rating_history (user_id, game_id, variant, rating_before, rating_change, rating_after)
      VALUES
        (v_game.white_player_id, p_game_id, v_game.variant, v_white.rating, v_white_change, v_white.rating + v_white_change),
        (v_game.black_player_id, p_game_id, v_game.variant, v_black.rating, v_black_change, v_black.rating + v_black_change);

      -- Update game_players table
      UPDATE public.game_players
      SET rating_before = v_white.rating, rating_change = v_white_change, rating_after = v_white.rating + v_white_change
      WHERE game_id = p_game_id AND color = 'WHITE';

      UPDATE public.game_players
      SET rating_before = v_black.rating, rating_change = v_black_change, rating_after = v_black.rating + v_black_change
      WHERE game_id = p_game_id AND color = 'BLACK';

      -- Persist rating changes to games row for quick retrieval
      UPDATE public.games
      SET white_rating_change = v_white_change,
          black_rating_change = v_black_change
      WHERE id = p_game_id;
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
