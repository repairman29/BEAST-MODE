"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

type PermissionType = 
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

interface PluginPermissionsProps {
  pluginId: string;
  pluginName: string;
  userId?: string;
  onPermissionsChanged?: () => void;
}

export default function PluginPermissions({ 
  pluginId, 
  pluginName,
  userId,
  onPermissionsChanged 
}: PluginPermissionsProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [pluginId, userId]);

  const fetchPermissions = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/beast-mode/marketplace/permissions?pluginId=${pluginId}&userId=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermissions = async () => {
    if (!userId) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/beast-mode/marketplace/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          userId,
          action: 'request'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
        if (onPermissionsChanged) {
          onPermissionsChanged();
        }
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGrantPermission = async (permissionType: PermissionType) => {
    if (!userId) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/beast-mode/marketplace/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          userId,
          action: 'grant',
          permissions: [permissionType]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
        if (onPermissionsChanged) {
          onPermissionsChanged();
        }
      }
    } catch (error) {
      console.error('Failed to grant permission:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevokePermission = async (permissionType: PermissionType) => {
    if (!userId) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/beast-mode/marketplace/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          userId,
          action: 'revoke',
          permissions: [permissionType]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
        if (onPermissionsChanged) {
          onPermissionsChanged();
        }
      }
    } catch (error) {
      console.error('Failed to revoke permission:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGrantAll = async () => {
    if (!userId) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/beast-mode/marketplace/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId,
          userId,
          action: 'grant'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
        if (onPermissionsChanged) {
          onPermissionsChanged();
        }
      }
    } catch (error) {
      console.error('Failed to grant all permissions:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getPermissionIcon = (type: PermissionType) => {
    const icons: Record<PermissionType, string> = {
      'read-files': '📖',
      'write-files': '✏️',
      'execute-commands': '⚡',
      'network-access': '🌐',
      'environment-variables': '🔐',
      'git-access': '🔀',
      'database-access': '💾',
      'api-keys': '🔑'
    };
    return icons[type] || '🔒';
  };

  const getPermissionColor = (granted: boolean) => {
    return granted ? 'text-green-400' : 'text-slate-400';
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-6">
          <div className="text-slate-400 text-center">Loading permissions...</div>
        </CardContent>
      </Card>
    );
  }

  if (permissions.length === 0) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">🔒 Plugin Permissions</CardTitle>
          <CardDescription className="text-slate-400">
            {pluginName} doesn't require any special permissions
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const grantedCount = permissions.filter(p => p.granted).length;
  const totalCount = permissions.length;

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-lg">🔒 Plugin Permissions</CardTitle>
            <CardDescription className="text-slate-400">
              {pluginName} requires {totalCount} permission{totalCount !== 1 ? 's' : ''} • {grantedCount}/{totalCount} granted
            </CardDescription>
          </div>
          {grantedCount < totalCount && (
            <Button
              onClick={handleGrantAll}
              disabled={isUpdating}
              className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs"
            >
              Grant All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {permissions.map((permission) => (
          <div
            key={permission.type}
            className={`p-3 rounded-lg border ${
              permission.granted
                ? 'bg-green-950/50 border-green-800'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{getPermissionIcon(permission.type)}</span>
                  <div>
                    <div className={`font-semibold ${getPermissionColor(permission.granted)}`}>
                      {permission.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-slate-400 text-sm">{permission.description}</div>
                  </div>
                </div>
                {permission.granted && permission.grantedAt && (
                  <div className="text-slate-500 text-xs mt-1">
                    Granted: {new Date(permission.grantedAt).toLocaleDateString()}
                  </div>
                )}
                {!permission.granted && permission.requestedAt && (
                  <div className="text-yellow-400 text-xs mt-1">
                    Requested: {new Date(permission.requestedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="ml-4">
                {permission.granted ? (
                  <Button
                    onClick={() => handleRevokePermission(permission.type)}
                    disabled={isUpdating}
                    variant="outline"
                    className="border-red-700 text-red-400 hover:bg-red-900/20 text-xs"
                  >
                    Revoke
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleGrantPermission(permission.type)}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    Grant
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {grantedCount === 0 && (
          <div className="mt-4 p-3 bg-yellow-950/50 border border-yellow-800 rounded-lg">
            <div className="text-yellow-400 text-sm font-semibold mb-1">⚠️ Permissions Required</div>
            <div className="text-slate-300 text-xs">
              This plugin requires permissions to function. Grant permissions to enable full functionality.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

