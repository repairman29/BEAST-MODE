import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../lib/api-module-loader';

/**
 * Aggregated Analytics API
 * Combines data from multiple sources for comprehensive analytics
 */

let customModelMonitoring: any;
let deliveryMetrics: any;
let anomalyDetector: any;
let predictiveAnalyzer: any;

try {
  customModelMonitoring = loadModule('../../../../lib/mlops/customModelMonitoring');
  deliveryMetrics = loadModule('../../../../lib/mlops/deliveryMetrics');
  anomalyDetector = loadModule('../../../../lib/mlops/anomalyDetector');
  predictiveAnalyzer = loadModule('../../../../lib/mlops/predictiveAnalyzer');
} catch (error) {
  console.warn('[Analytics API] Some modules not available:', error);
}

/**
 * GET /api/analytics
 * Get aggregated analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all'; // quality, performance, cost, delivery, all
    const timeRange = searchParams.get('timeRange') || '7d';

    const analytics: any = {
      timestamp: new Date().toISOString(),
      timeRange,
      category,
      data: {}
    };

    // Quality Analytics
    if (category === 'quality' || category === 'all') {
      try {
        // Get quality metrics from monitoring
        if (customModelMonitoring && typeof customModelMonitoring.getMetrics === 'function') {
          const qualityMetrics = customModelMonitoring.getMetrics(timeRange);
          analytics.data.quality = {
            averageQuality: qualityMetrics.averageQuality || 0,
            qualityTrend: qualityMetrics.qualityTrend || 'stable',
            qualityDistribution: qualityMetrics.qualityDistribution || {}
          };
        }
      } catch (error: any) {
        console.warn('[Analytics API] Quality metrics error:', error.message);
        analytics.data.quality = { error: 'Not available' };
      }
    }

    // Performance Analytics
    if (category === 'performance' || category === 'all') {
      try {
        if (customModelMonitoring && typeof customModelMonitoring.getMetrics === 'function') {
          const perfMetrics = customModelMonitoring.getMetrics(timeRange);
          analytics.data.performance = {
            averageLatency: perfMetrics.averageLatency || 0,
            p95Latency: perfMetrics.p95Latency || 0,
            p99Latency: perfMetrics.p99Latency || 0,
            successRate: perfMetrics.successRate || 0,
            requestsPerSecond: perfMetrics.requestsPerSecond || 0
          };
        }
      } catch (error: any) {
        console.warn('[Analytics API] Performance metrics error:', error.message);
        analytics.data.performance = { error: 'Not available' };
      }
    }

    // Cost Analytics
    if (category === 'cost' || category === 'all') {
      try {
        if (customModelMonitoring && typeof customModelMonitoring.getMetrics === 'function') {
          const costMetrics = customModelMonitoring.getMetrics(timeRange);
          analytics.data.cost = {
            totalCost: costMetrics.totalCost || 0,
            costSavings: costMetrics.costSavings || 0,
            costPerRequest: costMetrics.costPerRequest || 0,
            projectedMonthly: costMetrics.projectedMonthly || 0
          };
        }
      } catch (error: any) {
        console.warn('[Analytics API] Cost metrics error:', error.message);
        analytics.data.cost = { error: 'Not available' };
      }
    }

    // Delivery Analytics
    if (category === 'delivery' || category === 'all') {
      try {
        if (deliveryMetrics && typeof deliveryMetrics.getDeliveryMetrics === 'function') {
          const deliveryData = deliveryMetrics.getDeliveryMetrics(timeRange);
          analytics.data.delivery = {
            averageTimeToCode: deliveryData.averageTimeToCode || 0,
            featureCompletionRate: deliveryData.featureCompletionRate || 0,
            bugRate: deliveryData.bugRate || 0,
            developerProductivity: deliveryData.developerProductivity || {}
          };
        }
      } catch (error: any) {
        console.warn('[Analytics API] Delivery metrics error:', error.message);
        analytics.data.delivery = { error: 'Not available' };
      }
    }

    // Anomaly Summary
    if (category === 'all') {
      try {
        if (anomalyDetector && typeof anomalyDetector.getStats === 'function') {
          const anomalyStats = anomalyDetector.getStats(timeRange);
          analytics.data.anomalies = {
            total: anomalyStats.total || 0,
            bySeverity: anomalyStats.bySeverity || {},
            recent: anomalyStats.recent || []
          };
        }
      } catch (error: any) {
        console.warn('[Analytics API] Anomaly stats error:', error.message);
      }
    }

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error: any) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics', details: error.message },
      { status: 500 }
    );
  }
}
