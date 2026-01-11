import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * GitHub Actions Integration API
 */

let githubActions: any;

try {
  const githubActionsModule = loadModule('@/lib/integrations/githubActions') ||
                              require('@/lib/integrations/githubActions');
  githubActions = githubActionsModule?.getGitHubActionsIntegration
    ? githubActionsModule.getGitHubActionsIntegration()
    : githubActionsModule;
} catch (error) {
  console.warn('[GitHub Actions API] Module not available:', error);
}

/**
 * GET /api/integrations/github-actions
 * Get workflows or workflow YAML
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const format = searchParams.get('format') || 'json';

    if (!githubActions) {
      return NextResponse.json(
        { error: 'GitHub Actions integration not available' },
        { status: 503 }
      );
    }

    if (workflowId) {
      const workflow = githubActions.workflows.get(workflowId);
      if (!workflow) {
        return NextResponse.json(
          { error: 'Workflow not found' },
          { status: 404 }
        );
      }

      if (format === 'yaml') {
        const yaml = githubActions.generateWorkflowYAML(workflow);
        return new NextResponse(yaml, {
          headers: { 'Content-Type': 'text/yaml' }
        });
      }

      return NextResponse.json({
        success: true,
        workflow
      });
    }

    // List all workflows
    const workflows = Array.from(githubActions.workflows.values());
    return NextResponse.json({
      success: true,
      workflows
    });

  } catch (error: any) {
    console.error('[GitHub Actions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get workflows', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/github-actions
 * Create workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, workflow } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!repo || !workflow) {
      return NextResponse.json(
        { error: 'repo and workflow are required' },
        { status: 400 }
      );
    }

    if (!githubActions) {
      return NextResponse.json(
        { error: 'GitHub Actions integration not available' },
        { status: 503 }
      );
    }

    const created = githubActions.createWorkflow(repo, workflow);
    const yaml = githubActions.generateWorkflowYAML(created);

    return NextResponse.json({
      success: true,
      workflow: created,
      yaml
    });

  } catch (error: any) {
    console.error('[GitHub Actions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow', details: error.message },
      { status: 500 }
    );
  }
}
