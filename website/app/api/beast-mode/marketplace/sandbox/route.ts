import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Plugin Sandbox API
 * 
 * Manages sandbox configuration for plugin execution
 */

// In-memory storage (in production, use database)
const sandboxConfigs: Record<string, Record<string, any>> = {};

/**
 * GET /api/beast-mode/marketplace/sandbox
 * Get sandbox configuration for a plugin
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pluginId = searchParams.get('pluginId');
    const userId = searchParams.get('userId');

    if (!pluginId || !userId) {
      return NextResponse.json(
        { error: 'Plugin ID and User ID are required' },
        { status: 400 }
      );
    }

    const key = `${userId}:${pluginId}`;
    const sandbox = sandboxConfigs[key] || {
      enabled: true,
      isolationLevel: 'moderate',
      resourceLimits: {
        maxMemoryMB: 512,
        maxExecutionTimeMs: 30000,
        maxFileSizeKB: 1024
      },
      allowedOperations: [],
      blockedOperations: []
    };

    return NextResponse.json({
      success: true,
      pluginId,
      userId,
      sandbox
    });

  } catch (error: any) {
    console.error('[Sandbox API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get sandbox configuration', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/beast-mode/marketplace/sandbox
 * Update sandbox configuration for a plugin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pluginId, userId, sandbox } = body;

    if (!pluginId || !userId || !sandbox) {
      return NextResponse.json(
        { error: 'Plugin ID, User ID, and sandbox configuration are required' },
        { status: 400 }
      );
    }

    const key = `${userId}:${pluginId}`;
    sandboxConfigs[key] = {
      ...sandboxConfigs[key],
      ...sandbox,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      pluginId,
      userId,
      sandbox: sandboxConfigs[key]
    });

  } catch (error: any) {
    console.error('[Sandbox API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update sandbox configuration', details: error.message },
      { status: 500 }
    );
  }
}
