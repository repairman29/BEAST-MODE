import { NextRequest, NextResponse } from 'next/server';
import { analyzeTrends } from "../../../../lib/api-middleware';

/**
 * Trends API
 * 
 * Returns trend analysis for performance metrics
 * 
 * Phase 1, Week 2: High-Impact Services Integration
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'all';
    const timeRange = parseInt(searchParams.get('timeRange') || '3600000'); // Default 1 hour

    const trends = await analyzeTrends(endpoint, timeRange);

    if (!trends) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Trend analysis not available or insufficient data',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      endpoint,
      timeRange,
      trends,
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



