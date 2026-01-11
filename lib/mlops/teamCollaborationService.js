/**
 * Team & Collaboration Service with Database Integration
 * Uses new team tables for teams, members, workspaces, and sessions
 * 
 * Dog Fooding: Built using BEAST MODE
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
const { getDatabaseWriter } = require('./databaseWriter');

const logger = createLogger('TeamCollaborationService');

class TeamCollaborationService {
  constructor() {
    this.databaseWriter = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.databaseWriter = getDatabaseWriter();
      this.initialized = true;
      logger.info('✅ Team collaboration service initialized with database integration');
      return true;
    } catch (error) {
      logger.error('Failed to initialize team collaboration service:', error);
      return false;
    }
  }

  /**
   * Create team
   */
  async createTeam(ownerId, config) {
    if (!this.initialized) await this.initialize();

    const { name, description, avatarUrl, settings } = config;

    try {
      const result = await this.databaseWriter.write({
        table: 'teams',
        data: {
          name,
          description,
          owner_id: ownerId,
          avatar_url: avatarUrl,
          settings: settings || {},
          is_active: true
        }
      });

      // Add owner as team member
      await this.addTeamMember(result.id, ownerId, 'owner');

      logger.info(`Created team: ${name} (${result.id})`);
      return { success: true, id: result.id, team: result };
    } catch (error) {
      logger.error('Failed to create team:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add team member
   */
  async addTeamMember(teamId, userId, role = 'member', invitedBy = null) {
    if (!this.initialized) await this.initialize();

    try {
      const result = await this.databaseWriter.write({
        table: 'team_members',
        data: {
          team_id: teamId,
          user_id: userId,
          role,
          invited_by: invitedBy
        }
      });

      return { success: true, id: result.id, member: result };
    } catch (error) {
      logger.error('Failed to add team member:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create shared workspace
   */
  async createWorkspace(teamId, config) {
    if (!this.initialized) await this.initialize();

    const { name, description, workspaceType, config: workspaceConfig, isPublic, createdBy } = config;

    try {
      const result = await this.databaseWriter.write({
        table: 'shared_workspaces',
        data: {
          team_id: teamId,
          name,
          description,
          workspace_type: workspaceType,
          config: workspaceConfig || {},
          is_public: isPublic || false,
          created_by: createdBy
        }
      });

      logger.info(`Created workspace: ${name} (${result.id})`);
      return { success: true, id: result.id, workspace: result };
    } catch (error) {
      logger.error('Failed to create workspace:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start collaboration session
   */
  async startSession(workspaceId, config) {
    if (!this.initialized) await this.initialize();

    const { sessionName, sessionType, participants, hostId } = config;

    try {
      const result = await this.databaseWriter.write({
        table: 'collaboration_sessions',
        data: {
          workspace_id: workspaceId,
          session_name: sessionName,
          session_type: sessionType,
          participants: participants || [],
          host_id: hostId,
          status: 'active'
        }
      });

      logger.info(`Started collaboration session: ${sessionName} (${result.id})`);
      return { success: true, id: result.id, session: result };
    } catch (error) {
      logger.error('Failed to start session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * End collaboration session
   */
  async endSession(sessionId) {
    if (!this.initialized) await this.initialize();

    try {
      await this.databaseWriter.update({
        table: 'collaboration_sessions',
        filter: { id: sessionId },
        data: {
          status: 'ended',
          ended_at: new Date().toISOString()
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to end session:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let instance = null;

function getTeamCollaborationService() {
  if (!instance) {
    instance = new TeamCollaborationService();
  }
  return instance;
}

module.exports = {
  TeamCollaborationService,
  getTeamCollaborationService
};
