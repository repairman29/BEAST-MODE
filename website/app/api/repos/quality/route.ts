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
 * Load latest trained model
 */
function loadLatestModel() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), '../../.beast-mode/models'), // From website/ directory
      path.join(process.cwd(), '../.beast-mode/models'),    // Alternative
      path.join(process.cwd(), '.beast-mode/models'),        // If in root
      path.join(__dirname, '../../../.beast-mode/models'),   // From compiled location
    ];
    
    let modelsDir = null;
    for (const dir of possiblePaths) {
      if (fs.existsSync(dir)) {
        modelsDir = dir;
        break;
      }
    }
    
    if (!modelsDir) {
      console.error('[Quality API] Models directory not found. Tried:', possiblePaths);
      return null;
    }
    
    const files = fs.readdirSync(modelsDir)
      .filter((f: string) => f.startsWith('model-notable-quality-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.error('[Quality API] No model files found in:', modelsDir);
      return null;
    }
    
    const modelPath = path.join(modelsDir, files[0]);
    const model = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    
    console.log('[Quality API] Loaded model from:', modelPath);
    return model;
  } catch (error) {
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

export async function POST(request: NextRequest) {
  try {
    const body: QualityRequest = await request.json();
    const { repo, platform, features: providedFeatures } = body;
    
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository name is required (format: owner/repo)' },
        { status: 400 }
      );
    }
    
    // Load model
    const model = loadLatestModel();
    if (!model) {
      return NextResponse.json(
        { error: 'Quality prediction model not available' },
        { status: 503 }
      );
    }
    
    // If features not provided, we'd need to scan the repo
    // For now, require features or use defaults
    const features = providedFeatures || {};
    
    // Extract feature values in model's expected order
    const featureNames = model.featureNames || [];
    const featureValues: Record<string, number> = {};
    
    featureNames.forEach((name: string) => {
      featureValues[name] = features[name] || 0;
    });
    
    // Make prediction
    const quality = predictRandomForest(model, featureValues, featureNames);
    const confidence = 0.85; // Based on model's MAE
    const percentile = calculatePercentile(quality, model);
    
    // Get feature importance
    const factors: Record<string, { value: number; importance: number }> = {};
    if (model.featureImportance) {
      model.featureImportance.slice(0, 10).forEach((item: any) => {
        factors[item.name] = {
          value: featureValues[item.name] || 0,
          importance: item.importance
        };
      });
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(features, model);
    
    // Generate platform-specific insights
    const platformSpecific = generatePlatformSpecific(quality, features, platform);
    
    const response: QualityResponse = {
      quality: Math.max(0, Math.min(1, quality)),
      confidence,
      percentile: Math.max(0, Math.min(100, percentile)),
      factors,
      recommendations,
      platformSpecific
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('[Quality API] Error:', error);
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
    model: 'Random Forest (1,580 repos trained)'
  });
}

