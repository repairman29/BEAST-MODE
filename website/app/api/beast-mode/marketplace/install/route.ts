import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Plugin Installation API
 *
 * Handles plugin installation requests from the marketplace
 */
export async function POST(request: NextRequest) {
  try {
    const { pluginId, userId, options = {} } = await request.json();

    if (!pluginId || !userId) {
      return NextResponse.json(
        { error: 'Plugin ID and User ID are required' },
        { status: 400 }
      );
    }

    // Check if marketplace is available
    if (!global.beastMode || !global.beastMode.marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not available' },
        { status: 503 }
      );
    }

    // Track the installation attempt
    global.beastMode.marketplace.trackUsage(userId, 'plugin_install', {
      pluginId,
      timestamp: new Date().toISOString(),
      source: 'marketplace-ui'
    });

    try {
      // Attempt to install the plugin
      const installedPlugin = await global.beastMode.marketplace.installPlugin(pluginId, {
        ...options,
        userId
      });

      // Track successful installation
      global.beastMode.marketplace.trackUsage(userId, 'plugin_install', {
        pluginId,
        success: true,
        installedVersion: installedPlugin.version,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        plugin: installedPlugin,
        message: `Plugin ${installedPlugin.name} installed successfully`,
        timestamp: new Date().toISOString()
      });

    } catch (installError) {
      // Track failed installation
      global.beastMode.marketplace.trackUsage(userId, 'plugin_error', {
        pluginId,
        error: installError.message,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        {
          error: 'Plugin installation failed',
          details: installError.message,
          pluginId
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Plugin Installation API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process plugin installation',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for installation status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pluginId = searchParams.get('pluginId');
    const userId = searchParams.get('userId');

    if (!pluginId || !userId) {
      return NextResponse.json(
        { error: 'Plugin ID and User ID are required' },
        { status: 400 }
      );
    }

    // Check if marketplace is available
    if (!global.beastMode || !global.beastMode.marketplace) {
      return NextResponse.json(
        { error: 'Marketplace not available' },
        { status: 503 }
      );
    }

    // Check if plugin is already installed
    const installedPlugins = global.beastMode.marketplace.installedPlugins;
    const isInstalled = installedPlugins.has(pluginId);

    let installInfo = null;
    if (isInstalled) {
      installInfo = installedPlugins.get(pluginId);
    }

    return NextResponse.json({
      pluginId,
      userId,
      isInstalled,
      installInfo,
      canInstall: !isInstalled,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Installation Status API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check installation status',
        details: error.message
      },
      { status: 500 }
    );
  }
}
