-- 2025-09-29: Create subjects and academic_level_subjects tables and seed basic subjects
-- Idempotent: safe to run multiple times

BEGIN;

-- Create subjects table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subjects') THEN
        CREATE TABLE public.subjects (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            description_pt_br VARCHAR(255) NOT NULL,
            area VARCHAR(100)
        );
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not create subjects table: %', SQLERRM;
END $$;

-- Create academic_level_subjects linking table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academic_level_subjects') THEN
        CREATE TABLE public.academic_level_subjects (
            academic_level_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            PRIMARY KEY (academic_level_id, subject_id),
            FOREIGN KEY (academic_level_id) REFERENCES public.academic_levels(id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE
        );
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not create academic_level_subjects table: %', SQLERRM;
END $$;

-- Seed subjects (idempotent) with recommended list
-- We'll use upserts by name to avoid duplicates
WITH to_insert (name, description_pt_br, area) AS (
    VALUES
        ('PORTUGUESE_LANGUAGE', 'Língua Portuguesa', 'HUMANITIES'),
        ('MATHEMATICS', 'Matemática', 'EXACT_SCIENCES'),
        ('SCIENCES', 'Ciências', 'EXACT_SCIENCES'),
        ('HISTORY', 'História', 'HUMANITIES'),
        ('GEOGRAPHY', 'Geografia', 'HUMANITIES'),
        ('ARTS', 'Artes', 'ARTS'),
        ('PHYSICAL_EDUCATION', 'Educação Física', 'SPORTS'),
        ('FOREIGN_LANGUAGE_ENGLISH', 'Língua Estrangeira - Inglês', 'LANGUAGES'),
        ('LITERATURE', 'Literatura', 'HUMANITIES'),
        ('PHYSICS', 'Física', 'EXACT_SCIENCES'),
        ('CHEMISTRY', 'Química', 'EXACT_SCIENCES'),
        ('BIOLOGY', 'Biologia', 'EXACT_SCIENCES'),
        ('PHILOSOPHY', 'Filosofia', 'HUMANITIES'),
        ('SOCIOLOGY', 'Sociologia', 'HUMANITIES'),
        ('FOREIGN_LANGUAGE_SPANISH', 'Língua Estrangeira - Espanhol', 'LANGUAGES'),
        ('COMPUTER_PROGRAMMING', 'Programação de Computadores', 'TECHNOLOGY'),
        ('DATABASE_MANAGEMENT', 'Gerenciamento de Banco de Dados', 'TECHNOLOGY'),
        ('ELECTRONIC_CIRCUITS', 'Circuitos Eletrônicos', 'ENGINEERING'),
        ('NURSING_FUNDAMENTALS', 'Fundamentos de Enfermagem', 'HEALTH'),
        ('MECHANICAL_DESIGN', 'Desenho Mecânico', 'ENGINEERING'),
        ('WORKPLACE_SAFETY', 'Segurança do Trabalho', 'GENERAL'),
        ('CALCULUS', 'Cálculo', 'EXACT_SCIENCES'),
        ('LINEAR_ALGEBRA', 'Álgebra Linear', 'EXACT_SCIENCES'),
        ('DIFFERENTIAL_EQUATIONS', 'Equações Diferenciais', 'EXACT_SCIENCES'),
        ('CLASSICAL_MECHANICS', 'Mecânica Clássica', 'EXACT_SCIENCES'),
        ('CONSTITUTIONAL_LAW', 'Direito Constitucional', 'HUMANITIES'),
        ('CULTURAL_ANTHROPOLOGY', 'Antropologia Cultural', 'HUMANITIES'),
        ('CONTEMPORARY_PHILOSOPHY', 'Filosofia Contemporânea', 'HUMANITIES'),
        ('HUMAN_ANATOMY', 'Anatomia Humana', 'HEALTH'),
        ('BIOCHEMISTRY', 'Bioquímica', 'HEALTH'),
        ('PHARMACOLOGY', 'Farmacologia', 'HEALTH'),
        ('IMMUNOLOGY', 'Imunologia', 'HEALTH'),
        ('LITERARY_THEORY', 'Teoria Literária', 'ARTS'),
        ('ART_HISTORY', 'História da Arte', 'ARTS'),
        ('AESTHETICS', 'Estética', 'ARTS'),
        ('SCIENTIFIC_METHODOLOGY', 'Metodologia Científica', 'GENERAL'),
        ('ADVANCED_TOPICS_IN_AI', 'Tópicos Avançados em IA', 'TECHNOLOGY'),
        ('CRITICAL_THEORY', 'Teoria Crítica', 'HUMANITIES'),
        ('QUANTUM_FIELD_THEORY', 'Teoria Quântica de Campos', 'EXACT_SCIENCES'),
        ('SEMINARS_IN_GENETICS', 'Seminários em Genética', 'HEALTH')
)
INSERT INTO public.subjects (name, description_pt_br, area)
SELECT name, description_pt_br, area FROM to_insert
ON CONFLICT (name) DO UPDATE SET description_pt_br = EXCLUDED.description_pt_br
RETURNING id, name;

-- Link subjects to academic levels by name if academic_levels table exists
-- We'll try to match by known level names; if a name does not exist, skip silently

-- Helper: a table of desired links (academic_level_name, subject_name)
WITH desired_links (level_name, subject_name) AS (
    VALUES
        -- Elementary / Fundamental
        ('ELEMENTARY_SCHOOL', 'PORTUGUESE_LANGUAGE'),
        ('ELEMENTARY_SCHOOL', 'MATHEMATICS'),
        ('ELEMENTARY_SCHOOL', 'SCIENCES'),
        ('ELEMENTARY_SCHOOL', 'HISTORY'),
        ('ELEMENTARY_SCHOOL', 'GEOGRAPHY'),
        ('ELEMENTARY_SCHOOL', 'ARTS'),
        ('ELEMENTARY_SCHOOL', 'PHYSICAL_EDUCATION'),
        ('ELEMENTARY_SCHOOL', 'FOREIGN_LANGUAGE_ENGLISH'),

        -- High School
        ('HIGH_SCHOOL', 'PORTUGUESE_LANGUAGE'),
        ('HIGH_SCHOOL', 'MATHEMATICS'),
        ('HIGH_SCHOOL', 'SCIENCES'),
        ('HIGH_SCHOOL', 'HISTORY'),
        ('HIGH_SCHOOL', 'GEOGRAPHY'),
        ('HIGH_SCHOOL', 'ARTS'),
        ('HIGH_SCHOOL', 'PHYSICAL_EDUCATION'),
        ('HIGH_SCHOOL', 'FOREIGN_LANGUAGE_ENGLISH'),
        ('HIGH_SCHOOL', 'LITERATURE'),
        ('HIGH_SCHOOL', 'PHYSICS'),
        ('HIGH_SCHOOL', 'CHEMISTRY'),
        ('HIGH_SCHOOL', 'BIOLOGY'),
        ('HIGH_SCHOOL', 'PHILOSOPHY'),
        ('HIGH_SCHOOL', 'SOCIOLOGY'),
        ('HIGH_SCHOOL', 'FOREIGN_LANGUAGE_SPANISH'),

        -- Technical (examples)
        ('TECHNICAL', 'COMPUTER_PROGRAMMING'),
        ('TECHNICAL', 'DATABASE_MANAGEMENT'),
        ('TECHNICAL', 'ELECTRONIC_CIRCUITS'),
        ('TECHNICAL', 'NURSING_FUNDAMENTALS'),
        ('TECHNICAL', 'MECHANICAL_DESIGN'),
        ('TECHNICAL', 'WORKPLACE_SAFETY'),

        -- Undergraduate examples
        ('UNDERGRADUATE', 'CALCULUS'),
        ('UNDERGRADUATE', 'LINEAR_ALGEBRA'),
        ('UNDERGRADUATE', 'DIFFERENTIAL_EQUATIONS'),
        ('UNDERGRADUATE', 'CLASSICAL_MECHANICS'),
        ('UNDERGRADUATE', 'CONSTITUTIONAL_LAW'),
        ('UNDERGRADUATE', 'CULTURAL_ANTHROPOLOGY'),
        ('UNDERGRADUATE', 'CONTEMPORARY_PHILOSOPHY'),
        ('UNDERGRADUATE', 'HUMAN_ANATOMY'),
        ('UNDERGRADUATE', 'BIOCHEMISTRY'),
        ('UNDERGRADUATE', 'PHARMACOLOGY'),
        ('UNDERGRADUATE', 'IMMUNOLOGY')
)
INSERT INTO public.academic_level_subjects (academic_level_id, subject_id)
SELECT al.id, s.id
FROM desired_links dl
JOIN public.academic_levels al ON al.name = dl.level_name
JOIN public.subjects s ON s.name = dl.subject_name
ON CONFLICT (academic_level_id, subject_id) DO NOTHING;

COMMIT;
