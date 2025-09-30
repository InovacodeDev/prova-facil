-- Add assessments table and link questions to assessments

ALTER TABLE IF EXISTS public.questions
  ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL;

-- If assessments table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure index for user_id on assessments for fast lookup
CREATE INDEX IF NOT EXISTS idx_assessments_user ON public.assessments(user_id);
