-- Migration: 0008_create_profile_logs_cycle
-- Description: Create profile_logs_cycle table (monthly usage tracking per user)
-- Dependencies: 0003_create_profiles
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS profile_logs_cycle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
    -- User reference
    user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    -- Cycle identification (format: YYYY-MM)
    cycle VARCHAR(7) NOT NULL,
    -- Usage tracking
    total_questions INTEGER NOT NULL DEFAULT 0,
    subjects_breakdown JSONB NOT NULL DEFAULT '[]', -- Array of {subject: string, count: number}
    -- Timestamps
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_profile_logs_cycle_user_id ON profile_logs_cycle (user_id);

CREATE INDEX idx_profile_logs_cycle_cycle ON profile_logs_cycle (cycle);

-- Comments
COMMENT ON TABLE profile_logs_cycle IS 'Monthly usage tracking per user';

COMMENT ON COLUMN profile_logs_cycle.id IS 'Primary key (UUID)';

COMMENT ON COLUMN profile_logs_cycle.user_id IS 'Reference to user profile';

COMMENT ON COLUMN profile_logs_cycle.cycle IS 'Cycle in format YYYY-MM';

COMMENT ON COLUMN profile_logs_cycle.total_questions IS 'Total questions created in this cycle';

COMMENT ON COLUMN profile_logs_cycle.subjects_breakdown IS 'Breakdown of questions by subject (JSONB array)';

COMMENT ON COLUMN profile_logs_cycle.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN profile_logs_cycle.updated_at IS 'Record last update timestamp';
