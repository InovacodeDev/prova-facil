-- Inserts: Initial Data for Prova Fácil
-- Description: Seed data for plans and academic levels
-- Dependencies: 0007_create_plans, 0002_create_academic_levels
-- Created: 2025-10-13
-- Updated: 2025-10-13 (Aligned with schema.ts structure)
--
-- This file contains:
-- 1. Plan configurations (5 plans: Starter, Basic, Essentials, Plus, Advanced)
-- 2. Academic level configurations (13 levels with allowed question types/contexts)
--
-- IMPORTANT: This file can be run multiple times safely (idempotent)
-- ON CONFLICT clauses will update existing records instead of failing

-- =====================================================
-- 1. PLANS (5 subscription tiers)
-- =====================================================
-- Note: Schema uses 'id' as plan enum (PRIMARY KEY), not 'name'

-- Starter Plan (FREE)
INSERT INTO plans (
    id,
    model,
    questions_month,
    doc_type,
    docs_size,
    max_question_types,
    support
) VALUES (
    'starter',
    'gemini-2.5-flash-lite',
    30,
    ARRAY['txt', 'docx', 'text'],
    10,
    1,
    ARRAY['email']::support_type_enum[]
)
ON CONFLICT (id)
DO UPDATE SET
    model = EXCLUDED.model,
    questions_month = EXCLUDED.questions_month,
    doc_type = EXCLUDED.doc_type,
    docs_size = EXCLUDED.docs_size,
    max_question_types = EXCLUDED.max_question_types,
    support = EXCLUDED.support,
    updated_at = CURRENT_TIMESTAMP;

-- Basic Plan (R$ 29,90/mês)
INSERT INTO plans (
    id,
    model,
    questions_month,
    doc_type,
    docs_size,
    max_question_types,
    support
) VALUES (
    'basic',
    'gemini-2.5-flash-lite',
    75,
    ARRAY['txt', 'docx', 'text'],
    20,
    2,
    ARRAY['email']::support_type_enum[]
)
ON CONFLICT (id)
DO UPDATE SET
    model = EXCLUDED.model,
    questions_month = EXCLUDED.questions_month,
    doc_type = EXCLUDED.doc_type,
    docs_size = EXCLUDED.docs_size,
    max_question_types = EXCLUDED.max_question_types,
    support = EXCLUDED.support,
    updated_at = CURRENT_TIMESTAMP;

-- Essentials Plan (R$ 49,90/mês)
INSERT INTO plans (
    id,
    model,
    questions_month,
    doc_type,
    docs_size,
    max_question_types,
    support
) VALUES (
    'essentials',
    'gemini-2.5-flash',
    150,
    ARRAY['txt', 'docx', 'pdf', 'link', 'text'],
    30,
    3,
    ARRAY['email', 'whatsapp']::support_type_enum[]
)
ON CONFLICT (id)
DO UPDATE SET
    model = EXCLUDED.model,
    questions_month = EXCLUDED.questions_month,
    doc_type = EXCLUDED.doc_type,
    docs_size = EXCLUDED.docs_size,
    max_question_types = EXCLUDED.max_question_types,
    support = EXCLUDED.support,
    updated_at = CURRENT_TIMESTAMP;

-- Plus Plan (R$ 79,90/mês)
INSERT INTO plans (
    id,
    model,
    questions_month,
    doc_type,
    docs_size,
    max_question_types,
    support
) VALUES (
    'plus',
    'gemini-2.5-flash',
    250,
    ARRAY['txt', 'docx', 'pdf', 'link', 'text'],
    40,
    4,
    ARRAY['email', 'whatsapp', 'vip']::support_type_enum[]
)
ON CONFLICT (id)
DO UPDATE SET
    model = EXCLUDED.model,
    questions_month = EXCLUDED.questions_month,
    doc_type = EXCLUDED.doc_type,
    docs_size = EXCLUDED.docs_size,
    max_question_types = EXCLUDED.max_question_types,
    support = EXCLUDED.support,
    updated_at = CURRENT_TIMESTAMP;

-- Advanced Plan (R$ 129,90/mês)
INSERT INTO plans (
    id,
    model,
    questions_month,
    doc_type,
    docs_size,
    max_question_types,
    support
) VALUES (
    'advanced',
    'gemini-2.5-pro',
    300,
    ARRAY['txt', 'docx', 'pdf', 'pptx', 'link', 'text'],
    100,
    6,
    ARRAY['email', 'whatsapp', 'vip']::support_type_enum[]
)
ON CONFLICT (id)
DO UPDATE SET
    model = EXCLUDED.model,
    questions_month = EXCLUDED.questions_month,
    doc_type = EXCLUDED.doc_type,
    docs_size = EXCLUDED.docs_size,
    max_question_types = EXCLUDED.max_question_types,
    support = EXCLUDED.support,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- 2. ACADEMIC LEVELS (13 education levels)
-- =====================================================
-- Each level has specific allowed question types and contexts
-- The 'name' column uses the 'academic_level' enum type (UNIQUE constraint)
-- Note: Arrays use enum types directly, not JSONB

