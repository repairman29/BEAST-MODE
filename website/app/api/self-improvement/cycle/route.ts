import { NextRequest, NextResponse } from 'next/server';
import { getSelfImprovementService } from '../../../../../lib/mlops/selfImprovement';

/**
 * POST /api/self-improvement/cycle
 * Run a full improvement cycle (scan + improve + apply)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scanOptions = {},
      improvementOptions = {
        model: 'custom:beast-mode-code-model',
        userId: 'self-improvement',
        useLLM: true
      },
      applyOptions = {
        dryRun: true,
        backup: true
      },
      maxImprovements = 10
    } = body;

    const service = getSelfImprovementService();

    const result = await service.runImprovementCycle({
      scanOptions,
      improvementOptions,
      applyOptions,
      maxImprovements
    });

    return NextResponse.json({
      success: result.success,
      ...result,
      message: result.success
        ? `Improvement cycle complete: ${result.applied} improvements applied`
        : `Improvement cycle failed: ${result.error}`
    });
  } catch (error: any) {
    console.error('[Self-Improvement] Cycle failed:', error);
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
 * GET /api/self-improvement/cycle
 * Get improvement cycle status
 */
export async function GET() {
  try {
    const service = getSelfImprovementService();
    const metrics = service.getMetrics();

    return NextResponse.json({
      success: true,
      metrics,
      status: 'ready',
      message: 'Self-improvement service is ready'
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
