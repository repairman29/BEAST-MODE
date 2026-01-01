import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceStats } from '../../../../lib/api-middleware';

/**
 * Performance Statistics API
 * 
 * Returns real-time performance metrics
 * 
 * Phase 1, Week 1: Production Integration
 */

export async function GET(request: NextRequest) {
  try {
    const stats = await getPerformanceStats();

    if (!stats) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Performance monitor not available',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

