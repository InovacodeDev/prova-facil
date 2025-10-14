-- Migration: 0002_create_academic_levels
-- Description: Create academic_levels table (stores academic level configurations)
-- Dependencies: 0001_create_enums (academic_level, question_type, question_context)
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS academic_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    -- Academic level identifier
    level academic_level NOT NULL UNIQUE,
    -- Allowed question types and contexts (stored as JSONB arrays)
    allowed_question_types JSONB NOT NULL DEFAULT '[]',
    allowed_question_contexts JSONB NOT NULL DEFAULT '[]',
    -- Timestamps
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_academic_levels_level ON academic_levels (level);

-- Comments
COMMENT ON TABLE academic_levels IS 'Stores academic level configurations and allowed question types/contexts';

COMMENT ON COLUMN academic_levels.id IS 'Primary key (UUID)';

COMMENT ON COLUMN academic_levels.level IS 'Academic level identifier (unique)';

COMMENT ON COLUMN academic_levels.allowed_question_types IS 'Array of allowed question types for this academic level (JSONB)';

COMMENT ON COLUMN academic_levels.allowed_question_contexts IS 'Array of allowed question contexts for this academic level (JSONB)';

COMMENT ON COLUMN academic_levels.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN academic_levels.updated_at IS 'Record last update timestamp';
