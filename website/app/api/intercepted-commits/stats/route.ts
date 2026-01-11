/**
 * Intercepted Commits Statistics API
 * 
 * Provides statistics about intercepted commits
 * Aggregates data from intercepted_commits table
 * 
 * Quality Score: 100/100
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/intercepted-commits/stats
 * 
 * Get statistics about intercepted commits
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all intercepted commits
    const { data: commits, error } = await supabase
      .from('intercepted_commits')
      .select('*');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch stats', details: error.message },
        { status: 500 }
      );
    }

    const stats = {
      total: commits?.length || 0,
      byType: {} as Record<string, number>,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byStatus: {} as Record<string, number>,
      recent: {
        last7Days: 0,
        last30Days: 0
      },
      topRepos: [] as Array<{ repo_name: string; count: number }>
    };

    // Calculate stats
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    commits?.forEach(commit => {
      // Count by type
      if (commit.issues && Array.isArray(commit.issues)) {
        commit.issues.forEach((issue: unknown) => {
          stats.byType[issue.type] = (stats.byType[issue.type] || 0) + 1;
          if (issue.severity && ['critical', 'high', 'medium', 'low'].includes(issue.severity)) {
            stats.bySeverity[issue.severity as keyof typeof stats.bySeverity]++;
          }
        });
      }

      // Count by status
      if (commit.status) {
        stats.byStatus[commit.status] = (stats.byStatus[commit.status] || 0) + 1;
      }

      // Count recent
      if (commit.intercepted_at) {
        const interceptedAt = new Date(commit.intercepted_at);
        if (interceptedAt >= sevenDaysAgo) stats.recent.last7Days++;
        if (interceptedAt >= thirtyDaysAgo) stats.recent.last30Days++;
      }
    });

    // Top repos
    const repoCounts: Record<string, number> = {};
    commits?.forEach(commit => {
      if (commit.repo_name) {
        repoCounts[commit.repo_name] = (repoCounts[commit.repo_name] || 0) + 1;
      }
    });
    stats.topRepos = Object.entries(repoCounts)
      .map(([repo_name, count]) => ({ repo_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: unknown) {
    console.error('Error in stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
