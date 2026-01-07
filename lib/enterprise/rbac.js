/**
 * Role-Based Access Control Service
 * Manages user roles, permissions, and access policies
 * 
 * Month 7: Enterprise Features
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('RBAC');

class RBAC {
  constructor() {
    this.roles = new Map();
    this.users = new Map();
    this.permissions = new Map();
    this.policies = [];
  }

  /**
   * Initialize RBAC
   */
  async initialize() {
    try {
      // Define default roles
      this.defineDefaultRoles();
      logger.info('✅ RBAC initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize RBAC:', error);
      return false;
    }
  }

  /**
   * Define default roles
   */
  defineDefaultRoles() {
    // Admin role
    this.createRole('admin', {
      permissions: [
        'models:read',
        'models:write',
        'models:delete',
        'models:train',
        'models:deploy',
        'tenants:read',
        'tenants:write',
        'tenants:delete',
        'users:read',
        'users:write',
        'users:delete',
        'analytics:read',
        'analytics:write',
        'security:read',
        'security:write'
      ],
      description: 'Full system access'
    });

    // Data Scientist role
    this.createRole('data_scientist', {
      permissions: [
        'models:read',
        'models:write',
        'models:train',
        'models:deploy',
        'analytics:read',
        'analytics:write'
      ],
      description: 'Model development and training'
    });

    // Developer role
    this.createRole('developer', {
      permissions: [
        'models:read',
        'models:write',
        'predictions:read',
        'predictions:write'
      ],
      description: 'Application development'
    });

    // Viewer role
    this.createRole('viewer', {
      permissions: [
        'models:read',
        'predictions:read',
        'analytics:read'
      ],
      description: 'Read-only access'
    });
  }

  /**
   * Create role
   */
  createRole(roleName, config = {}) {
    const role = {
      name: roleName,
      permissions: config.permissions || [],
      description: config.description || '',
      createdAt: Date.now()
    };

    this.roles.set(roleName, role);
    logger.info(`Role created: ${roleName}`);
    return role;
  }

  /**
   * Get role
   */
  getRole(roleName) {
    return this.roles.get(roleName) || null;
  }

  /**
   * Assign role to user
   */
  assignRole(userId, tenantId, roleName) {
    if (!this.roles.has(roleName)) {
      throw new Error(`Role ${roleName} does not exist`);
    }

    const userKey = `${tenantId}:${userId}`;
    const user = this.users.get(userKey) || {
      userId,
      tenantId,
      roles: [],
      createdAt: Date.now()
    };

    if (!user.roles.includes(roleName)) {
      user.roles.push(roleName);
    }

    user.updatedAt = Date.now();
    this.users.set(userKey, user);

    logger.info(`Role ${roleName} assigned to user ${userId} in tenant ${tenantId}`);
    return user;
  }

  /**
   * Remove role from user
   */
  removeRole(userId, tenantId, roleName) {
    const userKey = `${tenantId}:${userId}`;
    const user = this.users.get(userKey);

    if (!user) {
      throw new Error('User not found');
    }

    user.roles = user.roles.filter(r => r !== roleName);
    user.updatedAt = Date.now();
    this.users.set(userKey, user);

    logger.info(`Role ${roleName} removed from user ${userId}`);
    return user;
  }

  /**
   * Check permission
   */
  hasPermission(userId, tenantId, permission) {
    const userKey = `${tenantId}:${userId}`;
    const user = this.users.get(userKey);

    if (!user) {
      return false;
    }

    // Check all user roles
    for (const roleName of user.roles) {
      const role = this.roles.get(roleName);
      if (role && role.permissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check multiple permissions
   */
  hasPermissions(userId, tenantId, permissions, requireAll = false) {
    if (requireAll) {
      return permissions.every(p => this.hasPermission(userId, tenantId, p));
    } else {
      return permissions.some(p => this.hasPermission(userId, tenantId, p));
    }
  }

  /**
   * Get user permissions
   */
  getUserPermissions(userId, tenantId) {
    const userKey = `${tenantId}:${userId}`;
    const user = this.users.get(userKey);

    if (!user) {
      return [];
    }

    const permissions = new Set();
    for (const roleName of user.roles) {
      const role = this.roles.get(roleName);
      if (role) {
        role.permissions.forEach(p => permissions.add(p));
      }
    }

    return Array.from(permissions);
  }

  /**
   * Create access policy
   */
  createPolicy(name, conditions, actions) {
    const policy = {
      name,
      conditions,
      actions,
      createdAt: Date.now()
    };

    this.policies.push(policy);
    logger.info(`Policy created: ${name}`);
    return policy;
  }

  /**
   * Evaluate policy
   */
  evaluatePolicy(policyName, context) {
    const policy = this.policies.find(p => p.name === policyName);
    if (!policy) {
      return { allowed: false, reason: 'Policy not found' };
    }

    // Evaluate conditions (simplified)
    const conditionsMet = policy.conditions.every(condition => {
      // Simple condition evaluation
      return context[condition.key] === condition.value;
    });

    return {
      allowed: conditionsMet,
      actions: conditionsMet ? policy.actions : []
    };
  }

  /**
   * Get user info
   */
  getUser(userId, tenantId) {
    const userKey = `${tenantId}:${userId}`;
    const user = this.users.get(userKey);
    
    if (!user) {
      return null;
    }

    return {
      ...user,
      permissions: this.getUserPermissions(userId, tenantId)
    };
  }

  /**
   * List users in tenant
   */
  listUsers(tenantId) {
    return Array.from(this.users.values())
      .filter(user => user.tenantId === tenantId);
  }
}

// Singleton instance
let instance = null;

function getRBAC() {
  if (!instance) {
    instance = new RBAC();
  }
  return instance;
}

module.exports = {
  RBAC,
  getRBAC
};

