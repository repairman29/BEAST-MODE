import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../lib/api-middleware';

/**
 * Model Optimization API
 * 
 * Provides model optimization (pruning, quantization, etc.)
 * 
 * Phase 2: Optimization Services Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const modelOptimizerPath = path.join(process.cwd(), '../../../lib/optimization/modelOptimizer');
    const { getModelOptimizer } = require(modelOptimizerPath);
    const optimizer = getModelOptimizer();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'status';

      if (operation === 'status') {
        return NextResponse.json({
          status: 'ok',
          message: 'Model optimizer ready',
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Model optimization API ready',
        operations: ['status'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'prune') {
        const { model, threshold } = body;
        const pruned = await optimizer.pruneModel(model, threshold || 0.1);
        return NextResponse.json({
          status: 'ok',
          data: { pruned },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'quantize') {
        const { model } = body;
        const quantized = await optimizer.quantizeModel(model);
        return NextResponse.json({
          status: 'ok',
          data: { quantized },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'optimize') {
        const { model, options } = body;
        const optimized = await optimizer.optimizeModel(model, options);
        return NextResponse.json({
          status: 'ok',
          data: { optimized },
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

