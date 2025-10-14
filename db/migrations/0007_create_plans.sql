-- Migration: 0007_create_plans
-- Description: Create plans table (plan configurations and pricing)
-- Dependencies: 0001_create_enums (plan, support_type_enum)
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    -- Plan identification
    name plan NOT NULL UNIQUE,
    -- Plan features
    price NUMERIC(10, 2) NOT NULL,
    questions_limit INTEGER NOT NULL,
    assessments_limit INTEGER NOT NULL,
    daily_questions_limit INTEGER NOT NULL,
    copilot_questions_limit INTEGER NOT NULL,
    support_type support_type_enum NOT NULL,
    -- Additional features (stored as JSONB array)
    features JSONB NOT NULL DEFAULT '[]',
    -- Timestamps
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_plans_name ON plans (name);

-- Comments
COMMENT ON TABLE plans IS 'Plan configurations, features, and pricing';

COMMENT ON COLUMN plans.id IS 'Primary key (UUID)';

COMMENT ON COLUMN plans.name IS 'Plan identifier (unique)';

COMMENT ON COLUMN plans.price IS 'Plan price (monthly)';

COMMENT ON COLUMN plans.questions_limit IS 'Total questions allowed per billing period';

COMMENT ON COLUMN plans.assessments_limit IS 'Total assessments allowed per billing period';

COMMENT ON COLUMN plans.daily_questions_limit IS 'Daily questions generation limit';

COMMENT ON COLUMN plans.copilot_questions_limit IS 'AI copilot questions limit';

COMMENT ON COLUMN plans.support_type IS 'Type of customer support included';

COMMENT ON COLUMN plans.features IS 'Array of additional features as JSONB';

COMMENT ON COLUMN plans.created_at IS 'Plan configuration creation timestamp';

COMMENT ON COLUMN plans.updated_at IS 'Plan configuration last update timestamp';
