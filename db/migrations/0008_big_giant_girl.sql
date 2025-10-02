CREATE TYPE "public"."support_type_enum" AS ENUM('email', 'whatsapp', 'vip');--> statement-breakpoint
CREATE TABLE "plans" (
	"id" "plan" PRIMARY KEY NOT NULL,
	"model" varchar(255) NOT NULL,
	"questions_month" integer DEFAULT 30 NOT NULL,
	"doc_type" text[] NOT NULL,
	"docs_size" integer DEFAULT 10 NOT NULL,
	"allowed_questions" "question_type"[] NOT NULL,
	"support" "support_type_enum"[] DEFAULT ARRAY['email']::"support_type_enum"[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "plan_models" CASCADE;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "allowed_cookies" text;

COMMENT ON TYPE support_type_enum IS 'Types of support available in different plans';

COMMENT ON TABLE public.plans IS 'Configuration for each subscription plan';
COMMENT ON COLUMN public.plans.id IS 'Plan identifier (starter, basic, essentials, plus, advanced)';
COMMENT ON COLUMN public.plans.model IS 'AI model used for question generation';
COMMENT ON COLUMN public.plans.questions_month IS 'Maximum number of questions per month';
COMMENT ON COLUMN public.plans.doc_type IS 'Allowed document types for upload (txt, docx, pdf, pptx, link, text)';
COMMENT ON COLUMN public.plans.docs_size IS 'Maximum document size in MB';
COMMENT ON COLUMN public.plans.allowed_questions IS 'Question types available in this plan';
COMMENT ON COLUMN public.plans.support IS 'Support channels available in this plan';

-- Insert all 5 plans with their configurations based on Pricing.tsx

-- Starter Plan (Free)
INSERT INTO public.plans (
    id, 
    model, 
    questions_month, 
    doc_type, 
    docs_size, 
    allowed_questions, 
    support
) VALUES (
    'starter',
    'gemini-2.5-flash-lite',
    30,
    ARRAY['txt', 'docx', 'text'],
    10,
    ARRAY['multiple_choice', 'true_false']::question_type[],
    ARRAY['email']::support_type_enum[]
);

-- Basic Plan (R$ 29,90/mês)
INSERT INTO public.plans (
    id, 
    model, 
    questions_month, 
    doc_type, 
    docs_size, 
    allowed_questions, 
    support
) VALUES (
    'basic',
    'gemini-2.5-flash-lite',
    75,
    ARRAY['txt', 'docx', 'text'],
    20,
    ARRAY['multiple_choice', 'true_false', 'open', 'fill_in_the_blank']::question_type[],
    ARRAY['email']::support_type_enum[]
);

-- Essentials Plan (R$ 49,90/mês)
INSERT INTO public.plans (
    id, 
    model, 
    questions_month, 
    doc_type, 
    docs_size, 
    allowed_questions, 
    support
) VALUES (
    'essentials',
    'gemini-2.5-flash',
    150,
    ARRAY['txt', 'docx', 'pdf', 'link', 'text'],
    30,
    ARRAY[
        'multiple_choice', 
        'true_false', 
        'open', 
        'fill_in_the_blank', 
        'matching_columns', 
        'problem_solving',
        'essay'
    ]::question_type[],
    ARRAY['email', 'whatsapp']::support_type_enum[]
);

-- Plus Plan (R$ 79,90/mês)
INSERT INTO public.plans (
    id, 
    model, 
    questions_month, 
    doc_type, 
    docs_size, 
    allowed_questions, 
    support
) VALUES (
    'plus',
    'gemini-2.5-flash',
    300,
    ARRAY['txt', 'docx', 'pdf', 'link', 'text'],
    40,
    ARRAY[
        'multiple_choice', 
        'true_false', 
        'open', 
        'sum',
        'fill_in_the_blank', 
        'matching_columns', 
        'problem_solving',
        'essay'
    ]::question_type[],
    ARRAY['email', 'whatsapp', 'vip']::support_type_enum[]
);

-- Advanced Plan (R$ 129,90/mês)
INSERT INTO public.plans (
    id, 
    model, 
    questions_month, 
    doc_type, 
    docs_size, 
    allowed_questions, 
    support
) VALUES (
    'advanced',
    'gemini-2.5-pro',
    300,
    ARRAY['txt', 'docx', 'pdf', 'pptx', 'link', 'text'],
    100,
    ARRAY[
        'multiple_choice', 
        'true_false', 
        'open', 
        'sum',
        'fill_in_the_blank', 
        'matching_columns', 
        'problem_solving',
        'essay'
    ]::question_type[],
    ARRAY['email', 'whatsapp', 'vip']::support_type_enum[]
);

-- Add comment about plan configurations
COMMENT ON TABLE public.plans IS 'Plan configurations:
- Starter: Free, 30q/month, txt/docx/text, 10MB, basic AI, email support
- Basic: R$29.90/month, 75q/month, txt/docx/text, 20MB, basic AI, email support
- Essentials: R$49.90/month, 150q/month, txt/docx/pdf/link/text, 30MB, advanced AI, email+whatsapp
- Plus: R$79.90/month, 300q/month, txt/docx/pdf/link/text, 40MB, advanced AI, email+whatsapp+vip
- Advanced: R$129.90/month, 300q/month, all formats, 100MB, premium AI, email+whatsapp+vip';
