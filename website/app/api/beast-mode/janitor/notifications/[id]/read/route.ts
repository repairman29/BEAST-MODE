import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../../../lib/supabase';

/**
 * POST /api/beast-mode/janitor/notifications/[id]/read
 * Mark notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = await getSupabaseClientOrNull();

    if (!supabase) {
      return NextResponse.json({ success: true, id });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Update notification in database
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error(`[Notification Read] Error updating notification:`, error);
      return NextResponse.json(
        { error: 'Failed to mark notification as read', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id,
      notification: data,
      message: 'Notification marked as read'
    });
  } catch (error: any) {
    console.error(`Failed to mark notification ${params.id} as read:`, error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read', details: error.message },
      { status: 500 }
    );
  }
}

