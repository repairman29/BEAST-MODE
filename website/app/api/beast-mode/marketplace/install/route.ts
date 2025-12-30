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

    // Mock plugin data
    const mockPlugins: Record<string, any> = {
      'eslint-pro': { name: 'ESLint Pro', version: '1.0.0' },
      'typescript-guardian': { name: 'TypeScript Guardian', version: '2.1.0' },
      'security-scanner': { name: 'Security Scanner', version: '1.5.0' },
      'prettier-integration': { name: 'Prettier Integration', version: '3.2.1' },
      'test-coverage': { name: 'Test Coverage', version: '1.8.0' }
    };

    const plugin = mockPlugins[pluginId] || { name: pluginId, version: '1.0.0' };

    // Simulate installation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Store installation in installed plugins API
    // In production, this would be stored in database
    if (!global.installedPluginsStore) {
      global.installedPluginsStore = new Map();
    }
    if (!global.installedPluginsStore.has(userId)) {
      global.installedPluginsStore.set(userId, new Map());
    }
    
    const userPlugins = global.installedPluginsStore.get(userId);
    userPlugins.set(pluginId, {
      id: pluginId,
      name: plugin.name,
      version: plugin.version,
      enabled: true,
      config: options.config || {},
      installedAt: new Date().toISOString()
    });

    // Return success response
    return NextResponse.json({
      success: true,
      plugin: {
        id: pluginId,
        name: plugin.name,
        version: plugin.version,
        installedAt: new Date().toISOString(),
        enabled: true,
        config: options.config || {}
      },
      message: `Plugin ${plugin.name} installed successfully`,
      timestamp: new Date().toISOString()
    });

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
