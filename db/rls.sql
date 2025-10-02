-- Final RLS policies (owner-based) for the main tables.
-- Nota: em expressões de WITH CHECK/USING, referencie colunas novas por nome (sem NEW).
-- Ajuste nomes/colunas se seu schema for diferente.

-- Enable RLS
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.logs ENABLE ROW LEVEL SECURITY;

-- ================================
-- profiles
-- ================================
DROP POLICY IF EXISTS profiles_select_owner ON public.profiles;
CREATE POLICY profiles_select_owner
  ON public.profiles
  FOR SELECT
  TO public, authenticated
  USING (true);

DROP POLICY IF EXISTS profiles_update_owner ON public.profiles;
CREATE POLICY profiles_update_owner
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_auth ON public.profiles;
CREATE POLICY profiles_insert_auth
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ================================
-- assessments
-- ================================
DROP POLICY IF EXISTS assessments_select_public ON public.assessments;
CREATE POLICY assessments_select_public
  ON public.assessments
  FOR SELECT
  TO public, authenticated
  USING (true);

DROP POLICY IF EXISTS assessments_insert_auth ON public.assessments;
CREATE POLICY assessments_insert_auth
  ON public.assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS assessments_update_owner ON public.assessments;
CREATE POLICY assessments_update_owner
  ON public.assessments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.assessments.user_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS assessments_delete_owner ON public.assessments;
CREATE POLICY assessments_delete_owner
  ON public.assessments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.assessments.user_id AND p.user_id = auth.uid()
    )
  );

-- ================================
-- questions
-- ================================
DROP POLICY IF EXISTS questions_select_public ON public.questions;
CREATE POLICY questions_select_public
  ON public.questions
  FOR SELECT
  TO public, authenticated
  USING (true);

DROP POLICY IF EXISTS questions_insert_owner_check ON public.questions;
CREATE POLICY questions_insert_owner_check
  ON public.questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.profiles p ON p.id = a.user_id
      WHERE a.id = assessment_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS questions_update_owner ON public.questions;
CREATE POLICY questions_update_owner
  ON public.questions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.profiles p ON p.id = a.user_id
      WHERE a.id = public.questions.assessment_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.profiles p ON p.id = a.user_id
      WHERE a.id = assessment_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS questions_delete_owner ON public.questions;
CREATE POLICY questions_delete_owner
  ON public.questions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments a
      JOIN public.profiles p ON p.id = a.user_id
      WHERE a.id = public.questions.assessment_id AND p.user_id = auth.uid()
    )
  );

-- ================================
-- answers
-- ================================
DROP POLICY IF EXISTS answers_select_public ON public.answers;
CREATE POLICY answers_select_public
  ON public.answers
  FOR SELECT
  TO public, authenticated
  USING (true);

DROP POLICY IF EXISTS answers_insert_owner_check ON public.answers;
CREATE POLICY answers_insert_owner_check
  ON public.answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.assessments a ON a.id = q.assessment_id
      JOIN public.profiles p ON p.id = a.user_id
      WHERE q.id = question_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS answers_update_owner ON public.answers;
CREATE POLICY answers_update_owner
  ON public.answers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.assessments a ON a.id = q.assessment_id
      JOIN public.profiles p ON p.id = a.user_id
      WHERE q.id = public.answers.question_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.assessments a ON a.id = q.assessment_id
      JOIN public.profiles p ON p.id = a.user_id
      WHERE q.id = question_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS answers_delete_owner ON public.answers;
CREATE POLICY answers_delete_owner
  ON public.answers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.assessments a ON a.id = q.assessment_id
      JOIN public.profiles p ON p.id = a.user_id
      WHERE q.id = public.answers.question_id AND p.user_id = auth.uid()
    )
  );

-- ================================
-- logs
-- ================================
DROP POLICY IF EXISTS logs_select_public ON public.logs;
CREATE POLICY logs_select_public
  ON public.logs
  FOR SELECT
  TO public, authenticated
  USING (true);

DROP POLICY IF EXISTS logs_insert_auth ON public.logs;
CREATE POLICY logs_insert_auth
  ON public.logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS logs_update_auth ON public.logs;
CREATE POLICY logs_update_auth
  ON public.logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS logs_delete_auth ON public.logs;
CREATE POLICY logs_delete_auth
  ON public.logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ================================
-- academic_levels
-- ================================
ALTER TABLE IF EXISTS public.academic_levels ENABLE ROW LEVEL SECURITY;

-- SELECT: allow public read access (change TO authenticated to require login)
DROP POLICY IF EXISTS academic_levels_select_public ON public.academic_levels;
CREATE POLICY academic_levels_select_public
  ON public.academic_levels
  FOR SELECT
  TO public, authenticated
  USING (true);

-- INSERT: only admins may insert
DROP POLICY IF EXISTS academic_levels_insert_admin ON public.academic_levels;
CREATE POLICY academic_levels_insert_admin
  ON public.academic_levels
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND COALESCE(p.is_admin, false) = true
    )
  );

-- UPDATE: only admins may update
DROP POLICY IF EXISTS academic_levels_update_admin ON public.academic_levels;
CREATE POLICY academic_levels_update_admin
  ON public.academic_levels
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND COALESCE(p.is_admin, false) = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND COALESCE(p.is_admin, false) = true
    )
  );

-- DELETE: only admins may delete
DROP POLICY IF EXISTS academic_levels_delete_admin ON public.academic_levels;
CREATE POLICY academic_levels_delete_admin
  ON public.academic_levels
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND COALESCE(p.is_admin, false) = true
    )
  );

-- ================================
-- plans
-- ================================
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for plans table
-- Allow public read access (anyone can see plan configurations)
CREATE POLICY "Allow public read access to plans"
    ON public.plans
    FOR SELECT
    TO public
    USING (true);

-- Allow admin write access only
CREATE POLICY "Allow admin to manage plans"
    ON public.plans
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Create index for faster lookups
CREATE INDEX idx_plans_id ON public.plans(id);

-- ================================
-- Notes:
-- - Policies use column names directly in WITH CHECK (evaluated against the new row).
-- - USING clauses reference the existing row via public.<table>.<col>.
-- - If you need service-role or admin exceptions, create additional policies for those roles.
-- - After applying, test with an authenticated session (auth.uid()) and the Supabase client.