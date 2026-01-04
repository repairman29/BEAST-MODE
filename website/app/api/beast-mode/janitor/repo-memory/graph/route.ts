import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../../lib/supabase';

/**
 * GET /api/beast-mode/janitor/repo-memory/graph
 * Get repo memory graph
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repository = searchParams.get('repository');
    
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = await getSupabaseClientOrNull();

    if (!supabase) {
      return NextResponse.json({ nodes: [] });
    }

    let query = supabase
      .from('repo_memory_graph')
      .select('*')
      .eq('user_id', userId || '');

    if (repository) {
      query = query.eq('repository', repository);
    }

    const { data: nodes, error } = await query;

    if (error) {
      console.error('Failed to fetch repo memory graph:', error);
      return NextResponse.json(
        { error: 'Failed to get graph', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      nodes: nodes?.map(node => ({
        id: node.node_id,
        label: node.node_label,
        type: node.node_type,
        connections: node.connections || [],
        metadata: node.metadata || {}
      })) || []
    });
  } catch (error: any) {
    console.error('Failed to get repo memory graph:', error);
    return NextResponse.json(
      { error: 'Failed to get graph', details: error.message },
      { status: 500 }
    );
  }
}
