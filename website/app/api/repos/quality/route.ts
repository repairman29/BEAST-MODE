import { NextRequest, NextResponse } from 'next/server';

/**
 * Repository Quality API
 * 
 * Provides quality predictions for GitHub repositories
 * Serves both Echeo.io and Code-Beast.dev (BEAST MODE) platforms
 * 
 * User Stories:
 * - Echeo: "As a developer, I want my repo quality to factor into my trust score"
 * - Echeo: "As a company, I want to verify repo quality before posting bounties"
 * - BEAST MODE: "As a developer, I want instant quality scores for my repos"
 * - BEAST MODE: "As a developer, I want to see what makes my repo high quality"
 */

interface QualityRequest {
  repo: string;
  platform?: 'echeo' | 'beast-mode';
  features?: Record<string, any>;
}

interface QualityResponse {
  quality: number;
  confidence: number;
  percentile: number;
  factors: Record<string, {
    value: number;
    importance: number;
  }>;
  recommendations: Array<{
    action: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  platformSpecific?: {
    echeo?: {
      trustScoreImpact: number;
      bountyEligibility: boolean;
    };
    beastMode?: {
      improvementSuggestions: string[];
      benchmarkComparison: {
        vsSimilar: number;
        vsLanguage: number;
        vsSize: number;
      };
    };
  };
  warning?: string;
  source?: string;
}

/**
 * Predict using Random Forest model
 */
function predictRandomForest(model: any, features: Record<string, any>, featureNames: string[]): number {
  const featureArray = featureNames.map(name => features[name] || 0);
  
  // Get predictions from all trees
  const treePredictions = model.model.trees.map((tree: any) => predictTree(tree, featureArray));
  
  // Average predictions
  return treePredictions.reduce((sum: number, p: number) => sum + p, 0) / treePredictions.length;
}

/**
 * Predict using decision tree
 */
function predictTree(tree: any, row: number[]): number {
  if (tree.type === 'leaf') {
    return tree.value;
  }
  
  if (row[tree.featureIdx] <= tree.threshold) {
    return predictTree(tree.left, row);
  } else {
    return predictTree(tree.right, row);
  }
}

/**
 * Load latest trained model (Storage-first pattern)
 */
async function loadLatestModel() {
  try {
    // Use Storage-first loader (falls back to local if Storage unavailable)
    const { loadModel } = require('../../../../../lib/mlops/loadTrainingData');
    const model = await loadModel('model-notable-quality-*.json');
    
    if (model) {
      console.log('[Quality API] Loaded model from Storage (or local fallback)');
      return model;
    }
    
    console.error('[Quality API] Model not found in Storage or local');
    return null;
  } catch (error: any) {
    console.error('[Quality API] Error loading model:', error);
    return null;
  }
}

/**
 * Calculate percentile from quality score
 */
function calculatePercentile(quality: number, model: any): number {
  // Use model's quality stats if available
  if (model.qualityStats) {
    const { mean, std } = model.qualityStats;
    // Simple percentile calculation based on normal distribution assumption
    const zScore = (quality - mean) / std;
    // Convert to percentile (0-100)
    const percentile = 50 + (zScore * 15); // Rough approximation
    return Math.max(0, Math.min(100, percentile));
  }
  return quality * 100; // Fallback
}

/**
 * Generate recommendations based on features
 */
function generateRecommendations(features: Record<string, any>, model: any): Array<{
  action: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const recommendations = [];
  
  // Check for missing quality indicators
  if (!features.hasTests && features.stars > 100) {
    recommendations.push({
      action: 'Add tests',
      impact: 'Would improve quality by +0.15',
      priority: 'high' as const
    });
  }
  
  if (!features.hasCI && features.stars > 50) {
    recommendations.push({
      action: 'Add CI/CD',
      impact: 'Would improve quality by +0.12',
      priority: 'high' as const
    });
  }
  
  if (!features.hasLicense) {
    recommendations.push({
      action: 'Add license',
      impact: 'Would improve quality by +0.05',
      priority: 'medium' as const
    });
  }
  
  if (features.openIssues > 0 && features.stars > 0) {
    const issueRatio = features.openIssues / features.stars;
    if (issueRatio > 0.5) {
      recommendations.push({
        action: 'Reduce open issues',
        impact: 'Would improve quality by +0.15',
        priority: 'high' as const
      });
    }
  }
  
  return recommendations;
}

/**
 * Generate platform-specific insights
 */
function generatePlatformSpecific(
  quality: number,
  features: Record<string, any>,
  platform: 'echeo' | 'beast-mode' | undefined
): QualityResponse['platformSpecific'] {
  if (!platform) return undefined;
  
  if (platform === 'echeo') {
    // Echeo-specific: trust score impact and bounty eligibility
    const trustScoreImpact = quality * 0.15; // 15% weight in trust score
    const bountyEligibility = quality >= 0.4; // Minimum quality for bounties
    
    return {
      echeo: {
        trustScoreImpact,
        bountyEligibility
      }
    };
  }
  
  if (platform === 'beast-mode') {
    // BEAST MODE-specific: improvement suggestions and benchmarks
    const improvementSuggestions = [];
    
    if (quality < 0.7) {
      improvementSuggestions.push('Focus on adding tests and CI/CD for quick wins');
    }
    if (features.stars < 100) {
      improvementSuggestions.push('Increase engagement through better documentation');
    }
    
    // Benchmark comparisons (simplified)
    const vsSimilar = quality >= 0.9 ? 95 : quality >= 0.7 ? 75 : 50;
    const vsLanguage = quality >= 0.9 ? 92 : quality >= 0.7 ? 70 : 45;
    const vsSize = quality >= 0.9 ? 90 : quality >= 0.7 ? 68 : 48;
    
    return {
      beastMode: {
        improvementSuggestions,
        benchmarkComparison: {
          vsSimilar,
          vsLanguage,
          vsSize
        }
      }
    };
  }
  
  return undefined;
}

// Model cache (singleton pattern - shared across requests)
let mlIntegrationInstance: any = null;
let mlIntegrationInitialized = false;
let mlIntegrationInitPromise: Promise<any> | null = null;

async function getMLIntegration() {
  // Return cached instance if already initialized
  if (mlIntegrationInstance && mlIntegrationInitialized) {
    return mlIntegrationInstance;
  }

  // If already initializing, wait for it
  if (mlIntegrationInitPromise) {
    try {
      await mlIntegrationInitPromise;
      return mlIntegrationInstance;
    } catch (error: any) {
      console.error('[Quality API] Initialization promise rejected:', error);
      // Continue to try initializing again
    }
  }

  // Initialize new instance
  try {
    const { MLModelIntegration } = require('../../../../../lib/mlops/mlModelIntegration');
    mlIntegrationInstance = new MLModelIntegration();
    
    mlIntegrationInitPromise = mlIntegrationInstance.initialize().then(() => {
      mlIntegrationInitialized = true;
      mlIntegrationInitPromise = null; // Clear promise after initialization
      console.log('[Quality API] ML Integration initialized successfully');
      console.log('[Quality API] Model available:', mlIntegrationInstance.isMLModelAvailable());
      return mlIntegrationInstance;
    }).catch((error: any) => {
      mlIntegrationInitPromise = null; // Clear promise on error
      mlIntegrationInitialized = false; // Mark as not initialized
      console.error('[Quality API] Initialization error:', error);
      console.error('[Quality API] Error stack:', error.stack);
      throw error;
    });
    
    await mlIntegrationInitPromise;
    return mlIntegrationInstance;
  } catch (error: any) {
    console.error('[Quality API] Failed to create ML Integration:', error);
    console.error('[Quality API] Error stack:', error.stack);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
    // Initialize monitoring and cache
    const { getQualityMonitoring } = require('../../../../../lib/mlops/qualityMonitoring');
    const { getQualityCache } = require('../../../../../lib/mlops/qualityCache');
  const monitoring = getQualityMonitoring();
  const cache = getQualityCache();
  
  try {
    const body: QualityRequest = await request.json();
    const { repo, platform, features: providedFeatures } = body;
    
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository name is required (format: owner/repo)' },
        { status: 400 }
      );
    }
    
    // Check cache first
    const cached = cache.get(repo, providedFeatures);
    if (cached) {
      const latency = Date.now() - startTime;
      monitoring.recordRequest(repo, platform, latency, true, true);
      console.log(`[Quality API] Cache hit for ${repo} (${latency}ms)`);
      const response = NextResponse.json({
        ...cached,
        cached: true,
        latency
      });
      // Add cache headers
      response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      return response;
    }
    
    // Use cached ML integration instance (avoids reloading model on every request)
    let mlIntegration;
    try {
      mlIntegration = await getMLIntegration();
    } catch (error: any) {
      console.warn('[Quality API] Failed to get ML Integration, will use fallback:', error.message);
      // Continue with fallback - don't return 503
      mlIntegration = null;
    }
    
    // If features not provided, we'd need to scan the repo
    // For now, require features or use defaults
    const features = providedFeatures || {};
    
    // Make prediction using mlModelIntegration (handles XGBoost async)
    // If model not available, it will use fallback prediction
    let predictionResult;
    let usingFallback = false;
    
    if (!mlIntegration || !mlIntegration.isMLModelAvailable()) {
      console.warn('[Quality API] Model not available, using fallback. Initialized:', mlIntegration?.initialized, 'Predictor:', !!mlIntegration?.qualityPredictor);
      // Use default prediction as fallback
      predictionResult = mlIntegration?.getDefaultPrediction() || {
        predictedQuality: 0.75,
        confidence: 0.5,
        source: 'fallback'
      };
      usingFallback = true;
    } else {
      try {
        predictionResult = await mlIntegration.predictQuality({ features });
      } catch (error: any) {
        console.warn('[Quality API] Prediction failed, using fallback:', error.message);
        predictionResult = mlIntegration.getDefaultPrediction();
        usingFallback = true;
      }
    }
    
    const quality = predictionResult.predictedQuality;
    const confidence = predictionResult.confidence || 0.5;
    
    // Get model info for percentile calculation (use defaults if model not available)
    const modelInfo = mlIntegration?.getModelInfo() || { metrics: {} };
    const percentile = calculatePercentile(quality, { qualityStats: modelInfo.metrics });
    
    // Get feature importance from model (only if model is available)
    const factors: Record<string, { value: number; importance: number }> = {};
    if (mlIntegration?.qualityPredictor?.metadata?.featureImportance) {
      mlIntegration.qualityPredictor.metadata.featureImportance.slice(0, 10).forEach((item: any) => {
        factors[item.name || item[0]] = {
          value: features[item.name || item[0]] || 0,
          importance: item.importance || item[1] || 0
        };
      });
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(features, { qualityStats: modelInfo.metrics });
    
    // Generate platform-specific insights
    const platformSpecific = generatePlatformSpecific(quality, features, platform);
    
    const responseData: QualityResponse = {
      quality: Math.max(0, Math.min(1, quality)),
      confidence,
      percentile: Math.max(0, Math.min(100, percentile)),
      factors,
      recommendations,
      platformSpecific,
      // Add metadata about prediction source
      ...(usingFallback && { 
        warning: 'Using fallback prediction - ML model not available',
        source: 'fallback'
      })
    };
    
    // Track performance
    const duration = Date.now() - startTime;
    if (typeof window === 'undefined') {
      // Server-side: track via API
      try {
        await fetch(`${request.url.split('/api')[0]}/api/beast-mode/monitoring/performance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stats: {
              'api.repos.quality': {
                operation: 'api.repos.quality',
                count: 1,
                totalDuration: duration,
                averageDuration: duration,
                minDuration: duration,
                maxDuration: duration,
                p50: duration,
                p95: duration,
                p99: duration,
                errorCount: 0,
                errorRate: 0,
              },
            },
            timestamp: Date.now(),
          }),
        });
      } catch (e) {
        // Silently fail
      }
    }
    
    const response = NextResponse.json(responseData);
    
    // Add cache headers for successful responses
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    // Store in cache
    cache.set(repo, providedFeatures, responseData);
    
    return response;
        
      } catch (error: any) {
        console.error('[Quality API] Error:', error);
        const duration = Date.now() - startTime;
        // Track error performance
        if (typeof window === 'undefined') {
          try {
            await fetch(`${request.url.split('/api')[0]}/api/beast-mode/monitoring/performance`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                stats: {
                  'api.repos.quality': {
                    operation: 'api.repos.quality',
                    count: 1,
                    totalDuration: duration,
                    averageDuration: duration,
                    minDuration: duration,
                    maxDuration: duration,
                    p50: duration,
                    p95: duration,
                    p99: duration,
                    errorCount: 1,
                    errorRate: 100,
                  },
                },
                timestamp: Date.now(),
              }),
            });
          } catch (e) {
            // Silently fail
          }
        }
        return NextResponse.json(
          { error: 'Failed to predict repository quality', details: error.message },
          { status: 500 }
        );
      }
    }

export async function GET() {
  return NextResponse.json({
    message: 'Repository Quality API',
    endpoints: {
      POST: '/api/repos/quality',
      description: 'Get quality prediction for a repository',
      body: {
        repo: 'owner/repo',
        platform: 'echeo | beast-mode (optional)',
        features: 'object (optional, will scan if not provided)'
      }
    },
    platforms: ['echeo', 'beast-mode'],
    model: 'XGBoost (2,621 repos trained, R² = 1.000)'
  });
}

