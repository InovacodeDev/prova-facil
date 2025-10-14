-- Migration: 0005_create_questions
-- Description: Create questions table (AI-generated questions within assessments)
-- Dependencies: 0001_create_enums (question_type, question_context, academic_level), 0004_create_assessments
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    -- Question content
    question_text TEXT NOT NULL,
    correct_answer TEXT,
    explanation TEXT,
    metadata JSONB,
    ai_metadata JSONB,
    -- Question classification
    question_type question_type NOT NULL DEFAULT 'multiple_choice',
    question_context question_context NOT NULL DEFAULT 'fixacao',
    academic_level academic_level NOT NULL DEFAULT 'none',
    -- Parent assessment
    assessment_id UUID NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
    -- Timestamps
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_questions_assessment_id ON questions (assessment_id);

CREATE INDEX idx_questions_question_type ON questions (question_type);

CREATE INDEX idx_questions_question_context ON questions (question_context);

CREATE INDEX idx_questions_academic_level ON questions (academic_level);

CREATE INDEX idx_questions_created_at ON questions (created_at DESC);

-- Comments
COMMENT ON TABLE questions IS 'AI-generated questions within assessments';

COMMENT ON COLUMN questions.id IS 'Primary key (UUID)';

COMMENT ON COLUMN questions.question_text IS 'The actual question text/prompt';

COMMENT ON COLUMN questions.correct_answer IS 'The correct answer (if applicable)';

COMMENT ON COLUMN questions.explanation IS 'Explanation for the correct answer';

COMMENT ON COLUMN questions.metadata IS 'Additional question metadata (options, answers, etc.) as JSONB';

COMMENT ON COLUMN questions.ai_metadata IS 'AI generation metadata (model, prompt, etc.) as JSONB';

COMMENT ON COLUMN questions.question_type IS 'Type of question (multiple_choice, true_false, etc.)';

COMMENT ON COLUMN questions.question_context IS 'Context or style of question (fixacao, contextualizada, etc.)';

COMMENT ON COLUMN questions.academic_level IS 'Academic level this question is designed for';

COMMENT ON COLUMN questions.assessment_id IS 'Reference to parent assessment';

COMMENT ON COLUMN questions.created_at IS 'Question creation timestamp';

COMMENT ON COLUMN questions.updated_at IS 'Question last update timestamp';
