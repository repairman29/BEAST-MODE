import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../../lib/api-middleware';

/**
 * Feedback Loop API
 * 
 * Provides feedback loop functionality for ML models
 * 
 * Phase 2: Advanced MLOps Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const feedbackLoopPath = path.join(process.cwd(), '../../../lib/mlops/feedbackLoop');
    const { FeedbackLoop } = require(feedbackLoopPath);
    const feedbackLoop = new FeedbackLoop();
    await feedbackLoop.initialize();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'status';

      if (operation === 'status') {
        return NextResponse.json({
          status: 'ok',
          message: 'Feedback loop ready',
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Feedback loop API ready',
        operations: ['status'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'submit') {
        const { serviceName, prediction, actual, context } = body;
        await feedbackLoop.recordFeedback(serviceName, prediction, actual, context);
        return NextResponse.json({
          status: 'ok',
          data: { submitted: true },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'process') {
        await feedbackLoop.processFeedbackBatch();
        return NextResponse.json({
          status: 'ok',
          data: { processed: true },
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

