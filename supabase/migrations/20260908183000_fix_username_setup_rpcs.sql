-- =============================================================================
-- FIX SUPABASE USERNAME SETUP, ATOMIC RPCS, AND PROFILES SCHEMA
-- =============================================================================

-- 1. Ensure public.profiles table has is_username_set column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_username_set BOOLEAN NOT NULL DEFAULT false;

-- Mark any existing non-default usernames as already set
UPDATE public.profiles
SET is_username_set = true
WHERE username IS NOT NULL
  AND username NOT LIKE 'player_%'
  AND username ~ '^[a-zA-Z0-9]{3,20}$';

-- 2. Update username constraints on profiles
-- Update length constraint to 3-20 characters
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS username_length_check;
ALTER TABLE public.profiles ADD CONSTRAINT username_length_check
  CHECK (char_length(username) >= 3 AND char_length(username) <= 20);

-- Update format constraint: alphanumeric only, or initial default player_xxxx
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS username_format_check;
ALTER TABLE public.profiles ADD CONSTRAINT username_format_check
  CHECK (username ~ '^[a-zA-Z0-9]+$' OR username LIKE 'player_%');

-- Case-insensitive unique index on LOWER(username)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (LOWER(username));

-- 3. Ensure Row Level Security (RLS) policies on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. RPC: check_username_available
-- Checks if a username meets all criteria and is not taken by another user
CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_clean TEXT;
  v_current_user_id UUID;
BEGIN
  IF p_username IS NULL THEN
    RETURN false;
  END IF;

  v_clean := TRIM(p_username);

  -- Minimum 3, Maximum 20 characters
  IF char_length(v_clean) < 3 OR char_length(v_clean) > 20 THEN
    RETURN false;
  END IF;

  -- Letters A-Z/a-z and numbers 0-9 only (no spaces, punctuation, symbols, emojis)
  IF NOT (v_clean ~ '^[a-zA-Z0-9]+$') THEN
    RETURN false;
  END IF;

  -- Get current authenticated user (if any)
  v_current_user_id := auth.uid();

  -- Case-insensitive availability check
  -- Available if no OTHER profile exists with this username
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE LOWER(username) = LOWER(v_clean)
      AND (v_current_user_id IS NULL OR id != v_current_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT) TO anon, authenticated, service_role;

-- 5. RPC: set_user_username
-- Atomically assigns a unique, case-insensitive username to the authenticated caller
CREATE OR REPLACE FUNCTION public.set_user_username(p_username TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_clean TEXT;
BEGIN
  -- Strict requirement: operates on authenticated user only, never client-supplied ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required. Please sign in.'
    );
  END IF;

  IF p_username IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Username cannot be empty.'
    );
  END IF;

  v_clean := TRIM(p_username);

  -- Validate length (3 to 20 chars)
  IF char_length(v_clean) < 3 OR char_length(v_clean) > 20 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Username must be between 3 and 20 characters.'
    );
  END IF;

  -- Validate format: letters A-Z, a-z, numbers 0-9 only
  IF NOT (v_clean ~ '^[a-zA-Z0-9]+$') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only alphanumeric characters (A-Z, a-z, 0-9) are allowed.'
    );
  END IF;

  -- Prevent race conditions: acquire advisory transaction lock on username hash
  PERFORM pg_advisory_xact_lock(hashtext('mills_username_' || LOWER(v_clean)));

  -- Case-insensitive check if taken by another user
  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE LOWER(username) = LOWER(v_clean)
      AND id != v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Username is already taken. Please pick another.'
    );
  END IF;

  -- Update profile record atomically
  UPDATE public.profiles
  SET username = v_clean,
      display_name = CASE
        WHEN display_name IS NULL OR display_name = '' OR display_name LIKE 'player_%' THEN v_clean
        ELSE display_name
      END,
      is_username_set = true,
      updated_at = now()
  WHERE id = v_user_id;

  -- If profile row was missing, upsert it
  IF NOT FOUND THEN
    INSERT INTO public.profiles (
      id,
      username,
      display_name,
      is_username_set,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      v_clean,
      v_clean,
      true,
      now(),
      now()
    );
  END IF;

  -- Synchronize auth.users raw_user_meta_data so session has updated username
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'username', v_clean,
    'display_name', v_clean
  )
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'username', v_clean
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.set_user_username(TEXT) TO authenticated, service_role;
