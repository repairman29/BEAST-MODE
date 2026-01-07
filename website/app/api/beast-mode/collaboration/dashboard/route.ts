import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * BEAST MODE Shared Dashboard API
 * 
 * Team visibility, role-based access, collaborative insights
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get('dashboardId');
    const action = searchParams.get('action') || 'data';

    let SharedDashboard;
    try {
      // @ts-ignore - Dynamic import, module may not exist
      const module = await import(/* webpackIgnore: true */ '../../../../../../lib/collaboration/shared-dashboard').catch(() => null);
      SharedDashboard = module?.default || module;
      if (!SharedDashboard) {
        return NextResponse.json({
          status: 'ok',
          data: { message: 'Collaboration module not available' },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      return NextResponse.json({
        status: 'ok',
        data: { message: 'Collaboration module not available' },
        timestamp: new Date().toISOString()
      });
    }
    const dashboard = new SharedDashboard({ dashboardId });

    if (action === 'data') {
      const timeRange = searchParams.get('timeRange') || '30d';
      const projectIds = searchParams.get('projectIds')?.split(',') || [];
      const userIds = searchParams.get('userIds')?.split(',') || [];
      
      const data = await dashboard.getDashboardData({
        timeRange,
        projectIds,
        userIds
      });
      return NextResponse.json(data);
    }

    if (action === 'permissions') {
      const userId = searchParams.get('userId');
      if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }
      const permissions = await dashboard.getPermissions(dashboardId!, userId);
      return NextResponse.json(permissions);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Shared Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, dashboardData, shareConfig } = body;

    let SharedDashboard;
    try {
      // @ts-ignore - Optional module, may not exist
      const module = await import(/* webpackIgnore: true */ '../../../../../../lib/collaboration/shared-dashboard').catch(() => null);
      SharedDashboard = module?.default || module;
      if (!SharedDashboard) {
        return NextResponse.json({
          status: 'error',
          error: 'Collaboration module not available',
          timestamp: new Date().toISOString()
        }, { status: 503 });
      }
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        error: 'Collaboration module not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    const dashboard = new SharedDashboard({ dashboardId: body.dashboardId });

    if (action === 'create') {
      const newDashboard = await dashboard.createDashboard(dashboardData);
      return NextResponse.json(newDashboard);
    }

    if (action === 'update') {
      if (!body.dashboardId) {
        return NextResponse.json({ error: 'Dashboard ID required' }, { status: 400 });
      }
      const updated = await dashboard.updateDashboard(body.dashboardId, body.updates);
      return NextResponse.json(updated);
    }

    if (action === 'share') {
      if (!body.dashboardId) {
        return NextResponse.json({ error: 'Dashboard ID required' }, { status: 400 });
      }
      const shareResult = await dashboard.shareDashboard(body.dashboardId, shareConfig);
      return NextResponse.json(shareResult);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Shared Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}

