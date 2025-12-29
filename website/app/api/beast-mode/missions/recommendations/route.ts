import { NextRequest, NextResponse } from 'next/server';

/**
 * Mission Recommendations API
 *
 * AI-powered mission recommendations based on project context
 */
export async function POST(request: NextRequest) {
  try {
    const projectContext = await request.json();

    // Check if BEAST MODE mission guidance is available
    if (!global.beastMode || !global.beastMode.missionGuidance) {
      return NextResponse.json(
        { error: 'Mission Guidance not available', recommendations: [] },
        { status: 503 }
      );
    }

    // Get mission recommendations
    const recommendations = await global.beastMode.getMissionRecommendations(projectContext);

    return NextResponse.json({
      recommendations,
      projectContext,
      generatedAt: new Date().toISOString(),
      totalRecommendations: recommendations.length
    });

  } catch (error) {
    console.error('Mission Recommendations API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate mission recommendations',
        details: error.message
      },
      { status: 500 }
    );
  }
}

