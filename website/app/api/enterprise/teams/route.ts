import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Teams API
 * Enterprise team management
 */

let teamManager: any;
let auditLogger: any;

try {
  const teamManagerModule = loadModule('../../../../../lib/enterprise/teamManager') ||
                            require('../../../../../lib/enterprise/teamManager');
  teamManager = teamManagerModule?.getTeamManager
    ? teamManagerModule.getTeamManager()
    : teamManagerModule;

  const auditLoggerModule = loadModule('../../../../../lib/enterprise/auditLogger') ||
                            require('../../../../../lib/enterprise/auditLogger');
  auditLogger = auditLoggerModule?.getAuditLogger
    ? auditLoggerModule.getAuditLogger()
    : auditLoggerModule;
} catch (error) {
  console.warn('[Teams API] Modules not available:', error);
}

/**
 * GET /api/enterprise/teams
 * Get user's teams or team details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!teamManager) {
      return NextResponse.json(
        { error: 'Team management not available' },
        { status: 503 }
      );
    }

    if (teamId) {
      // Get specific team
      const members = teamManager.getTeamMembers(teamId);
      return NextResponse.json({
        success: true,
        teamId,
        members
      });
    } else {
      // Get user's teams
      const teams = teamManager.getUserTeams(userId);
      return NextResponse.json({
        success: true,
        teams
      });
    }

  } catch (error: any) {
    console.error('[Teams API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get teams', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprise/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    if (!teamManager) {
      return NextResponse.json(
        { error: 'Team management not available' },
        { status: 503 }
      );
    }

    const team = await teamManager.createTeam(userId, name, description);

    // Audit log
    if (auditLogger && typeof auditLogger.log === 'function') {
      auditLogger.log('team.created', userId, {
        resource: 'team',
        resourceId: team.id,
        changes: { name, description }
      });
    }

    return NextResponse.json({
      success: true,
      team
    });

  } catch (error: any) {
    console.error('[Teams API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create team', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/enterprise/teams
 * Update team or add/remove members
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, action, userId: targetUserId, role } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!teamId || !action) {
      return NextResponse.json(
        { error: 'teamId and action are required' },
        { status: 400 }
      );
    }

    if (!teamManager) {
      return NextResponse.json(
        { error: 'Team management not available' },
        { status: 503 }
      );
    }

    let result;

    switch (action) {
      case 'add_member':
        if (!targetUserId) {
          return NextResponse.json(
            { error: 'userId is required for add_member' },
            { status: 400 }
          );
        }
        result = teamManager.addMember(teamId, targetUserId, role || 'member');
        if (auditLogger) {
          auditLogger.log('team.member_added', userId, {
            resource: 'team',
            resourceId: teamId,
            changes: { memberId: targetUserId, role }
          });
        }
        break;

      case 'remove_member':
        if (!targetUserId) {
          return NextResponse.json(
            { error: 'userId is required for remove_member' },
            { status: 400 }
          );
        }
        result = teamManager.removeMember(teamId, targetUserId);
        if (auditLogger) {
          auditLogger.log('team.member_removed', userId, {
            resource: 'team',
            resourceId: teamId,
            changes: { memberId: targetUserId }
          });
        }
        break;

      case 'update_role':
        if (!targetUserId || !role) {
          return NextResponse.json(
            { error: 'userId and role are required for update_role' },
            { status: 400 }
          );
        }
        result = teamManager.updateMemberRole(teamId, targetUserId, role);
        if (auditLogger) {
          auditLogger.log('team.role_updated', userId, {
            resource: 'team',
            resourceId: teamId,
            changes: { memberId: targetUserId, newRole: role }
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('[Teams API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update team', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/enterprise/teams
 * Delete a team
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      );
    }

    if (!teamManager) {
      return NextResponse.json(
        { error: 'Team management not available' },
        { status: 503 }
      );
    }

    const result = teamManager.deleteTeam(teamId, userId);

    // Audit log
    if (auditLogger && typeof auditLogger.log === 'function') {
      auditLogger.log('team.deleted', userId, {
        resource: 'team',
        resourceId: teamId
      });
    }

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('[Teams API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete team', details: error.message },
      { status: 500 }
    );
  }
}
