-- Migration: 0002_create_academic_levels
-- Description: Create academic_levels table (stores academic level configurations)
-- Dependencies: 0001_create_enums (academic_level, question_type, question_context)
-- Created: 2025-10-13
CREATE TABLE
  IF NOT EXISTS academic_levels (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    -- Academic level identifier
    name academic_level NOT NULL UNIQUE,
    -- Allowed question types and contexts (stored as enum arrays)
    allowed_question_types question_type[] NOT NULL,
    allowed_question_context question_context[] NOT NULL,
    -- Description
    description TEXT,
    -- Timestamps
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

-- Indexes
CREATE INDEX idx_academic_levels_name ON academic_levels (name);

-- Comments
COMMENT ON TABLE academic_levels IS 'Stores academic level configurations and allowed question types/contexts';

COMMENT ON COLUMN academic_levels.id IS 'Primary key (INTEGER with IDENTITY)';

COMMENT ON COLUMN academic_levels.name IS 'Academic level identifier (unique)';

COMMENT ON COLUMN academic_levels.allowed_question_types IS 'Array of allowed question types for this academic level (enum array)';

COMMENT ON COLUMN academic_levels.allowed_question_context IS 'Array of allowed question contexts for this academic level (enum array)';

COMMENT ON COLUMN academic_levels.description IS 'Optional description of the academic level';

COMMENT ON COLUMN academic_levels.created_at IS 'Record creation timestamp';
