import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../../lib/api-middleware';

// Optional production integration
let withProductionIntegration: any = null;
try {
  const middleware = require('../../../../lib/api-middleware');
  withProductionIntegration = middleware.withProductionIntegration;
} catch (error) {
  // Middleware not available
}

/**
 * ML Prediction API
 * 
 * Provides ML quality predictions with intelligent routing to specialized services
 * 
 * Routing Strategy:
 * 1. Try specialized service (Code Roach, Oracle, etc.) if context matches
 * 2. Fall back to BEAST MODE ML model if available
 * 3. Fall back to heuristics
 * 
 * Month 3: Week 1 - First Mate Integration
 * Phase 1, Week 1: Production Integration (Error Handling, Performance Monitoring, Caching)
 * Phase 2: Service Integration - Specialized ML services
 */

async function handlePOST(request: NextRequest) {
  try {
    const { context } = await request.json();

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      );
    }

    // Try service router first (specialized services)
    let serviceRouter = null;
    try {
      const path = require('path');
      const routerPath = path.join(process.cwd(), '../lib/mlops/serviceRouter');
      const { getServiceRouter } = require(routerPath);
      serviceRouter = getServiceRouter();
    } catch (error) {
      console.debug('[ML API] Service router not available:', error.message);
    }

    // Try to load ML model integration (fallback)
    let mlIntegration = null;
    try {
      const path = require('path');
      const mlPath = path.join(process.cwd(), '../lib/mlops/mlModelIntegration');
      const { getMLModelIntegration } = require(mlPath);
      mlIntegration = await getMLModelIntegration();
    } catch (error) {
      console.debug('[ML API] ML integration not available:', error.message);
    }

    // Fallback predictor function
    const fallbackPredictor = async (ctx: any) => {
      // Try BEAST MODE ML model
      if (mlIntegration && mlIntegration.isMLModelAvailable()) {
        try {
          const serviceName = ctx.provider === 'first-mate' ? 'first-mate' : 
                            ctx.provider === 'game-app' ? 'game-app' :
                            'unknown';
          
          const enhancedContext = {
            ...ctx,
            serviceName: serviceName,
            predictionType: ctx.actionType || 'quality'
          };
          
          const prediction = mlIntegration.predictQualitySync(enhancedContext);
          
          // Get expanded predictions if requested
          let expandedPredictions = null;
          if (ctx.includeExpanded !== false) {
            try {
              expandedPredictions = await mlIntegration.getExpandedPredictions(enhancedContext);
            } catch (error) {
              console.debug('[ML API] Expanded predictions not available:', error.message);
            }
          }
          
          return {
            predictedQuality: prediction.predictedQuality,
            confidence: prediction.confidence,
            source: prediction.source || 'ml_model',
            modelVersion: prediction.modelVersion || 'unknown',
            expanded: expandedPredictions
          };
        } catch (error) {
          console.debug('[ML API] ML prediction failed:', error.message);
          // Fall through to heuristics
        }
      }
      
      // Final fallback: heuristics
      return getHeuristicPrediction(ctx);
    };

    // Try service router first (specialized services)
    if (serviceRouter) {
      try {
        const routedResult = await serviceRouter.routePrediction(context, fallbackPredictor);
        
        const response: any = {
          prediction: {
            predictedQuality: routedResult.predictedQuality,
            confidence: routedResult.confidence,
            source: routedResult.source || 'unknown',
            routed: routedResult.routed || false,
            service: routedResult.service,
            predictionType: routedResult.predictionType
          },
          timestamp: new Date().toISOString(),
          mlAvailable: routedResult.source !== 'heuristic',
          serviceUsed: routedResult.routed ? routedResult.service : null
        };

        // Add service-specific metadata
        if (routedResult.method) {
          response.prediction.method = routedResult.method;
        }
        if (routedResult.factors) {
          response.prediction.factors = routedResult.factors;
        }
        if (routedResult.relevance) {
          response.prediction.relevance = routedResult.relevance;
        }
        if (routedResult.expanded) {
          response.expanded = routedResult.expanded;
        }

        return NextResponse.json(response);
      } catch (error) {
        console.warn('[ML API] Service routing failed:', error.message);
        // Fall through to direct fallback
      }
    }

    // Direct fallback (no service router available)
    const fallbackResult = await fallbackPredictor(context);

    const fallback = fallbackResult as any;
    return NextResponse.json({
      prediction: {
        predictedQuality: fallbackResult.predictedQuality,
        confidence: fallbackResult.confidence,
        source: fallback?.source || 'heuristic'
      },
      timestamp: new Date().toISOString(),
      mlAvailable: fallback?.source !== 'heuristic'
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

// Export POST handler - wrap with production integration if available
let POST: typeof handlePOST = handlePOST;
try {
  if (withProductionIntegration) {
    POST = withProductionIntegration(handlePOST, {
      endpoint: '/api/ml/predict',
      enableCache: true,
      cacheTTL: 300000 // 5 minutes
    }) as typeof handlePOST;
  }
} catch (error) {
  // Production integration not available, use handler directly
  console.warn('[ML Predict API] Production integration not available:', error);
}

export { POST };

/**
 * GET endpoint for health check
 */
export async function GET(request: NextRequest) {
  try {
    let mlAvailable = false;
    let modelInfo = null;
    let serviceStatus = null;

    // Check BEAST MODE ML
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

    // Check service router
    try {
      const path = require('path');
      const routerPath = path.join(process.cwd(), '../lib/mlops/serviceRouter');
      const { getServiceRouter } = require(routerPath);
      const router = getServiceRouter();
      serviceStatus = router.getRoutingStatistics();
    } catch (error) {
      // Service router not available
    }

    return NextResponse.json({
      status: 'ok',
      mlAvailable,
      modelInfo,
      services: serviceStatus,
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
