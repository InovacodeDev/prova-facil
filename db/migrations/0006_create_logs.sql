-- Migration: 0006_create_logs
-- Description: Create logs table (action logging for analytics)
-- Dependencies: 0001_create_enums (action_type)
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
    -- Action details
    action action_type NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_logs_action ON logs (action);

-- Comments
COMMENT ON TABLE logs IS 'Action logs for analytics and tracking';

COMMENT ON COLUMN logs.id IS 'Primary key (UUID)';

COMMENT ON COLUMN logs.action IS 'Type of action performed';

COMMENT ON COLUMN logs.count IS 'Counter for this action type';

COMMENT ON COLUMN logs.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN logs.updated_at IS 'Record last update timestamp';
