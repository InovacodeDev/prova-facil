-- Inserts: Initial Data for Prova Fácil
-- Description: Seed data for plans and academic levels
-- Dependencies: 0007_create_plans, 0002_create_academic_levels
-- Created: 2025-10-13
-- Updated: 2025-10-13 (Added ON CONFLICT clauses for idempotency)
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
-- Note: Price values match the Stripe configuration
-- The 'name' column uses the 'plan' enum type (UNIQUE constraint)

-- Starter Plan (FREE)
INSERT INTO plans (
    name,
    price,
    questions_limit,
    assessments_limit,
    daily_questions_limit,
    copilot_questions_limit,
    support_type,
    features
) VALUES (
    'starter',
    0.00,
    30,
    5,
    10,
    10,
    'email',
    '["Modelo: gemini-2.5-flash-lite", "Tipos de documento: txt, docx, text", "Tamanho máximo: 10MB", "1 tipo de questão"]'::jsonb
)
ON CONFLICT (name)
DO UPDATE SET
    price = EXCLUDED.price,
    questions_limit = EXCLUDED.questions_limit,
    assessments_limit = EXCLUDED.assessments_limit,
    daily_questions_limit = EXCLUDED.daily_questions_limit,
    copilot_questions_limit = EXCLUDED.copilot_questions_limit,
    support_type = EXCLUDED.support_type,
    features = EXCLUDED.features,
    updated_at = CURRENT_TIMESTAMP;

-- Basic Plan (R$ 29,90/mês)
INSERT INTO plans (
    name,
    price,
    questions_limit,
    assessments_limit,
    daily_questions_limit,
    copilot_questions_limit,
    support_type,
    features
) VALUES (
    'basic',
    29.90,
    75,
    15,
    25,
    25,
    'email',
    '["Modelo: gemini-2.5-flash-lite", "Tipos de documento: txt, docx, text", "Tamanho máximo: 20MB", "2 tipos de questão"]'::jsonb
)
ON CONFLICT (name)
DO UPDATE SET
    price = EXCLUDED.price,
    questions_limit = EXCLUDED.questions_limit,
    assessments_limit = EXCLUDED.assessments_limit,
    daily_questions_limit = EXCLUDED.daily_questions_limit,
    copilot_questions_limit = EXCLUDED.copilot_questions_limit,
    support_type = EXCLUDED.support_type,
    features = EXCLUDED.features,
    updated_at = CURRENT_TIMESTAMP;

-- Essentials Plan (R$ 49,90/mês)
INSERT INTO plans (
    name,
    price,
    questions_limit,
    assessments_limit,
    daily_questions_limit,
    copilot_questions_limit,
    support_type,
    features
) VALUES (
    'essentials',
    49.90,
    150,
    30,
    50,
    50,
    'whatsapp',
    '["Modelo: gemini-2.5-flash", "Tipos de documento: txt, docx, pdf, link, text", "Tamanho máximo: 30MB", "3 tipos de questão", "Suporte WhatsApp"]'::jsonb
)
ON CONFLICT (name)
DO UPDATE SET
    price = EXCLUDED.price,
    questions_limit = EXCLUDED.questions_limit,
    assessments_limit = EXCLUDED.assessments_limit,
    daily_questions_limit = EXCLUDED.daily_questions_limit,
    copilot_questions_limit = EXCLUDED.copilot_questions_limit,
    support_type = EXCLUDED.support_type,
    features = EXCLUDED.features,
    updated_at = CURRENT_TIMESTAMP;

-- Plus Plan (R$ 79,90/mês)
INSERT INTO plans (
    name,
    price,
    questions_limit,
    assessments_limit,
    daily_questions_limit,
    copilot_questions_limit,
    support_type,
    features
) VALUES (
    'plus',
    79.90,
    250,
    50,
    100,
    100,
    'vip',
    '["Modelo: gemini-2.5-flash", "Tipos de documento: txt, docx, pdf, link, text", "Tamanho máximo: 40MB", "4 tipos de questão", "Suporte VIP"]'::jsonb
)
ON CONFLICT (name)
DO UPDATE SET
    price = EXCLUDED.price,
    questions_limit = EXCLUDED.questions_limit,
    assessments_limit = EXCLUDED.assessments_limit,
    daily_questions_limit = EXCLUDED.daily_questions_limit,
    copilot_questions_limit = EXCLUDED.copilot_questions_limit,
    support_type = EXCLUDED.support_type,
    features = EXCLUDED.features,
    updated_at = CURRENT_TIMESTAMP;

-- Advanced Plan (R$ 129,90/mês)
INSERT INTO plans (
    name,
    price,
    questions_limit,
    assessments_limit,
    daily_questions_limit,
    copilot_questions_limit,
    support_type,
    features
) VALUES (
    'advanced',
    129.90,
    300,
    100,
    150,
    150,
    'vip',
    '["Modelo: gemini-2.5-pro", "Tipos de documento: txt, docx, pdf, pptx, link, text", "Tamanho máximo: 100MB", "6 tipos de questão", "Suporte VIP prioritário"]'::jsonb
)
ON CONFLICT (name)
DO UPDATE SET
    price = EXCLUDED.price,
    questions_limit = EXCLUDED.questions_limit,
    assessments_limit = EXCLUDED.assessments_limit,
    daily_questions_limit = EXCLUDED.daily_questions_limit,
    copilot_questions_limit = EXCLUDED.copilot_questions_limit,
    support_type = EXCLUDED.support_type,
    features = EXCLUDED.features,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- 2. ACADEMIC LEVELS (13 education levels)
