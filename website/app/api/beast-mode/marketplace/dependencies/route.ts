import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Plugin Dependencies API
 * 
 * Handles dependency resolution, conflict detection, and auto-installation
 */

/**
 * Resolve plugin dependencies recursively
 */
async function resolveDependencies(
  pluginId: string,
  registry: Record<string, any>,
  installed: Set<string>,
  resolving: Set<string> = new Set(),
  resolved: string[] = []
): Promise<{ dependencies: string[], conflicts: string[], missing: string[] }> {
  // Check for circular dependencies
  if (resolving.has(pluginId)) {
    return {
      dependencies: [],
      conflicts: [`Circular dependency detected: ${pluginId}`],
      missing: []
    };
  }

  resolving.add(pluginId);
  const plugin = registry[pluginId];
  
  if (!plugin) {
    resolving.delete(pluginId);
    return {
      dependencies: [],
      conflicts: [],
      missing: [pluginId]
    };
  }

  const dependencies: string[] = [];
  const conflicts: string[] = [];
  const missing: string[] = [];

  // Get plugin dependencies
  const pluginDeps = plugin.dependencies || [];

  for (const depId of pluginDeps) {
    // Check if already installed
    if (installed.has(depId)) {
      continue;
    }

    // Check if already resolved in this resolution chain
    if (resolved.includes(depId)) {
      continue;
    }

    // Check if dependency exists in registry
    if (!registry[depId]) {
      missing.push(depId);
      continue;
    }

    // Check for version conflicts (simplified - in production would check versions)
    const depPlugin = registry[depId];
    if (depPlugin.dependencies && depPlugin.dependencies.includes(pluginId)) {
      conflicts.push(`Circular dependency: ${pluginId} <-> ${depId}`);
      continue;
    }

    // Recursively resolve dependency's dependencies
    const depResult = await resolveDependencies(
      depId,
      registry,
      installed,
      resolving,
      [...resolved, pluginId]
    );

    if (depResult.conflicts.length > 0) {
      conflicts.push(...depResult.conflicts);
    }
    if (depResult.missing.length > 0) {
      missing.push(...depResult.missing);
    }

    // Add dependency and its dependencies
    dependencies.push(depId, ...depResult.dependencies);
  }

  resolving.delete(pluginId);
  
  // Remove duplicates while preserving order
  const uniqueDeps = Array.from(new Set(dependencies));

  return {
    dependencies: uniqueDeps,
    conflicts,
    missing
  };
}

/**
 * GET /api/beast-mode/marketplace/dependencies
 * Get dependencies for a plugin
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pluginId = searchParams.get('pluginId');
    const userId = searchParams.get('userId');

    if (!pluginId) {
      return NextResponse.json(
        { error: 'Plugin ID is required' },
        { status: 400 }
      );
    }

    // Fetch plugin registry
    const pluginsResponse = await fetch(`${request.nextUrl.origin}/api/beast-mode/marketplace/plugins`);
    if (!pluginsResponse.ok) {
      throw new Error('Failed to fetch plugin registry');
    }
    const pluginsData = await pluginsResponse.json();
    const registry: Record<string, any> = {};
    (pluginsData.plugins || []).forEach((p: any) => {
      registry[p.id] = p;
    });

    // Get installed plugins
    const installed = new Set<string>();
    if (userId) {
      try {
        const installedResponse = await fetch(
          `${request.nextUrl.origin}/api/beast-mode/marketplace/installed?userId=${userId}`
        );
        if (installedResponse.ok) {
          const installedData = await installedResponse.json();
          (installedData.plugins || []).forEach((p: any) => {
            installed.add(p.id);
          });
        }
      } catch (e) {
        // Ignore errors fetching installed plugins
      }
    }

    // Resolve dependencies
    const result = await resolveDependencies(pluginId, registry, installed);

    // Get dependency details
    const dependencyDetails = result.dependencies.map((depId: string) => {
      const dep = registry[depId];
      return dep ? {
        id: depId,
        name: dep.name,
        version: dep.version,
        description: dep.description,
        category: dep.category
      } : { id: depId, name: depId, missing: true };
    });

    return NextResponse.json({
      pluginId,
      dependencies: result.dependencies,
      dependencyDetails,
      conflicts: result.conflicts,
      missing: result.missing,
      canInstall: result.conflicts.length === 0 && result.missing.length === 0,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Dependencies API error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve dependencies', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/beast-mode/marketplace/dependencies
 * Install plugin with all dependencies
 */
export async function POST(request: NextRequest) {
  try {
    const { pluginId, userId, autoInstall = true } = await request.json();

    if (!pluginId || !userId) {
      return NextResponse.json(
        { error: 'Plugin ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get dependency resolution
    const depsResponse = await fetch(
      `${request.nextUrl.origin}/api/beast-mode/marketplace/dependencies?pluginId=${pluginId}&userId=${userId}`
    );
    
    if (!depsResponse.ok) {
      throw new Error('Failed to resolve dependencies');
    }

    const depsData = await depsResponse.json();

    if (depsData.conflicts.length > 0 || depsData.missing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot install due to dependency issues',
        conflicts: depsData.conflicts,
        missing: depsData.missing
      }, { status: 400 });
    }

    const installedPlugins: string[] = [];

    // Install dependencies first (in order)
    if (autoInstall && depsData.dependencies.length > 0) {
      for (const depId of depsData.dependencies) {
        try {
          const installResponse = await fetch(
            `${request.nextUrl.origin}/api/beast-mode/marketplace/install`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pluginId: depId, userId })
            }
          );

          if (installResponse.ok) {
            installedPlugins.push(depId);
          }
        } catch (e) {
          console.error(`Failed to install dependency ${depId}:`, e);
        }
      }
    }

    // Install main plugin
    const mainInstallResponse = await fetch(
      `${request.nextUrl.origin}/api/beast-mode/marketplace/install`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluginId, userId })
      }
    );

    if (!mainInstallResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Failed to install main plugin'
      }, { status: 500 });
    }

    const mainPlugin = await mainInstallResponse.json();

    return NextResponse.json({
      success: true,
      plugin: mainPlugin.plugin,
      dependencies: depsData.dependencyDetails,
      installedDependencies: installedPlugins,
      message: `Plugin ${mainPlugin.plugin.name} and ${installedPlugins.length} dependency(ies) installed successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Dependency Installation API error:', error);
    return NextResponse.json(
      { error: 'Failed to install plugin with dependencies', details: error.message },
      { status: 500 }
    );
  }
}

