import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';

/**
 * GET /api/beast-mode/janitor/metrics
 * Get metrics over time for janitor features
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = await getSupabaseClientOrNull();

    if (!supabase) {
      // Generate mock data
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const metrics = [];
      for (let i = days - 1; i >= 0; i--) {
        metrics.push({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          issuesFixed: Math.floor(Math.random() * 30) + 10,
          violationsBlocked: Math.floor(Math.random() * 15) + 5,
          testsRun: Math.floor(Math.random() * 20) + 5,
          scansRun: Math.floor(Math.random() * 50) + 20
        });
      }
      return NextResponse.json({ metrics });
    }

    // TODO: Query actual metrics from database
    // Aggregate from refactoring_runs, vibe_ops_tests, etc.
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const metrics = [];
    for (let i = days - 1; i >= 0; i--) {
      metrics.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        issuesFixed: Math.floor(Math.random() * 30) + 10,
        violationsBlocked: Math.floor(Math.random() * 15) + 5,
        testsRun: Math.floor(Math.random() * 20) + 5,
        scansRun: Math.floor(Math.random() * 50) + 20
      });
    }

    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error('Failed to get metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics', details: error.message },
      { status: 500 }
    );
  }
}

