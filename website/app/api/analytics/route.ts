import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Advanced Analytics API
 * 
 * Aggregates data from all analytics sources
 */

let deliveryMetrics: any;
let customModelMonitoring: any;
let modelQualityScorer: any;

try {
  const deliveryMetricsModule = loadModule('../../../../../lib/mlops/deliveryMetrics') ||
                                require('../../../../../lib/mlops/deliveryMetrics');
  deliveryMetrics = deliveryMetricsModule?.getDeliveryMetrics
    ? deliveryMetricsModule.getDeliveryMetrics()
    : deliveryMetricsModule;

  const customModelMonitoringModule = loadModule('../../../../../lib/mlops/customModelMonitoring') ||
                                      require('../../../../../lib/mlops/customModelMonitoring');
  customModelMonitoring = customModelMonitoringModule?.getCustomModelMonitoring
    ? customModelMonitoringModule.getCustomModelMonitoring()
    : customModelMonitoringModule;

  const modelQualityScorerModule = loadModule('../../../../../lib/mlops/modelQualityScorer') ||
                                   require('../../../../../lib/mlops/modelQualityScorer');
  modelQualityScorer = modelQualityScorerModule?.getModelQualityScorer
    ? modelQualityScorerModule.getModelQualityScorer()
    : modelQualityScorerModule;
} catch (error) {
  console.warn('[Analytics API] Modules not available:', error);
}

/**
 * GET /api/analytics
 * Get aggregated analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const category = searchParams.get('category'); // quality, performance, delivery, cost, models

    const userId = request.cookies.get('github_oauth_user_id')?.value;

    // Fetch data based on category
    if (category === 'quality') {
      // Quality analytics
      const qualityData = {
        trends: [] as Array<{ date: string; score: number }>,
        average: 0.85,
        distribution: {}
      };

      return NextResponse.json({
        success: true,
        data: qualityData,
        timeRange
      });
    }

    if (category === 'performance') {
      // Performance analytics
      let performanceData: any = {
        latency: [] as Array<{ date: string; avg: number; p95: number; p99: number }>,
        throughput: [] as Array<{ date: string; requests: number }>,
        successRate: 100
      };

      if (customModelMonitoring && typeof customModelMonitoring.getMetrics === 'function') {
        const metrics = customModelMonitoring.getMetrics();
        performanceData.successRate = parseFloat(metrics.requests?.successRate?.replace('%', '') || '100');
      }

      return NextResponse.json({
        success: true,
        data: performanceData,
        timeRange
      });
    }

    if (category === 'delivery') {
      // Delivery analytics
      let deliveryData: any = {
        featuresCompleted: 0,
        avgTimeToCode: 0,
        bugRate: 0,
        productivityScore: 0
      };

      if (deliveryMetrics && typeof deliveryMetrics.getDeliveryMetrics === 'function') {
        const metrics = deliveryMetrics.getDeliveryMetrics(userId, timeRange);
        deliveryData = {
          featuresCompleted: metrics.totalFeatures || 0,
          avgTimeToCode: metrics.avgTimeToCode || 0,
          bugRate: 0, // Will be calculated from bug tracking
          productivityScore: 75 // Placeholder
        };
      }

      return NextResponse.json({
        success: true,
        data: deliveryData,
        timeRange
      });
    }

    if (category === 'cost') {
      // Cost analytics
      let costData: any = {
        customModelCost: 0,
        providerModelCost: 0,
        savings: 0,
        savingsPercent: 0,
        trends: []
      };

      if (customModelMonitoring && typeof customModelMonitoring.getMetrics === 'function') {
        const metrics = customModelMonitoring.getMetrics();
        costData.customModelCost = metrics.costs?.customModelCost || 0;
        costData.providerModelCost = metrics.costs?.providerModelCost || 0;
        costData.savings = metrics.costs?.savings || 0;
        costData.savingsPercent = metrics.costs?.savingsPercent || 0;
      }

      return NextResponse.json({
        success: true,
        data: costData,
        timeRange
      });
    }

    if (category === 'models') {
      // Model analytics
      let modelsData: any = {
        topPerformers: [] as Array<{ modelId: string; score: number; requests: number }>,
        qualityComparison: {}
      };

      if (modelQualityScorer && typeof modelQualityScorer.getAllScores === 'function') {
        const scores = modelQualityScorer.getAllScores();
        modelsData.topPerformers = scores.slice(0, 10).map((s: any) => ({
          modelId: s.modelId,
          score: s.score,
          requests: s.count || 0
        }));
      }

      return NextResponse.json({
        success: true,
        data: modelsData,
        timeRange
      });
    }

    // Return all categories
    return NextResponse.json({
      success: true,
      message: 'Specify category parameter: quality, performance, delivery, cost, or models',
      availableCategories: ['quality', 'performance', 'delivery', 'cost', 'models']
    });

  } catch (error: any) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics data', details: error.message },
      { status: 500 }
    );
  }
}
