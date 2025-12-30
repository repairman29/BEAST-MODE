import { NextRequest, NextResponse } from 'next/server';
import { missions } from '../shared';

/**
 * Mission Management API
 * 
 * Update or delete individual missions
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const missionId = params.id;
    const mission = missions.find(m => m.id === missionId);

    if (!mission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mission,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch mission', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const missionId = params.id;
    const updates = await request.json();

    const missionIndex = missions.findIndex(m => m.id === missionId);
    if (missionIndex === -1) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }

    // Update mission
    missions[missionIndex] = {
      ...missions[missionIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      mission: missions[missionIndex],
      message: 'Mission updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update mission', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    missions.splice(missionIndex, 1);

    return NextResponse.json({
      message: 'Mission deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete mission', details: error.message },
      { status: 500 }
    );
  }
}

