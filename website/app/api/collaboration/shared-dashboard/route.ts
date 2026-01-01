import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../lib/api-middleware';

/**
 * Shared Dashboard API
 * 
 * Provides shared dashboard functionality
 * 
 * Phase 2: Collaboration Services Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const sharedDashboardPath = path.join(process.cwd(), '../../../lib/collaboration/shared-dashboard');
    const { getSharedDashboard } = require(sharedDashboardPath);
    const dashboard = getSharedDashboard();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'list';

      if (operation === 'list') {
        const dashboards = dashboard.listDashboards();
        return NextResponse.json({
          status: 'ok',
          data: { dashboards },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'get') {
        const dashboardId = searchParams.get('dashboardId');
        if (!dashboardId) {
          return NextResponse.json(
            { error: 'dashboardId required' },
            { status: 400 }
          );
        }
        const dashboardData = dashboard.getDashboard(dashboardId);
        return NextResponse.json({
          status: 'ok',
          data: { dashboard: dashboardData },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Shared dashboard API ready',
        operations: ['list', 'get'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'create') {
        const { name, config } = body;
        const created = dashboard.createDashboard(name, config);
        return NextResponse.json({
          status: 'ok',
          data: { dashboard: created },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'share') {
        const { dashboardId, userId, permissions } = body;
        const shared = dashboard.shareDashboard(dashboardId, userId, permissions);
        return NextResponse.json({
          status: 'ok',
          data: { shared },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json(
        { error: `Unknown operation: ${operation}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
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

export const GET = withProductionIntegration(handler);
export const POST = withProductionIntegration(handler);

