import { NextRequest, NextResponse } from 'next/server';

/**
 * Deployment Strategies API
 *
 * Get supported deployment strategies
 */
export async function GET(request: NextRequest) {
  try {
    // Check if BEAST MODE deployment orchestrator is available
    if (!global.beastMode || !global.beastMode.deploymentOrchestrator) {
      return NextResponse.json(
        { error: 'Deployment Orchestrator not available', strategies: [] },
        { status: 503 }
      );
    }

    // Get supported strategies
    const strategies = global.beastMode.getSupportedStrategies();

    return NextResponse.json({
      strategies,
      count: strategies.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Strategies API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve strategies',
        details: error.message
      },
      { status: 500 }
    );
  }
}

