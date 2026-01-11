import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Bitbucket Integration API
 */

let bitbucketIntegration: any;

try {
  const bitbucketModule = loadModule('@/lib/integrations/bitbucket') ||
                         require('@/lib/integrations/bitbucket');
  bitbucketIntegration = bitbucketModule?.getBitbucketIntegration
    ? bitbucketModule.getBitbucketIntegration()
    : bitbucketModule;
} catch (error) {
  console.warn('[Bitbucket API] Module not available:', error);
}

/**
 * GET /api/integrations/bitbucket
 * Get pipelines or pipeline YAML
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');
    const format = searchParams.get('format') || 'json';

    if (!bitbucketIntegration) {
      return NextResponse.json(
        { error: 'Bitbucket integration not available' },
        { status: 503 }
      );
    }

    if (pipelineId) {
      const pipeline = bitbucketIntegration.pipelines.get(pipelineId);
      if (!pipeline) {
        return NextResponse.json(
          { error: 'Pipeline not found' },
          { status: 404 }
        );
      }

      if (format === 'yaml') {
        const yaml = bitbucketIntegration.generatePipelineYAML(pipeline);
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
    const pipelines = Array.from(bitbucketIntegration.pipelines.values());
    return NextResponse.json({
      success: true,
      pipelines
    });

  } catch (error: any) {
    console.error('[Bitbucket API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get pipelines', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/bitbucket
 * Connect Bitbucket or create pipeline
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

    if (!bitbucketIntegration) {
      return NextResponse.json(
        { error: 'Bitbucket integration not available' },
        { status: 503 }
      );
    }

    if (action === 'connect') {
      if (!config || !config.appPassword) {
        return NextResponse.json(
          { error: 'appPassword is required' },
          { status: 400 }
        );
      }

      const result = bitbucketIntegration.connect(userId, config);
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

      const created = bitbucketIntegration.createPipeline(repo, pipeline);
      const yaml = bitbucketIntegration.generatePipelineYAML(created);

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
    console.error('[Bitbucket API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process Bitbucket request', details: error.message },
      { status: 500 }
    );
  }
}
