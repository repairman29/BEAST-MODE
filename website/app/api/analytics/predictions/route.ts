import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Predictive Analysis API
 */

let predictiveAnalyzer: any;

try {
  const predictiveAnalyzerModule = loadModule('../../../../../lib/mlops/predictiveAnalyzer') ||
                                   require('../../../../../lib/mlops/predictiveAnalyzer');
  predictiveAnalyzer = predictiveAnalyzerModule?.getPredictiveAnalyzer
    ? predictiveAnalyzerModule.getPredictiveAnalyzer()
    : predictiveAnalyzerModule;
} catch (error) {
  console.warn('[Predictions API] Module not available:', error);
}

/**
 * GET /api/analytics/predictions
 * Get predictions for metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('metric');
    const daysAhead = parseInt(searchParams.get('daysAhead') || '7');

    if (metricName) {
      // Get prediction for specific metric
      // Would need history data - for now return structure
      return NextResponse.json({
        success: true,
        metric: metricName,
        prediction: null,
        note: 'Provide history data via POST to get predictions'
      });
    }

    // Get all predictions
    if (predictiveAnalyzer && typeof predictiveAnalyzer.getAllPredictions === 'function') {
      const predictions = predictiveAnalyzer.getAllPredictions();
      return NextResponse.json({
        success: true,
        predictions
      });
    }

    return NextResponse.json({
      success: true,
      predictions: {},
      note: 'Predictive analyzer not available'
    });

  } catch (error: any) {
    console.error('[Predictions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get predictions', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/predictions
 * Generate prediction from history
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metricName, history, daysAhead = 7 } = body;

    if (!metricName || !history || !Array.isArray(history)) {
      return NextResponse.json(
        { error: 'metricName and history array are required' },
        { status: 400 }
      );
    }

    if (predictiveAnalyzer && typeof predictiveAnalyzer.getPrediction === 'function') {
      const prediction = predictiveAnalyzer.getPrediction(metricName, history, daysAhead);
      return NextResponse.json({
        success: true,
        metric: metricName,
        prediction,
        daysAhead
      });
    }

    return NextResponse.json(
      { error: 'Predictive analyzer not available' },
      { status: 503 }
    );

  } catch (error: any) {
    console.error('[Predictions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction', details: error.message },
      { status: 500 }
    );
  }
}
