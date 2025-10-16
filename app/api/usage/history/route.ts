/**
 * Usage History API Route
 *
 * Fetches question generation history from profile_logs_cycle for the last 6 months
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile ID
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Calculate date 6 months ago (format: YYYY-MM)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const minCycle = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

    // Fetch usage data from profile_logs_cycle
    const { data: logsCycles, error } = await supabase
      .from('profile_logs_cycle')
      .select('cycle, total_questions, subjects_breakdown')
      .eq('user_id', profile.id)
      .gte('cycle', minCycle)
      .order('cycle', { ascending: true });

    if (error) {
      throw error;
    }

    // Initialize all 6 months with 0
    const monthlyUsage: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyUsage[key] = 0;
    }

    // Populate with actual data
    logsCycles?.forEach((log) => {
      if (log.cycle in monthlyUsage) {
        monthlyUsage[log.cycle] = log.total_questions || 0;
      }
    });

    // Format for chart
    const formattedData = Object.entries(monthlyUsage).map(([cycle, count]) => {
      const [year, monthNum] = cycle.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

      return {
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1).replace('.', ''), // Capitalize and remove dot
        count: count,
        fullDate: cycle,
      };
    });

    // Calculate total
    const total = Object.values(monthlyUsage).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      usage: formattedData,
      total: total,
    });
  } catch (error) {
    console.error('[API] Error fetching usage history:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch usage history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
