import { NextRequest, NextResponse } from 'next/server';

/**
 * Model Registry API
 * 
 * Provides model registry and versioning functionality
 * 
 * Phase 3: Model Management Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const mlflowPath = path.join(process.cwd(), '../../../lib/mlops/mlflowService');
    const { MLflowService } = require(mlflowPath);
    const mlflow = new MLflowService();
    await mlflow.initialize();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'list';

      if (operation === 'list') {
        const runs = await mlflow.getRuns(100);
        return NextResponse.json({
          status: 'ok',
          data: { runs: runs.runs || [] },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'get') {
        const runId = searchParams.get('runId');
        if (!runId) {
          return NextResponse.json(
            { error: 'runId required' },
            { status: 400 }
          );
        }
        // Get run would be implemented here
        return NextResponse.json({
          status: 'ok',
          data: { run: { id: runId } },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'best') {
        const metricName = searchParams.get('metricName') || 'accuracy';
        const bestRun = await mlflow.getBestRun(metricName);
        return NextResponse.json({
          status: 'ok',
          data: { bestRun },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Model registry API ready',
        operations: ['list', 'get', 'best'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'start-run') {
        const { runName, tags } = body;
        const run = await mlflow.startRun(runName, tags || {});
        return NextResponse.json({
          status: 'ok',
          data: { run },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'log-metric') {
        const { key, value, step } = body;
        await mlflow.logMetric(key, value, step);
        return NextResponse.json({
          status: 'ok',
          message: 'Metric logged',
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'log-param') {
        const { key, value } = body;
        await mlflow.logParam(key, value);
        return NextResponse.json({
          status: 'ok',
          message: 'Parameter logged',
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'end-run') {
        const { status } = body;
        await mlflow.endRun(status || 'FINISHED');
        return NextResponse.json({
          status: 'ok',
          message: 'Run ended',
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
    try {
    } catch (error) {
      // Fall through to direct handler
    }
  }
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

