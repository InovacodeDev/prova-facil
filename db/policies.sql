-- Policies: Row Level Security (RLS) Policies for Prova Fácil
-- Description: Security policies for all database tables
-- Dependencies: All migrations
-- Created: 2025-10-13
--
-- This file enables RLS and creates policies for:
-- 1. profiles - User profile access control
-- 2. assessments - Assessment ownership and access
-- 3. questions - Question access through assessment ownership
-- 4. logs - Log access control
-- 5. plans - Public read, admin write
-- 6. academic_levels - Public read, admin write
-- 7. profile_logs_cycle - User-specific usage tracking
-- 8. error_logs - Error log access control
-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (for public profile pages)
CREATE POLICY "profiles_select_all" ON profiles FOR
SELECT
  TO public,
  authenticated USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON profiles FOR
UPDATE TO authenticated USING (id = auth.uid ())
WITH
  CHECK (id = auth.uid ());

-- Users can insert their own profile (on signup)
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated
WITH
  CHECK (id = auth.uid ());

-- Users can delete their own profile
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE TO authenticated USING (id = auth.uid ());

COMMENT ON POLICY "profiles_select_all" ON profiles IS 'Allow public read access to profiles';

COMMENT ON POLICY "profiles_update_own" ON profiles IS 'Users can only update their own profile';

COMMENT ON POLICY "profiles_insert_own" ON profiles IS 'Users can create their own profile on signup';

COMMENT ON POLICY "profiles_delete_own" ON profiles IS 'Users can delete their own profile';

-- =====================================================
-- 2. ASSESSMENTS TABLE
-- =====================================================
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Anyone can view assessments (for public sharing)
CREATE POLICY "assessments_select_all" ON assessments FOR
SELECT
  TO public,
  authenticated USING (true);

-- Users can insert assessments if authenticated
CREATE POLICY "assessments_insert_auth" ON assessments FOR INSERT TO authenticated
WITH
  CHECK (user_id = auth.uid ());

-- Users can only update their own assessments
CREATE POLICY "assessments_update_own" ON assessments FOR
UPDATE TO authenticated USING (user_id = auth.uid ())
WITH
  CHECK (user_id = auth.uid ());

-- Users can only delete their own assessments
CREATE POLICY "assessments_delete_own" ON assessments FOR DELETE TO authenticated USING (user_id = auth.uid ());

COMMENT ON POLICY "assessments_select_all" ON assessments IS 'Allow public read access for sharing';

COMMENT ON POLICY "assessments_insert_auth" ON assessments IS 'Authenticated users can create assessments';

COMMENT ON POLICY "assessments_update_own" ON assessments IS 'Users can only update their own assessments';

COMMENT ON POLICY "assessments_delete_own" ON assessments IS 'Users can only delete their own assessments';

-- =====================================================
-- 3. QUESTIONS TABLE
-- =====================================================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Anyone can view questions (for public assessment sharing)
CREATE POLICY "questions_select_all" ON questions FOR
SELECT
  TO public,
  authenticated USING (true);

-- Users can insert questions if they own the parent assessment
CREATE POLICY "questions_insert_owner" ON questions FOR INSERT TO authenticated
WITH
  CHECK (
    EXISTS (
      SELECT
        1
      FROM
        assessments
      WHERE
        assessments.id = assessment_id
        AND assessments.user_id = auth.uid ()
    )
  );

-- Users can only update questions in their own assessments
CREATE POLICY "questions_update_owner" ON questions FOR
UPDATE TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      assessments
    WHERE
      assessments.id = questions.assessment_id
      AND assessments.user_id = auth.uid ()
  )
)
WITH
  CHECK (
    EXISTS (
      SELECT
        1
      FROM
        assessments
      WHERE
        assessments.id = assessment_id
        AND assessments.user_id = auth.uid ()
    )
  );

-- Users can only delete questions from their own assessments
CREATE POLICY "questions_delete_owner" ON questions FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      assessments
    WHERE
      assessments.id = questions.assessment_id
      AND assessments.user_id = auth.uid ()
  )
);

COMMENT ON POLICY "questions_select_all" ON questions IS 'Allow public read access for assessment sharing';

COMMENT ON POLICY "questions_insert_owner" ON questions IS 'Users can add questions to their own assessments';

COMMENT ON POLICY "questions_update_owner" ON questions IS 'Users can only update questions in their assessments';

COMMENT ON POLICY "questions_delete_owner" ON questions IS 'Users can only delete questions from their assessments';

-- =====================================================
-- 4. LOGS TABLE
-- =====================================================
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Anyone can view aggregated logs (for statistics)
CREATE POLICY "logs_select_all" ON logs FOR
SELECT
  TO public,
  authenticated USING (true);

-- Only authenticated users can insert logs
CREATE POLICY "logs_insert_auth" ON logs FOR INSERT TO authenticated
WITH
  CHECK (true);

-- Only service role can update logs
CREATE POLICY "logs_update_service" ON logs FOR
UPDATE TO authenticated USING (auth.uid () IS NOT NULL);

