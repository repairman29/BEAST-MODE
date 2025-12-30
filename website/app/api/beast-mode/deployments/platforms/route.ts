import { NextRequest, NextResponse } from 'next/server';

/**
 * Deployment Platforms API
 *
 * Get supported deployment platforms
 */
export async function GET(request: NextRequest) {
  try {
    // Check if BEAST MODE deployment orchestrator is available
    if (!global.beastMode || !global.beastMode.deploymentOrchestrator) {
      return NextResponse.json(
        { error: 'Deployment Orchestrator not available', platforms: [] },
        { status: 503 }
      );
    }

    // Get supported platforms
    const platforms = global.beastMode.getSupportedPlatforms?.() || [
      'vercel',
      'railway',
      'aws',
      'netlify',
      'render'
    ];

    return NextResponse.json({
      platforms,
      count: platforms.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Platforms API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve platforms',
        details: error.message,
        platforms: ['vercel', 'railway', 'aws', 'netlify', 'render']
      },
      { status: 500 }
    );
  }
}
