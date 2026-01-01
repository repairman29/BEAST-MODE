import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Team Workspace API
 * 
 * Shared dashboards, team quality metrics, collaborative missions
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const action = searchParams.get('action') || 'metrics';

    let TeamWorkspace;
    try {
      TeamWorkspace = require('../../../../../../lib/collaboration/team-workspace');
    } catch (error) {
      return NextResponse.json({
        status: 'ok',
        data: { message: 'Collaboration module not available' },
        timestamp: new Date().toISOString()
      });
    }
    const workspace = new TeamWorkspace({ workspaceId });

    if (action === 'metrics') {
      const timeRange = searchParams.get('timeRange') || '30d';
      const metrics = await workspace.getTeamMetrics(timeRange);
      return NextResponse.json(metrics);
    }

    if (action === 'missions') {
      const missions = await workspace.getCollaborativeMissions();
      return NextResponse.json(missions);
    }

    if (action === 'activity') {
      const limit = parseInt(searchParams.get('limit') || '50');
      const activity = await workspace.getActivityFeed(limit);
      return NextResponse.json(activity);
    }

    if (action === 'dashboard-config') {
      const config = await workspace.getDashboardConfig();
      return NextResponse.json(config);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Team Workspace API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace data', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workspaceData, userId, role } = body;

    let TeamWorkspace;
    try {
      TeamWorkspace = require('../../../../../../lib/collaboration/team-workspace');
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        error: 'Collaboration module not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    const workspace = new TeamWorkspace({ workspaceId: body.workspaceId });

    if (action === 'create') {
      const newWorkspace = await workspace.createWorkspace(workspaceData);
      return NextResponse.json(newWorkspace);
    }

    if (action === 'add-member') {
      if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }
      const member = await workspace.addTeamMember(userId, role);
      return NextResponse.json(member);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Team Workspace API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}

