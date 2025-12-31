import { NextRequest, NextResponse } from 'next/server';

/**
 * ML Prediction API
 * 
 * Provides ML quality predictions for First Mate and other services
 * 
 * Month 3: Week 1 - First Mate Integration
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
      // Path relative to BEAST-MODE-PRODUCT root
      const path = require('path');
      const mlPath = path.join(process.cwd(), '../lib/mlops/mlModelIntegration');
      const { getMLModelIntegration } = require(mlPath);
      mlIntegration = await getMLModelIntegration();
    } catch (error) {
      console.debug('[ML API] ML integration not available:', error.message);
    }

    // If ML model is available, use it
    if (mlIntegration && mlIntegration.isMLModelAvailable()) {
      try {
        // Add service name to context (detect from provider or use default)
        const serviceName = context.provider === 'first-mate' ? 'first-mate' : 
                          context.provider === 'game-app' ? 'game-app' :
                          'unknown';
        
        const enhancedContext = {
          ...context,
          serviceName: serviceName,
          predictionType: context.actionType || 'quality'
        };
        
        const prediction = mlIntegration.predictQualitySync(enhancedContext);
        
        // Get expanded predictions if requested
        let expandedPredictions = null;
        if (context.includeExpanded !== false) {
          try {
            expandedPredictions = await mlIntegration.getExpandedPredictions(enhancedContext);
          } catch (error) {
            console.debug('[ML API] Expanded predictions not available:', error.message);
          }
        }
        
        const response: any = {
          prediction: {
            predictedQuality: prediction.predictedQuality,
            confidence: prediction.confidence,
            source: prediction.source || 'ml_model',
            modelVersion: prediction.modelVersion || 'unknown'
          },
          timestamp: new Date().toISOString(),
          mlAvailable: true
        };

        if (expandedPredictions) {
          response.expanded = expandedPredictions;
        }
        
        return NextResponse.json(response);
      } catch (error) {
        console.warn('[ML API] ML prediction failed:', error.message);
        // Fall through to heuristic fallback
      }
    }

    // Fallback: Simple heuristic prediction
    const heuristicPrediction = getHeuristicPrediction(context);

    return NextResponse.json({
      prediction: {
        predictedQuality: heuristicPrediction.predictedQuality,
        confidence: heuristicPrediction.confidence,
        source: 'heuristic'
      },
      timestamp: new Date().toISOString(),
      mlAvailable: false
    });

  } catch (error) {
    console.error('[ML API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate prediction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Heuristic prediction fallback
 */
function getHeuristicPrediction(context: any) {
  let quality = 0.7; // Base quality
  let confidence = 0.5; // Base confidence

  // Provider-based adjustments
  const providerScores: Record<string, number> = {
    'openai': 0.85,
    'anthropic': 0.88,
    'gemini': 0.82,
    'mistral': 0.80,
    'together': 0.78,
    'groq': 0.75,
    'code-roach': 0.75,
    'first-mate': 0.70
  };

  if (context.provider && providerScores[context.provider]) {
    quality = providerScores[context.provider];
    confidence = 0.6;
  }

  // Model-based adjustments
  if (context.model) {
    if (context.model.includes('gpt-4') || context.model.includes('claude-opus')) {
      quality = Math.min(0.95, quality + 0.1);
      confidence = Math.min(0.9, confidence + 0.2);
    } else if (context.model.includes('ft:') || context.model.includes('fine-tuned')) {
      quality = Math.min(0.9, quality + 0.05);
      confidence = Math.min(0.8, confidence + 0.1);
    }
  }

  // Action type adjustments
  if (context.actionType) {
    if (context.actionType.includes('critical') || context.actionType.includes('important')) {
      quality = Math.max(0.6, quality - 0.1); // Critical actions are harder
    }
  }

  // Stat value adjustments (for dice rolls)
  if (context.statValue !== undefined) {
    const statValue = typeof context.statValue === 'number' ? context.statValue : 5;
    if (statValue > 30) {
      quality = Math.min(0.95, quality + 0.1); // High stats = better quality
    } else if (statValue < 15) {
      quality = Math.max(0.5, quality - 0.1); // Low stats = lower quality
    }
  }

  return {
    predictedQuality: Math.max(0.3, Math.min(1.0, quality)),
    confidence: Math.max(0.3, Math.min(1.0, confidence))
  };
}

/**
 * GET endpoint for health check
 */
export async function GET(request: NextRequest) {
  try {
    let mlAvailable = false;
    let modelInfo = null;

    try {
      const path = require('path');
      const mlPath = path.join(process.cwd(), '../lib/mlops/mlModelIntegration');
      const { getMLModelIntegration } = require(mlPath);
      const mlIntegration = await getMLModelIntegration();
      
      if (mlIntegration && mlIntegration.isMLModelAvailable()) {
        mlAvailable = true;
        modelInfo = mlIntegration.getModelInfo();
      }
    } catch (error) {
      // ML not available
    }

    return NextResponse.json({
      status: 'ok',
      mlAvailable,
      modelInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

