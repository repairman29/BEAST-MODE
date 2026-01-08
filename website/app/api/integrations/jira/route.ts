import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Jira Integration API
 */

let jiraIntegration: any;

try {
  const jiraModule = loadModule('../../../../../lib/integrations/jira') ||
                     require('../../../../../lib/integrations/jira');
  jiraIntegration = jiraModule?.getJiraIntegration
    ? jiraModule.getJiraIntegration()
    : jiraModule;
} catch (error) {
  console.warn('[Jira API] Module not available:', error);
}

/**
 * POST /api/integrations/jira
 * Connect Jira or create issues
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config, qualityFinding } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!jiraIntegration) {
      return NextResponse.json(
        { error: 'Jira integration not available' },
        { status: 503 }
      );
    }

    if (action === 'connect') {
      if (!config || !config.jiraUrl || !config.apiToken) {
        return NextResponse.json(
          { error: 'jiraUrl and apiToken are required' },
          { status: 400 }
        );
      }

      const result = jiraIntegration.connect(userId, config);
      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'create_issue') {
      if (!qualityFinding) {
        return NextResponse.json(
          { error: 'qualityFinding is required' },
          { status: 400 }
        );
      }

      const result = await jiraIntegration.createIssue(userId, qualityFinding);
      return NextResponse.json({
        success: true,
        result
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Jira API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process Jira request', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/jira
 * Get user's Jira issues
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!jiraIntegration) {
      return NextResponse.json(
        { error: 'Jira integration not available' },
        { status: 503 }
      );
    }

    const issues = jiraIntegration.getUserIssues(userId);
    return NextResponse.json({
      success: true,
      issues
    });

  } catch (error: any) {
    console.error('[Jira API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get Jira issues', details: error.message },
      { status: 500 }
    );
  }
}
