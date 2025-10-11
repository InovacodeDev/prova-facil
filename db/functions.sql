CREATE OR REPLACE FUNCTION log_subscription_event(
  p_user_id UUID,
  p_stripe_customer_id VARCHAR,
  p_stripe_subscription_id VARCHAR,
  p_stripe_price_id VARCHAR,
  p_status subscription_status,
  p_plan_id plan,
  p_event_type VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_subscription_id UUID;
BEGIN
  INSERT INTO subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    plan_id,
    event_type
  ) VALUES (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_status,
    p_plan_id,
    p_event_type
  )
  RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;

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

CREATE OR REPLACE FUNCTION update_question_types_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update timestamp if selected_question_types actually changed
    IF OLD.selected_question_types IS DISTINCT FROM NEW.selected_question_types THEN
        NEW.question_types_updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_question_types_update()
RETURNS TRIGGER AS $$
DECLARE
    days_since_last_update INTEGER;
BEGIN
    -- Only validate if selected_question_types is being changed
    IF OLD.selected_question_types IS DISTINCT FROM NEW.selected_question_types THEN
        
        -- If there's a previous update timestamp, check the 30-day restriction
        IF OLD.question_types_updated_at IS NOT NULL THEN
            -- Calculate days since last update
            days_since_last_update := EXTRACT(DAY FROM (NOW() - OLD.question_types_updated_at));
            
            -- If less than 30 days, prevent the update
            IF days_since_last_update < 30 THEN
                RAISE EXCEPTION 'Você só pode alterar os tipos de questões uma vez a cada 30 dias. Última alteração: %. Próxima alteração disponível em: %',
                    TO_CHAR(OLD.question_types_updated_at, 'DD/MM/YYYY'),
                    TO_CHAR(OLD.question_types_updated_at + INTERVAL '30 days', 'DD/MM/YYYY');
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION can_update_question_types(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    last_update TIMESTAMP WITH TIME ZONE;
    days_since_update INTEGER;
BEGIN
    -- Get the last update timestamp
    SELECT question_types_updated_at INTO last_update
    FROM profiles
    WHERE id = user_id;
    
    -- If never updated, allow update
    IF last_update IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Calculate days since last update
    days_since_update := EXTRACT(DAY FROM (NOW() - last_update));
    
    -- Return true if 30 or more days have passed
    RETURN days_since_update >= 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_update_question_types IS 'Check if user can update their selected question types (30 days minimum between updates)';

CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;