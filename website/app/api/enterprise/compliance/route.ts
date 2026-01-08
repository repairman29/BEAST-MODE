import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Compliance API
 * Enterprise compliance features (GDPR, SOC2, HIPAA)
 */

let compliance: any;
let auditLogger: any;

try {
  const complianceModule = loadModule('../../../../../lib/enterprise/compliance') ||
                          require('../../../../../lib/enterprise/compliance');
  compliance = complianceModule?.getCompliance
    ? complianceModule.getCompliance()
    : complianceModule;

  const auditLoggerModule = loadModule('../../../../../lib/enterprise/auditLogger') ||
                            require('../../../../../lib/enterprise/auditLogger');
  auditLogger = auditLoggerModule?.getAuditLogger
    ? auditLoggerModule.getAuditLogger()
    : auditLoggerModule;
} catch (error) {
  console.warn('[Compliance API] Modules not available:', error);
}

/**
 * GET /api/enterprise/compliance
 * Get compliance status or report
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const type = searchParams.get('type') || 'status';
    const timeRange = searchParams.get('timeRange') || '30d';

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!compliance) {
      return NextResponse.json(
        { error: 'Compliance features not available' },
        { status: 503 }
      );
    }

    if (type === 'report') {
      const report = compliance.generateComplianceReport(userId, timeRange);
      return NextResponse.json({
        success: true,
        report
      });
    } else {
      const status = compliance.checkComplianceStatus(userId);
      return NextResponse.json({
        success: true,
        status
      });
    }

  } catch (error: any) {
    console.error('[Compliance API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get compliance info', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprise/compliance
 * Apply policy, export data, or request erasure
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, policyId, resources, dataTypes, format } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!compliance) {
      return NextResponse.json(
        { error: 'Compliance features not available' },
        { status: 503 }
      );
    }

    if (action === 'apply_policy') {
      if (!policyId) {
        return NextResponse.json(
          { error: 'policyId is required' },
          { status: 400 }
        );
      }

      const result = compliance.applyPolicy(userId, policyId, resources || []);
      
      // Audit log
      if (auditLogger && typeof auditLogger.log === 'function') {
        auditLogger.log('compliance.policy_applied', userId, {
          resource: 'compliance',
          resourceId: result.id,
          changes: { policyId, resources }
        });
      }

      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'export_data') {
      const result = compliance.exportUserData(userId, format || 'json');
      
      // Audit log
      if (auditLogger && typeof auditLogger.log === 'function') {
        auditLogger.log('compliance.data_exported', userId, {
          resource: 'user_data',
          changes: { format }
        });
      }

      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'request_erasure') {
      const result = compliance.processRightToErasure(userId, dataTypes || []);
      
      // Audit log
      if (auditLogger && typeof auditLogger.log === 'function') {
        auditLogger.log('compliance.erasure_requested', userId, {
          resource: 'user_data',
          changes: { dataTypes }
        });
      }

      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'check_retention') {
      const { dataType, createdAt } = body;
      if (!dataType || !createdAt) {
        return NextResponse.json(
          { error: 'dataType and createdAt are required' },
          { status: 400 }
        );
      }

      const result = compliance.checkDataRetention(dataType, createdAt);
      return NextResponse.json({
        success: true,
        result
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Compliance API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process compliance request', details: error.message },
      { status: 500 }
    );
  }
}
