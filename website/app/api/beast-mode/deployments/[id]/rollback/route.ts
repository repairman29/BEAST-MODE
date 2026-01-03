import { NextRequest, NextResponse } from 'next/server';

// Use unified config if available
let getUnifiedConfig: any = null;
try {
  const path = require('path');
  const configPath = path.join(process.cwd(), '../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value (TypeScript compatible)
async function getConfigValue(key: string, defaultValue: string | null = null): Promise<string | null> {
  if (getUnifiedConfig) {
    try {
      const config = await getUnifiedConfig();
      const value = config.get(key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (error) {
      // Fallback to process.env
    }
  }
  // Fallback to process.env for backward compatibility
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

/**
 * BEAST MODE Deployment Rollback API
 * 
 * Rolls back a deployment to the previous version
 */

// Helper to check if platform tokens are configured (async)
async function checkPlatformTokens() {
  const vercelToken = await getConfigValue('VERCEL_API_TOKEN', null);
  const railwayToken = await getConfigValue('RAILWAY_TOKEN', null);
  return {
    hasVercelToken: !!vercelToken,
    hasRailwayToken: !!railwayToken
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deploymentId = params.id;
    const { reason } = await request.json().catch(() => ({}));

    // In a real implementation, this would:
    // 1. Fetch the deployment details
    // 2. Find the previous successful deployment
    // 3. Trigger rollback on the platform
    // 4. Update deployment status

    // Mock rollback response
    const rollbackDeployment = {
      id: `rollback-${Date.now()}`,
      originalDeploymentId: deploymentId,
      status: 'rolling_back',
      progress: 0,
      startTime: new Date().toISOString(),
      reason: reason || 'Manual rollback requested',
      logs: [
        { timestamp: new Date().toISOString(), message: 'Rollback initiated', progress: 0 },
        { timestamp: new Date().toISOString(), message: 'Identifying previous version...', progress: 25 },
        { timestamp: new Date().toISOString(), message: 'Preparing rollback...', progress: 50 },
        { timestamp: new Date().toISOString(), message: 'Rolling back deployment...', progress: 75 }
      ]
    };

    // Simulate rollback completion after a delay
    setTimeout(() => {
      rollbackDeployment.status = 'rolled_back';
      rollbackDeployment.progress = 100;
      rollbackDeployment.logs.push({
        timestamp: new Date().toISOString(),
        message: 'Rollback completed successfully',
        progress: 100
      });
    }, 5000);

    return NextResponse.json({
      success: true,
      message: 'Rollback initiated',
      deployment: rollbackDeployment,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Rollback API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to rollback deployment',
        details: error.message
      },
      { status: 500 }
    );
  }
}

