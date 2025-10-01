ALTER TYPE public.action_type ADD VALUE IF NOT EXISTS 'unique_assessments';

ALTER TYPE public.action_type ADD VALUE IF NOT EXISTS 'mean_questions_per_assessment';

INSERT INTO
  public.logs (action, count, created_at, updated_at)
VALUES
  ('unique_assessments', 0, NOW (), NOW ()),
  (
    'mean_questions_per_assessment',
    0,
    NOW (),
    NOW ()
  );