-- Drop unused columns from categories and assessments (idempotent)
-- Date: 2025-09-29

DO $$
BEGIN
  -- Drop description from categories if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.categories DROP COLUMN IF EXISTS description;
  END IF;

  -- Drop description, pdf_filename and pdf_url from assessments if exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.assessments DROP COLUMN IF EXISTS description;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'pdf_filename'
  ) THEN
    ALTER TABLE public.assessments DROP COLUMN IF EXISTS pdf_filename;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE public.assessments DROP COLUMN IF EXISTS pdf_url;
  END IF;
END$$;
