/**
 * Get Plan Configuration by Plan ID
 *
 * Returns the complete plan configuration including limits, features, etc.
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: planId } = params;

    if (!planId) {
      return NextResponse.json({ error: 'Missing plan ID' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get complete plan configuration
    const { data: planData, error } = await supabase
      .from('plans')
      .select('id, questions_month, doc_type, docs_size, max_question_types, support')
      .eq('id', planId)
      .maybeSingle();

    if (error || !planData) {
      console.error('[API] Plan not found:', planId, error);
      // Return default starter config as fallback
      return NextResponse.json(
        {
          plan: {
            id: 'starter',
            questions_month: 30,
            doc_type: ['text', 'docx'],
            docs_size: 10,
            max_question_types: 1,
            support: ['email'],
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ plan: planData }, { status: 200 });
  } catch (error) {
    console.error('[API] Error fetching plan config:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch plan configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
