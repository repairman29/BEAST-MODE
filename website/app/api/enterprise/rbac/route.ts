import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * RBAC API
 * Role-based access control
 */

let rbac: any;
let auditLogger: any;

try {
  const rbacModule = loadModule('../../../../../lib/enterprise/rbac') ||
                     require('../../../../../lib/enterprise/rbac');
  rbac = rbacModule?.getRBAC
    ? rbacModule.getRBAC()
    : rbacModule;

  const auditLoggerModule = loadModule('../../../../../lib/enterprise/auditLogger') ||
                            require('../../../../../lib/enterprise/auditLogger');
  auditLogger = auditLoggerModule?.getAuditLogger
    ? auditLoggerModule.getAuditLogger()
    : auditLoggerModule;
} catch (error) {
  console.warn('[RBAC API] Modules not available:', error);
}

/**
 * GET /api/enterprise/rbac
 * Get user roles or check permissions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const checkPermission = searchParams.get('permission');
    const contextParam = searchParams.get('context');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!rbac) {
      return NextResponse.json(
        { error: 'RBAC not available' },
        { status: 503 }
      );
    }

    if (checkPermission) {
      // Check if user has permission
      const context = contextParam ? JSON.parse(contextParam) : null;
      const hasPermission = rbac.hasPermission(userId, checkPermission, context);
      return NextResponse.json({
        success: true,
        userId,
        permission: checkPermission,
        hasPermission,
        context
      });
    } else {
      // Get user roles
      const context = contextParam ? JSON.parse(contextParam) : null;
      const roles = rbac.getUserRoles(userId, context);
      const permissions = rbac.getUserPermissions(userId, context);
      return NextResponse.json({
        success: true,
        userId,
        roles,
        permissions
      });
    }

  } catch (error: any) {
    console.error('[RBAC API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get RBAC info', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprise/rbac
 * Assign role to user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: targetUserId, role, context } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    if (!rbac) {
      return NextResponse.json(
        { error: 'RBAC not available' },
        { status: 503 }
      );
    }

    // Check if current user has permission to assign roles
    if (!rbac.hasPermission(userId, 'manage_users')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to assign roles' },
        { status: 403 }
      );
    }

    const result = rbac.assignRole(targetUserId, role, context);

    // Audit log
    if (auditLogger && typeof auditLogger.log === 'function') {
      auditLogger.log('rbac.role_assigned', userId, {
        resource: 'user',
        resourceId: targetUserId,
        changes: { role, context }
      });
    }

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('[RBAC API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to assign role', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/enterprise/rbac
 * Remove role from user
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const targetUserId = searchParams.get('userId');
    const role = searchParams.get('role');
    const contextParam = searchParams.get('context');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    if (!rbac) {
      return NextResponse.json(
        { error: 'RBAC not available' },
        { status: 503 }
      );
    }

    // Check if current user has permission to remove roles
    if (!rbac.hasPermission(userId, 'manage_users')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to remove roles' },
        { status: 403 }
      );
    }

    const context = contextParam ? JSON.parse(contextParam) : null;
    const result = rbac.removeRole(targetUserId, role, context);

    // Audit log
    if (auditLogger && typeof auditLogger.log === 'function') {
      auditLogger.log('rbac.role_removed', userId, {
        resource: 'user',
        resourceId: targetUserId,
        changes: { role, context }
      });
    }

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('[RBAC API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove role', details: error.message },
      { status: 500 }
    );
  }
}
