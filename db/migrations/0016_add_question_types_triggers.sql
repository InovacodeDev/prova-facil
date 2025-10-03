-- Migration: Add trigger and validation for question_types updates
-- Created: 2025-10-02
-- Description: 
--   - Trigger to auto-update question_types_updated_at when selected_question_types changes
--   - Function to prevent updates within 30 days

-- Function: Update question_types_updated_at timestamp on change
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

-- Create trigger to call the function
DROP TRIGGER IF EXISTS trigger_update_question_types_timestamp ON profiles;
CREATE TRIGGER trigger_update_question_types_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_question_types_timestamp();

COMMENT ON FUNCTION update_question_types_timestamp IS 'Automatically updates question_types_updated_at when selected_question_types changes';

-- Function: Validate 30-day restriction on question types updates
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

-- Create trigger to validate before update
DROP TRIGGER IF EXISTS trigger_validate_question_types_update ON profiles;
CREATE TRIGGER trigger_validate_question_types_update
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_question_types_update();

COMMENT ON FUNCTION validate_question_types_update IS 'Prevents users from updating selected_question_types more than once every 30 days';

-- Update the existing can_update_question_types function to be more precise
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
