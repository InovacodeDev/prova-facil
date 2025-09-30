
-- Ensure an ENUM type for profile plans exists and migrate the profiles.plan column to use it.
-- This script is idempotent and will safely convert an existing text column into the
-- enum by mapping unknown values to the default 'starter'.
-- Date: 2025-09-29

DO $$
BEGIN
  -- 1) Create enum type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_plan_enum') THEN
    CREATE TYPE profile_plan_enum AS ENUM ('starter','basic','essentials','plus','advanced');
  END IF;

  -- 2) If the profiles table doesn't have `plan`, add it with the enum type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN plan profile_plan_enum DEFAULT 'starter';
  ELSE
    -- If it exists but is not the enum type, convert it safely
    IF (SELECT udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan') != 'profile_plan_enum' THEN
      -- add temporary enum column
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_new profile_plan_enum DEFAULT 'starter';
      -- copy values mapping any unknown/invalid values to 'starter'
      UPDATE public.profiles SET plan_new = CASE
        WHEN plan::text IN ('starter','basic','essentials','plus','advanced') THEN plan::text::profile_plan_enum
        ELSE 'starter'::profile_plan_enum
      END;
      -- drop old column and rename
      ALTER TABLE public.profiles DROP COLUMN plan;
      ALTER TABLE public.profiles RENAME COLUMN plan_new TO plan;
    END IF;
  END IF;

  -- 3) Ensure plan_expire_at exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan_expire_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN plan_expire_at TIMESTAMPTZ;
  END IF;

  -- 4) Ensure index on user_id exists (idempotent)
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_profiles_user_id') THEN
    CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
  END IF;
END
$$;
