import { NextRequest, NextResponse } from 'next/server';

/**
 * Start Mission API
 *
 * Starts an existing mission
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const missionId = params.id;

    // Check if BEAST MODE mission guidance is available
    if (!global.beastMode || !global.beastMode.missionGuidance) {
      return NextResponse.json(
        { error: 'Mission Guidance not available' },
        { status: 503 }
      );
    }

    // Start the mission
    const mission = await global.beastMode.startMission(missionId);

    return NextResponse.json({
      message: `Mission ${mission.name} started successfully`,
      mission,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Start Mission API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to start mission',
        details: error.message
      },
      { status: 500 }
    );
  }
}

