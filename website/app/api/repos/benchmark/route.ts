import { NextRequest, NextResponse } from 'next/server';

/**
 * Repository Benchmarking API
 * 
 * Compares a repository against the dataset to show percentiles and rankings
 * 
 * User Stories:
 * - Echeo: "As a developer, I want to see how my repos compare to others"
 * - BEAST MODE: "As a developer, I want to know my repo's percentile ranking"
 */

interface BenchmarkRequest {
  repo: string;
  features?: Record<string, any>;
}

interface BenchmarkResponse {
  quality: number;
  percentile: number;
  rank: string;
  comparison: {
    vsSimilarRepos: {
      better: number;
      worse: number;
    };
    vsLanguage: {
      percentile: number;
      language: string;
    };
    vsSize: {
      percentile: number;
      sizeCategory: string;
    };
  };
  improvements: Array<{
    action: string;
    current: boolean;
    impact: string;
    percentileGain: string;
  }>;
}

/**
 * Load dataset statistics for benchmarking
 */
function loadDatasetStats() {
  try {
    const fs = require('fs');
    const path = require('path');
    const modelPath = path.join(process.cwd(), '../../.beast-mode/models');
    
    // Find latest model
    const files = fs.readdirSync(modelPath)
      .filter((f: string) => f.startsWith('model-notable-quality-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      return null;
    }
    
    const model = JSON.parse(fs.readFileSync(path.join(modelPath, files[0]), 'utf8'));
    return model.qualityStats || null;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate percentile
 */
function calculatePercentile(quality: number, stats: any): number {
  if (!stats) {
    return quality * 100; // Fallback
  }
  
  const { mean, std } = stats;
  const zScore = (quality - mean) / std;
  // Convert to percentile (rough approximation)
  const percentile = 50 + (zScore * 15);
  return Math.max(0, Math.min(100, percentile));
}

/**
 * Get rank description
 */
function getRank(percentile: number): string {
  if (percentile >= 95) return 'Top 5%';
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 50) return 'Top 50%';
  if (percentile >= 25) return 'Bottom 50%';
  if (percentile >= 10) return 'Bottom 25%';
  return 'Bottom 10%';
}

/**
 * Generate improvement suggestions
 */
function generateImprovements(features: Record<string, any>, quality: number): Array<{
  action: string;
  current: boolean;
  impact: string;
  percentileGain: string;
}> {
  const improvements = [];
  
  if (!features.hasTests && quality < 0.9) {
    improvements.push({
      action: 'Add tests',
      current: false,
      impact: '+0.15 quality',
      percentileGain: '+5-10%'
    });
  }
  
  if (!features.hasCI && quality < 0.9) {
    improvements.push({
      action: 'Add CI/CD',
      current: false,
      impact: '+0.12 quality',
      percentileGain: '+3-7%'
    });
  }
  
  if (!features.hasLicense && quality < 0.95) {
    improvements.push({
      action: 'Add license',
      current: false,
      impact: '+0.05 quality',
      percentileGain: '+1-2%'
    });
  }
  
  if (features.openIssues > 0 && features.stars > 0) {
    const issueRatio = features.openIssues / features.stars;
    if (issueRatio > 0.5) {
      improvements.push({
        action: 'Reduce open issues',
        current: true,
        impact: '+0.15 quality',
        percentileGain: '+5-10%'
      });
    }
  }
  
  return improvements;
}

export async function POST(request: NextRequest) {
  try {
    const body: BenchmarkRequest = await request.json();
    const { repo, features: providedFeatures } = body;
    
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository name is required (format: owner/repo)' },
        { status: 400 }
      );
    }
    
    // Get quality score
    const qualityResponse = await fetch(`${request.nextUrl.origin}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo, features: providedFeatures })
    });
    
    if (!qualityResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get quality score' },
        { status: 500 }
      );
    }
    
    const qualityData = await qualityResponse.json();
    const quality = qualityData.quality;
    
    // Load dataset stats
    const stats = loadDatasetStats();
    const percentile = calculatePercentile(quality, stats);
    const rank = getRank(percentile);
    
    // Generate comparisons (simplified - would use actual dataset in production)
    const features = providedFeatures || {};
    const language = features.language || 'Unknown';
    const fileCount = features.fileCount || 0;
    const sizeCategory = fileCount > 1000 ? 'large' : fileCount > 100 ? 'medium' : 'small';
    
    // Simplified comparisons (would use actual dataset in production)
    const vsSimilar = percentile >= 90 ? 95 : percentile >= 75 ? 85 : 70;
    const vsLanguage = percentile >= 90 ? 92 : percentile >= 75 ? 80 : 65;
    const vsSize = percentile >= 90 ? 90 : percentile >= 75 ? 75 : 60;
    
    // Generate improvements
    const improvements = generateImprovements(features, quality);
    
    const response: BenchmarkResponse = {
      quality,
      percentile: Math.round(percentile * 10) / 10,
      rank,
      comparison: {
        vsSimilarRepos: {
          better: Math.round((percentile / 100) * 100),
          worse: Math.round(((100 - percentile) / 100) * 100)
        },
        vsLanguage: {
          percentile: vsLanguage,
          language
        },
        vsSize: {
          percentile: vsSize,
          sizeCategory
        }
      },
      improvements
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('[Benchmark API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to benchmark repository', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Repository Benchmarking API',
    endpoints: {
      POST: '/api/repos/benchmark',
      description: 'Compare repository against dataset benchmarks',
      body: {
        repo: 'owner/repo',
        features: 'object (optional)'
      }
    }
  });
}

