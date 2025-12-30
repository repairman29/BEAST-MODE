import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Plugin Analytics API
 * 
 * Tracks plugin usage, performance, and statistics
 */

declare global {
  var pluginExecutions: any[] | undefined;
  var installedPluginsStore: Map<string, Map<string, any>> | undefined;
}

/**
 * GET /api/beast-mode/marketplace/analytics
 * Get plugin analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    const pluginId = searchParams.get('pluginId');

    const executions = global.pluginExecutions || [];
    const installedPluginsStore = global.installedPluginsStore || new Map();
    const userPlugins = installedPluginsStore.get(userId) || new Map();

    // Filter executions by user and optionally by plugin
    let filteredExecutions = executions.filter((e: any) => e.userId === userId);
    if (pluginId) {
      filteredExecutions = filteredExecutions.filter((e: any) => e.pluginId === pluginId);
    }

    // Calculate analytics
    const analytics = {
      totalExecutions: filteredExecutions.length,
      successfulExecutions: filteredExecutions.filter((e: any) => e.success).length,
      failedExecutions: filteredExecutions.filter((e: any) => !e.success).length,
      averageDuration: filteredExecutions.length > 0
        ? filteredExecutions.reduce((sum: number, e: any) => sum + (e.duration || 0), 0) / filteredExecutions.length
        : 0,
      executionsByPlugin: {} as Record<string, number>,
      executionsByDay: {} as Record<string, number>,
      installedPlugins: userPlugins.size,
      enabledPlugins: Array.from(userPlugins.values()).filter((p: any) => p.enabled).length
    };

    // Group by plugin
    filteredExecutions.forEach((exec: any) => {
      analytics.executionsByPlugin[exec.pluginId] = (analytics.executionsByPlugin[exec.pluginId] || 0) + 1;
    });

    // Group by day
    filteredExecutions.forEach((exec: any) => {
      const date = new Date(exec.timestamp).toISOString().split('T')[0];
      analytics.executionsByDay[date] = (analytics.executionsByDay[date] || 0) + 1;
    });

    // Get most used plugins
    const mostUsedPlugins = Object.entries(analytics.executionsByPlugin)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([id, count]) => ({
        pluginId: id,
        executions: count,
        plugin: userPlugins.get(id) || { name: id }
      }));

    return NextResponse.json({
      userId,
      pluginId: pluginId || 'all',
      analytics: {
        ...analytics,
        mostUsedPlugins,
        successRate: analytics.totalExecutions > 0
          ? (analytics.successfulExecutions / analytics.totalExecutions * 100).toFixed(1)
          : '0.0'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Plugin Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}