-- Elementary School (1º ao 5º ano)
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'elementary_school',
    ARRAY['multiple_choice', 'true_false']::question_type[],
    ARRAY['fixacao', 'contextualizada']::question_context[],
    'Ensino Fundamental I (1º ao 5º ano) - Questões simples e contextualizadas'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- Middle School (6º ao 9º ano)
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'middle_school',
    ARRAY['multiple_choice', 'true_false', 'fill_in_the_blank', 'matching_columns']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica']::question_context[],
    'Ensino Fundamental II (6º ao 9º ano) - Questões de fixação e teóricas'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- High School (1º ao 3º ano)
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'high_school',
    ARRAY['multiple_choice', 'true_false', 'open', 'sum', 'fill_in_the_blank', 'matching_columns', 'problem_solving']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica', 'estudo_caso']::question_context[],
    'Ensino Médio (1º ao 3º ano) - Questões aprofundadas e estudos de caso'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- Technical Education
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'technical',
    ARRAY['multiple_choice', 'true_false', 'open', 'problem_solving', 'project_based']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica', 'estudo_caso', 'pesquisa']::question_context[],
    'Ensino Técnico - Questões práticas e baseadas em projetos'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- Undergraduate (Graduação)
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'undergraduate',
    ARRAY['multiple_choice', 'true_false', 'open', 'sum', 'fill_in_the_blank', 'matching_columns', 'problem_solving', 'essay', 'summative']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica', 'estudo_caso', 'discursiva_aberta', 'pesquisa']::question_context[],
    'Graduação - Todos os tipos de questões exceto gamificadas'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- Specialization (Especialização)
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'specialization',
    ARRAY['multiple_choice', 'true_false', 'open', 'problem_solving', 'essay', 'summative', 'project_based']::question_type[],
    ARRAY['contextualizada', 'teorica', 'estudo_caso', 'discursiva_aberta', 'pesquisa']::question_context[],
    'Especialização - Questões analíticas e dissertativas'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- MBA
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'mba',
    ARRAY['multiple_choice', 'open', 'problem_solving', 'essay', 'summative', 'project_based']::question_type[],
    ARRAY['contextualizada', 'estudo_caso', 'discursiva_aberta', 'pesquisa']::question_context[],
    'MBA - Foco em estudos de caso e projetos'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- Masters (Mestrado)
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'masters',
    ARRAY['open', 'problem_solving', 'essay', 'summative', 'project_based']::question_type[],
    ARRAY['teorica', 'estudo_caso', 'discursiva_aberta', 'pesquisa']::question_context[],
    'Mestrado - Questões avançadas e pesquisa acadêmica'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- Doctorate (Doutorado)
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'doctorate',
    ARRAY['open', 'essay', 'summative', 'project_based']::question_type[],
    ARRAY['teorica', 'estudo_caso', 'discursiva_aberta', 'pesquisa']::question_context[],
    'Doutorado - Questões de pesquisa e dissertativas avançadas'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- Postdoctoral (Pós-Doutorado)
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'postdoctoral',
    ARRAY['open', 'essay', 'summative', 'project_based']::question_type[],
    ARRAY['teorica', 'discursiva_aberta', 'pesquisa']::question_context[],
    'Pós-Doutorado - Pesquisa avançada e produção científica'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- Extension Course (Curso de Extensão)
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'extension',
    ARRAY['multiple_choice', 'true_false', 'open', 'fill_in_the_blank', 'problem_solving']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica', 'pesquisa']::question_context[],
    'Curso de Extensão - Questões práticas e teóricas'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- Language Course (Curso de Idiomas)
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'language_course',
    ARRAY['multiple_choice', 'true_false', 'fill_in_the_blank', 'matching_columns', 'open']::question_type[],
    ARRAY['fixacao', 'contextualizada']::question_context[],
    'Curso de Idiomas - Questões de fixação e contextualizadas'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- None (Sem nível específico - todos os tipos disponíveis)
INSERT INTO academic_levels (
    name,
    allowed_question_types,
    allowed_question_context,
    description
) VALUES (
    'none',
    ARRAY['multiple_choice', 'true_false', 'open', 'sum', 'fill_in_the_blank', 'matching_columns', 'problem_solving', 'essay', 'project_based', 'gamified', 'summative']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica', 'estudo_caso', 'discursiva_aberta', 'letra_lei', 'pesquisa']::question_context[],
    'Sem nível específico - Todos os tipos de questões e contextos disponíveis'
)
ON CONFLICT (name)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_context = EXCLUDED.allowed_question_context,
    description = EXCLUDED.description;

-- =====================================================
-- VERIFICATION QUERIES (OPTIONAL)
-- =====================================================
-- Run these to verify the inserts were successful

-- Verify plans
-- SELECT id, model, questions_month FROM plans ORDER BY questions_month;

-- Verify academic levels
-- SELECT name, array_length(allowed_question_types, 1) as type_count
-- FROM academic_levels
-- ORDER BY type_count DESC;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. This file is IDEMPOTENT - can be run multiple times safely
-- 2. ON CONFLICT clauses will UPDATE existing records instead of failing
-- 3. Plan configurations match the schema.ts structure exactly
-- 4. Academic levels use enum arrays (not JSONB) for type safety
-- 5. The 'none' level allows all question types and is the fallback
-- 6. To manually update a plan/level, modify the INSERT and re-run this file
