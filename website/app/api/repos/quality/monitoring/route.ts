import { NextRequest, NextResponse } from 'next/server';

// Import from BEAST-MODE-PRODUCT root (outside website directory)
// Use dynamic require to avoid build-time errors
let getQualityMonitoring: any;
let getQualityCache: any;

try {
  const qualityMonitoring = require('../../../../../../lib/mlops/qualityMonitoring');
  const qualityCache = require('../../../../../../lib/mlops/qualityCache');
  getQualityMonitoring = qualityMonitoring.getQualityMonitoring || qualityMonitoring.default?.getQualityMonitoring;
  getQualityCache = qualityCache.getQualityCache || qualityCache.default?.getQualityCache;
} catch (error) {
  // Fallback if modules don't exist
  console.warn('[Quality Monitoring] Modules not available, using fallback');
  getQualityMonitoring = () => ({ getMetrics: () => ({}), getTopRepos: () => [], getPlatformDistribution: () => ({}) });
  getQualityCache = () => ({ getStats: () => ({}) });
}

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

