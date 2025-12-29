import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Missions API
 *
 * Mission creation, management, and tracking
 */
export async function GET(request: NextRequest) {
  try {
    // Check if BEAST MODE mission guidance is available
    if (!global.beastMode || !global.beastMode.missionGuidance) {
      return NextResponse.json(
        { error: 'Mission Guidance not available', missions: [] },
        { status: 503 }
      );
    }

    // Get active missions
    const missions = global.beastMode.getActiveMissions();

    return NextResponse.json({
      missions,
      count: missions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Missions API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve missions',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for creating new missions
 */
export async function POST(request: NextRequest) {
  try {
    const missionData = await request.json();

    // Check if BEAST MODE mission guidance is available
    if (!global.beastMode || !global.beastMode.missionGuidance) {
      return NextResponse.json(
        { error: 'Mission Guidance not available' },
        { status: 503 }
      );
    }

    // Create new mission
    const mission = await global.beastMode.createMission(missionData);

    return NextResponse.json(mission, { status: 201 });

  } catch (error) {
    console.error('Create Mission API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create mission',
        details: error.message
      },
      { status: 500 }
    );
  }
}

