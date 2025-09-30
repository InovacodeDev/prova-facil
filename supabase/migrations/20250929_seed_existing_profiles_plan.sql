-- Set NULL or invalid profile plan values to 'starter'
-- Date: 2025-09-29

DO $$
BEGIN
  -- Only run if enum exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_plan_enum') THEN
    -- For safety, if the plan column exists and is of enum type, ensure no nulls
    IF EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan'
    ) THEN
      UPDATE public.profiles SET plan = 'starter' WHERE plan IS NULL;
    END IF;
  END IF;
END
$$;
