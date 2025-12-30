import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Vercel Integration API
 * 
 * Provides endpoints for Vercel deployments to interact with BEAST MODE
 */

/**
 * POST /api/ci/vercel
 * Receive deployment quality check results from Vercel
 */
export async function POST(request: NextRequest) {
  try {
    const {
      deploymentId,
      projectId,
      url,
      branch,
      commit,
      qualityScore,
      issues,
      warnings,
      buildTime,
      timestamp
    } = await request.json();

    // Validate required fields
    if (!deploymentId || !projectId || !url) {
      return NextResponse.json(
        { error: 'Deployment ID, Project ID, and URL are required' },
        { status: 400 }
      );
    }

    // Store deployment quality check result
    // In production, this would be stored in a database
    const deploymentResult = {
      deploymentId,
      projectId,
      url,
      branch: branch || 'main',
      commit: commit || null,
      qualityScore: qualityScore || 0,
      issues: issues || [],
      warnings: warnings || [],
      buildTime: buildTime || 0,
      timestamp: timestamp || new Date().toISOString(),
      status: qualityScore >= 80 ? 'approved' : 'needs-review',
      canDeploy: qualityScore >= 80
    };

    // In production, save to database
    // await saveDeploymentCheck(deploymentResult);

    return NextResponse.json({
      success: true,
      message: 'Deployment quality check received',
      deployment: deploymentResult,
      recommendation: qualityScore >= 80 
        ? 'Deployment approved - quality standards met'
        : 'Deployment needs review - quality score below threshold',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Vercel Integration API error:', error);
    return NextResponse.json(
      { error: 'Failed to process deployment check', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ci/vercel
 * Get deployment quality check history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const deploymentId = searchParams.get('deploymentId');

    if (!projectId && !deploymentId) {
      return NextResponse.json(
        { error: 'Project ID or Deployment ID is required' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    // const checks = await getDeploymentChecks({ projectId, deploymentId });

    // Mock data for now
    const checks = [
      {
        deploymentId: deploymentId || 'dep-123',
        projectId: projectId || 'proj-123',
        qualityScore: 85,
        status: 'approved',
        timestamp: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      projectId,
      deploymentId,
      checks,
      total: checks.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Vercel Integration API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployment checks', details: error.message },
      { status: 500 }
    );
  }
}

