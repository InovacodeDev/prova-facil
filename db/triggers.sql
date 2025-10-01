-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE LOGS
-- =====================================================
-- Execute este SQL no Supabase SQL Editor após aplicar a migration 0002
-- 
-- Estas triggers mantêm a tabela `logs` sincronizada automaticamente:
-- 1. copy_question: incrementa quando questions.copy_count aumenta
-- 2. create_new_questions: incrementa quando um assessment é criado
-- 3. new_questions: incrementa quando uma question é criada
--
-- IMPORTANTE: Com estas triggers, você NÃO precisa mais chamar
-- incrementActionLog() manualmente no código da aplicação!

-- =====================================================
-- FUNÇÃO HELPER: UPSERT/INCREMENT COM SEGURANÇA
-- =====================================================
-- Esta função incrementa o contador de logs de forma segura,
-- lidando com concorrência e criando a linha se não existir

CREATE OR REPLACE FUNCTION public.increment_action_log(p_action public.action_type)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
BEGIN
  LOOP
    -- Tentar atualizar linha existente
    UPDATE public.logs
    SET count = count + 1,
        updated_at = now()
    WHERE action = p_action;
    IF FOUND THEN
      RETURN;
    END IF;

    -- If no row was updated, try to insert one
    BEGIN
      INSERT INTO public.logs (action, count, created_at, updated_at)
      VALUES (p_action, 1, now(), now());
      RETURN;
    EXCEPTION WHEN unique_violation THEN
      -- Concurrent insert happened, loop and try update again
      CONTINUE;
    END;
  END LOOP;
END;
$$;


-- Trigger function: increment log when questions.copy_count increases
CREATE OR REPLACE FUNCTION public.trg_questions_copy_count_increment()
RETURNS trigger LANGUAGE plpgsql AS
$$
BEGIN
  -- Only act when copy_count increased
  IF TG_OP = 'UPDATE' AND COALESCE(NEW.copy_count, 0) > COALESCE(OLD.copy_count, 0) THEN
    PERFORM public.increment_action_log('copy_question'::public.action_type);
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger AFTER UPDATE on questions, only when copy_count changed and increased
DROP TRIGGER IF EXISTS questions_copy_count_inc ON public.questions;
CREATE TRIGGER questions_copy_count_inc
AFTER UPDATE OF copy_count ON public.questions
FOR EACH ROW
WHEN (COALESCE(NEW.copy_count, 0) > COALESCE(OLD.copy_count, 0))
EXECUTE FUNCTION public.trg_questions_copy_count_increment();


-- Trigger function: increment create_new_questions when an assessment is created
-- Also updates unique_assessments count
CREATE OR REPLACE FUNCTION public.trg_assessments_after_insert()
RETURNS trigger LANGUAGE plpgsql AS
$$
BEGIN
  PERFORM public.increment_action_log('create_new_questions'::public.action_type);
  
  -- Update unique_assessments count (total distinct assessments)
  UPDATE public.logs
  SET count = (SELECT COUNT(DISTINCT id) FROM public.assessments),
      updated_at = now()
  WHERE action = 'unique_assessments'::public.action_type;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assessments_after_insert_log ON public.assessments;
CREATE TRIGGER assessments_after_insert_log
AFTER INSERT ON public.assessments
FOR EACH ROW
EXECUTE FUNCTION public.trg_assessments_after_insert();


-- Trigger function: increment new_questions when a question is created
-- Also recalculates mean_questions_per_assessment
CREATE OR REPLACE FUNCTION public.trg_questions_after_insert()
RETURNS trigger LANGUAGE plpgsql AS
$$
DECLARE
  v_mean NUMERIC;
BEGIN
  PERFORM public.increment_action_log('new_questions'::public.action_type);
  
  -- Calculate mean questions per assessment (rounded to 1 decimal place)
  SELECT COALESCE(ROUND(AVG(question_count)::numeric, 1), 0)
  INTO v_mean
  FROM (
    SELECT COUNT(q.id) AS question_count
    FROM public.assessments a
    LEFT JOIN public.questions q ON q.assessment_id = a.id
    GROUP BY a.id
  ) assessment_question_counts;
  
  -- Update mean_questions_per_assessment (store as integer by multiplying by 10)
  -- We'll divide by 10 in the API to get the decimal
  UPDATE public.logs
  SET count = ROUND(v_mean * 10)::integer,
      updated_at = now()
  WHERE action = 'mean_questions_per_assessment'::public.action_type;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS questions_after_insert_log ON public.questions;
CREATE TRIGGER questions_after_insert_log
AFTER INSERT ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.trg_questions_after_insert();