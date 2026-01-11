import { NextRequest, NextResponse } from 'next/server';

// Import from BEAST-MODE-PRODUCT root (outside website directory)
// Use dynamic require to avoid build-time errors
let getQualityCache: any;

try {
  const qualityCache = require('@/lib/mlops/qualityCache');
  getQualityCache = qualityCache.getQualityCache || qualityCache.default?.getQualityCache;
} catch (error) {
  // Fallback if module doesn't exist
  console.warn('[Quality Stats] Module not available, using fallback');
  getQualityCache = () => ({ getStats: () => ({}) });
}

/**
 * GET /api/repos/quality/stats
 * Get quality API statistics (cache hits, misses, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const cache = getQualityCache();
    const stats = cache.getStats();

    return NextResponse.json({
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Quality API Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats', details: error.message },
      { status: 500 }
    );
  }
}

