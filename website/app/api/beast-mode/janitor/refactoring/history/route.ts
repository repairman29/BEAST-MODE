import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../../lib/supabase';

/**
 * GET /api/beast-mode/janitor/refactoring/history
 * Get refactoring history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repository = searchParams.get('repository');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = getSupabaseClientOrNull();

    if (!supabase) {
      return NextResponse.json({ runs: [] });
    }

    let query = supabase
      .from('refactoring_runs')
      .select('*')
      .eq('user_id', userId || '')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (repository) {
      query = query.eq('repository', repository);
    }

    const { data: runs, error } = await query;

    if (error) {
      console.error('Failed to fetch refactoring history:', error);
      return NextResponse.json(
        { error: 'Failed to get refactoring history', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      runs: runs?.map(run => ({
        id: run.id,
        timestamp: run.created_at,
        issuesFixed: run.issues_fixed || 0,
        prsCreated: run.prs_created || 0,
        status: run.status,
        changes: run.changes || []
      })) || []
    });
  } catch (error: any) {
    console.error('Failed to get refactoring history:', error);
    return NextResponse.json(
      { error: 'Failed to get refactoring history', details: error.message },
      { status: 500 }
    );
  }
}
