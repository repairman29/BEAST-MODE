import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Installed Plugins API
 * 
 * Manages installed plugins for users
 */

// In-memory storage (would be database in production)
// Use global to persist across API calls
declare global {
  var installedPluginsStore: Map<string, Map<string, any>> | undefined;
}

const getInstalledPluginsStore = () => {
  if (!global.installedPluginsStore) {
    global.installedPluginsStore = new Map();
  }
  return global.installedPluginsStore;
};

/**
 * GET /api/beast-mode/marketplace/installed
 * Get user's installed plugins
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    const installedPluginsStore = getInstalledPluginsStore();
    const userPlugins = installedPluginsStore.get(userId) || new Map();
    const plugins = Array.from(userPlugins.values());

    return NextResponse.json({
      userId,
      plugins,
      count: plugins.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Installed Plugins API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installed plugins', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/beast-mode/marketplace/installed
 * Update plugin configuration
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, pluginId, config, enabled } = await request.json();

    if (!userId || !pluginId) {
      return NextResponse.json(
        { error: 'User ID and Plugin ID are required' },
        { status: 400 }
      );
    }

    const installedPluginsStore = getInstalledPluginsStore();
    if (!installedPluginsStore.has(userId)) {
      installedPluginsStore.set(userId, new Map());
    }

    const userPlugins = installedPluginsStore.get(userId)!;
    
    if (!userPlugins.has(pluginId)) {
      return NextResponse.json(
        { error: 'Plugin not installed' },
        { status: 404 }
      );
    }

    const plugin = userPlugins.get(pluginId);
    
    if (config !== undefined) {
      plugin.config = { ...plugin.config, ...config };
    }
    
    if (enabled !== undefined) {
      plugin.enabled = enabled;
    }

    plugin.updatedAt = new Date().toISOString();
    userPlugins.set(pluginId, plugin);

    return NextResponse.json({
      success: true,
      plugin,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update Plugin API error:', error);
    return NextResponse.json(
      { error: 'Failed to update plugin', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/beast-mode/marketplace/installed
 * Uninstall a plugin
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';
    const pluginId = searchParams.get('pluginId');

    if (!pluginId) {
      return NextResponse.json(
        { error: 'Plugin ID is required' },
        { status: 400 }
      );
    }

    const installedPluginsStore = getInstalledPluginsStore();
    const userPlugins = installedPluginsStore.get(userId);
    if (!userPlugins || !userPlugins.has(pluginId)) {
      return NextResponse.json(
        { error: 'Plugin not installed' },
        { status: 404 }
      );
    }

    userPlugins.delete(pluginId);

    return NextResponse.json({
      success: true,
      message: 'Plugin uninstalled successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Uninstall Plugin API error:', error);
    return NextResponse.json(
      { error: 'Failed to uninstall plugin', details: error.message },
      { status: 500 }
    );
  }
}

