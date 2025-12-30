import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Plugin Updates API
 * 
 * Handles plugin version checking and auto-updates
 */

// Plugin versions registry (would be from database in production)
const PLUGIN_VERSIONS: Record<string, any> = {
  'eslint-pro': { latest: '1.0.0', current: '1.0.0' },
  'typescript-guardian': { latest: '2.1.0', current: '2.1.0' },
  'security-scanner': { latest: '1.5.0', current: '1.5.0' },
  'prettier-integration': { latest: '3.2.1', current: '3.2.1' },
  'test-coverage': { latest: '1.8.0', current: '1.8.0' }
};

/**
 * GET /api/beast-mode/marketplace/updates
 * Check for plugin updates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    const pluginId = searchParams.get('pluginId');

    const installedPluginsStore = global.installedPluginsStore || new Map();
    const userPlugins = installedPluginsStore.get(userId) || new Map();

    if (pluginId) {
      // Check specific plugin
      const plugin = userPlugins.get(pluginId);
      if (!plugin) {
        return NextResponse.json(
          { error: 'Plugin not installed' },
          { status: 404 }
        );
      }

      const versionInfo = PLUGIN_VERSIONS[pluginId] || { latest: plugin.version, current: plugin.version };
      const hasUpdate = versionInfo.latest !== plugin.version;

      return NextResponse.json({
        pluginId,
        currentVersion: plugin.version,
        latestVersion: versionInfo.latest,
        hasUpdate,
        updateAvailable: hasUpdate,
        changelog: hasUpdate ? [
          `Version ${versionInfo.latest} released`,
          'Bug fixes and performance improvements',
          'New features added'
        ] : [],
        timestamp: new Date().toISOString()
      });
    }

    // Check all installed plugins
    const updates: any[] = [];
    userPlugins.forEach((plugin, id) => {
      const versionInfo = PLUGIN_VERSIONS[id] || { latest: plugin.version, current: plugin.version };
      if (versionInfo.latest !== plugin.version) {
        updates.push({
          pluginId: id,
          pluginName: plugin.name,
          currentVersion: plugin.version,
          latestVersion: versionInfo.latest,
          changelog: [
            `Version ${versionInfo.latest} released`,
            'Bug fixes and performance improvements'
          ]
        });
      }
    });

    return NextResponse.json({
      userId,
      updatesAvailable: updates.length,
      updates,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Plugin Updates API error:', error);
    return NextResponse.json(
      { error: 'Failed to check updates', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/beast-mode/marketplace/updates
 * Update a plugin
 */
export async function POST(request: NextRequest) {
  try {
    const { pluginId, userId, version } = await request.json();

    if (!pluginId || !userId) {
      return NextResponse.json(
        { error: 'Plugin ID and User ID are required' },
        { status: 400 }
      );
    }

    const installedPluginsStore = global.installedPluginsStore || new Map();
    const userPlugins = installedPluginsStore.get(userId) || new Map();

    if (!userPlugins.has(pluginId)) {
      return NextResponse.json(
        { error: 'Plugin not installed' },
        { status: 404 }
      );
    }

    const plugin = userPlugins.get(pluginId);
    const versionInfo = PLUGIN_VERSIONS[pluginId] || { latest: plugin.version };
    const targetVersion = version || versionInfo.latest;

    // Simulate update process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update plugin version
    plugin.version = targetVersion;
    plugin.updatedAt = new Date().toISOString();
    userPlugins.set(pluginId, plugin);

    return NextResponse.json({
      success: true,
      pluginId,
      previousVersion: plugin.version,
      newVersion: targetVersion,
      message: `Plugin updated to version ${targetVersion}`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Plugin Update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update plugin', details: error.message },
      { status: 500 }
    );
  }
}

