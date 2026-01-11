import { NextRequest, NextResponse } from 'next/server';

/**
 * Team & Collaboration API
 * 
 * Phase 3: Enterprise Features
 * Dog Fooding: Built using BEAST MODE
 */

// Dynamic import to avoid build-time errors
let service: any = null;

try {
  const serviceModule = require('@/lib/mlops/teamCollaborationService');
  if (serviceModule.getTeamCollaborationService) {
    service = serviceModule.getTeamCollaborationService();
  } else if (serviceModule.TeamCollaborationService) {
    service = new serviceModule.TeamCollaborationService();
  } else {
    service = serviceModule;
  }
} catch (error) {
  console.warn('[Team Collaboration API] Service not available:', error);
}

export async function GET(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Team collaboration service not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      const initialized = service.initialize ? await service.initialize() : true;
      return NextResponse.json({
        status: 'ok',
        available: !!service,
        initialized,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Team collaboration API ready',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Team collaboration service not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const body = await request.json();
    const { action, userId, ...params } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case 'create-team':
        result = await service.createTeam(userId, params);
        break;
      case 'add-member':
        result = await service.addTeamMember(params.teamId, params.userId, params.role, params.invitedBy);
        break;
      case 'create-workspace':
        result = await service.createWorkspace(params.teamId, params);
        break;
      case 'start-session':
        result = await service.startSession(params.workspaceId, params);
        break;
      case 'end-session':
        result = await service.endSession(params.sessionId);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      status: result.success ? 'ok' : 'error',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
