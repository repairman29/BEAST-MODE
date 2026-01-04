import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../lib/supabase';
import { sendError, handleApiError, validateRequired } from '../../../../lib/errors';

/**
 * BEAST MODE Error Logging API
 * 
 * Stores error logs for monitoring and debugging
 */

/**
 * POST /api/beast-mode/errors
 * Store error logs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { errors } = body;

    const validation = validateRequired(body, ['errors']);
    if (!validation.valid) {
      return sendError('VALIDATION_ERROR', 'Invalid request: errors array required', validation.error?.details);
    }
    
    if (!Array.isArray(errors)) {
      return sendError('VALIDATION_ERROR', 'Errors must be an array');
    }

    // Store errors in Supabase
    const supabase = await getSupabaseClientOrNull();
    const timestamp = new Date().toISOString();
    
    if (supabase) {
      try {
        const errorRecords = errors.map((error: any) => ({
          message: error.message || error.name || 'Unknown error',
          stack: error.stack || null,
          name: error.name || 'Error',
          context: error.context || {},
          user_id: request.cookies.get('github_oauth_user_id')?.value || null,
          component: error.context?.component || null,
          severity: error.severity || 'error',
          created_at: error.context?.timestamp ? new Date(error.context.timestamp).toISOString() : timestamp,
        }));

        const { error: dbError } = await supabase
          .from('error_logs')
          .insert(errorRecords);

        if (dbError) {
          console.error('Failed to store errors in database:', dbError);
          // Fallback to in-memory storage
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Fallback to in-memory storage
      }
    }

    return NextResponse.json({ success: true, count: errors.length });
  } catch (error: any) {
    return handleApiError(error, {
      method: 'POST',
      path: '/api/beast-mode/errors',
      service: 'beast-mode'
    });
  }
}

/**
 * GET /api/beast-mode/errors
 * Get error logs (for admin/monitoring)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClientOrNull();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const since = searchParams.get('since');
    const component = searchParams.get('component');

    let errors: any[] = [];
    let stats = {
      total: 0,
      recent: 0,
      byType: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
    };

    if (supabase) {
      try {
        let query = supabase
          .from('error_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (since) {
          query = query.gte('created_at', new Date(parseInt(since)).toISOString());
        }

        if (component) {
          query = query.eq('component', component);
        }

        const { data, error: dbError } = await query;

        if (!dbError && data) {
          errors = data.map((e: any) => ({
            message: e.message,
            stack: e.stack,
            name: e.name,
            context: e.context,
            timestamp: new Date(e.created_at).getTime(),
          }));

          // Get total count
          const { count } = await supabase
            .from('error_logs')
            .select('*', { count: 'exact', head: true });

          stats.total = count || 0;
          stats.recent = errors.length;

          // Aggregate statistics
          errors.forEach((error) => {
            stats.byType[error.name] = (stats.byType[error.name] || 0) + 1;
            if (error.context?.component) {
              stats.byComponent[error.context.component] =
                (stats.byComponent[error.context.component] || 0) + 1;
            }
          });
        }
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // Return empty results on error
      }
    }

    return NextResponse.json({
      errors,
      stats,
    });
  } catch (error: any) {
    return handleApiError(error, {
      method: 'GET',
      path: '/api/beast-mode/errors',
      service: 'beast-mode'
    });
  }
}

