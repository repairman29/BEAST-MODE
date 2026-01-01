import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../../lib/api-middleware';

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
    const { ABTestingFramework } = require(abTestingPath);
    const abTesting = new ABTestingFramework();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'list';

      if (operation === 'list') {
        const experiments = abTesting.getAllExperiments();
        return NextResponse.json({
          status: 'ok',
          data: { experiments },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'active') {
        const experiments = abTesting.getActiveExperiments();
        return NextResponse.json({
          status: 'ok',
          data: { experiments },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'get') {
        const experimentName = searchParams.get('experimentName');
        if (!experimentName) {
          return NextResponse.json(
            { error: 'experimentName required' },
            { status: 400 }
          );
        }
        const results = abTesting.getResults(experimentName);
        return NextResponse.json({
          status: 'ok',
          data: { results },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'A/B testing API ready',
        operations: ['list', 'active', 'get'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'create') {
        const { name, variants } = body;
        const experiment = await abTesting.createExperiment(name, variants);
        return NextResponse.json({
          status: 'ok',
          data: { experiment },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'get-variant') {
        const { experimentName, userId } = body;
        const variant = abTesting.getVariant(experimentName, userId);
        return NextResponse.json({
          status: 'ok',
          data: { variant },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'record-result') {
        const { experimentName, variantId, result } = body;
        await abTesting.recordResult(experimentName, variantId, result);
        return NextResponse.json({
          status: 'ok',
          message: 'Result recorded',
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'end') {
        const { experimentName } = body;
        const results = await abTesting.endExperiment(experimentName);
        return NextResponse.json({
          status: 'ok',
          data: { results },
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

