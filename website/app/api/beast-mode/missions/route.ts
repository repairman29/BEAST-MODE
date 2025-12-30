import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Missions API
 *
 * Mission creation, management, and tracking
 */
import { missions } from './shared';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      missions,
      count: missions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Missions API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve missions',
        details: error.message,
        missions: []
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

    if (!missionData.name || !missionData.description) {
      return NextResponse.json(
        { error: 'Mission name and description are required' },
        { status: 400 }
      );
    }

    const newMission = {
      id: String(missions.length + 1),
      name: missionData.name,
      description: missionData.description,
      type: missionData.type || 'code-refactor',
      priority: missionData.priority || 'medium',
      status: 'planning',
      progress: 0,
      deadline: missionData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      tasks: (missionData.objectives || []).filter((obj: string) => obj.trim()).map((obj: string, idx: number) => ({
        id: String(idx + 1),
        name: obj,
        status: 'pending',
        progress: 0
      })),
      createdAt: new Date().toISOString()
    };

    missions.push(newMission);

    return NextResponse.json({
      mission: newMission,
      message: 'Mission created successfully',
      timestamp: new Date().toISOString()
    }, { status: 201 });

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

