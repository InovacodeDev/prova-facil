-- Add user_id column to answers table (idempotent)
-- Date: 2025-09-29

DO $$
BEGIN
  -- only add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'answers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.answers
      ADD COLUMN user_id UUID;
  END IF;

  -- Create index for faster queries by user
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'idx_answers_user'
  ) THEN
    CREATE INDEX idx_answers_user ON public.answers(user_id);
  END IF;
END$$;

-- Ensure foreign key to users (profiles) if profiles table exists and column not already constrained
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    -- add FK constraint only if not present
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public' AND tc.table_name = 'answers' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id'
    ) THEN
      ALTER TABLE public.answers
        ADD CONSTRAINT fk_answers_user_id_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
  END IF;
END$$;
