import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../../lib/supabase';

/**
 * GET /api/beast-mode/janitor/activity
 * Get recent janitor activity feed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = getSupabaseClientOrNull();

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

    // TODO: Create activity_logs table or query from existing tables
    // For now, return mock data
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
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          type: 'enforcement',
          feature: 'Architecture Enforcement',
          message: 'Blocked 3 violations: secrets in code',
          status: 'success',
          details: { violationsBlocked: 3 }
        }
      ]
    });
  } catch (error: any) {
    console.error('Failed to get activity feed:', error);
    return NextResponse.json(
      { error: 'Failed to get activity feed', details: error.message },
      { status: 500 }
    );
  }
}

