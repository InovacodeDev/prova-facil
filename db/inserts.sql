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
    2,
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
    3,
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
    250,
    ARRAY['txt', 'docx', 'pdf', 'link', 'text'],
    40,
    4,
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
    6,
    ARRAY['email', 'whatsapp', 'vip']::support_type_enum[]
);

-- Insert Academic Levels
-- Seguindo o enum academicLevelEnum e a estrutura da tabela academic_levels
INSERT INTO public.academic_levels (name, allowed_question_types, allowed_question_context, description, created_at) VALUES
  (
    'elementary_school',
    ARRAY['multiple_choice', 'true_false']::question_type[],
    ARRAY['fixacao', 'contextualizada']::question_context[],
    'Ensino Fundamental I (1º ao 5º ano) - Questões simples e contextualizadas',
    NOW()
  ),
  (
    'middle_school',
    ARRAY['multiple_choice', 'true_false', 'fill_in_the_blank', 'matching_columns']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica']::question_context[],
    'Ensino Fundamental II (6º ao 9º ano) - Questões de fixação e teóricas',
    NOW()
  ),
  (
    'high_school',
    ARRAY['multiple_choice', 'true_false', 'open', 'sum', 'fill_in_the_blank', 'matching_columns', 'problem_solving']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica', 'estudo_caso']::question_context[],
    'Ensino Médio (1º ao 3º ano) - Questões aprofundadas e estudos de caso',
    NOW()
  ),
  (
    'technical',
    ARRAY['multiple_choice', 'true_false', 'open', 'problem_solving', 'project_based']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica', 'estudo_caso', 'pesquisa']::question_context[],
    'Ensino Técnico - Questões práticas e baseadas em projetos',
    NOW()
  ),
  (
    'undergraduate',
    ARRAY['multiple_choice', 'true_false', 'open', 'sum', 'fill_in_the_blank', 'matching_columns', 'problem_solving', 'essay', 'summative']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica', 'estudo_caso', 'discursiva_aberta', 'pesquisa']::question_context[],
    'Graduação - Todos os tipos de questões exceto gamificadas',
    NOW()
  ),
  (
    'specialization',
    ARRAY['multiple_choice', 'true_false', 'open', 'problem_solving', 'essay', 'summative', 'project_based']::question_type[],
    ARRAY['contextualizada', 'teorica', 'estudo_caso', 'discursiva_aberta', 'pesquisa']::question_context[],
    'Especialização - Questões analíticas e dissertativas',
    NOW()
  ),
  (
    'mba',
    ARRAY['multiple_choice', 'open', 'problem_solving', 'essay', 'summative', 'project_based']::question_type[],
    ARRAY['contextualizada', 'estudo_caso', 'discursiva_aberta', 'pesquisa']::question_context[],
    'MBA - Foco em estudos de caso e projetos',
    NOW()
  ),
  (
    'masters',
    ARRAY['open', 'problem_solving', 'essay', 'summative', 'project_based']::question_type[],
    ARRAY['teorica', 'estudo_caso', 'discursiva_aberta', 'pesquisa']::question_context[],
    'Mestrado - Questões avançadas e pesquisa acadêmica',
    NOW()
  ),
  (
    'doctorate',
    ARRAY['open', 'essay', 'summative', 'project_based']::question_type[],
    ARRAY['teorica', 'estudo_caso', 'discursiva_aberta', 'pesquisa']::question_context[],
    'Doutorado - Questões de pesquisa e dissertativas avançadas',
    NOW()
  ),
  (
    'postdoctoral',
    ARRAY['open', 'essay', 'summative', 'project_based']::question_type[],
    ARRAY['teorica', 'discursiva_aberta', 'pesquisa']::question_context[],
    'Pós-Doutorado - Pesquisa avançada e produção científica',
    NOW()
  ),
  (
    'extension',
    ARRAY['multiple_choice', 'true_false', 'open', 'fill_in_the_blank', 'problem_solving']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica', 'pesquisa']::question_context[],
    'Curso de Extensão - Questões práticas e teóricas',
    NOW()
  ),
  (
    'language_course',
    ARRAY['multiple_choice', 'true_false', 'fill_in_the_blank', 'matching_columns', 'open']::question_type[],
    ARRAY['fixacao', 'contextualizada']::question_context[],
    'Curso de Idiomas - Questões de fixação e contextualizadas',
    NOW()
  ),
  (
    'none',
    ARRAY['multiple_choice', 'true_false', 'open', 'sum', 'fill_in_the_blank', 'matching_columns', 'problem_solving', 'essay', 'project_based', 'gamified', 'summative']::question_type[],
    ARRAY['fixacao', 'contextualizada', 'teorica', 'estudo_caso', 'discursiva_aberta', 'letra_lei', 'pesquisa']::question_context[],
    'Sem nível específico - Todos os tipos de questões e contextos disponíveis',
    NOW()
  );