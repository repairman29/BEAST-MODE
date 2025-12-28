import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE AI Recommendations API
 *
 * Provides AI-powered plugin recommendations based on user profile and project context
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, projectContext = {} } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if marketplace is available
    if (!global.beastMode || !global.beastMode.marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not available' },
        { status: 503 }
      );
    }

    // Get AI recommendations from marketplace
    const recommendations = await global.beastMode.marketplace.getAIRecommendations(
      userId,
      projectContext,
      {
        limit: 12,
        includeReasons: true,
        minConfidence: 0.6
      }
    );

    return NextResponse.json({
      userId,
      recommendations: recommendations.recommendations,
      projectContext: recommendations.projectContext,
      totalConsidered: recommendations.totalConsidered,
      generatedAt: recommendations.generatedAt,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Recommendations API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate AI recommendations',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for recommendation health check
 */
export async function GET(request: NextRequest) {
  try {
    const isAvailable = global.beastMode &&
                       global.beastMode.marketplace &&
                       global.beastMode.marketplace.aiRecommendations;

    return NextResponse.json({
      status: isAvailable ? 'operational' : 'unavailable',
      message: isAvailable
        ? 'AI Recommendations system is ready'
        : 'AI Recommendations system not initialized',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recommendations health check error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    );
  }
}
