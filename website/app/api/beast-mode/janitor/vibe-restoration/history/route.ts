import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../../lib/supabase';

/**
 * GET /api/beast-mode/janitor/vibe-restoration/history
 * Get vibe restoration history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repository = searchParams.get('repository');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = await getSupabaseClientOrNull();

    if (!supabase) {
      return NextResponse.json({ states: [] });
    }

    let query = supabase
      .from('vibe_restoration_states')
      .select('*')
      .eq('user_id', userId || '')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (repository) {
      query = query.eq('repository', repository);
    }

    const { data: states, error } = await query;

    if (error) {
      console.error('Failed to fetch vibe restoration history:', error);
      return NextResponse.json(
        { error: 'Failed to get history', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      states: states?.map(state => ({
        id: state.id,
        timestamp: state.created_at,
        qualityScore: state.quality_score,
        commitHash: state.commit_hash,
        description: state.description,
        isGood: state.is_good
      })) || []
    });
  } catch (error: any) {
    console.error('Failed to get vibe restoration history:', error);
    return NextResponse.json(
      { error: 'Failed to get history', details: error.message },
      { status: 500 }
    );
  }
}
