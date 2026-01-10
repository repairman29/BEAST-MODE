/**
 * API Module Loader
 * 
 * Handles loading Node.js modules in both development and production
 * Works around Vercel serverless limitations with dynamic requires
 */

let moduleCache: Map<string, any> = new Map();

/**
 * Load a module with caching and error handling
 * Works in both dev and production (Vercel serverless)
 */
export function loadModule<T = any>(modulePath: string): T | null {
  // Check cache first
  if (moduleCache.has(modulePath)) {
    return moduleCache.get(modulePath) as T;
  }

  try {
    // Try direct require (works in dev and if bundled)
    const loadedModule = require(modulePath);
    moduleCache.set(modulePath, loadedModule);
    return loadedModule as T;
  } catch (error: any) {
    // If direct require fails, try with path resolution
    try {
      const resolvedPath = require.resolve(modulePath);
      const loadedModule = require(resolvedPath);
      moduleCache.set(modulePath, loadedModule);
      return loadedModule as T;
    } catch (resolveError: any) {
      console.warn(`[Module Loader] Could not load ${modulePath}:`, error.message);
      return null;
    }
  }
}

/**
 * Load module with fallback
 */
export function loadModuleWithFallback<T = any>(
  modulePath: string,
  fallback: T | null = null
): T {
  return loadModule<T>(modulePath) || fallback;
}

/**
 * Clear module cache (useful for testing)
 */
export function clearModuleCache() {
  moduleCache.clear();
}

/**
 * Preload modules (call during initialization)
 */
export async function preloadModules(modulePaths: string[]) {
  for (const path of modulePaths) {
    loadModule(path);
  }
}
