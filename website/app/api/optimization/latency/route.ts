import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Latency Optimization API
 * 
 * Provides latency optimization statistics and controls
 */

let latencyOptimizer: any;
let batchProcessor: any;

try {
  const latencyOptimizerModule = loadModule('../../../../../lib/mlops/latencyOptimizer') ||
                                  require('../../../../../lib/mlops/latencyOptimizer');
  latencyOptimizer = latencyOptimizerModule?.getLatencyOptimizer
    ? latencyOptimizerModule.getLatencyOptimizer()
    : latencyOptimizerModule;

  const batchProcessorModule = loadModule('../../../../../lib/mlops/batchProcessor') ||
                                require('../../../../../lib/mlops/batchProcessor');
  batchProcessor = batchProcessorModule?.getBatchProcessor
    ? batchProcessorModule.getBatchProcessor()
    : batchProcessorModule;
} catch (error) {
  console.warn('[Latency Optimization API] Modules not available:', error);
}

/**
 * GET /api/optimization/latency
 * Get latency optimization statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats: any = {};

    if (latencyOptimizer && typeof latencyOptimizer.getStats === 'function') {
      stats.latencyOptimizer = latencyOptimizer.getStats();
    }

    if (batchProcessor && typeof batchProcessor.getStats === 'function') {
      stats.batchProcessor = batchProcessor.getStats();
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Latency Optimization API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get optimization stats', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/optimization/latency/clear
 * Clear caches and reset statistics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'clear-cache' && latencyOptimizer && typeof latencyOptimizer.clearCache === 'function') {
      latencyOptimizer.clearCache();
      return NextResponse.json({
        success: true,
        message: 'Cache cleared'
      });
    }

    if (action === 'clear-all' && latencyOptimizer && typeof latencyOptimizer.clear === 'function') {
      latencyOptimizer.clear();
      if (batchProcessor && typeof batchProcessor.clear === 'function') {
        batchProcessor.clear();
      }
      return NextResponse.json({
        success: true,
        message: 'All optimization data cleared'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Latency Optimization API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action', details: error.message },
      { status: 500 }
    );
  }
}
