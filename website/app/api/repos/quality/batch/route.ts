import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/repos/quality/batch
 * Batch quality prediction endpoint
 * 
 * User Stories:
 * - "As a developer, I want to analyze multiple repos at once"
 * - "As a team lead, I want to compare quality across my organization"
 * 
 * Performance: Processes up to 50 repos in parallel
 */
interface BatchQualityRequest {
  repos: string[];
  platform?: string;
  features?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: BatchQualityRequest = await request.json();
    const { repos, platform, features } = body;

    if (!repos || !Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json(
        { error: 'Repos array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (repos.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 repos per batch request' },
        { status: 400 }
      );
    }

    // Process repos in parallel (up to 50)
    const baseUrl = request.url.split('/api')[0];
    const promises = repos.map(async (repo) => {
      try {
        const res = await fetch(`${baseUrl}/api/repos/quality`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo,
            platform,
            features
          })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          return {
            repo,
            success: false,
            error: errorData.error || 'Failed to analyze repository'
          };
        }

        const data = await res.json();
        return {
          repo,
          success: true,
          ...data
        };
      } catch (error: any) {
        return {
          repo,
          success: false,
          error: error.message || 'Unknown error'
        };
      }
    });

    const results = await Promise.all(promises);
    const latency = Date.now() - startTime;

    // Calculate statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const averageQuality = results
      .filter(r => r.success && r.quality !== undefined)
      .reduce((sum, r) => sum + (r.quality || 0), 0) / successful || 0;

    return NextResponse.json({
      results,
      summary: {
        total: repos.length,
        successful,
        failed,
        averageQuality: averageQuality > 0 ? averageQuality : null,
        latency
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Batch Quality API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch request', details: error.message },
      { status: 500 }
    );
  }
}

