import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../lib/api-middleware';

/**
 * A/B Testing API
 * 
 * Provides A/B testing functionality for ML models
 * 
 * Phase 3: Model Management Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const abTestingPath = path.join(process.cwd(), '../../../lib/mlops/abTesting');
    const { ABTesting } = require(abTestingPath);
    const abTesting = new ABTesting();
    await abTesting.initialize();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'list';

      if (operation === 'list') {
        const experiments = await abTesting.listExperiments();
        return NextResponse.json({
          status: 'ok',
          data: { experiments },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'get') {
        const experimentId = searchParams.get('experimentId');
        if (!experimentId) {
          return NextResponse.json(
            { error: 'experimentId required' },
            { status: 400 }
          );
        }
        const experiment = await abTesting.getExperiment(experimentId);
        return NextResponse.json({
          status: 'ok',
          data: { experiment },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'results') {
        const experimentId = searchParams.get('experimentId');
        if (!experimentId) {
          return NextResponse.json(
            { error: 'experimentId required' },
            { status: 400 }
          );
        }
        const results = await abTesting.getExperimentResults(experimentId);
        return NextResponse.json({
          status: 'ok',
          data: { results },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'A/B testing API ready',
        operations: ['list', 'get', 'results'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'create') {
        const { name, variants, config } = body;
        const experiment = await abTesting.createExperiment(name, variants, config);
        return NextResponse.json({
          status: 'ok',
          data: { experiment },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'start') {
        const { experimentId } = body;
        const started = await abTesting.startExperiment(experimentId);
        return NextResponse.json({
          status: 'ok',
          data: { started },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'stop') {
        const { experimentId } = body;
        const stopped = await abTesting.stopExperiment(experimentId);
        return NextResponse.json({
          status: 'ok',
          data: { stopped },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'select-winner') {
        const { experimentId, winnerVariant } = body;
        const selected = await abTesting.selectWinner(experimentId, winnerVariant);
        return NextResponse.json({
          status: 'ok',
          data: { selected },
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

