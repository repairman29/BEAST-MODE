import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../lib/supabase';

/**
 * GET /api/beast-mode/janitor/notifications
 * Get janitor notifications
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = await getSupabaseClientOrNull();

    if (!supabase) {
      // Mock data fallback
      return NextResponse.json({
        notifications: [
          {
            id: '1',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            type: 'refactor-complete',
            title: 'Overnight Refactoring Complete',
            message: 'Fixed 23 issues and created 5 PRs',
            read: false,
            actionUrl: '/dashboard?view=janitor&tab=history'
          }
        ]
      });
    }

    // TODO: Query from notifications table
    return NextResponse.json({
      notifications: [
        {
          id: '1',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          type: 'refactor-complete',
          title: 'Overnight Refactoring Complete',
          message: 'Fixed 23 issues and created 5 PRs',
          read: false,
          actionUrl: '/dashboard?view=janitor&tab=history'
        }
      ]
    });
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json(
      { error: 'Failed to get notifications', details: error.message },
      { status: 500 }
    );
  }
}

