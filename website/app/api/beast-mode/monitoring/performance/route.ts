import { NextRequest, NextResponse } from 'next/server';

/**
 * Performance Monitoring API
 * 
 * Receives and stores performance metrics
 */

// In-memory storage (replace with database in production)
let performanceData: {
  stats: Record<string, any>;
  timestamp: number;
}[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stats, timestamp } = body;

    // Store performance data
    performanceData.push({
      stats,
      timestamp: timestamp || Date.now(),
    });

    // Keep only last 1000 entries
    if (performanceData.length > 1000) {
      performanceData = performanceData.slice(-1000);
    }

    return NextResponse.json({
      success: true,
      message: 'Performance metrics recorded',
    });
  } catch (error: any) {
    console.error('Performance monitoring API error:', error);
    return NextResponse.json(
      { error: 'Failed to record performance metrics', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const timeWindow = searchParams.get('timeWindow') ? parseInt(searchParams.get('timeWindow')!) : undefined;

    // Get latest stats
    const latest = performanceData[performanceData.length - 1];
    if (!latest) {
      return NextResponse.json({
        stats: {},
        message: 'No performance data available',
      });
    }

    let stats = latest.stats;

    // Filter by operation if specified
    if (operation && stats[operation]) {
      stats = { [operation]: stats[operation] };
    }

    // Filter by time window if specified
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      const filtered = performanceData.filter(d => d.timestamp >= cutoff);
      if (filtered.length > 0) {
        // Aggregate stats from time window
        const aggregated: Record<string, any> = {};
        for (const data of filtered) {
          for (const [op, stat] of Object.entries(data.stats)) {
            if (!aggregated[op]) {
              aggregated[op] = {
                operation: op,
                count: 0,
                totalDuration: 0,
                errorCount: 0,
                durations: [],
              };
            }
            aggregated[op].count += stat.count || 0;
            aggregated[op].totalDuration += stat.totalDuration || 0;
            aggregated[op].errorCount += stat.errorCount || 0;
            // Collect durations for percentile calculation
            if (stat.durations) {
              aggregated[op].durations.push(...stat.durations);
            }
          }
        }
        // Calculate averages and percentiles
        for (const [op, agg] of Object.entries(aggregated)) {
          agg.averageDuration = agg.count > 0 ? Math.round(agg.totalDuration / agg.count) : 0;
          agg.errorRate = agg.count > 0 ? (agg.errorCount / agg.count) * 100 : 0;
          if (agg.durations.length > 0) {
            agg.durations.sort((a: number, b: number) => a - b);
            agg.p50 = agg.durations[Math.floor(agg.durations.length * 0.5)];
            agg.p95 = agg.durations[Math.floor(agg.durations.length * 0.95)];
            agg.p99 = agg.durations[Math.floor(agg.durations.length * 0.99)];
            agg.minDuration = agg.durations[0];
            agg.maxDuration = agg.durations[agg.durations.length - 1];
          }
          delete agg.durations;
        }
        stats = aggregated;
      }
    }

    return NextResponse.json({
      stats,
      timestamp: latest.timestamp,
      message: 'Performance metrics retrieved',
    });
  } catch (error: any) {
    console.error('Performance monitoring GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve performance metrics', details: error.message },
      { status: 500 }
    );
  }
}

