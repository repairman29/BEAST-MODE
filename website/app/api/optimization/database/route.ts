import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../lib/api-middleware';

/**
 * Database Optimization API
 * 
 * Provides database optimization functionality
 * 
 * Phase 4: Performance Optimization
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const dbOptimizerPath = path.join(process.cwd(), '../../../lib/scale/databaseOptimizer');
    const { getDatabaseOptimizer } = require(dbOptimizerPath);
    const optimizer = getDatabaseOptimizer();
    await optimizer.initialize();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'status';

      if (operation === 'status') {
        return NextResponse.json({
          status: 'ok',
          message: 'Database optimizer ready',
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'analyze') {
        const stats = optimizer.getQueryStatistics();
        const recommendations = optimizer.getIndexRecommendations();
        return NextResponse.json({
          status: 'ok',
          data: { 
            stats,
            recommendations
          },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Database optimization API ready',
        operations: ['status', 'analyze'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'optimize') {
        const { query, params } = body;
        const result = await optimizer.optimizeQuery(query, params || []);
        return NextResponse.json({
          status: 'ok',
          data: { result },
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

export const GET = withProductionIntegration(handler);
export const POST = withProductionIntegration(handler);

