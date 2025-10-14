-- Migration: 0003_create_profiles
-- Description: Create profiles table (user profiles with subscription and limits)
-- Dependencies: 0001_create_enums (question_type), 0002_create_academic_levels
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
    -- User identification
    user_id UUID NOT NULL UNIQUE,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    full_name VARCHAR(255),
    email VARCHAR(320) NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP
    WITH
      TIME ZONE,
      -- Stripe integration (only IDs stored, subscription data cached in Redis)
      stripe_customer_id VARCHAR(255) UNIQUE,
      stripe_subscription_id VARCHAR(255),
      -- User preferences
      academic_level_id INTEGER REFERENCES academic_levels (id) ON DELETE SET NULL,
      allowed_cookies TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      selected_question_types question_type[] NOT NULL DEFAULT ARRAY[]::question_type[],
      question_types_updated_at TIMESTAMP
    WITH
      TIME ZONE,
      -- Timestamps
      created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles (user_id);

CREATE INDEX idx_profiles_email ON profiles (email);

CREATE INDEX idx_profiles_stripe_customer_id ON profiles (stripe_customer_id);

CREATE INDEX idx_profiles_academic_level_id ON profiles (academic_level_id);

-- Comments
COMMENT ON TABLE profiles IS 'User profiles with Stripe integration and preferences';

COMMENT ON COLUMN profiles.id IS 'Primary key (UUID)';

COMMENT ON COLUMN profiles.user_id IS 'Supabase auth user ID (unique)';

COMMENT ON COLUMN profiles.is_admin IS 'Admin flag for elevated permissions';

COMMENT ON COLUMN profiles.full_name IS 'User full name (optional)';

COMMENT ON COLUMN profiles.email IS 'User email address (unique)';

COMMENT ON COLUMN profiles.email_verified IS 'Email verification status';

COMMENT ON COLUMN profiles.email_verified_at IS 'Email verification timestamp';

COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID (unique)';

COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Active Stripe subscription ID';

COMMENT ON COLUMN profiles.academic_level_id IS 'Foreign key to academic_levels table';

COMMENT ON COLUMN profiles.allowed_cookies IS 'Array of allowed cookie types';

COMMENT ON COLUMN profiles.selected_question_types IS 'User-selected question types (limited by plan)';

COMMENT ON COLUMN profiles.question_types_updated_at IS 'Last time question types were updated';

COMMENT ON COLUMN profiles.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN profiles.updated_at IS 'Record last update timestamp';
