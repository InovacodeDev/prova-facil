-- Insert default log entries
INSERT INTO
  public.logs (action, count, created_at, updated_at)
VALUES
  ('unique_assessments', 0, NOW (), NOW ()),
  (
    'mean_questions_per_assessment',
    0,
    NOW (),
    NOW ()
  );

-- Insert all 5 plans with their configurations based on Pricing.tsx

-- Starter Plan (Free)
INSERT INTO public.plans (
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
);

-- Basic Plan (R$ 29,90/mês)
INSERT INTO public.plans (
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
    3,
    ARRAY['email']::support_type_enum[]
);

-- Essentials Plan (R$ 49,90/mês)
INSERT INTO public.plans (
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
    5,
    ARRAY['email', 'whatsapp']::support_type_enum[]
);

-- Plus Plan (R$ 79,90/mês)
INSERT INTO public.plans (
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
    300,
    ARRAY['txt', 'docx', 'pdf', 'link', 'text'],
    40,
    8,
    ARRAY['email', 'whatsapp', 'vip']::support_type_enum[]
);

-- Advanced Plan (R$ 129,90/mês)
INSERT INTO public.plans (
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
    11,
    ARRAY['email', 'whatsapp', 'vip']::support_type_enum[]
);

