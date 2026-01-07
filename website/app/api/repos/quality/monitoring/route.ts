import { NextRequest, NextResponse } from 'next/server';
import { getQualityMonitoring } from '../../../../../lib/mlops/qualityMonitoring';
import { getQualityCache } from '../../../../../lib/mlops/qualityCache';

/**
 * GET /api/repos/quality/monitoring
 * Get quality API monitoring metrics
 */
export async function GET(request: NextRequest) {
  try {
    const monitoring = getQualityMonitoring();
    const cache = getQualityCache();
    
    const metrics = monitoring.getMetrics();
    const cacheStats = cache.getStats();
    const topRepos = monitoring.getTopRepos(10);
    const platformDistribution = monitoring.getPlatformDistribution();

    return NextResponse.json({
      metrics,
      cache: cacheStats,
      topRepos,
      platformDistribution,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Quality Monitoring] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get monitoring data', details: error.message },
      { status: 500 }
    );
  }
}