-- =====================================================
-- Each level has specific allowed question types and contexts
-- The 'level' column uses the 'academic_level' enum type (UNIQUE constraint)

-- Elementary School (1º ao 5º ano)
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'elementary_school',
    '["multiple_choice", "true_false"]'::jsonb,
    '["fixacao", "contextualizada"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- Middle School (6º ao 9º ano)
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'middle_school',
    '["multiple_choice", "true_false", "fill_in_the_blank", "matching_columns"]'::jsonb,
    '["fixacao", "contextualizada", "teorica"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- High School (1º ao 3º ano)
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'high_school',
    '["multiple_choice", "true_false", "open", "sum", "fill_in_the_blank", "matching_columns", "problem_solving"]'::jsonb,
    '["fixacao", "contextualizada", "teorica", "estudo_caso"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- Technical Education
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'technical',
    '["multiple_choice", "true_false", "open", "problem_solving", "project_based"]'::jsonb,
    '["fixacao", "contextualizada", "teorica", "estudo_caso", "pesquisa"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- Undergraduate (Graduação)
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'undergraduate',
    '["multiple_choice", "true_false", "open", "sum", "fill_in_the_blank", "matching_columns", "problem_solving", "essay", "summative"]'::jsonb,
    '["fixacao", "contextualizada", "teorica", "estudo_caso", "discursiva_aberta", "pesquisa"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- Specialization (Especialização)
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'specialization',
    '["multiple_choice", "true_false", "open", "problem_solving", "essay", "summative", "project_based"]'::jsonb,
    '["contextualizada", "teorica", "estudo_caso", "discursiva_aberta", "pesquisa"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- MBA
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'mba',
    '["multiple_choice", "open", "problem_solving", "essay", "summative", "project_based"]'::jsonb,
    '["contextualizada", "estudo_caso", "discursiva_aberta", "pesquisa"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- Masters (Mestrado)
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'masters',
    '["open", "problem_solving", "essay", "summative", "project_based"]'::jsonb,
    '["teorica", "estudo_caso", "discursiva_aberta", "pesquisa"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- Doctorate (Doutorado)
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'doctorate',
    '["open", "essay", "summative", "project_based"]'::jsonb,
    '["teorica", "estudo_caso", "discursiva_aberta", "pesquisa"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- Postdoctoral (Pós-Doutorado)
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'postdoctoral',
    '["open", "essay", "summative", "project_based"]'::jsonb,
    '["teorica", "discursiva_aberta", "pesquisa"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- Extension Course (Curso de Extensão)
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'extension',
    '["multiple_choice", "true_false", "open", "fill_in_the_blank", "problem_solving"]'::jsonb,
    '["fixacao", "contextualizada", "teorica", "pesquisa"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- Language Course (Curso de Idiomas)
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'language_course',
    '["multiple_choice", "true_false", "fill_in_the_blank", "matching_columns", "open"]'::jsonb,
    '["fixacao", "contextualizada"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- None (Sem nível específico - todos os tipos disponíveis)
INSERT INTO academic_levels (
    level,
    allowed_question_types,
    allowed_question_contexts
) VALUES (
    'none',
    '["multiple_choice", "true_false", "open", "sum", "fill_in_the_blank", "matching_columns", "problem_solving", "essay", "project_based", "gamified", "summative"]'::jsonb,
    '["fixacao", "contextualizada", "teorica", "estudo_caso", "discursiva_aberta", "letra_lei", "pesquisa"]'::jsonb
)
ON CONFLICT (level)
DO UPDATE SET
    allowed_question_types = EXCLUDED.allowed_question_types,
    allowed_question_contexts = EXCLUDED.allowed_question_contexts,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- VERIFICATION QUERIES (OPTIONAL)
-- =====================================================
-- Run these to verify the inserts were successful

-- Verify plans
-- SELECT name, price, questions_limit FROM plans ORDER BY price;

-- Verify academic levels
-- SELECT level, jsonb_array_length(allowed_question_types) as type_count
-- FROM academic_levels
-- ORDER BY type_count DESC;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. This file is IDEMPOTENT - can be run multiple times safely
-- 2. ON CONFLICT clauses will UPDATE existing records instead of failing
-- 3. Plan prices should match your Stripe product configuration
-- 4. Features JSONB arrays are displayed in the UI as bullet points
-- 5. Academic level configurations control which question types/contexts
--    are available based on the user's selected education level
-- 6. The 'none' level allows all question types and is the fallback
-- 7. To manually update a plan, modify the INSERT statement and re-run this file
-- 8. The updated_at timestamp is automatically updated on conflict
