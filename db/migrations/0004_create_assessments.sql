-- Migration: 0004_create_assessments
-- Description: Create assessments table (user-created assessments/exams)
-- Dependencies: 0003_create_profiles
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    -- Assessment metadata
    title TEXT NOT NULL,
    description TEXT,
    -- Owner
    profile_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    -- Timestamps
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_assessments_profile_id ON assessments (profile_id);

CREATE INDEX idx_assessments_created_at ON assessments (created_at DESC);

-- Comments
COMMENT ON TABLE assessments IS 'User-created assessments (exams, tests, quizzes)';

COMMENT ON COLUMN assessments.id IS 'Primary key (UUID)';

COMMENT ON COLUMN assessments.title IS 'Assessment title';

COMMENT ON COLUMN assessments.description IS 'Assessment description (optional)';

COMMENT ON COLUMN assessments.profile_id IS 'Reference to profile that owns this assessment';

COMMENT ON COLUMN assessments.created_at IS 'Assessment creation timestamp';

COMMENT ON COLUMN assessments.updated_at IS 'Assessment last update timestamp';
