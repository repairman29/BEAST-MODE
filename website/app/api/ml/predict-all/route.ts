import { NextRequest, NextResponse } from 'next/server';

/**
 * ML Predict All API
 * 
 * Returns all prediction types: quality, latency, cost, satisfaction, resources
 * 
 * Month 5: Week 3 - Expanded Predictions API
 */

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json();

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      );
    }

    // Try to load ML model integration
    let mlIntegration = null;
    try {
      const path = require('path');
      const mlPath = path.join(process.cwd(), '../lib/mlops/mlModelIntegration');
      const { getMLModelIntegration } = require(mlPath);
      mlIntegration = await getMLModelIntegration();
    } catch (error) {
      console.debug('[ML API] ML integration not available:', error.message);
    }

    // Get all predictions
    const results: any = {
      timestamp: new Date().toISOString(),
      mlAvailable: false
    };

    if (mlIntegration && mlIntegration.isMLModelAvailable()) {
      try {
        // Add service name to context
        const serviceName = context.provider === 'first-mate' ? 'first-mate' : 
                          context.provider === 'game-app' ? 'game-app' :
                          'unknown';
        
        const enhancedContext = {
          ...context,
          serviceName: serviceName,
          predictionType: context.actionType || 'quality'
        };
        
        // Get quality prediction
        const qualityPrediction = mlIntegration.predictQualitySync(enhancedContext);
        results.quality = {
          predictedQuality: qualityPrediction.predictedQuality,
          confidence: qualityPrediction.confidence,
          source: qualityPrediction.source || 'ml_model',
          modelVersion: qualityPrediction.modelVersion || 'unknown'
        };

        // Get expanded predictions
        const expanded = await mlIntegration.getExpandedPredictions(enhancedContext);
        if (expanded) {
          results.latency = expanded.latency;
          results.cost = expanded.cost;
          results.satisfaction = expanded.satisfaction;
          results.resources = expanded.resources;
        }

        results.mlAvailable = true;
      } catch (error) {
        console.warn('[ML API] ML prediction failed:', error.message);
      }
    }

    // Fallback: Simple heuristic predictions
    if (!results.quality) {
      results.quality = {
        predictedQuality: 0.75,
        confidence: 0.5,
        source: 'heuristic'
      };
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('[ML API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ml/predict-all',
    description: 'Returns all prediction types: quality, latency, cost, satisfaction, resources',
    method: 'POST',
    body: {
      context: {
        serviceName: 'string (optional)',
        predictionType: 'string (optional)',
        provider: 'string (optional)',
        actionType: 'string (optional)',
        includeExpanded: 'boolean (optional, default: true)'
      }
    },
    response: {
      quality: {
        predictedQuality: 'number (0-1)',
        confidence: 'number (0-1)',
        source: 'string',
        modelVersion: 'string'
      },
      latency: {
        latency: 'number (ms)',
        confidence: 'number (0-1)',
        unit: 'string'
      },
      cost: {
        cost: 'number',
        confidence: 'number (0-1)',
        unit: 'string'
      },
      satisfaction: {
        satisfaction: 'number (1-5)',
        confidence: 'number (0-1)',
        scale: 'string'
      },
      resources: {
        cpu: 'number (%)',
        memory: 'number (%)',
        network: 'number (%)',
        confidence: 'number (0-1)'
      }
    }
  });
}