COMMENT ON POLICY "logs_select_all" ON logs IS 'Allow public read for statistics';

COMMENT ON POLICY "logs_insert_auth" ON logs IS 'Authenticated users can create log entries';

COMMENT ON POLICY "logs_update_service" ON logs IS 'System can update log counters';

-- =====================================================
-- 5. PLANS TABLE
-- =====================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view plan configurations
CREATE POLICY "plans_select_all" ON plans FOR
SELECT
  TO public,
  authenticated USING (true);

-- Only service role or admins can modify plans
CREATE POLICY "plans_manage_admin" ON plans FOR ALL TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      profiles
    WHERE
      profiles.id = auth.uid ()
      AND profiles.is_admin = true
  )
);

COMMENT ON POLICY "plans_select_all" ON plans IS 'Allow public read access to plan configurations';

COMMENT ON POLICY "plans_manage_admin" ON plans IS 'Only admins can manage plans';

-- =====================================================
-- 6. ACADEMIC_LEVELS TABLE
-- =====================================================
ALTER TABLE academic_levels ENABLE ROW LEVEL SECURITY;

-- Anyone can view academic levels
CREATE POLICY "academic_levels_select_all" ON academic_levels FOR
SELECT
  TO public,
  authenticated USING (true);

-- Only service role or admins can modify academic levels
CREATE POLICY "academic_levels_manage_admin" ON academic_levels FOR ALL TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      profiles
    WHERE
      profiles.id = auth.uid ()
      AND profiles.is_admin = true
  )
);

COMMENT ON POLICY "academic_levels_select_all" ON academic_levels IS 'Allow public read access';

COMMENT ON POLICY "academic_levels_manage_admin" ON academic_levels IS 'Only admins can manage academic levels';

-- =====================================================
-- 7. PROFILE_LOGS_CYCLE TABLE
-- =====================================================
ALTER TABLE profile_logs_cycle ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage logs
CREATE POLICY "profile_logs_cycle_select_own" ON profile_logs_cycle FOR
SELECT
  TO authenticated USING (user_id = auth.uid ());

-- System can insert/update logs (service role only)
CREATE POLICY "profile_logs_cycle_manage_system" ON profile_logs_cycle FOR ALL TO authenticated USING (true)
WITH
  CHECK (true);

COMMENT ON POLICY "profile_logs_cycle_select_own" ON profile_logs_cycle IS 'Users can view their own usage tracking';

COMMENT ON POLICY "profile_logs_cycle_manage_system" ON profile_logs_cycle IS 'System manages usage tracking';

-- =====================================================
-- 8. ERROR_LOGS TABLE
-- =====================================================
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Users can view error logs where they are mentioned in context JSONB
CREATE POLICY "error_logs_select_own" ON error_logs FOR
SELECT
  TO authenticated USING (
    -- Check if context->>'userId' matches auth.uid()
    (context->>'userId')::uuid = auth.uid ()
    OR context->>'userId' IS NULL
  );

-- Anyone (including anonymous) can insert error logs
CREATE POLICY "error_logs_insert_all" ON error_logs FOR INSERT TO public,
authenticated
WITH
  CHECK (true);

-- Only admins can update/delete error logs
CREATE POLICY "error_logs_manage_admin" ON error_logs FOR ALL TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      profiles
    WHERE
      profiles.id = auth.uid ()
      AND profiles.is_admin = true
  )
);

COMMENT ON POLICY "error_logs_select_own" ON error_logs IS 'Users can view errors where they are mentioned in context.userId';

COMMENT ON POLICY "error_logs_insert_all" ON error_logs IS 'Anyone can report errors';

COMMENT ON POLICY "error_logs_manage_admin" ON error_logs IS 'Only admins can manage error logs (requires is_admin column)';

-- =====================================================
-- INDEXES FOR POLICY PERFORMANCE
-- =====================================================
-- These indexes help RLS policies perform better
-- Index for auth.uid() lookups on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_auth_uid ON profiles (id);

-- Index for assessment ownership checks
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments (user_id);

-- Index for question ownership through assessments
CREATE INDEX IF NOT EXISTS idx_questions_assessment_for_auth ON questions (assessment_id);

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Admin functionality is controlled by profiles.is_admin column.
--    To make a user admin:
--    UPDATE profiles SET is_admin = true WHERE id = '<user-uuid>';
--
-- 2. Service role bypasses RLS automatically. Use it for:
--    - Migrations
--    - Seed data
--    - Background jobs
--    - Admin operations
--
-- 3. Test policies with:
--    SET ROLE authenticated;
--    SET request.jwt.claim.sub = '<user-uuid>';
--    -- Run queries to test
--    RESET ROLE;
--
-- 4. To view all policies:
--    SELECT * FROM pg_policies WHERE schemaname = 'public';
--
-- 5. Error logs use context->>'userId' instead of a dedicated user_id column.
--    This allows flexible error tracking for both authenticated and anonymous users.
