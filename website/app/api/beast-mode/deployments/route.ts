import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Deployments API
 *
 * Enterprise deployment orchestration across multiple platforms
 */
export async function GET(request: NextRequest) {
  try {
    // Check if BEAST MODE deployment orchestrator is available
    if (!global.beastMode || !global.beastMode.deploymentOrchestrator) {
      return NextResponse.json(
        { error: 'Deployment Orchestrator not available', deployments: [] },
        { status: 503 }
      );
    }

    // Get active deployments and history
    const activeDeployments = global.beastMode.getActiveDeployments();
    const deploymentHistory = global.beastMode.getDeploymentHistory(20);

    const allDeployments = [...activeDeployments, ...deploymentHistory];

    return NextResponse.json({
      deployments: allDeployments,
      count: allDeployments.length,
      active: activeDeployments.length,
      completed: deploymentHistory.filter(d => d.status === 'completed').length,
      failed: deploymentHistory.filter(d => d.status === 'failed').length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Deployments API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve deployments',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for creating new deployments
 */
export async function POST(request: NextRequest) {
  try {
    const deploymentConfig = await request.json();

    // Check if BEAST MODE deployment orchestrator is available
    if (!global.beastMode || !global.beastMode.deploymentOrchestrator) {
      return NextResponse.json(
        { error: 'Deployment Orchestrator not available' },
        { status: 503 }
      );
    }

    // Create new deployment
    const result = await global.beastMode.deployApplication(deploymentConfig);

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Create Deployment API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create deployment',
        details: error.message
      },
      { status: 500 }
    );
  }
}

