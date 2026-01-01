import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../../lib/api-middleware';

/**
 * Performance Optimization API
 * 
 * Provides performance tracking and optimization
 * 
 * Phase 2: Optimization Services Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const performanceOptimizerPath = path.join(process.cwd(), '../../../lib/scale/performanceOptimizer');
    const { getPerformanceOptimizer } = require(performanceOptimizerPath);
    const optimizer = getPerformanceOptimizer();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'summary';

      if (operation === 'summary') {
        const stats = optimizer.getPerformanceStatistics();
        return NextResponse.json({
          status: 'ok',
          data: stats,
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'metrics') {
        const stats = optimizer.getPerformanceStatistics();
        return NextResponse.json({
          status: 'ok',
          data: { metrics: stats },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'recommendations') {
        const recommendations = optimizer.getOptimizationRecommendations();
        return NextResponse.json({
          status: 'ok',
          data: { recommendations },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Performance optimization API ready',
        operations: ['summary', 'metrics', 'recommendations'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'track') {
        const { metric, value, metadata } = body;
        optimizer.trackMetric(metric, value, metadata);
        return NextResponse.json({
          status: 'ok',
          message: 'Metric tracked',
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'optimize') {
        const { target } = body;
        // Optimization would be implemented here
        const optimization = { target, recommendations: [] };
        return NextResponse.json({
          status: 'ok',
          data: { optimization },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'detect-opportunities') {
        const recommendations = optimizer.getOptimizationRecommendations();
        return NextResponse.json({
          status: 'ok',
          data: { opportunities: recommendations },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json(
        { error: `Unknown operation: ${operation}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
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

export async function GET(req: NextRequest) {
  return withProductionIntegration(handler)(req);
}
export async function POST(req: NextRequest) {
  return withProductionIntegration(handler)(req);
}

