import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../../../lib/supabase';

/**
 * POST /api/beast-mode/janitor/errors
 * Log janitor errors for debugging
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, stack, componentStack, timestamp } = body;
    
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = getSupabaseClientOrNull();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Janitor Error]', {
        error,
        stack,
        componentStack,
        timestamp,
        userId
      });
    }

    // TODO: Store in error_logs table if needed
    if (supabase) {
      // Could insert into error_logs table here
    }

    return NextResponse.json({
      success: true,
      message: 'Error logged'
    });
  } catch (error: any) {
    console.error('Failed to log error:', error);
    return NextResponse.json(
      { error: 'Failed to log error', details: error.message },
      { status: 500 }
    );
  }
}

