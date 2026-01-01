import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../../lib/api-middleware';

/**
 * Cost Optimization API
 * 
 * Provides cost tracking and optimization
 * 
 * Phase 2: Optimization Services Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const costOptimizerPath = path.join(process.cwd(), '../../../lib/optimization/costOptimization');
    const { getCostOptimization } = require(costOptimizerPath);
    const optimizer = getCostOptimization();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'summary';

      if (operation === 'summary') {
        const analytics = optimizer.getCostAnalytics();
        return NextResponse.json({
          status: 'ok',
          data: analytics,
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'predict') {
        const duration = parseInt(searchParams.get('duration') || '3600');
        // Cost prediction would be implemented here
        const prediction = { estimated: 0, duration };
        return NextResponse.json({
          status: 'ok',
          data: prediction,
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'budgets') {
        // Get budgets would be implemented here
        const budgets = [];
        return NextResponse.json({
          status: 'ok',
          data: { budgets },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Cost optimization API ready',
        operations: ['summary', 'predict', 'budgets'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'track') {
        const { operation: op, cost, metadata } = body;
        optimizer.trackCost(op, cost);
        return NextResponse.json({
          status: 'ok',
          message: 'Cost tracked',
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'set-budget') {
        const { tenantId, amount } = body;
        optimizer.setBudget(tenantId, amount);
        return NextResponse.json({
          status: 'ok',
          message: 'Budget set',
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'get-recommendations') {
        const { tenantId } = body;
        const recommendations = optimizer.optimizeCosts(tenantId || 'default');
        return NextResponse.json({
          status: 'ok',
          data: { recommendations },
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
  const wrappedHandler = await withProductionIntegration(handler);
  return wrappedHandler(req);
}
export async function POST(req: NextRequest) {
  const wrappedHandler = await withProductionIntegration(handler);
  return wrappedHandler(req);
}

