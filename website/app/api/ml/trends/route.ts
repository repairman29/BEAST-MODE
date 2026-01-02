import { NextRequest, NextResponse } from 'next/server';

// Optional import - service may not be available
async function getAnalyzeTrends() {
  try {
    const middleware = await import(/* webpackIgnore: true */ '../../../../lib/api-middleware').catch(() => null);
    return middleware?.analyzeTrends || null;
  } catch {
    return null;
  }
}

/**
 * Trends API
 * 
 * Returns trend analysis for performance metrics
 * 
 * Phase 1, Week 2: High-Impact Services Integration
 */

export async function GET(request: NextRequest) {
  try {
    const analyzeTrends = await getAnalyzeTrends();
    if (!analyzeTrends) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Trend analysis not available',
        timestamp: new Date().toISOString()
      });
    }
    
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



