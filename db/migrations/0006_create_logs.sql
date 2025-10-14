-- Migration: 0006_create_logs
-- Description: Create logs table (action logging for analytics)
-- Dependencies: 0001_create_enums (action_type)
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    -- User identification (nullable for anonymous actions)
    user_id UUID,
    -- Action details
    action action_type NOT NULL,
    details JSONB,
    -- Timestamp
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_logs_user_id ON logs (user_id);

CREATE INDEX idx_logs_action ON logs (action);

CREATE INDEX idx_logs_created_at ON logs (created_at DESC);

-- Comments
COMMENT ON TABLE logs IS 'Action logs for analytics and tracking';

COMMENT ON COLUMN logs.id IS 'Primary key (UUID)';

COMMENT ON COLUMN logs.user_id IS 'User who performed the action (nullable for anonymous)';

COMMENT ON COLUMN logs.action IS 'Type of action performed';

COMMENT ON COLUMN logs.details IS 'Additional action details as JSONB';

COMMENT ON COLUMN logs.created_at IS 'Action timestamp';
