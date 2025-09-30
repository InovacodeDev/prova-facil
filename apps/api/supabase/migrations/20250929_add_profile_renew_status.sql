-- Add profile.renew_status enum and column (idempotent)
-- Date: 2025-09-29
-- Adds a `renew_status` column to public.profiles using an enum type
-- Values: 'monthly', 'canceled', 'annually', 'trial' (US spelling 'annually')

-- Create enum type if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_renew_status_enum') THEN
    CREATE TYPE profile_renew_status_enum AS ENUM ('monthly', 'canceled', 'annually', 'trial');
  END IF;
END$$;

-- Ensure all enum values exist (safe if type already exists)
DO $$
BEGIN
  BEGIN
    ALTER TYPE profile_renew_status_enum ADD VALUE 'monthly';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TYPE profile_renew_status_enum ADD VALUE 'canceled';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TYPE profile_renew_status_enum ADD VALUE 'annually';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TYPE profile_renew_status_enum ADD VALUE 'trial';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END$$;

-- Add or convert column on profiles to use the enum
DO $$
DECLARE
  current_type TEXT;
BEGIN
  -- If column doesn't exist, add it with default 'trial'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'renew_status'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN renew_status profile_renew_status_enum DEFAULT 'trial'::profile_renew_status_enum;
  ELSE
    -- If the column exists, check its type
    SELECT t.typname INTO current_type
    FROM pg_attribute a
    JOIN pg_type t ON a.atttypid = t.oid
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'profiles' AND a.attname = 'renew_status' AND n.nspname = 'public'
    LIMIT 1;

    IF current_type IS DISTINCT FROM 'profile_renew_status_enum' THEN
      -- Convert using a safe mapping: keep known values, fallback to 'trial'
      ALTER TABLE public.profiles
        ALTER COLUMN renew_status TYPE profile_renew_status_enum
        USING (
          CASE
            WHEN renew_status IN ('monthly','canceled','annually','trial') THEN renew_status::profile_renew_status_enum
            ELSE 'trial'::profile_renew_status_enum
          END
        );
      -- Ensure default is set
      ALTER TABLE public.profiles ALTER COLUMN renew_status SET DEFAULT 'trial'::profile_renew_status_enum;
    END IF;
  END IF;
END$$;

-- Create index for renew_status if useful for queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'idx_profiles_renew_status'
  ) THEN
    CREATE INDEX idx_profiles_renew_status ON public.profiles(renew_status);
  END IF;
END$$;
