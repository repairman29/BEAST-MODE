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

    // Query from notifications table
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .or('notification_category.is.null,notification_category.eq.beast-mode')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('[Notifications] Error querying notifications:', error);
      // Fallback to empty array if table doesn't exist yet
      return NextResponse.json({ notifications: [] });
    }

    const formattedNotifications = (notifications || []).map(notif => ({
      id: notif.id,
      timestamp: notif.created_at,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      read: notif.read || false,
      actionUrl: notif.action_url || null
    }));

    return NextResponse.json({ notifications: formattedNotifications });
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json(
      { error: 'Failed to get notifications', details: error.message },
      { status: 500 }
    );
  }
}

