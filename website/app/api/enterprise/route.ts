import { NextRequest, NextResponse } from 'next/server';

/**
 * Enterprise API
 * 
 * Unified enterprise operations (multi-tenant, RBAC, security, analytics)
 * 
 * Phase 2, Week 1: Enterprise Unification
 */

// Optional import - will be loaded dynamically
async function getEnterpriseService() {
  try {
    const service = await import('../../../../lib/enterprise/unifiedEnterpriseService').catch(() => null);
    if (service) {
      return service.getUnifiedEnterpriseService();
    }
  } catch (error) {
    // Service not available
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const service = await getEnterpriseService();
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Enterprise service not available',
        timestamp: new Date().toISOString()
      });
    }

    await service.initialize();

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const tenantId = searchParams.get('tenantId');
    const userId = searchParams.get('userId');

    if (operation === 'status' && tenantId) {
      const status = await service.getTenantStatus(tenantId);
      return NextResponse.json({
        status: 'ok',
        data: status,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'service-status') {
      const serviceStatus = service.getStatus();
      return NextResponse.json({
        status: 'ok',
        data: serviceStatus,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Enterprise API ready',
      operations: [
        'status?tenantId=xxx',
        'service-status',
        'tenant-config?tenantId=xxx',
        'user-permissions?userId=xxx&tenantId=xxx'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const service = await getEnterpriseService();
    if (!service) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Enterprise service not available',
        timestamp: new Date().toISOString()
      });
    }

    await service.initialize();

    const body = await request.json();
    const { operation, tenantId, userId, ...params } = body;

    switch (operation) {
      case 'register-tenant':
        const tenant = await service.registerTenant(params);
        return NextResponse.json({
          status: 'ok',
          data: tenant,
          timestamp: new Date().toISOString()
        });

      case 'create-role':
        const role = await service.createRole(params.roleName, params.permissions);
        return NextResponse.json({
          status: 'ok',
          data: role,
          timestamp: new Date().toISOString()
        });

      case 'assign-role':
        if (!userId || !params.roleName) {
          return NextResponse.json(
            { error: 'userId and roleName required' },
            { status: 400 }
          );
        }
        const assignment = await service.assignRole(userId, params.roleName, tenantId);
        return NextResponse.json({
          status: 'ok',
          data: assignment,
          timestamp: new Date().toISOString()
        });

      case 'generate-api-key':
        if (!tenantId || !userId) {
          return NextResponse.json(
            { error: 'tenantId and userId required' },
            { status: 400 }
          );
        }
        const apiKey = await enterpriseService.generateApiKey(tenantId, userId, params.permissions || []);
        return NextResponse.json({
          status: 'ok',
          data: apiKey,
          timestamp: new Date().toISOString()
        });

      case 'check-permission':
        if (!userId || !params.permission) {
          return NextResponse.json(
            { error: 'userId and permission required' },
            { status: 400 }
          );
        }
        const hasPermission = await enterpriseService.hasPermission(userId, params.permission, tenantId);
        return NextResponse.json({
          status: 'ok',
          data: { hasPermission },
          timestamp: new Date().toISOString()
        });

      case 'create-dashboard':
        if (!tenantId) {
          return NextResponse.json(
            { error: 'tenantId required' },
            { status: 400 }
          );
        }
        const dashboard = await enterpriseService.createDashboard(tenantId, params.dashboardConfig);
        return NextResponse.json({
          status: 'ok',
          data: dashboard,
          timestamp: new Date().toISOString()
        });

      case 'generate-report':
        if (!tenantId || !params.reportType) {
          return NextResponse.json(
            { error: 'tenantId and reportType required' },
            { status: 400 }
          );
        }
        const report = await enterpriseService.generateReport(tenantId, params.reportType, params.options || {});
        return NextResponse.json({
          status: 'ok',
          data: report,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}



