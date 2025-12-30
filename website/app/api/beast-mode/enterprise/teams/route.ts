import { NextRequest, NextResponse } from 'next/server';

/**
 * Enterprise Teams API
 * 
 * Manage teams for enterprise organizations
 */

// In-memory storage (replace with database in production)
let teams: any[] = [
  { id: '1', name: 'Engineering', members: 12, repos: 8, createdAt: new Date().toISOString() },
  { id: '2', name: 'Product', members: 5, repos: 3, createdAt: new Date().toISOString() },
  { id: '3', name: 'Design', members: 4, repos: 2, createdAt: new Date().toISOString() }
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      teams,
      count: teams.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch teams', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const newTeam = {
      id: String(teams.length + 1),
      name: name.trim(),
      members: 0,
      repos: 0,
      createdAt: new Date().toISOString()
    };

    teams.push(newTeam);

    return NextResponse.json({
      team: newTeam,
      message: 'Team created successfully'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create team', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const teamIndex = teams.findIndex(t => t.id === id);
    if (teamIndex === -1) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (name) {
      teams[teamIndex].name = name.trim();
    }

    return NextResponse.json({
      team: teams[teamIndex],
      message: 'Team updated successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update team', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const teamIndex = teams.findIndex(t => t.id === id);
    if (teamIndex === -1) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    teams.splice(teamIndex, 1);

    return NextResponse.json({
      message: 'Team deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete team', details: error.message },
      { status: 500 }
    );
  }
}

