-- RPC Function: Get user questions by subject for a given month
-- This function is used by the usage tracking system

CREATE OR REPLACE FUNCTION get_user_questions_by_subject(
    p_user_id UUID,
    p_month_start TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    subject VARCHAR,
    count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.subject,
        COUNT(q.id)::BIGINT as count
    FROM 
        questions q
    INNER JOIN 
        assessments a ON q.assessment_id = a.id
    WHERE 
        a.user_id = p_user_id
        AND q.created_at >= p_month_start
    GROUP BY 
        a.subject
    ORDER BY 
        count DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_questions_by_subject(UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;

COMMENT ON FUNCTION get_user_questions_by_subject IS 'Returns the count of questions created by a user grouped by subject for a given month';
