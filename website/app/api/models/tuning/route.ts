import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Model Tuning API
 * Provides model performance tuning recommendations
 */

let modelPerformanceTuner: any;
let customModelMonitoring: any;

try {
  modelPerformanceTuner = loadModule('../../../../../lib/mlops/modelPerformanceTuner');
  customModelMonitoring = loadModule('../../../../../lib/mlops/customModelMonitoring');
} catch (error) {
  console.warn('[Model Tuning API] Some modules not available:', error);
}

/**
 * GET /api/models/tuning
 * Get tuning recommendations for a model
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required' },
        { status: 400 }
      );
    }

    // Get tuning recommendations
    if (modelPerformanceTuner && typeof modelPerformanceTuner.getTuningRecommendations === 'function') {
      const recommendations = modelPerformanceTuner.getTuningRecommendations(modelId);
      return NextResponse.json({
        success: true,
        modelId,
        recommendations
      });
    }

    // Fallback: Get metrics and provide basic recommendations
    if (customModelMonitoring && typeof customModelMonitoring.getMetrics === 'function') {
      const metrics = customModelMonitoring.getMetrics('7d');
      const recommendations = {
        temperature: metrics.averageQuality < 0.7 ? 0.8 : 0.7,
        maxTokens: 4000,
        reasoning: metrics.averageQuality < 0.7 
          ? 'Quality below threshold - consider increasing temperature'
          : 'Model performing well - current settings optimal'
      };

      return NextResponse.json({
        success: true,
        modelId,
        recommendations,
        note: 'Basic recommendations (tuner not available)'
      });
    }

    // Default recommendations
    return NextResponse.json({
      success: true,
      modelId,
      recommendations: {
        temperature: 0.7,
        maxTokens: 4000,
        reasoning: 'Default recommendations (monitoring not available)'
      },
      note: 'Monitoring not available'
    });

  } catch (error: any) {
    console.error('[Model Tuning API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get tuning recommendations', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/models/tuning
 * Apply tuning recommendations to a model
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, settings } = body;

    if (!modelId || !settings) {
      return NextResponse.json(
        { error: 'modelId and settings are required' },
        { status: 400 }
      );
    }

    // Apply tuning if tuner is available
    if (modelPerformanceTuner && typeof modelPerformanceTuner.applyTuning === 'function') {
      const result = modelPerformanceTuner.applyTuning(modelId, settings);
      return NextResponse.json({
        success: true,
        modelId,
        applied: result,
        message: 'Tuning applied successfully'
      });
    }

    // Fallback: Just acknowledge
    return NextResponse.json({
      success: true,
      modelId,
      message: 'Tuning settings received (tuner not available)',
      note: 'Settings would be applied when tuner is available'
    });

  } catch (error: any) {
    console.error('[Model Tuning API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to apply tuning', details: error.message },
      { status: 500 }
    );
  }
}
