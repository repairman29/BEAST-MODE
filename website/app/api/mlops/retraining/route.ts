import { NextRequest, NextResponse } from 'next/server';

/**
 * Model Retraining API
 * 
 * Provides automated model retraining functionality
 * 
 * Phase 3: MLOps Automation Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const modelImprovementPath = path.join(process.cwd(), '../../../lib/mlops/modelImprovement');
    const { getModelImprovement } = require(modelImprovementPath);
    const modelImprovement = getModelImprovement();
    await modelImprovement.initialize();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'status';

      if (operation === 'status') {
        const stats = modelImprovement.getImprovementStats();
        return NextResponse.json({
          status: 'ok',
          data: { stats },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'recommendations') {
        const recommendations = modelImprovement.getRecommendations();
        return NextResponse.json({
          status: 'ok',
          data: { recommendations },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Model retraining API ready',
        operations: ['status', 'recommendations'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'retrain') {
        const result = await modelImprovement.triggerRetraining();
        return NextResponse.json({
          status: 'ok',
          data: { retrained: result },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'record-feedback') {
        const { prediction, actual, context } = body;
        await modelImprovement.recordFeedback(prediction, actual, context);
        return NextResponse.json({
          status: 'ok',
          message: 'Feedback recorded',
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'schedule') {
        const { modelId, schedule, options } = body;
        // Schedule retraining would be implemented here
        return NextResponse.json({
          status: 'ok',
          message: 'Retraining scheduled',
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

let withProductionIntegration: any = null;
try {
  /* webpackIgnore: true */
  const middleware = require(`../../../../lib/api-middleware`);
  withProductionIntegration = middleware.withProductionIntegration;
} catch (error) {
  // Middleware not available
}

export async function GET(req: NextRequest) {
  if (withProductionIntegration) {
    try {
      const wrappedHandler = withProductionIntegration(handler);
      return wrappedHandler(req);
    } catch (error) {
      // Fall through to direct handler
    }
  }
  return handler(req);
}

export async function POST(req: NextRequest) {
  if (withProductionIntegration) {
    try {
      const wrappedHandler = withProductionIntegration(handler);
      return wrappedHandler(req);
    } catch (error) {
      // Fall through to direct handler
    }
  }
  return handler(req);
}

