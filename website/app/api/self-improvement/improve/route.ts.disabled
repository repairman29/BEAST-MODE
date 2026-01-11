import { NextRequest, NextResponse } from 'next/server';
import { getSelfImprovementService } from '../../../../../lib/mlops/selfImprovement';

/**
 * POST /api/self-improvement/improve
 * Generate and optionally apply improvements
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      opportunity,
      model = 'custom:beast-mode-code-model',
      userId = 'self-improvement',
      useLLM = true,
      dryRun = true,
      backup = true
    } = body;

    if (!opportunity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Opportunity object is required'
        },
        { status: 400 }
      );
    }

    const service = getSelfImprovementService();

    // Generate improvement
    const improvement = await service.generateImprovement(opportunity, {
      model,
      userId,
      useLLM
    });

    if (!improvement.success) {
      return NextResponse.json({
        success: false,
        error: improvement.error,
        improvement
      });
    }

    // Apply improvement if not dry run
    let applied = null;
    if (!dryRun) {
      applied = await service.applyImprovement(improvement, {
        dryRun: false,
        backup
      });
    } else {
      applied = {
        success: true,
        file: improvement.file,
        dryRun: true,
        qualityGain: improvement.qualityGain
      };
    }

    return NextResponse.json({
      success: true,
      improvement: {
        file: improvement.file,
        qualityGain: improvement.qualityGain,
        validation: improvement.validation
      },
      applied,
      metrics: service.getMetrics()
    });
  } catch (error: any) {
    console.error('[Self-Improvement] Improve failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
