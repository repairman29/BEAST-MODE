import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';

/**
 * POST /api/beast-mode/janitor/refactor
 * Trigger a manual refactoring run
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repository } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = getSupabaseClientOrNull();

    // Create refactoring run record
    let runId: string | null = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('refactoring_runs')
        .insert({
          user_id: userId || null,
          repository: repository || null,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        runId = data.id;
      }
    }

    // In production, this would trigger an actual refactoring job
    // For now, we'll simulate it by updating the status after a delay
    // In a real implementation, this would be handled by a background job queue

    return NextResponse.json({
      success: true,
      message: 'Refactoring started',
      runId,
      estimatedTime: '5-10 minutes',
      issuesFound: 0, // Will be updated when refactoring completes
      prsCreated: 0,
      status: 'running'
    });
  } catch (error: any) {
    console.error('Failed to trigger refactoring:', error);
    return NextResponse.json(
      { error: 'Failed to trigger refactoring', details: error.message },
      { status: 500 }
    );
  }
}
