import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Error Logging API
 * 
 * Stores error logs for monitoring and debugging
 */

declare global {
  var errorLogs: Array<{
    message: string;
    stack?: string;
    name: string;
    context: any;
    timestamp: number;
  }> | undefined;
}

if (!global.errorLogs) {
  global.errorLogs = [];
}

/**
 * POST /api/beast-mode/errors
 * Store error logs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { errors } = body;

    if (!errors || !Array.isArray(errors)) {
      return NextResponse.json(
        { error: 'Invalid request: errors array required' },
        { status: 400 }
      );
    }

    // Store errors (in production, this would go to a database)
    const timestamp = Date.now();
    errors.forEach((error: any) => {
      global.errorLogs!.push({
        ...error,
        timestamp: error.context?.timestamp || timestamp,
      });
    });

    // Keep only last 1000 errors
    if (global.errorLogs.length > 1000) {
      global.errorLogs = global.errorLogs.slice(-1000);
    }

    return NextResponse.json({ success: true, count: errors.length });
  } catch (error: any) {
    console.error('Error logging API error:', error);
    return NextResponse.json(
      { error: 'Failed to store error logs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/beast-mode/errors
 * Get error logs (for admin/monitoring)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const since = searchParams.get('since');

    let errors = global.errorLogs || [];

    // Filter by timestamp if provided
    if (since) {
      const sinceTimestamp = parseInt(since);
      errors = errors.filter((e) => e.timestamp >= sinceTimestamp);
    }

    // Sort by timestamp (newest first) and limit
    errors = errors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    // Aggregate error statistics
    const stats = {
      total: global.errorLogs?.length || 0,
      recent: errors.length,
      byType: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
    };

    errors.forEach((error) => {
      stats.byType[error.name] = (stats.byType[error.name] || 0) + 1;
      if (error.context?.component) {
        stats.byComponent[error.context.component] =
          (stats.byComponent[error.context.component] || 0) + 1;
      }
    });

    return NextResponse.json({
      errors,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}

