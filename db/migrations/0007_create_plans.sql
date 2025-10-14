-- Migration: 0007_create_plans
-- Description: Create plans table (plan configurations)
-- Dependencies: 0001_create_enums (plan, support_type_enum)
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS plans (
    id plan PRIMARY KEY NOT NULL,
    -- Plan features
    model VARCHAR(255) NOT NULL,
    questions_month INTEGER NOT NULL DEFAULT 30,
    doc_type TEXT[] NOT NULL,
    docs_size INTEGER NOT NULL DEFAULT 10,
    max_question_types INTEGER NOT NULL DEFAULT 1,
    support support_type_enum[] NOT NULL,
    -- Timestamps
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_plans_id ON plans (id);

-- Comments
COMMENT ON TABLE plans IS 'Plan configurations and features';

COMMENT ON COLUMN plans.id IS 'Primary key (plan enum)';

COMMENT ON COLUMN plans.model IS 'AI model name for this plan';

COMMENT ON COLUMN plans.questions_month IS 'Monthly questions limit';

COMMENT ON COLUMN plans.doc_type IS 'Array of supported document types';

COMMENT ON COLUMN plans.docs_size IS 'Maximum document size in MB';

COMMENT ON COLUMN plans.max_question_types IS 'Maximum number of question types allowed';

COMMENT ON COLUMN plans.support IS 'Array of support types included';

COMMENT ON COLUMN plans.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN plans.updated_at IS 'Record last update timestamp';

COMMENT ON COLUMN plans.created_at IS 'Plan configuration creation timestamp';

COMMENT ON COLUMN plans.updated_at IS 'Plan configuration last update timestamp';
