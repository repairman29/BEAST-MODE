import { NextRequest, NextResponse } from 'next/server';

/**
 * Quality Trends API
 * 
 * Returns historical quality data for a repository to enable trend visualization
 */

interface TrendsRequest {
  repo: string;
  days?: number; // Number of days to look back (default: 90)
}

export async function POST(request: NextRequest) {
  try {
    const body: TrendsRequest = await request.json();
    const { repo, days = 90 } = body;

    if (!repo) {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      );
    }

    // Get database writer
    const { getDatabaseWriter } = require('@/lib/mlops/databaseWriter');
    const databaseWriter = getDatabaseWriter();

    if (!databaseWriter || !databaseWriter.supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query historical predictions
    const { data, error } = await databaseWriter.supabase
      .from('ml_predictions')
      .select('predicted_value, confidence, context, created_at')
      .eq('service_name', 'beast-mode')
      .eq('prediction_type', 'quality')
      .or(`context->>repo.eq.${repo},context->repo.eq.${repo}`)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Trends API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trends', details: error.message },
        { status: 500 }
      );
    }

    // Process data for trends
    const trends = (data || []).map((item: any) => ({
      date: item.created_at,
      quality: item.predicted_value || 0,
      confidence: item.confidence || 0,
      context: item.context || {}
    }));

    // Calculate statistics
    const qualities = trends.map(t => t.quality).filter(q => q > 0);
    const averageQuality = qualities.length > 0
      ? qualities.reduce((a, b) => a + b, 0) / qualities.length
      : 0;
    
    const sortedQualities = [...qualities].sort((a, b) => a - b);
    const medianQuality = sortedQualities.length > 0
      ? sortedQualities[Math.floor(sortedQualities.length / 2)]
      : 0;

    // Calculate trend direction
    if (trends.length < 2) {
      return NextResponse.json({
        trends: trends,
        statistics: {
          count: trends.length,
          averageQuality,
          medianQuality,
          trend: 'insufficient_data',
          trendValue: 0
        }
      });
    }

    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, t) => sum + t.quality, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + t.quality, 0) / secondHalf.length;
    
    const trendValue = secondAvg - firstAvg;
    const trend = trendValue > 0.05 ? 'improving' : trendValue < -0.05 ? 'declining' : 'stable';

    // Calculate velocity (rate of change)
    const velocity = trends.length > 1
      ? (trends[trends.length - 1].quality - trends[0].quality) / (days || 90)
      : 0;

    return NextResponse.json({
      trends: trends,
      statistics: {
        count: trends.length,
        averageQuality,
        medianQuality,
        minQuality: sortedQualities[0] || 0,
        maxQuality: sortedQualities[sortedQualities.length - 1] || 0,
        trend,
        trendValue,
        velocity, // Quality change per day
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days
        }
      }
    });

  } catch (error: any) {
    console.error('[Trends API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends', details: error.message },
      { status: 500 }
    );
  }
}
