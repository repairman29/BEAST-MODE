import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../../lib/api-middleware';

/**
 * Game Narrative ML Prediction API
 * 
 * Provides ML quality predictions for game narrative generation
 * 
 * Month 4: Week 1 - Main Game App Integration
 * Phase 1, Week 1: Production Integration (Error Handling, Performance Monitoring, Caching)
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

    // Try to load game narrative integration
    let gameIntegration = null;
    try {
      const path = require('path');
      const integrationPath = path.join(process.cwd(), '../lib/mlops/gameNarrativeIntegration');
      const { getGameNarrativeIntegration } = require(integrationPath);
      gameIntegration = getGameNarrativeIntegration();
      await gameIntegration.initialize();
    } catch (error) {
      console.debug('[Game ML API] Integration not available:', error.message);
    }

    if (!gameIntegration || !gameIntegration.isAvailable()) {
      // Fallback: Simple heuristic prediction
      const heuristicPrediction = getHeuristicPrediction(context);
      return NextResponse.json({
        prediction: heuristicPrediction,
        timestamp: new Date().toISOString(),
        mlAvailable: false
      });
    }

    // Get ML prediction
      // Add service name to context
      const enhancedContext = {
        ...context,
        serviceName: 'game-app',
        predictionType: 'narrative-quality'
      };
      
      const prediction = await gameIntegration.predictNarrativeQuality(enhancedContext);

    if (!prediction) {
      // Fallback
      const heuristicPrediction = getHeuristicPrediction(context);
      return NextResponse.json({
        prediction: heuristicPrediction,
        timestamp: new Date().toISOString(),
        mlAvailable: false
      });
    }

    return NextResponse.json({
      prediction: {
        predictedQuality: prediction.predictedQuality,
        confidence: prediction.confidence,
        source: prediction.source,
        shouldRetry: prediction.shouldRetry,
        recommendation: prediction.recommendation
      },
      timestamp: new Date().toISOString(),
      mlAvailable: true
    });

  } catch (error) {
    console.error('[Game ML API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate prediction',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
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
    'game-app': 0.70
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

  // Stat value adjustments
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
    confidence: Math.max(0.3, Math.min(1.0, confidence)),
    source: 'heuristic',
    shouldRetry: quality < 0.7,
    recommendation: quality > 0.8 
      ? 'High quality expected - proceed with generation'
      : quality > 0.6
      ? 'Good quality expected - proceed'
      : quality > 0.4
      ? 'Moderate quality - consider retry'
      : 'Low quality expected - retry recommended'
  };
}

// Export wrapped POST handler with production integration
export const POST = withProductionIntegration(handlePOST, {
  endpoint: '/api/game/ml-predict',
  enableCache: true,
  cacheTTL: 300000 // 5 minutes
});

/**
 * GET endpoint for health check
 */
export async function GET(request: NextRequest) {
  try {
    let mlAvailable = false;
    let ensembleAvailable = false;

    try {
      const path = require('path');
      const integrationPath = path.join(process.cwd(), '../lib/mlops/gameNarrativeIntegration');
      const { getGameNarrativeIntegration } = require(integrationPath);
      const gameIntegration = getGameNarrativeIntegration();
      await gameIntegration.initialize();
      
      mlAvailable = gameIntegration.isAvailable();
      ensembleAvailable = gameIntegration.isEnsembleAvailable();
    } catch (error) {
      // ML not available
    }

    return NextResponse.json({
      status: 'ok',
      mlAvailable,
      ensembleAvailable,
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

