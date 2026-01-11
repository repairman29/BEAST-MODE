/**
 * Role-Based Access Control (RBAC)
 * 
 * Manages roles and permissions for enterprise features
 */

// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}
const log = createLogger('RBAC');

class RBAC {
  constructor() {
    this.roles = new Map(); // roleName -> permissions[]
    this.userRoles = new Map(); // userId -> roles[]
    this.initializeDefaultRoles();
  }

  /**
   * Initialize default roles
   */
  initializeDefaultRoles() {
    // System roles
    this.roles.set('super_admin', [
      'all'
    ]);

    this.roles.set('admin', [
      'read', 'write', 'delete',
      'manage_users', 'manage_teams',
      'manage_models', 'manage_integrations',
      'view_analytics', 'export_data'
    ]);

    this.roles.set('developer', [
      'read', 'write',
      'use_models', 'generate_code',
      'view_own_analytics'
    ]);

    this.roles.set('viewer', [
      'read',
      'view_analytics'
    ]);

    // Team roles
    this.roles.set('team_owner', [
      'read', 'write', 'delete',
      'manage_team_members', 'manage_team_models',
      'view_team_analytics', 'export_team_data'
    ]);

    this.roles.set('team_admin', [
      'read', 'write',
      'manage_team_members', 'manage_team_models',
      'view_team_analytics'
    ]);

    this.roles.set('team_member', [
      'read', 'write',
      'use_team_models', 'view_team_analytics'
    ]);

    this.roles.set('team_viewer', [
      'read',
      'view_team_analytics'
    ]);
  }

  /**
   * Assign role to user
   */
  assignRole(userId, roleName, context = null) {
    if (!this.roles.has(roleName)) {
      throw new Error(`Role not found: ${roleName}`);
    }

    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, []);
    }

    const userRoles = this.userRoles.get(userId);
    const roleAssignment = {
      role: roleName,
      context, // e.g., { teamId: 'team-123' }
      assignedAt: new Date().toISOString()
    };

    // Check if role already assigned in same context
    const existing = userRoles.find(r => 
      r.role === roleName && 
      JSON.stringify(r.context) === JSON.stringify(context)
    );

    if (!existing) {
      userRoles.push(roleAssignment);
      log.info(`Role assigned: ${userId} -> ${roleName}`, context);
    }

    return roleAssignment;
  }

  /**
   * Remove role from user
   */
  removeRole(userId, roleName, context = null) {
    if (!this.userRoles.has(userId)) {
      return { removed: false };
    }

    const userRoles = this.userRoles.get(userId);
    const index = userRoles.findIndex(r => 
      r.role === roleName && 
      JSON.stringify(r.context) === JSON.stringify(context)
    );

    if (index > -1) {
      userRoles.splice(index, 1);
      log.info(`Role removed: ${userId} -> ${roleName}`, context);
      return { removed: true };
    }

    return { removed: false };
  }

  /**
   * Get user roles
   */
  getUserRoles(userId, context = null) {
    const userRoles = this.userRoles.get(userId) || [];
    
    if (context) {
      return userRoles.filter(r => 
        JSON.stringify(r.context) === JSON.stringify(context)
      );
    }

    return userRoles;
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId, permission, context = null) {
    const userRoles = this.getUserRoles(userId, context);

    for (const roleAssignment of userRoles) {
      const role = this.roles.get(roleAssignment.role);
      if (!role) continue;

      // Super admin has all permissions
      if (role.includes('all')) {
        return true;
      }

      // Check if role has permission
      if (role.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all permissions for user
   */
  getUserPermissions(userId, context = null) {
    const userRoles = this.getUserRoles(userId, context);
    const permissions = new Set();

    for (const roleAssignment of userRoles) {
      const role = this.roles.get(roleAssignment.role);
      if (!role) continue;

      if (role.includes('all')) {
        return ['all']; // Super admin
      }

      role.forEach(perm => permissions.add(perm));
    }

    return Array.from(permissions);
  }

  /**
   * Create custom role
   */
  createRole(roleName, permissions) {
    if (this.roles.has(roleName)) {
      throw new Error(`Role already exists: ${roleName}`);
    }

    this.roles.set(roleName, permissions);
    log.info(`Custom role created: ${roleName}`);
    return { roleName, permissions };
  }

  /**
   * Update role permissions
   */
  updateRole(roleName, permissions) {
    if (!this.roles.has(roleName)) {
      throw new Error(`Role not found: ${roleName}`);
    }

    // Don't allow updating system roles
    const systemRoles = ['super_admin', 'admin', 'developer', 'viewer'];
    if (systemRoles.includes(roleName)) {
      throw new Error(`Cannot update system role: ${roleName}`);
    }

    this.roles.set(roleName, permissions);
    log.info(`Role updated: ${roleName}`);
    return { roleName, permissions };
  }
}

// Singleton instance
let rbacInstance = null;

function getRBAC() {
  if (!rbacInstance) {
    rbacInstance = new RBAC();
  }
  return rbacInstance;
}

module.exports = {
  RBAC,
  getRBAC
};
