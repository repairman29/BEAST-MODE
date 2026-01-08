import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Model Performance Tuning API
 * 
 * Provides model performance tuning and optimization
 */

let modelPerformanceTuner: any;

try {
  const modelPerformanceTunerModule = loadModule('../../../../../lib/mlops/modelPerformanceTuner') ||
                                      require('../../../../../lib/mlops/modelPerformanceTuner');
  modelPerformanceTuner = modelPerformanceTunerModule?.getModelPerformanceTuner
    ? modelPerformanceTunerModule.getModelPerformanceTuner()
    : modelPerformanceTunerModule;
} catch (error) {
  console.warn('[Model Tuning API] Module not available:', error);
}

/**
 * GET /api/models/tuning
 * Get optimal settings for a model
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const taskType = searchParams.get('taskType');

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required' },
        { status: 400 }
      );
    }

    if (modelPerformanceTuner && typeof modelPerformanceTuner.getOptimalSettings === 'function') {
      const settings = modelPerformanceTuner.getOptimalSettings(modelId, taskType);
      const stats = modelPerformanceTuner.getStats(modelId);

      return NextResponse.json({
        success: true,
        modelId,
        taskType,
        optimalSettings: settings,
        stats
      });
    }

    // Return defaults if tuner not available
    return NextResponse.json({
      success: true,
      modelId,
      taskType,
      optimalSettings: {
        temperature: 0.7,
        maxTokens: 2000
      },
      note: 'Model performance tuner not available - using defaults'
    });

  } catch (error: any) {
    console.error('[Model Tuning API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get optimal settings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/models/tuning
 * Tune model based on performance metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, metrics, currentSettings } = body;

    if (!modelId || !metrics) {
      return NextResponse.json(
        { error: 'modelId and metrics are required' },
        { status: 400 }
      );
    }

    if (modelPerformanceTuner && typeof modelPerformanceTuner.tuneModel === 'function') {
      const recommendations = modelPerformanceTuner.tuneModel(modelId, metrics, currentSettings);
      return NextResponse.json({
        success: true,
        modelId,
        recommendations
      });
    }

    return NextResponse.json(
      { error: 'Model performance tuner not available' },
      { status: 503 }
    );

  } catch (error: any) {
    console.error('[Model Tuning API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to tune model', details: error.message },
      { status: 500 }
    );
  }
}
