-- Migration: 0003_create_profiles
-- Description: Create profiles table (user profiles with subscription and limits)
-- Dependencies: 0001_create_enums (plan, academic_level), 0002_create_academic_levels
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    -- User identification
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    -- Subscription plan
    plan plan NOT NULL DEFAULT 'starter',
    plan_created_at TIMESTAMP
    WITH
      TIME ZONE,
      plan_ends_at TIMESTAMP
    WITH
      TIME ZONE,
      plan_stripe_price_id TEXT,
      plan_period TEXT,
      -- Stripe integration
      stripe_customer_id TEXT UNIQUE,
      stripe_subscription_id TEXT UNIQUE,
      -- Usage limits and counters
      questions_limit INTEGER NOT NULL DEFAULT 100,
      assessments_limit INTEGER NOT NULL DEFAULT 100,
      daily_questions_limit INTEGER NOT NULL DEFAULT 10,
      copilot_questions_limit INTEGER NOT NULL DEFAULT 10,
      questions_count INTEGER NOT NULL DEFAULT 0,
      assessments_count INTEGER NOT NULL DEFAULT 0,
      daily_questions_count INTEGER NOT NULL DEFAULT 0,
      copilot_questions_count INTEGER NOT NULL DEFAULT 0,
      -- Last reset timestamps
      last_daily_reset TIMESTAMP
    WITH
      TIME ZONE,
      last_copilot_reset TIMESTAMP
    WITH
      TIME ZONE,
      -- User preferences
      academic_level_id UUID REFERENCES academic_levels (id) ON DELETE SET NULL,
      -- Timestamps
      created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_profiles_email ON profiles (email);

CREATE INDEX idx_profiles_plan ON profiles (plan);

CREATE INDEX idx_profiles_stripe_customer_id ON profiles (stripe_customer_id);

CREATE INDEX idx_profiles_stripe_subscription_id ON profiles (stripe_subscription_id);

CREATE INDEX idx_profiles_academic_level_id ON profiles (academic_level_id);

-- Comments
COMMENT ON TABLE profiles IS 'User profiles with subscription plans and usage limits';

COMMENT ON COLUMN profiles.id IS 'Primary key (UUID, matches Supabase auth.users.id)';

COMMENT ON COLUMN profiles.email IS 'User email address (unique)';

COMMENT ON COLUMN profiles.full_name IS 'User full name';

COMMENT ON COLUMN profiles.plan IS 'Current subscription plan';

COMMENT ON COLUMN profiles.plan_created_at IS 'When the current plan was activated';

COMMENT ON COLUMN profiles.plan_ends_at IS 'When the current plan expires';

COMMENT ON COLUMN profiles.plan_stripe_price_id IS 'Stripe price ID for current plan';

COMMENT ON COLUMN profiles.plan_period IS 'Billing period (monthly/yearly)';

COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID (unique)';

COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID (unique)';

COMMENT ON COLUMN profiles.questions_limit IS 'Total questions allowed in current period';

COMMENT ON COLUMN profiles.assessments_limit IS 'Total assessments allowed in current period';

COMMENT ON COLUMN profiles.daily_questions_limit IS 'Daily questions generation limit';

COMMENT ON COLUMN profiles.copilot_questions_limit IS 'AI copilot questions limit';

COMMENT ON COLUMN profiles.questions_count IS 'Current questions used count';

COMMENT ON COLUMN profiles.assessments_count IS 'Current assessments used count';

COMMENT ON COLUMN profiles.daily_questions_count IS 'Current daily questions count';

COMMENT ON COLUMN profiles.copilot_questions_count IS 'Current copilot questions count';

COMMENT ON COLUMN profiles.last_daily_reset IS 'Last time daily counter was reset';

COMMENT ON COLUMN profiles.last_copilot_reset IS 'Last time copilot counter was reset';

COMMENT ON COLUMN profiles.academic_level_id IS 'Reference to user academic level preference';

COMMENT ON COLUMN profiles.created_at IS 'Profile creation timestamp';

COMMENT ON COLUMN profiles.updated_at IS 'Profile last update timestamp';
