-- Migration: 0004_create_assessments
-- Description: Create assessments table (user-created assessments/exams)
-- Dependencies: 0003_create_profiles
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
    -- Owner (references profiles table)
    user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    -- Assessment metadata
    subject VARCHAR(255) NOT NULL,
    title VARCHAR(1024),
    -- Timestamps
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_assessments_user_id ON assessments (user_id);

CREATE INDEX idx_assessments_created_at ON assessments (created_at DESC);

-- Comments
COMMENT ON TABLE assessments IS 'User-created assessments (exams, tests, quizzes)';

COMMENT ON COLUMN assessments.id IS 'Primary key (UUID)';

COMMENT ON COLUMN assessments.user_id IS 'Reference to profile that owns this assessment';

COMMENT ON COLUMN assessments.subject IS 'Assessment subject/topic';

COMMENT ON COLUMN assessments.title IS 'Assessment title (optional)';

COMMENT ON COLUMN assessments.created_at IS 'Assessment creation timestamp';
