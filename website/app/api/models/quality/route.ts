import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Model Quality API
 * 
 * Provides model quality scoring and statistics
 */

let modelQualityScorer: any;

try {
  const modelQualityScorerModule = loadModule('../../../../../lib/mlops/modelQualityScorer') ||
                                    require('../../../../../lib/mlops/modelQualityScorer');
  modelQualityScorer = modelQualityScorerModule?.getModelQualityScorer
    ? modelQualityScorerModule.getModelQualityScorer()
    : modelQualityScorerModule;
} catch (error) {
  console.warn('[Model Quality API] Module not available:', error);
}

/**
 * GET /api/models/quality
 * Get model quality scores
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    if (modelId && modelQualityScorer && typeof modelQualityScorer.getModelScore === 'function') {
      const score = modelQualityScorer.getModelScore(modelId);
      if (!score) {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        score
      });
    }

    // Get all scores
    if (modelQualityScorer && typeof modelQualityScorer.getAllScores === 'function') {
      const scores = modelQualityScorer.getAllScores();
      return NextResponse.json({
        success: true,
        scores
      });
    }

    return NextResponse.json({
      success: true,
      scores: [],
      note: 'Model quality scorer not available'
    });

  } catch (error: any) {
    console.error('[Model Quality API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get quality scores', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/models/quality
 * Score a model response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, metrics, feedback } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required' },
        { status: 400 }
      );
    }

    if (metrics && modelQualityScorer && typeof modelQualityScorer.scoreResponse === 'function') {
      const score = modelQualityScorer.scoreResponse(modelId, metrics);
      return NextResponse.json({
        success: true,
        score,
        modelId
      });
    }

    if (feedback && modelQualityScorer && typeof modelQualityScorer.recordFeedback === 'function') {
      modelQualityScorer.recordFeedback(modelId, feedback);
      return NextResponse.json({
        success: true,
        message: 'Feedback recorded'
      });
    }

    return NextResponse.json(
      { error: 'Invalid request - provide metrics or feedback' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Model Quality API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
