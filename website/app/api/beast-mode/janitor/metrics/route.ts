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

    // Query actual metrics from database
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    // Aggregate from activity_logs
    const { data: activities, error: activityError } = await supabase
      .from('activity_logs')
      .select('activity_type, status, details, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .order('created_at', { ascending: true });

    if (activityError) {
      console.warn('[Metrics] Error querying activity_logs:', activityError);
    }

    // Group by date and calculate metrics
    const metricsByDate = new Map<string, any>();
    
    // Initialize all dates
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      metricsByDate.set(dateKey, {
        date: date.toISOString(),
        issuesFixed: 0,
        violationsBlocked: 0,
        testsRun: 0,
        scansRun: 0
      });
    }

    // Aggregate activities
    if (activities) {
      for (const activity of activities) {
        const dateKey = new Date(activity.created_at).toISOString().split('T')[0];
        const metric = metricsByDate.get(dateKey);
        if (metric) {
          if (activity.activity_type === 'refactor') {
            metric.issuesFixed += activity.details?.issuesFixed || 0;
          } else if (activity.activity_type === 'enforcement') {
            metric.violationsBlocked += activity.details?.violationsBlocked || 0;
          } else if (activity.activity_type === 'test') {
            metric.testsRun += 1;
          } else if (activity.activity_type === 'scan') {
            metric.scansRun += 1;
          }
        }
      }
    }

    const metrics = Array.from(metricsByDate.values());

    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error('Failed to get metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics', details: error.message },
      { status: 500 }
    );
  }
}

