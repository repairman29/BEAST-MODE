import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Audit Log API
 * Enterprise audit logging and compliance
 */

let auditLogger: any;
let rbac: any;

try {
  const auditLoggerModule = loadModule('../../../../../lib/enterprise/auditLogger') ||
                            require('../../../../../lib/enterprise/auditLogger');
  auditLogger = auditLoggerModule?.getAuditLogger
    ? auditLoggerModule.getAuditLogger()
    : auditLoggerModule;

  const rbacModule = loadModule('../../../../../lib/enterprise/rbac') ||
                     require('../../../../../lib/enterprise/rbac');
  rbac = rbacModule?.getRBAC
    ? rbacModule.getRBAC()
    : rbacModule;
} catch (error) {
  console.warn('[Audit API] Modules not available:', error);
}

/**
 * GET /api/enterprise/audit
 * Get audit logs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const timeRange = searchParams.get('timeRange') || '7d';
    const stats = searchParams.get('stats') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!auditLogger) {
      return NextResponse.json(
        { error: 'Audit logging not available' },
        { status: 503 }
      );
    }

    // Check permissions
    if (rbac && !rbac.hasPermission(userId, 'view_analytics')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view audit logs' },
        { status: 403 }
      );
    }

    if (stats) {
      // Get statistics
      const statistics = auditLogger.getStats(timeRange);
      return NextResponse.json({
        success: true,
        stats: statistics,
        timeRange
      });
    } else {
      // Get logs
      const filters: any = {
        limit
      };

      if (action) filters.action = action;
      if (resource) filters.resource = resource;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const logs = auditLogger.getLogs(filters);
      return NextResponse.json({
        success: true,
        logs,
        count: logs.length
      });
    }

  } catch (error: any) {
    console.error('[Audit API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get audit logs', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprise/audit/export
 * Export audit logs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = 'json', filters = {} } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!auditLogger) {
      return NextResponse.json(
        { error: 'Audit logging not available' },
        { status: 503 }
      );
    }

    // Check permissions
    if (rbac && !rbac.hasPermission(userId, 'export_data')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to export audit logs' },
        { status: 403 }
      );
    }

    const exportData = auditLogger.exportLogs(filters, format);

    // Audit log the export
    if (auditLogger && typeof auditLogger.log === 'function') {
      auditLogger.log('audit.exported', userId, {
        resource: 'audit',
        changes: { format, filters }
      });
    }

    return NextResponse.json({
      success: true,
      export: exportData
    });

  } catch (error: any) {
    console.error('[Audit API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs', details: error.message },
      { status: 500 }
    );
  }
}
