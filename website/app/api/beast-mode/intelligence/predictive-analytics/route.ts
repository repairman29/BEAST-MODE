import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Predictive Analytics API
 * 
 * Forecast future issues, risk prediction models, trend analysis
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentState, historicalData, predictionHorizon } = body;

    if (!currentState) {
      return NextResponse.json(
        { error: 'Current state is required' },
        { status: 400 }
      );
    }

    let PredictiveAnalytics;
    try {
      // @ts-ignore - Dynamic import, module may not exist
      // Try website/lib first (for Next.js), then fallback to root lib
      const module = await import(/* webpackIgnore: true */ '../../../../lib/intelligence/predictive-analytics.js').catch(() => 
        import(/* webpackIgnore: true */ '../../../../../../lib/intelligence/predictive-analytics.js').catch(() => null)
      );
      PredictiveAnalytics = module?.default || module;
      if (!PredictiveAnalytics) {
        return NextResponse.json({
          status: 'error',
          error: 'Intelligence module not available',
          timestamp: new Date().toISOString()
        }, { status: 503 });
      }
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        error: 'Intelligence module not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    const analytics = new PredictiveAnalytics({
      predictionHorizon: predictionHorizon || 30
    });

    // Generate predictions
    const predictions = await analytics.predictQualityIssues(
      historicalData || [],
      currentState
    );

    // Generate risk assessment
    const riskAssessment = await analytics.generateRiskAssessment(
      currentState,
      historicalData || []
    );

    return NextResponse.json({
      predictions: predictions.predictions,
      riskAssessment: riskAssessment,
      confidence: predictions.confidence,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Predictive Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions', details: error.message },
      { status: 500 }
    );
  }
}

