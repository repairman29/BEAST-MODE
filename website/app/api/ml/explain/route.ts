import { NextRequest, NextResponse } from 'next/server';

/**
 * ML Explainability API
 * 
 * Returns prediction explanations with feature importance and SHAP values
 * 
 * Month 6: Week 2 - Explainability API
 */

export async function POST(request: NextRequest) {
  try {
    const { context, prediction } = await request.json();

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      );
    }

    // Try to load explainability service
    let explainability = null;
    try {
      const path = require('path');
      const explainPath = path.join(process.cwd(), '../lib/mlops/modelExplainability');
      const { getModelExplainability } = require(explainPath);
      explainability = getModelExplainability();
    } catch (error) {
      console.debug('[Explain API] Explainability service not available:', error.message);
    }

    // Try to load ML integration
    let mlIntegration = null;
    try {
      const path = require('path');
      const mlPath = path.join(process.cwd(), '../lib/mlops/mlModelIntegration');
      const { getMLModelIntegration } = require(mlPath);
      mlIntegration = await getMLModelIntegration();
    } catch (error) {
      console.debug('[Explain API] ML integration not available:', error.message);
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      available: false
    };

    if (explainability && mlIntegration) {
      try {
        // Get prediction if not provided
        let predValue = prediction?.predictedQuality || prediction;
        if (!predValue && mlIntegration.isMLModelAvailable()) {
          const pred = mlIntegration.predictQualitySync(context);
          predValue = pred.predictedQuality;
        }

        // Extract features
        const features = context.features || 
          Object.values(context).filter(v => typeof v === 'number').slice(0, 10);
        
        const featureNames = context.featureNames || 
          Object.keys(context).filter(k => typeof context[k] === 'number').slice(0, 10);

        // Generate explanation
        const explanation = explainability.explainPrediction(
          { predict: () => predValue },
          features,
          predValue,
          featureNames,
          context
        );

        results.available = true;
        results.explanation = explanation;
        results.prediction = predValue;
      } catch (error) {
        console.warn('[Explain API] Explanation generation failed:', error.message);
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('[Explain API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ml/explain',
    description: 'Returns prediction explanations with feature importance and SHAP values',
    method: 'POST',
    body: {
      context: {
        serviceName: 'string (optional)',
        predictionType: 'string (optional)',
        features: 'array (optional)',
        featureNames: 'array (optional)'
      },
      prediction: {
        predictedQuality: 'number (optional)'
      }
    },
    response: {
      explanation: {
        prediction: 'number',
        summary: 'string',
        factors: 'array',
        topFeatures: 'array'
      }
    }
  });
}

