/**
 * BEAST MODE Shared Dashboard
 * 
 * Team visibility, role-based access, and collaborative insights
 */

class SharedDashboard {
  constructor(options = {}) {
    this.dashboardId = options.dashboardId;
    this.workspaceId = options.workspaceId;
    this.options = {
      enableRealTime: options.enableRealTime !== false,
      enableCustomization: options.enableCustomization !== false,
      ...options
    };
  }

  /**
   * Create shared dashboard
   */
  async createDashboard(dashboardData) {
    const { name, description, workspaceId, widgets, visibility } = dashboardData;
    
    return {
      dashboardId: `dashboard-${Date.now()}`,
      name,
      description,
      workspaceId,
      widgets: widgets || this.getDefaultWidgets(),
      visibility: visibility || 'workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: dashboardData.createdBy
    };
  }

  /**
   * Get default widgets
   */
  getDefaultWidgets() {
    return [
      {
        id: 'overall-quality',
        type: 'quality-score',
        title: 'Overall Quality Score',
        config: {
          showTrend: true,
          showBreakdown: true
        }
      },
      {
        id: 'team-metrics',
        type: 'team-metrics',
        title: 'Team Metrics',
        config: {
          showMemberScores: true,
          showProjectScores: true
        }
      },
      {
        id: 'active-issues',
        type: 'issues-list',
        title: 'Active Issues',
        config: {
          limit: 10,
          severity: 'all'
        }
      },
      {
        id: 'recent-activity',
        type: 'activity-feed',
        title: 'Recent Activity',
        config: {
          limit: 20
        }
      }
    ];
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(filters = {}) {
    const { timeRange = '30d', projectIds = [], userIds = [] } = filters;

    return {
      overallMetrics: await this.getOverallMetrics(timeRange, projectIds, userIds),
      teamMetrics: await this.getTeamMetrics(timeRange, projectIds, userIds),
      projectMetrics: await this.getProjectMetrics(projectIds),
      recentActivity: await this.getRecentActivity(20),
      topIssues: await this.getTopIssues(10),
      trends: await this.getTrends(timeRange)
    };
  }

  /**
   * Get overall metrics
   */
  async getOverallMetrics(timeRange, projectIds, userIds) {
    return {
      qualityScore: 82,
      totalProjects: projectIds.length || 5,
      totalIssues: 45,
      resolvedIssues: 32,
      activeMembers: userIds.length || 8,
      averageScore: 82,
      trend: 'improving',
      trendValue: 3.2
    };
  }

  /**
   * Get team metrics
   */
  async getTeamMetrics(timeRange, projectIds, userIds) {
    return {
      memberCount: userIds.length || 8,
      activeMembers: 6,
      averageScore: 82,
      scoreDistribution: {
        excellent: 2,
        good: 4,
        fair: 2,
        needsImprovement: 0
      },
      topPerformers: [
        { userId: 'user-1', userName: 'Developer 1', score: 92 },
        { userId: 'user-2', userName: 'Developer 2', score: 88 }
      ]
    };
  }

  /**
   * Get project metrics
   */
  async getProjectMetrics(projectIds) {
    return projectIds.map(projectId => ({
      projectId,
      projectName: `Project ${projectId}`,
      score: 80 + Math.floor(Math.random() * 20),
      issues: Math.floor(Math.random() * 20),
      contributors: Math.floor(Math.random() * 5) + 1,
      lastUpdated: new Date().toISOString()
    }));
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit) {
    return [
      {
        id: 'activity-1',
        type: 'scan',
        userId: 'user-1',
        userName: 'Developer 1',
        action: 'completed quality scan',
        target: 'project-1',
        timestamp: new Date().toISOString()
      },
      {
        id: 'activity-2',
        type: 'mission',
        userId: 'user-2',
        userName: 'Developer 2',
        action: 'updated mission',
        target: 'mission-1',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ].slice(0, limit);
  }

  /**
   * Get top issues
   */
  async getTopIssues(limit) {
    return [
      {
        id: 'issue-1',
        type: 'security',
        severity: 'high',
        message: 'Potential XSS vulnerability',
        projectId: 'project-1',
        count: 5
      },
      {
        id: 'issue-2',
        type: 'performance',
        severity: 'medium',
        message: 'Inefficient loop detected',
        projectId: 'project-2',
        count: 3
      }
    ].slice(0, limit);
  }

  /**
   * Get trends
   */
  async getTrends(timeRange) {
    return {
      qualityScore: {
        direction: 'up',
        change: 3.2,
        data: [78, 79, 80, 81, 82]
      },
      issues: {
        direction: 'down',
        change: -5,
        data: [50, 48, 47, 46, 45]
      },
      resolvedIssues: {
        direction: 'up',
        change: 8,
        data: [24, 26, 28, 30, 32]
      }
    };
  }

  /**
   * Update dashboard configuration
   */
  async updateDashboard(dashboardId, updates) {
    return {
      dashboardId,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Share dashboard
   */
  async shareDashboard(dashboardId, shareConfig) {
    const { userIds, role, expiresAt } = shareConfig;
    
    return {
      dashboardId,
      sharedWith: userIds.map(userId => ({
        userId,
        role: role || 'viewer',
        sharedAt: new Date().toISOString(),
        expiresAt
      })),
      shareLink: `https://beastmode.dev/dashboard/shared/${dashboardId}`,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Get dashboard permissions
   */
  async getPermissions(dashboardId, userId) {
    // This would check user's role and permissions
    return {
      canView: true,
      canEdit: true,
      canShare: false,
      canDelete: false,
      role: 'member'
    };
  }
}

module.exports = SharedDashboard;

