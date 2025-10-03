/**
 * Usage Tracking Module
 * Tracks user question generation usage and quota
 */

import { createClient } from "./supabase/server";

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

        // Get user's profile and plan
        const { data: userProfile } = await supabase.from("profiles").select("plan").eq("id", userId).single();

        if (!userProfile) {
            return null;
        }

        const { data: plan } = await supabase
            .from("plans")
            .select("questions_month")
            .eq("id", userProfile.plan)
            .single();

        if (!plan) {
            return null;
        }

        const { questions_month } = plan;
        const totalQuota = questions_month || 30; // Default to 30 if not found

        // Get current month start date
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonth = monthStart.toISOString().substring(0, 7); // YYYY-MM

        // Count total questions created this month using Supabase
        const { count: totalQuestions } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("assessments.user_id", userId)
            .gte("created_at", monthStart.toISOString());

        // Get breakdown by subject using RPC function
        const { data: subjectBreakdownResult } = await supabase.rpc("get_user_questions_by_subject", {
            p_user_id: userId,
            p_month_start: monthStart.toISOString(),
        });

        // Calculate percentages for each subject
        const subjectBreakdown: SubjectUsage[] = (subjectBreakdownResult || []).map((row: any) => ({
            subject: row.subject,
            count: row.count,
            percentage: totalQuestions && totalQuestions > 0 ? Math.round((row.count / totalQuestions) * 100) : 0,
        }));

        // Calculate remaining quota and percentage used
        const remainingQuota = Math.max(0, totalQuota - (totalQuestions || 0));
        const percentageUsed = totalQuota > 0 ? Math.round(((totalQuestions || 0) / totalQuota) * 100) : 0;

        return {
            userId,
            totalQuestions: totalQuestions || 0,
            totalQuota,
            remainingQuota,
            percentageUsed,
            subjectBreakdown,
            currentMonth,
        };
    } catch (error) {
        console.error("Error getting user usage stats:", error);
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
        const { data: existingLog } = await supabase
            .from("profile_logs_cycle")
            .select("*")
            .eq("user_id", userId)
            .eq("cycle", cycle)
            .single();

        if (existingLog) {
            // Update existing log
            const subjectsBreakdown = existingLog.subjects_breakdown as Array<{ subject: string; count: number }>;
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
        return [];
    }
}
