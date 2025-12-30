import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Plugin Permissions API
 * 
 * Handles plugin permission requests, grants, and management
 */

// Permission types
export type PermissionType = 
  | 'read-files'
  | 'write-files'
  | 'execute-commands'
  | 'network-access'
  | 'environment-variables'
  | 'git-access'
  | 'database-access'
  | 'api-keys';

interface Permission {
  type: PermissionType;
  description: string;
  required: boolean;
  granted: boolean;
  requestedAt?: string;
  grantedAt?: string;
}

interface PluginPermissions {
  pluginId: string;
  permissions: Permission[];
  userId: string;
}

declare global {
  var pluginPermissionsStore: Map<string, PluginPermissions> | undefined;
}

const getPermissionsStore = () => {
  if (!global.pluginPermissionsStore) {
    global.pluginPermissionsStore = new Map();
  }
  return global.pluginPermissionsStore;
};

// Default permission requirements for plugins
const DEFAULT_PERMISSIONS: Record<string, PermissionType[]> = {
  'eslint-pro': ['read-files'],
  'typescript-guardian': ['read-files'],
  'security-scanner': ['read-files', 'network-access'],
  'prettier-integration': ['read-files', 'write-files'],
  'test-coverage': ['read-files', 'execute-commands']
};

/**
 * GET /api/beast-mode/marketplace/permissions
 * Get permissions for a plugin or user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pluginId = searchParams.get('pluginId');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const permissionsStore = getPermissionsStore();
    const key = `${userId}:${pluginId || 'all'}`;

    if (pluginId) {
      // Get permissions for specific plugin
      const stored = permissionsStore.get(key);
      
      if (stored) {
        return NextResponse.json({
          pluginId,
          userId,
          permissions: stored.permissions,
          timestamp: new Date().toISOString()
        });
      }

      // Return default permissions if not stored
      const defaultPerms = DEFAULT_PERMISSIONS[pluginId] || [];
      const permissions: Permission[] = defaultPerms.map(type => ({
        type,
        description: getPermissionDescription(type),
        required: true,
        granted: false
      }));

      return NextResponse.json({
        pluginId,
        userId,
        permissions,
        timestamp: new Date().toISOString()
      });
    } else {
      // Get all permissions for user
      const allPermissions: Record<string, Permission[]> = {};
      
      const entries = Array.from(permissionsStore.entries());
      for (const [storeKey, value] of entries) {
        if (storeKey.startsWith(`${userId}:`)) {
          const pluginId = storeKey.split(':')[1];
          allPermissions[pluginId] = value.permissions;
        }
      }

      return NextResponse.json({
        userId,
        permissions: allPermissions,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('Permissions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/beast-mode/marketplace/permissions
 * Request or grant permissions
 */
export async function POST(request: NextRequest) {
  try {
    const { pluginId, userId, permissions, action } = await request.json();

    if (!pluginId || !userId) {
      return NextResponse.json(
        { error: 'Plugin ID and User ID are required' },
        { status: 400 }
      );
    }

    const permissionsStore = getPermissionsStore();
    const key = `${userId}:${pluginId}`;

    if (action === 'request') {
      // Request permissions for plugin
      const defaultPerms = DEFAULT_PERMISSIONS[pluginId] || [];
      const requestedPerms: Permission[] = (permissions || defaultPerms).map((type: PermissionType) => ({
        type,
        description: getPermissionDescription(type),
        required: true,
        granted: false,
        requestedAt: new Date().toISOString()
      }));

      permissionsStore.set(key, {
        pluginId,
        userId,
        permissions: requestedPerms
      });

      return NextResponse.json({
        success: true,
        pluginId,
        userId,
        permissions: requestedPerms,
        message: 'Permissions requested',
        timestamp: new Date().toISOString()
      });
    } else if (action === 'grant') {
      // Grant permissions
      const stored = permissionsStore.get(key);
      if (!stored) {
        return NextResponse.json(
          { error: 'No permission request found' },
          { status: 404 }
        );
      }

      const grantedTypes = permissions || stored.permissions.map(p => p.type);
      
      stored.permissions = stored.permissions.map(perm => {
        if (grantedTypes.includes(perm.type)) {
          return {
            ...perm,
            granted: true,
            grantedAt: new Date().toISOString()
          };
        }
        return perm;
      });

      permissionsStore.set(key, stored);

      return NextResponse.json({
        success: true,
        pluginId,
        userId,
        permissions: stored.permissions,
        message: 'Permissions granted',
        timestamp: new Date().toISOString()
      });
    } else if (action === 'revoke') {
      // Revoke permissions
      const stored = permissionsStore.get(key);
      if (!stored) {
        return NextResponse.json(
          { error: 'No permissions found' },
          { status: 404 }
        );
      }

      const revokedTypes = permissions || stored.permissions.map(p => p.type);
      
      stored.permissions = stored.permissions.map(perm => {
        if (revokedTypes.includes(perm.type)) {
          return {
            ...perm,
            granted: false,
            grantedAt: undefined
          };
        }
        return perm;
      });

      permissionsStore.set(key, stored);

      return NextResponse.json({
        success: true,
        pluginId,
        userId,
        permissions: stored.permissions,
        message: 'Permissions revoked',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "request", "grant", or "revoke"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Permissions API error:', error);
    return NextResponse.json(
      { error: 'Failed to process permissions', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/beast-mode/marketplace/permissions
 * Remove all permissions for a plugin
 */
export async function DELETE(request: NextRequest) {
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

    const permissionsStore = getPermissionsStore();
    const key = `${userId}:${pluginId}`;
    
    permissionsStore.delete(key);

    return NextResponse.json({
      success: true,
      message: 'Permissions removed',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Permissions API error:', error);
    return NextResponse.json(
      { error: 'Failed to remove permissions', details: error.message },
      { status: 500 }
    );
  }
}

function getPermissionDescription(type: PermissionType): string {
  const descriptions: Record<PermissionType, string> = {
    'read-files': 'Read files in your project',
    'write-files': 'Modify files in your project',
    'execute-commands': 'Run system commands',
    'network-access': 'Make network requests',
    'environment-variables': 'Access environment variables',
    'git-access': 'Read and modify git repository',
    'database-access': 'Access database connections',
    'api-keys': 'Access stored API keys'
  };
  return descriptions[type] || 'Unknown permission';
}

