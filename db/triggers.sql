-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Attach trigger AFTER UPDATE on questions, only when copy_count changed and increased
DROP TRIGGER IF EXISTS questions_copy_count_inc ON public.questions;
CREATE TRIGGER questions_copy_count_inc
AFTER UPDATE OF copy_count ON public.questions
FOR EACH ROW
WHEN (COALESCE(NEW.copy_count, 0) > COALESCE(OLD.copy_count, 0))
EXECUTE FUNCTION public.trg_questions_copy_count_increment();

-- Trigger function: increment create_new_questions when an assessment is created
-- Also updates unique_assessments count
DROP TRIGGER IF EXISTS assessments_after_insert_log ON public.assessments;
CREATE TRIGGER assessments_after_insert_log
AFTER INSERT ON public.assessments
FOR EACH ROW
EXECUTE FUNCTION public.trg_assessments_after_insert();


-- Trigger function: increment new_questions when a question is created
-- Also recalculates mean_questions_per_assessment

DROP TRIGGER IF EXISTS questions_after_insert_log ON public.questions;
CREATE TRIGGER questions_after_insert_log
AFTER INSERT ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.trg_questions_after_insert();

-- Create trigger to call the function
DROP TRIGGER IF EXISTS trigger_update_question_types_timestamp ON profiles;
CREATE TRIGGER trigger_update_question_types_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_question_types_timestamp();

COMMENT ON FUNCTION update_question_types_timestamp IS 'Automatically updates question_types_updated_at when selected_question_types changes';

-- Create trigger to validate before update
DROP TRIGGER IF EXISTS trigger_validate_question_types_update ON profiles;
CREATE TRIGGER trigger_validate_question_types_update
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_question_types_update();

COMMENT ON FUNCTION validate_question_types_update IS 'Prevents users from updating selected_question_types more than once every 30 days';


-- Aplicar trigger se não existir
DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON profiles;
CREATE TRIGGER profiles_updated_at_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();