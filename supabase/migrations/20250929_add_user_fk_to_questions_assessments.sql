-- Ensure user_id FK and indexes on questions and assessments (idempotent)
-- Date: 2025-09-29

DO $$
BEGIN
  -- Ensure questions.user_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.questions ADD COLUMN user_id UUID;
  END IF;

  -- Ensure assessments.user_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN user_id UUID;
  END IF;

  -- Create indexes if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'idx_questions_user'
  ) THEN
    CREATE INDEX idx_questions_user ON public.questions(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'idx_assessments_user'
  ) THEN
    CREATE INDEX idx_assessments_user ON public.assessments(user_id);
  END IF;

  -- Add foreign key constraints to profiles if profiles exists and constraints missing
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    -- questions FK
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public' AND tc.table_name = 'questions' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id'
    ) THEN
      ALTER TABLE public.questions ADD CONSTRAINT fk_questions_user_id_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- assessments FK
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public' AND tc.table_name = 'assessments' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id'
    ) THEN
      ALTER TABLE public.assessments ADD CONSTRAINT fk_assessments_user_id_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
  END IF;
END$$;
