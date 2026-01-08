import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Predictive Capabilities API
 */

let predictiveCapabilities: any;

try {
  const predictiveModule = loadModule('../../../../../lib/ai/predictiveCapabilities') ||
                           require('../../../../../lib/ai/predictiveCapabilities');
  predictiveCapabilities = predictiveModule?.getPredictiveCapabilities
    ? predictiveModule.getPredictiveCapabilities()
    : predictiveModule;
} catch (error) {
  console.warn('[Predictive Capabilities API] Module not available:', error);
}

/**
 * POST /api/ai/predictions
 * Make predictions (bugs, quality, resources)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, code, filePath, codebase, historicalData, options = {} } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!predictiveCapabilities) {
      return NextResponse.json(
        { error: 'Predictive capabilities not available' },
        { status: 503 }
      );
    }

    if (type === 'bugs') {
      if (!code || !filePath) {
        return NextResponse.json(
          { error: 'code and filePath are required for bug prediction' },
          { status: 400 }
        );
      }

      const result = predictiveCapabilities.predictBugs(code, filePath, historicalData || []);
      return NextResponse.json({
        success: true,
        result
      });
    }

    if (type === 'quality_trend') {
      if (!historicalData || !Array.isArray(historicalData)) {
        return NextResponse.json(
          { error: 'historicalData array is required for quality forecasting' },
          { status: 400 }
        );
      }

      const days = options.days || 30;
      const result = predictiveCapabilities.forecastQualityTrend(historicalData, days);
      return NextResponse.json({
        success: true,
        result
      });
    }

    if (type === 'resource_usage') {
      if (!codebase) {
        return NextResponse.json(
          { error: 'codebase is required for resource prediction' },
          { status: 400 }
        );
      }

      const result = predictiveCapabilities.predictResourceUsage(codebase, options);
      return NextResponse.json({
        success: true,
        result
      });
    }

    return NextResponse.json(
      { error: `Unknown prediction type: ${type}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Predictive Capabilities API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to make prediction', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/predictions
 * Get prediction history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const predictionId = searchParams.get('id');
    const filePath = searchParams.get('filePath');

    if (!predictiveCapabilities) {
      return NextResponse.json(
        { error: 'Predictive capabilities not available' },
        { status: 503 }
      );
    }

    if (predictionId) {
      const predictionsMap = predictiveCapabilities.predictions || new Map();
      const prediction = predictionsMap.get(predictionId);
      if (!prediction) {
        return NextResponse.json(
          { error: 'Prediction not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        prediction
      });
    }

    if (filePath) {
      const predictionsMap = predictiveCapabilities.predictions || new Map();
      const predictions = Array.from(predictionsMap.values())
        .filter((p: any) => p.file === filePath)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return NextResponse.json({
        success: true,
        predictions
      });
    }

    // Return all predictions
    const predictionsMap = predictiveCapabilities.predictions || new Map();
    const predictions = Array.from(predictionsMap.values());
    return NextResponse.json({
      success: true,
      predictions,
      count: predictions.length
    });

  } catch (error: any) {
    console.error('[Predictive Capabilities API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get predictions', details: error.message },
      { status: 500 }
    );
  }
}
