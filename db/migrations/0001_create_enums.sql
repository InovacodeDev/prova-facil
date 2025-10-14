-- Migration: 0001_create_enums
-- Description: Create all ENUM types used across the database
-- Created: 2025-10-13
-- Plan enum
CREATE TYPE plan AS ENUM (
  'starter',
  'basic',
  'essentials',
  'plus',
  'advanced'
);

-- Support type enum
CREATE TYPE support_type_enum AS ENUM ('email', 'whatsapp', 'vip');

-- Question type enum
CREATE TYPE question_type AS ENUM (
  'multiple_choice',
  'true_false',
  'open',
  'sum',
  'fill_in_the_blank',
  'matching_columns',
  'problem_solving',
  'essay',
  'project_based',
  'gamified',
  'summative'
);

-- Question context enum
CREATE TYPE question_context AS ENUM (
  'fixacao',
  'contextualizada',
  'teorica',
  'estudo_caso',
  'discursiva_aberta',
  'letra_lei',
  'pesquisa'
);

-- Action type enum
CREATE TYPE action_type AS ENUM (
  'create_new_questions',
  'new_questions',
  'copy_question',
  'unique_assessments',
  'mean_questions_per_assessment'
);

-- Academic level enum
CREATE TYPE academic_level AS ENUM (
  'elementary_school',
  'middle_school',
  'high_school',
  'technical',
  'undergraduate',
  'specialization',
  'mba',
  'masters',
  'doctorate',
  'postdoctoral',
  'extension',
  'language_course',
  'none'
);

-- Error level enum
CREATE TYPE error_level AS ENUM ('error', 'warn', 'fatal', 'info');

-- Comments
COMMENT ON TYPE plan IS 'Available subscription plans';

COMMENT ON TYPE support_type_enum IS 'Types of customer support available';

COMMENT ON TYPE question_type IS 'Types of questions that can be generated';

COMMENT ON TYPE question_context IS 'Context or style of questions';

COMMENT ON TYPE action_type IS 'Types of actions logged in the system';

COMMENT ON TYPE academic_level IS 'Academic education levels';

COMMENT ON TYPE error_level IS 'Severity levels for error logging';
