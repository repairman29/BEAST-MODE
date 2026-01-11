import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Latency Optimization API
 * Provides latency optimization recommendations and status
 */

let latencyOptimizer: any;
let customModelMonitoring: any;

try {
  latencyOptimizer = loadModule('@/lib/mlops/latencyOptimizer');
  customModelMonitoring = loadModule('@/lib/mlops/customModelMonitoring');
} catch (error) {
  console.warn('[Latency Optimization API] Some modules not available:', error);
}

/**
 * GET /api/optimization/latency
 * Get latency optimization status and recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

    // Get optimization status if optimizer is available
    if (latencyOptimizer && typeof latencyOptimizer.getOptimizationStatus === 'function') {
      const status = latencyOptimizer.getOptimizationStatus(timeRange);
      return NextResponse.json({
        success: true,
        optimization: status,
        timeRange
      });
    }

    // Fallback: Get latency metrics from monitoring
    if (customModelMonitoring && typeof customModelMonitoring.getMetrics === 'function') {
      const metrics = customModelMonitoring.getMetrics(timeRange);
      const optimization = {
        currentLatency: metrics.averageLatency || 0,
        p95Latency: metrics.p95Latency || 0,
        p99Latency: metrics.p99Latency || 0,
        cacheHitRate: metrics.cacheHitRate || 0,
        recommendations: []
      };

      // Basic recommendations based on latency
      if (optimization.currentLatency > 500) {
        optimization.recommendations.push({
          type: 'caching',
          priority: 'high',
          message: 'Consider enabling caching to reduce latency'
        });
      }
      if (optimization.p95Latency > 1000) {
        optimization.recommendations.push({
          type: 'connection_pooling',
          priority: 'medium',
          message: 'Consider connection pooling for external services'
        });
      }

      return NextResponse.json({
        success: true,
        optimization,
        timeRange,
        note: 'Basic optimization data (optimizer not available)'
      });
    }

    // Default response
    return NextResponse.json({
      success: true,
      optimization: {
        currentLatency: 0,
        recommendations: [],
        note: 'Monitoring not available'
      },
      timeRange
    });

  } catch (error: any) {
    console.error('[Latency Optimization API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get latency optimization', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/optimization/latency
 * Apply latency optimization settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: 'settings are required' },
        { status: 400 }
      );
    }

    // Apply optimization if optimizer is available
    if (latencyOptimizer && typeof latencyOptimizer.applyOptimization === 'function') {
      const result = latencyOptimizer.applyOptimization(settings);
      return NextResponse.json({
        success: true,
        applied: result,
        message: 'Optimization applied successfully'
      });
    }

    // Fallback: Just acknowledge
    return NextResponse.json({
      success: true,
      message: 'Optimization settings received (optimizer not available)',
      note: 'Settings would be applied when optimizer is available'
    });

  } catch (error: any) {
    console.error('[Latency Optimization API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to apply optimization', details: error.message },
      { status: 500 }
    );
  }
}
