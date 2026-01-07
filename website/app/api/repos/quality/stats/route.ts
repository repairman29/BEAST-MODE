import { NextRequest, NextResponse } from 'next/server';
import { getQualityCache } from '../../../../../lib/mlops/qualityCache';

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

