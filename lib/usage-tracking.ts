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
