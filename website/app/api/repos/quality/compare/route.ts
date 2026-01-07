import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/repos/quality/compare
 * Compare quality scores between repositories
 * 
 * User Stories:
 * - "As a developer, I want to compare my repo quality to competitors"
 * - "As a team lead, I want to see quality differences across projects"
 */
interface CompareQualityRequest {
  repos: string[];
  platform?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CompareQualityRequest = await request.json();
    const { repos, platform } = body;

    if (!repos || !Array.isArray(repos) || repos.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 repos are required for comparison' },
        { status: 400 }
      );
    }

    if (repos.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 repos for comparison' },
        { status: 400 }
      );
    }

    // Fetch quality for all repos
    const baseUrl = request.url.split('/api')[0];
    const promises = repos.map(async (repo) => {
      try {
        const res = await fetch(`${baseUrl}/api/repos/quality`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo, platform })
        });

        if (!res.ok) {
          return { repo, success: false, error: 'Failed to analyze' };
        }

        const data = await res.json();
        return { repo, success: true, ...data };
      } catch (error: any) {
        return { repo, success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success && r.quality !== undefined);

    if (successful.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 successful analyses for comparison' },
        { status: 400 }
      );
    }

    // Sort by quality
    const sorted = [...successful].sort((a, b) => (b.quality || 0) - (a.quality || 0));

    // Calculate statistics
    const qualities = successful.map(r => r.quality || 0);
    const average = qualities.reduce((a, b) => a + b, 0) / qualities.length;
    const min = Math.min(...qualities);
    const max = Math.max(...qualities);
    const range = max - min;

    // Find best and worst
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    // Calculate differences
    const differences = sorted.map((repo, idx) => {
      if (idx === 0) return null;
      const prev = sorted[idx - 1];
      return {
        repo: repo.repo,
        vs: prev.repo,
        difference: (repo.quality || 0) - (prev.quality || 0),
        percentageDiff: ((repo.quality || 0) - (prev.quality || 0)) / (prev.quality || 1) * 100
      };
    }).filter(Boolean);

    return NextResponse.json({
      comparison: {
        repos: sorted,
        statistics: {
          count: successful.length,
          average: average,
          min: min,
          max: max,
          range: range
        },
        ranking: {
          best: {
            repo: best.repo,
            quality: best.quality,
            percentile: best.percentile
          },
          worst: {
            repo: worst.repo,
            quality: worst.quality,
            percentile: worst.percentile
          }
        },
        differences
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Compare Quality API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to compare repositories', details: error.message },
      { status: 500 }
    );
  }
}

