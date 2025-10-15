/**
 * Usage History API Route
 *
 * Fetches question generation history for the last 6 months
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

    // Calculate date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Fetch question generation history
    const { data: history, error } = await supabase
      .from('questions')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Group by month and count
    const monthlyUsage: Record<string, number> = {};
    
    // Initialize all 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyUsage[key] = 0;
    }

    // Count questions per month
    history?.forEach((question) => {
      const date = new Date(question.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthlyUsage) {
        monthlyUsage[key]++;
      }
    });

    // Format for chart
    const formattedData = Object.entries(monthlyUsage).map(([month, count]) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      return {
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1), // Capitalize
        count: count,
        fullDate: month,
      };
    });

    return NextResponse.json({
      usage: formattedData,
      total: history?.length || 0,
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
