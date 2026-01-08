import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * GitLab Integration API
 */

let gitlabIntegration: any;

try {
  const gitlabModule = loadModule('../../../../../lib/integrations/gitlab') ||
                       require('../../../../../lib/integrations/gitlab');
  gitlabIntegration = gitlabModule?.getGitLabIntegration
    ? gitlabModule.getGitLabIntegration()
    : gitlabModule;
} catch (error) {
  console.warn('[GitLab API] Module not available:', error);
}

/**
 * GET /api/integrations/gitlab
 * Get pipelines or pipeline YAML
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');
    const format = searchParams.get('format') || 'json';

    if (!gitlabIntegration) {
      return NextResponse.json(
        { error: 'GitLab integration not available' },
        { status: 503 }
      );
    }

    if (pipelineId) {
      const pipeline = gitlabIntegration.pipelines.get(pipelineId);
      if (!pipeline) {
        return NextResponse.json(
          { error: 'Pipeline not found' },
          { status: 404 }
        );
      }

      if (format === 'yaml') {
        const yaml = gitlabIntegration.generateCIYAML(pipeline);
        return new NextResponse(yaml, {
          headers: { 'Content-Type': 'text/yaml' }
        });
      }

      return NextResponse.json({
        success: true,
        pipeline
      });
    }

    // List all pipelines
    const pipelines = Array.from(gitlabIntegration.pipelines.values());
    return NextResponse.json({
      success: true,
      pipelines
    });

  } catch (error: any) {
    console.error('[GitLab API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get pipelines', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/gitlab
 * Connect GitLab or create pipeline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config, repo, pipeline } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!gitlabIntegration) {
      return NextResponse.json(
        { error: 'GitLab integration not available' },
        { status: 503 }
      );
    }

    if (action === 'connect') {
      if (!config || !config.accessToken) {
        return NextResponse.json(
          { error: 'accessToken is required' },
          { status: 400 }
        );
      }

      const result = gitlabIntegration.connect(userId, config);
      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'create_pipeline') {
      if (!repo || !pipeline) {
        return NextResponse.json(
          { error: 'repo and pipeline are required' },
          { status: 400 }
        );
      }

      const created = gitlabIntegration.createPipeline(repo, pipeline);
      const yaml = gitlabIntegration.generateCIYAML(created);

      return NextResponse.json({
        success: true,
        pipeline: created,
        yaml
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[GitLab API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process GitLab request', details: error.message },
      { status: 500 }
    );
  }
}
