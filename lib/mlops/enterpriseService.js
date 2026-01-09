/**
 * Enterprise Service with Database Integration
 * Uses new enterprise tables for SSO, permissions, audit logs, and settings
 * 
 * Dog Fooding: Built using BEAST MODE
 */

const { createLogger } = require('../utils/logger');
const { getDatabaseWriter } = require('./databaseWriter');

const logger = createLogger('EnterpriseService');

class EnterpriseService {
  constructor() {
    this.databaseWriter = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.databaseWriter = getDatabaseWriter();
      this.initialized = true;
      logger.info('✅ Enterprise service initialized with database integration');
      return true;
    } catch (error) {
      logger.error('Failed to initialize enterprise service:', error);
      return false;
    }
  }

  /**
   * Configure SSO
   */
  async configureSSO(teamId, config) {
    if (!this.initialized) await this.initialize();

    const { ssoType, providerName, enabled, config: ssoConfig } = config;

    try {
      // Check if SSO config exists
      const existing = await this.databaseWriter.read({
        table: 'sso_configurations',
        filter: { team_id: teamId, sso_type: ssoType }
      });

      if (existing && existing.length > 0) {
        // Update existing
        const result = await this.databaseWriter.update({
          table: 'sso_configurations',
          filter: { id: existing[0].id },
          data: {
            provider_name: providerName,
            enabled,
            config: ssoConfig,
            updated_at: new Date().toISOString()
          }
        });
        return { success: true, id: existing[0].id, sso: result };
      }

      // Create new
      const result = await this.databaseWriter.write({
        table: 'sso_configurations',
        data: {
          team_id: teamId,
          sso_type: ssoType,
          provider_name: providerName,
          enabled,
          config: ssoConfig
        }
      });

      logger.info(`Configured SSO: ${providerName} for team ${teamId}`);
      return { success: true, id: result.id, sso: result };
    } catch (error) {
      logger.error('Failed to configure SSO:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create role permission
   */
  async createPermission(config) {
    if (!this.initialized) await this.initialize();

    const { roleName, resourceType, resourceId, permissionType, customPermissions, conditions } = config;

    try {
      const result = await this.databaseWriter.write({
        table: 'role_permissions',
        data: {
          role_name: roleName,
          resource_type: resourceType,
          resource_id: resourceId,
          permission_type: permissionType,
          custom_permissions: customPermissions || {},
          conditions: conditions || {}
        }
      });

      return { success: true, id: result.id, permission: result };
    } catch (error) {
      logger.error('Failed to create permission:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log audit event
   */
  async logAuditEvent(event) {
    if (!this.initialized) await this.initialize();

    const {
      userId,
      teamId,
      actionType,
      resourceType,
      resourceId,
      actionDetails,
      ipAddress,
      userAgent,
      success,
      errorMessage,
      metadata
    } = event;

    try {
      const result = await this.databaseWriter.write({
        table: 'audit_logs',
        data: {
          user_id: userId,
          team_id: teamId,
          action_type: actionType,
          resource_type: resourceType,
          resource_id: resourceId,
          action_details: actionDetails || {},
          ip_address: ipAddress,
          user_agent: userAgent,
          success: success !== false,
          error_message: errorMessage,
          metadata: metadata || {}
        }
      });

      return { success: true, id: result.id };
    } catch (error) {
      logger.warn('Failed to log audit event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set enterprise setting
   */
  async setSetting(teamId, key, value, config = {}) {
    if (!this.initialized) await this.initialize();

    const { settingType, description, isEncrypted, updatedBy } = config;

    try {
      // Check if setting exists
      const existing = await this.databaseWriter.read({
        table: 'enterprise_settings',
        filter: { team_id: teamId, setting_key: key }
      });

      if (existing && existing.length > 0) {
        // Update existing
        const result = await this.databaseWriter.update({
          table: 'enterprise_settings',
          filter: { id: existing[0].id },
          data: {
            setting_value: value,
            updated_by: updatedBy,
            updated_at: new Date().toISOString()
          }
        });
        return { success: true, id: existing[0].id, setting: result };
      }

      // Create new
      const result = await this.databaseWriter.write({
        table: 'enterprise_settings',
        data: {
          team_id: teamId,
          setting_key: key,
          setting_value: value,
          setting_type: settingType || 'json',
          description,
          is_encrypted: isEncrypted || false,
          updated_by: updatedBy
        }
      });

      return { success: true, id: result.id, setting: result };
    } catch (error) {
      logger.error('Failed to set setting:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let instance = null;

function getEnterpriseService() {
  if (!instance) {
    instance = new EnterpriseService();
  }
  return instance;
}

module.exports = {
  EnterpriseService,
  getEnterpriseService
};
