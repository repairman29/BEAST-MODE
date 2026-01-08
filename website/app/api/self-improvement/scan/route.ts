import { NextRequest, NextResponse } from 'next/server';
import { getSelfImprovementService } from '../../../../../lib/mlops/selfImprovement';

/**
 * POST /api/self-improvement/scan
 * Scan codebase for improvement opportunities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      repo = 'BEAST-MODE',
      targetDir = null,
      filePatterns = ['**/*.js', '**/*.ts'],
      minQualityThreshold = 0.7,
      maxFiles = 50
    } = body;

    const service = getSelfImprovementService();
    const opportunities = await service.scanForOpportunities({
      repo,
      targetDir,
      filePatterns,
      minQualityThreshold,
      maxFiles
    });

    return NextResponse.json({
      success: true,
      opportunities: opportunities.length,
      results: opportunities.map(opp => ({
        file: opp.file,
        issues: opp.issues,
        opportunities: opp.opportunities,
        priority: opp.opportunities[0]?.priority || 'medium'
      })),
      metrics: service.getMetrics()
    });
  } catch (error: any) {
    console.error('[Self-Improvement] Scan failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/self-improvement/scan
 * Get scan status and metrics
 */
export async function GET() {
  try {
    const service = getSelfImprovementService();
    const metrics = service.getMetrics();

    return NextResponse.json({
      success: true,
      metrics,
      status: 'ready'
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
