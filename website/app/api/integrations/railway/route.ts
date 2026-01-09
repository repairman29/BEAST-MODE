import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Railway Integration API
 * 
 * Provides endpoints for Railway deployments to interact with BEAST MODE
 */

// In-memory storage (in production, use database)
const railwayDeployments: any[] = [];

/**
 * GET /api/integrations/railway
 * Get Railway deployments
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    let deployments = railwayDeployments;

    if (userId) {
      deployments = deployments.filter(d => d.userId === userId);
    }

    if (projectId) {
      deployments = deployments.filter(d => d.projectId === projectId);
    }

    // Sort by most recent
    deployments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      deployments: deployments.slice(0, 50), // Limit to 50 most recent
      count: deployments.length
    });

  } catch (error: any) {
    console.error('[Railway API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get Railway deployments', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/railway
 * Receive Railway deployment webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deployment, project, event } = body;

    if (!deployment || !project) {
      return NextResponse.json(
        { error: 'Deployment and project are required' },
        { status: 400 }
      );
    }

    // Store deployment
    const deploymentRecord = {
      id: deployment.id || `railway-${Date.now()}`,
      projectId: project.id,
      project: project.name,
      url: deployment.url || deployment.service?.url,
      status: deployment.status || 'building',
      branch: deployment.branch || 'main',
      commit: deployment.commit || deployment.git?.sha || 'unknown',
      qualityScore: null, // Will be set after quality check
      createdAt: deployment.createdAt || new Date().toISOString(),
      completedAt: deployment.completedAt || null,
      userId: body.userId || null
    };

    railwayDeployments.unshift(deploymentRecord);
    
    // Keep only last 1000 deployments
    if (railwayDeployments.length > 1000) {
      railwayDeployments.splice(1000);
    }

    // If deployment is ready, run quality check
    if (event === 'deployment.ready' || deployment.status === 'ready') {
      // Run quality check (async, don't wait)
      fetch(`${request.nextUrl.origin}/api/repos/quality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: project.repository || project.name,
          url: deploymentRecord.url
        })
      }).catch(err => console.error('Quality check failed:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Railway deployment received',
      deployment: deploymentRecord
    });

  } catch (error: any) {
    console.error('[Railway API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process Railway deployment', details: error.message },
      { status: 500 }
    );
  }
}
