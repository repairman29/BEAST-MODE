import { NextRequest, NextResponse } from 'next/server';
import { missions } from '../../shared';

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

    const missionIndex = missions.findIndex(m => m.id === missionId);
    if (missionIndex === -1) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }

    // Update mission status to active
    missions[missionIndex] = {
      ...missions[missionIndex],
      status: 'active',
      startedAt: new Date().toISOString(),
      progress: 0
    };

    return NextResponse.json({
      message: `Mission ${missions[missionIndex].name} started successfully`,
      mission: missions[missionIndex],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
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

