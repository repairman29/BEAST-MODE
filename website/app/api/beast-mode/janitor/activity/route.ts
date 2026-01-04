import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';

/**
 * GET /api/beast-mode/janitor/activity
 * Get recent janitor activity feed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = await getSupabaseClientOrNull();

    if (!supabase) {
      // Mock data fallback
      return NextResponse.json({
        activities: [
          {
            id: '1',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            type: 'refactor',
            feature: 'Silent Refactoring',
            message: 'Fixed 23 issues, created 5 PRs',
            status: 'success',
            details: { issuesFixed: 23, prsCreated: 5 }
          }
        ]
      });
    }

    // Query from activity_logs table
    const { data: activities, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[Activity] Error querying activity_logs:', error);
      // Fallback to empty array if table doesn't exist yet
      return NextResponse.json({ activities: [] });
    }

    const formattedActivities = (activities || []).map(activity => ({
      id: activity.id,
      timestamp: activity.created_at,
      type: activity.activity_type,
      feature: activity.feature,
      message: activity.message,
      status: activity.status,
      details: activity.details || {}
    }));

    return NextResponse.json({ activities: formattedActivities });
  } catch (error: any) {
    console.error('Failed to get activity feed:', error);
    return NextResponse.json(
      { error: 'Failed to get activity feed', details: error.message },
      { status: 500 }
    );
  }
}

