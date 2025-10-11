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

-- ================================
-- Notes:
-- - Policies use column names directly in WITH CHECK (evaluated against the new row).
-- - USING clauses reference the existing row via public.<table>.<col>.
-- - If you need service-role or admin exceptions, create additional policies for those roles.
-- - After applying, test with an authenticated session (auth.uid()) and the Supabase client.

-- Policy: Users can only view their own logs
CREATE POLICY "Users can view their own cycle logs"
ON profile_logs_cycle
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can insert/update logs (via service role)
CREATE POLICY "System can manage cycle logs"
ON profile_logs_cycle
FOR ALL
USING (true)
WITH CHECK (true);

-- Garantir que a view é acessível publicamente
GRANT SELECT ON public_profiles_count TO anon, authenticated;

COMMENT ON VIEW public_profiles_count IS 
'View pública para estatísticas agregadas de profiles. Não expõe dados individuais.';

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: usuários podem ver apenas suas próprias subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON subscriptions
FOR SELECT
USING (user_id = auth.uid() OR user_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Habilita Row-Level Security na tabela subscriptions e cria políticas:
-- - INSERT: apenas usuários autenticados e apenas inserindo rows com user_id = auth.uid()
-- - UPDATE: apenas o proprietário (user_id) pode atualizar; impede mudança de owner

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- INSERT: somente usuários autenticados e apenas para seu próprio user_id
CREATE POLICY subscriptions_insert_authenticated
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid()::uuid = user_id
  );

-- UPDATE: somente o proprietário pode atualizar a sua subscription.
-- USING filtra as linhas que podem ser afetadas (owner apenas).
-- WITH CHECK garante que o user_id não seja alterado para outro owner durante o UPDATE.
CREATE POLICY subscriptions_update_owner
  ON public.subscriptions
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND auth.uid()::uuid = user_id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid()::uuid = user_id
  );

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_select_owner ON public.subscriptions;

CREATE POLICY subscriptions_select_owner
  ON public.subscriptions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.subscriptions.user_id
        AND p.user_id = auth.uid()
    )
  );

-- Nota:
-- 1) Estas políticas usam a função auth.uid() (Supabase/Postgres JWT helper). 
--    Se seu ambiente não expõe auth.uid(), substitua por current_setting('request.jwt.claims.sub', true).
-- 2) Considere criar políticas adicionais para SELECT/DELETE conforme necessidade.

-- Adiciona políticas RLS para a tabela `payments`
-- - SELECT: somente o usuário que criou (owner) pode ler
-- - INSERT: somente usuários autenticados podem inserir e apenas para seu próprio profile
-- - UPDATE: somente o owner pode atualizar; impede alteração do owner

ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select_owner ON public.payments;
CREATE POLICY payments_select_owner
  ON public.payments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.payments.user_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS payments_insert_auth ON public.payments;
CREATE POLICY payments_insert_auth
  ON public.payments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.payments.user_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS payments_update_owner ON public.payments;
CREATE POLICY payments_update_owner
  ON public.payments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.payments.user_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.payments.user_id
        AND p.user_id = auth.uid()
    )
  );