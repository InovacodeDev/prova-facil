-- Migration: 0005_create_questions
-- Description: Create questions table (AI-generated questions within assessments)
-- Dependencies: 0001_create_enums (question_type), 0004_create_assessments
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
    -- Parent assessment
    assessment_id UUID REFERENCES assessments (id) ON DELETE CASCADE,
    -- Question classification
    type question_type NOT NULL DEFAULT 'multiple_choice',
    -- Question content
    question VARCHAR(8192) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Copy tracking
    copy_count INTEGER NOT NULL DEFAULT 0,
    copy_last_at TIMESTAMP
    WITH
      TIME ZONE,
      -- Timestamps
      created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_questions_assessment_id ON questions (assessment_id);

CREATE INDEX idx_questions_type ON questions (type);

CREATE INDEX idx_questions_created_at ON questions (created_at DESC);

-- Comments
COMMENT ON TABLE questions IS 'AI-generated questions within assessments';

COMMENT ON COLUMN questions.id IS 'Primary key (UUID)';

COMMENT ON COLUMN questions.assessment_id IS 'Reference to parent assessment (nullable for standalone questions)';

COMMENT ON COLUMN questions.type IS 'Question type (multiple_choice, true_false, etc.)';

COMMENT ON COLUMN questions.question IS 'The actual question text/prompt';

COMMENT ON COLUMN questions.metadata IS 'Question metadata (options, answer, etc.) as JSONB';

COMMENT ON COLUMN questions.copy_count IS 'Number of times this question was copied';

COMMENT ON COLUMN questions.copy_last_at IS 'Last time this question was copied';

COMMENT ON COLUMN questions.created_at IS 'Question creation timestamp';

COMMENT ON COLUMN questions.created_at IS 'Question creation timestamp';

COMMENT ON COLUMN questions.updated_at IS 'Question last update timestamp';
