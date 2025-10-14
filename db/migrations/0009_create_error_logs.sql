-- Migration: 0009_create_error_logs
-- Description: Create error_logs table (application error tracking)
-- Dependencies: 0001_create_enums (error_level)
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
    -- Error details
    message TEXT NOT NULL,
    stack TEXT,
    level error_level NOT NULL DEFAULT 'error',
    context JSONB, -- {userId?, endpoint?, method?, userAgent?, etc}
    -- Timestamp
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_error_logs_level ON error_logs (level);

CREATE INDEX idx_error_logs_created_at ON error_logs (created_at DESC);

-- Comments
COMMENT ON TABLE error_logs IS 'Application error tracking and logging';

COMMENT ON COLUMN error_logs.id IS 'Primary key (UUID)';

COMMENT ON COLUMN error_logs.message IS 'Error message';

COMMENT ON COLUMN error_logs.stack IS 'Error stack trace (optional)';

COMMENT ON COLUMN error_logs.level IS 'Error severity level';

COMMENT ON COLUMN error_logs.context IS 'Additional error context as JSONB (userId, endpoint, method, userAgent, etc.)';

COMMENT ON COLUMN error_logs.created_at IS 'Error timestamp';
