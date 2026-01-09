import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../../../../echeo-landing/lib/supabase';

/**
 * Monitoring Stats API
 * 
 * Returns real-time monitoring statistics
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();

    // Get monitoring data from custom_model_monitoring table
    // If table doesn't exist, return empty stats
    const { data: monitoringData, error } = await supabase
      .from('custom_model_monitoring')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      // Table might not exist yet - return empty stats
      if (error.message.includes('does not exist') || error.message.includes('relation')) {
        return NextResponse.json({
          totalRequests: 0,
          successRate: 0,
          averageLatency: 0,
          cacheHitRate: 0,
          byModel: [],
          recentRequests: []
        });
      }
      throw error;
    }

    const totalRequests = monitoringData?.length || 0;
    const successfulRequests = monitoringData?.filter(m => m.success === true).length || 0;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
    
    const totalLatency = monitoringData?.reduce((sum, m) => sum + (m.latency_ms || 0), 0) || 0;
    const averageLatency = totalRequests > 0 ? totalLatency / totalRequests : 0;
    
    const cacheHits = monitoringData?.filter(m => m.from_cache === true).length || 0;
    const cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

    // Group by model
    const byModelMap = new Map<string, {
      requests: number;
      successes: number;
      totalLatency: number;
      cacheHits: number;
    }>();

    monitoringData?.forEach(m => {
      const modelId = m.model_id || 'unknown';
      const existing = byModelMap.get(modelId) || {
        requests: 0,
        successes: 0,
        totalLatency: 0,
        cacheHits: 0
      };
      
      existing.requests++;
      if (m.success) existing.successes++;
      existing.totalLatency += m.latency_ms || 0;
      if (m.from_cache) existing.cacheHits++;
      
      byModelMap.set(modelId, existing);
    });

    const byModel = Array.from(byModelMap.entries()).map(([modelId, data]) => ({
      modelId,
      requests: data.requests,
      successRate: data.requests > 0 ? data.successes / data.requests : 0,
      averageLatency: data.requests > 0 ? data.totalLatency / data.requests : 0,
      cacheHits: data.cacheHits
    })).sort((a, b) => b.requests - a.requests);

    // Recent requests (last 20)
    const recentRequests = monitoringData?.slice(0, 20).map(m => ({
      id: m.id || '',
      modelId: m.model_id || 'unknown',
      success: m.success === true,
      latency: m.latency_ms || 0,
      fromCache: m.from_cache === true,
      timestamp: m.created_at || new Date().toISOString()
    })) || [];

    return NextResponse.json({
      totalRequests,
      successRate,
      averageLatency,
      cacheHitRate,
      byModel,
      recentRequests
    });
  } catch (error: any) {
    console.error('[Monitoring Stats API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch monitoring stats',
        details: error.message,
        totalRequests: 0,
        successRate: 0,
        averageLatency: 0,
        cacheHitRate: 0,
        byModel: [],
        recentRequests: []
      },
      { status: 500 }
    );
  }
}
