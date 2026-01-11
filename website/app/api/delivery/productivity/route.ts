import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Developer Productivity API
 * 
 * Tracks developer productivity metrics
 */

let deliveryMetrics: any;
try {
  const deliveryMetricsModule = loadModule('@/lib/mlops/deliveryMetrics') || 
                                 require('@/lib/mlops/deliveryMetrics');
  deliveryMetrics = deliveryMetricsModule?.getDeliveryMetrics 
    ? deliveryMetricsModule.getDeliveryMetrics()
    : deliveryMetricsModule;
} catch (error) {
  console.warn('[Productivity API] Delivery metrics module not available:', error);
}

/**
 * GET /api/delivery/productivity
 * Get developer productivity metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    // Calculate productivity metrics
    const developers: Array<{
      developerId: string;
      developerName: string;
      featuresCompleted: number;
      avgTimePerFeature: number;
      avgQuality: number;
      bugRate: number;
      productivityScore: number;
    }> = [];

    // If delivery metrics module is available, use it
    if (deliveryMetrics && typeof deliveryMetrics.getDeliveryMetrics === 'function') {
      const metrics = deliveryMetrics.getDeliveryMetrics(userId, timeRange);
      
      // For now, create a single developer entry from overall metrics
      // TODO: Track per-developer metrics
      developers.push({
        developerId: userId || 'default',
        developerName: 'Developer',
        featuresCompleted: metrics.totalFeatures || 0,
        avgTimePerFeature: metrics.avgTimeToCode || 0,
        avgQuality: metrics.avgQuality || 0,
        bugRate: 0, // Will be calculated from bug tracking
        productivityScore: calculateProductivityScore(metrics)
      });
    }

    // Calculate overall metrics
    const overall = {
      totalFeatures: developers.reduce((sum, d) => sum + d.featuresCompleted, 0),
      avgTimePerFeature: developers.length > 0
        ? developers.reduce((sum, d) => sum + d.avgTimePerFeature, 0) / developers.length
        : 0,
      avgQuality: developers.length > 0
        ? developers.reduce((sum, d) => sum + d.avgQuality, 0) / developers.length
        : 0,
      avgBugRate: developers.length > 0
        ? developers.reduce((sum, d) => sum + d.bugRate, 0) / developers.length
        : 0
    };

    // Generate trends (simplified)
    const trends: Array<{ date: string; featuresCompleted: number; avgQuality: number }> = [];
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString(),
        featuresCompleted: Math.floor(Math.random() * 5), // Placeholder
        avgQuality: overall.avgQuality
      });
    }

    return NextResponse.json({
      success: true,
      developers,
      overall,
      trends
    });

  } catch (error: any) {
    console.error('[Productivity API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get productivity data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Calculate productivity score (0-100)
 */
function calculateProductivityScore(metrics: any): number {
  let score = 50; // Base score

  // Quality component (0-30 points)
  const qualityScore = (metrics.avgQuality || 0) * 30;
  score += qualityScore;

  // Speed component (0-20 points)
  // Faster = better (inverse relationship)
  const avgTime = metrics.avgTimeToCode || 0;
  const speedScore = Math.max(0, 20 - (avgTime / 1000)); // 20s = 0 points, 0s = 20 points
  score += speedScore;

  // Volume component (0-30 points)
  // More features = better (capped)
  const volumeScore = Math.min(30, (metrics.totalFeatures || 0) * 2);
  score += volumeScore;

  // Bug rate component (0-20 points)
  // Lower bug rate = better
  const bugRate = metrics.avgBugRate || 0;
  const bugScore = Math.max(0, 20 - (bugRate * 2));
  score += bugScore;

  return Math.min(100, Math.max(0, score));
}
