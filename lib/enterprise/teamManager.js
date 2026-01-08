/**
 * Team Manager
 * 
 * Manages teams, members, and permissions for enterprise features
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('TeamManager');

class TeamManager {
  constructor() {
    this.teams = new Map(); // teamId -> team data
    this.members = new Map(); // userId -> teamIds[]
    this.permissions = new Map(); // teamId -> userId -> permissions[]
  }

  /**
   * Create a team
   */
  async createTeam(ownerId, teamName, description = '') {
    const teamId = `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const team = {
      id: teamId,
      name: teamName,
      description,
      ownerId,
      createdAt: new Date().toISOString(),
      memberCount: 1,
      status: 'active'
    };

    this.teams.set(teamId, team);
    this.addMember(teamId, ownerId, 'owner');

    log.info(`Team created: ${teamId} by ${ownerId}`);
    return team;
  }

  /**
   * Add member to team
   */
  addMember(teamId, userId, role = 'member') {
    if (!this.teams.has(teamId)) {
      throw new Error(`Team not found: ${teamId}`);
    }

    const team = this.teams.get(teamId);
    
    if (!this.members.has(userId)) {
      this.members.set(userId, []);
    }

    const userTeams = this.members.get(userId);
    if (!userTeams.includes(teamId)) {
      userTeams.push(teamId);
    }

    // Set permissions
    if (!this.permissions.has(teamId)) {
      this.permissions.set(teamId, new Map());
    }
    this.permissions.get(teamId).set(userId, role);

    team.memberCount = Array.from(this.permissions.get(teamId).keys()).length;
    this.teams.set(teamId, team);

    log.info(`Member added to team: ${userId} -> ${teamId} (${role})`);
    return { teamId, userId, role };
  }

  /**
   * Remove member from team
   */
  removeMember(teamId, userId) {
    if (!this.teams.has(teamId)) {
      throw new Error(`Team not found: ${teamId}`);
    }

    const userTeams = this.members.get(userId) || [];
    const index = userTeams.indexOf(teamId);
    if (index > -1) {
      userTeams.splice(index, 1);
    }

    if (this.permissions.has(teamId)) {
      this.permissions.get(teamId).delete(userId);
    }

    const team = this.teams.get(teamId);
    team.memberCount = this.permissions.get(teamId)?.size || 0;
    this.teams.set(teamId, team);

    log.info(`Member removed from team: ${userId} -> ${teamId}`);
    return { teamId, userId, removed: true };
  }

  /**
   * Get user's teams
   */
  getUserTeams(userId) {
    const teamIds = this.members.get(userId) || [];
    return teamIds.map(id => {
      const team = this.teams.get(id);
      const role = this.permissions.get(id)?.get(userId) || 'member';
      return { ...team, role };
    });
  }

  /**
   * Get team members
   */
  getTeamMembers(teamId) {
    if (!this.teams.has(teamId)) {
      throw new Error(`Team not found: ${teamId}`);
    }

    const permissions = this.permissions.get(teamId) || new Map();
    const members = [];

    for (const [userId, role] of permissions.entries()) {
      members.push({ userId, role });
    }

    return members;
  }

  /**
   * Check if user has permission
   */
  hasPermission(teamId, userId, permission) {
    const role = this.permissions.get(teamId)?.get(userId);
    if (!role) return false;

    const rolePermissions = {
      owner: ['read', 'write', 'admin', 'delete', 'manage_members'],
      admin: ['read', 'write', 'admin', 'manage_members'],
      member: ['read', 'write'],
      viewer: ['read']
    };

    return rolePermissions[role]?.includes(permission) || false;
  }

  /**
   * Update member role
   */
  updateMemberRole(teamId, userId, newRole) {
    if (!this.teams.has(teamId)) {
      throw new Error(`Team not found: ${teamId}`);
    }

    if (!this.permissions.has(teamId)) {
      this.permissions.set(teamId, new Map());
    }

    this.permissions.get(teamId).set(userId, newRole);
    log.info(`Member role updated: ${userId} -> ${teamId} (${newRole})`);
    return { teamId, userId, role: newRole };
  }

  /**
   * Delete team
   */
  deleteTeam(teamId, userId) {
    if (!this.teams.has(teamId)) {
      throw new Error(`Team not found: ${teamId}`);
    }

    const team = this.teams.get(teamId);
    if (team.ownerId !== userId && !this.hasPermission(teamId, userId, 'delete')) {
      throw new Error('Only team owner can delete team');
    }

    // Remove all members
    const permissions = this.permissions.get(teamId) || new Map();
    for (const memberUserId of permissions.keys()) {
      this.removeMember(teamId, memberUserId);
    }

    this.teams.delete(teamId);
    this.permissions.delete(teamId);

    log.info(`Team deleted: ${teamId}`);
    return { teamId, deleted: true };
  }
}

// Singleton instance
let teamManagerInstance = null;

function getTeamManager() {
  if (!teamManagerInstance) {
    teamManagerInstance = new TeamManager();
  }
  return teamManagerInstance;
}

module.exports = {
  TeamManager,
  getTeamManager
};
