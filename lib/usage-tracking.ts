/**
 * Usage Tracking Module
 * Tracks user question generation usage and quota
 */

import { createClient } from "./supabase/server";
import { logError } from './error-logs-service';

export interface SubjectUsage {
    subject: string;
    count: number;
    percentage: number;
}

export interface UsageStats {
    userId: string;
    totalQuestions: number;
    totalQuota: number;
    remainingQuota: number;
    percentageUsed: number;
    subjectBreakdown: SubjectUsage[];
    currentMonth: string;
}

/**
 * Get user's question usage statistics
 * @param userId - The user's UUID
 * @returns Usage statistics including subject breakdown
 */
export async function getUserUsageStats(userId: string): Promise<UsageStats | null> {
    try {
        const supabase = await createClient();

        const { data: userProfile, error: profileError } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", userId)
            .single();

        if (profileError || !userProfile) {
            return null;
        }

        const { data: planData, error: planError } = await supabase
            .from("plans")
            .select("questions_month")
            .eq("id", userProfile.plan)
            .single();

        if (planError || !planData) {
            return null;
        }

        const totalQuota = planData.questions_month ?? 30;
        const now = new Date();
        const cycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const { data: cycleLog, error: cycleError } = await supabase
            .from("profile_logs_cycle")
            .select("total_questions, subjects_breakdown")
            .eq("user_id", userId)
            .eq("cycle", cycle)
            .maybeSingle();

        if (cycleError && cycleError.code !== "PGRST116") {
            throw cycleError;
        }

        const totalQuestions = cycleLog?.total_questions ?? 0;
        const subjectsBreakdownRaw =
            (cycleLog?.subjects_breakdown as Array<{ subject: string; count: number }> | null) ?? [];

        const subjectBreakdown: SubjectUsage[] = subjectsBreakdownRaw.map((entry) => ({
            subject: entry.subject,
            count: entry.count,
            percentage: totalQuestions > 0 ? Math.round((entry.count / totalQuestions) * 100) : 0,
        }));

        const remainingQuota = Math.max(0, totalQuota - totalQuestions);
        const percentageUsed = totalQuota > 0 ? Math.round((totalQuestions / totalQuota) * 100) : 0;

        return {
            userId,
            totalQuestions,
            totalQuota,
            remainingQuota,
            percentageUsed,
            subjectBreakdown,
            currentMonth: cycle,
        };
    } catch (error) {
        console.error("Error getting user usage stats:", error);
        
        await logError({
            message: error instanceof Error ? error.message : 'Error getting user usage stats',
            stack: error instanceof Error ? error.stack : undefined,
            level: 'error',
            context: {
                function: 'getUserUsageStats',
                userId,
            },
        });
        
        throw error;
    }
}

/**
 * Check if user has remaining quota to create questions
 * @param userId - The user's UUID
 * @param requestedCount - Number of questions to create
 * @returns Boolean indicating if user has quota
 */
export async function checkUserQuota(userId: string, requestedCount: number = 1): Promise<boolean> {
    const stats = await getUserUsageStats(userId);
    if (!stats) return false;

    return stats.remainingQuota >= requestedCount;
}

/**
 * Update or create profile_logs_cycle for current month
 * @param userId - The user's UUID
 * @param subject - The subject of the questions
 * @param count - Number of questions created
 */
export async function updateProfileLogsCycle(userId: string, subject: string, count: number): Promise<void> {
    try {
        const supabase = await createClient();
        const now = new Date();
        const cycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM

        // Get existing log for this cycle
        const { data: existingLog, error: existingError } = await supabase
            .from("profile_logs_cycle")
            .select("id, total_questions, subjects_breakdown")
            .eq("user_id", userId)
            .eq("cycle", cycle)
            .maybeSingle();

        if (existingError && existingError.code !== "PGRST116") {
            throw existingError;
        }

        if (existingLog) {
            // Update existing log
            const subjectsBreakdown = Array.isArray(existingLog.subjects_breakdown)
                ? [...(existingLog.subjects_breakdown as Array<{ subject: string; count: number }>)]
                : [];
            const subjectIndex = subjectsBreakdown.findIndex((s) => s.subject === subject);

            if (subjectIndex >= 0) {
                subjectsBreakdown[subjectIndex].count += count;
            } else {
                subjectsBreakdown.push({ subject, count });
            }

            await supabase
                .from("profile_logs_cycle")
                .update({
                    total_questions: existingLog.total_questions + count,
                    subjects_breakdown: subjectsBreakdown,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existingLog.id);
        } else {
            // Create new log
            await supabase.from("profile_logs_cycle").insert({
                user_id: userId,
                cycle,
                total_questions: count,
                subjects_breakdown: [{ subject, count }],
            });
        }
    } catch (error) {
        console.error("Error updating profile logs cycle:", error);
        
        await logError({
            message: error instanceof Error ? error.message : 'Error updating profile logs cycle',
            stack: error instanceof Error ? error.stack : undefined,
            level: 'error',
            context: {
                function: 'updateProfileLogsCycle',
                userId,
                subject,
                count,
            },
        });
        
        throw error;
    }
}

/**
 * Get historical usage data for a user
 * @param userId - The user's UUID
 * @param limit - Number of months to retrieve
 * @returns Array of usage logs
 */
export async function getUserUsageHistory(userId: string, limit: number = 12): Promise<any[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("profile_logs_cycle")
            .select("*")
            .eq("user_id", userId)
            .order("cycle", { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error("Error getting user usage history:", error);
        
        await logError({
            message: error instanceof Error ? error.message : 'Error getting user usage history',
            stack: error instanceof Error ? error.stack : undefined,
            level: 'error',
            context: {
                function: 'getUserUsageHistory',
                userId,
                limit,
            },
        });
        
        return [];
    }
}
