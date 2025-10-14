-- Migration: 0008_create_profile_logs_cycle
-- Description: Create profile_logs_cycle table (monthly usage tracking per user)
-- Dependencies: 0003_create_profiles
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS profile_logs_cycle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    -- User reference
    profile_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    -- Cycle identification
    cycle_month INTEGER NOT NULL,
    cycle_year INTEGER NOT NULL,
    -- Usage counters
    questions_created INTEGER NOT NULL DEFAULT 0,
    assessments_created INTEGER NOT NULL DEFAULT 0,
    -- Timestamp
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      -- Unique constraint: one record per user per month/year
      UNIQUE (profile_id, cycle_month, cycle_year)
  );

-- Indexes
CREATE INDEX idx_profile_logs_cycle_profile_id ON profile_logs_cycle (profile_id);

CREATE INDEX idx_profile_logs_cycle_date ON profile_logs_cycle (cycle_year DESC, cycle_month DESC);

-- Comments
COMMENT ON TABLE profile_logs_cycle IS 'Monthly usage tracking per user (questions and assessments created)';

COMMENT ON COLUMN profile_logs_cycle.id IS 'Primary key (UUID)';

COMMENT ON COLUMN profile_logs_cycle.profile_id IS 'Reference to user profile';

COMMENT ON COLUMN profile_logs_cycle.cycle_month IS 'Month of the cycle (1-12)';

COMMENT ON COLUMN profile_logs_cycle.cycle_year IS 'Year of the cycle';

COMMENT ON COLUMN profile_logs_cycle.questions_created IS 'Number of questions created in this cycle';

COMMENT ON COLUMN profile_logs_cycle.assessments_created IS 'Number of assessments created in this cycle';

COMMENT ON COLUMN profile_logs_cycle.created_at IS 'Record creation timestamp';
