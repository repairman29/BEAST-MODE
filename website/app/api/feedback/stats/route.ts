import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '../../../../lib/supabase';

/**
 * GET /api/feedback/stats
 * Get ML feedback collection statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClientOrNull();

    if (!supabase) {
      return NextResponse.json({
        totalPredictions: 0,
        withFeedback: 0,
        feedbackRate: 0,
        byService: {},
        trainingReady: false
      });
    }

    // Get total predictions
    const { count: totalPredictions, error: pError } = await supabase
      .from('ml_predictions')
      .select('*', { count: 'exact', head: true });

    if (pError) {
      console.error('[Feedback Stats] Error getting predictions:', pError);
    }

    // Get feedback with actual values (including metadata for source tracking)
    const { data: feedbackData, error: fError } = await supabase
      .from('ml_feedback')
      .select('service_name, prediction_id, feedback_score, metadata, created_at')
      .not('feedback_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (fError) {
      console.error('[Feedback Stats] Error getting feedback:', fError);
    }

    const feedbackCount = feedbackData?.length || 0;
    const feedbackRate = totalPredictions && totalPredictions > 0 
      ? feedbackCount / totalPredictions 
      : 0;

    // Group by service
    const byService: Record<string, number> = {};
    feedbackData?.forEach(f => {
      const service = f.service_name || 'unknown';
      byService[service] = (byService[service] || 0) + 1;
    });

    // Track inferred vs manual feedback
    let inferredFeedback = 0;
    let manualFeedback = 0;
    const bySource: Record<string, number> = {};
    
    feedbackData?.forEach(f => {
      const metadata = f.metadata || {};
      const source = metadata.source || 'unknown';
      const isInferred = metadata.inferred === true || source.includes('inferred') || source.includes('auto');
      
      if (isInferred) {
        inferredFeedback++;
      } else {
        manualFeedback++;
      }
      
      // Track by source
      bySource[source] = (bySource[source] || 0) + 1;
    });

    // Get recent activity (last 10 feedback entries)
    const recentActivity = feedbackData?.slice(0, 10).map(f => ({
      predictionId: f.prediction_id || '',
      source: (f.metadata as any)?.source || 'unknown',
      score: f.feedback_score || 0,
      timestamp: f.created_at || new Date().toISOString()
    })) || [];

    // Check training readiness (need 50+ predictions with feedback)
    const uniquePredictionsWithFeedback = new Set(feedbackData?.map(f => f.prediction_id).filter(Boolean) || []);
    const trainingReady = uniquePredictionsWithFeedback.size >= 50;

    return NextResponse.json({
      totalPredictions: totalPredictions || 0,
      withFeedback: feedbackCount,
      feedbackRate,
      byService,
      trainingReady,
      predictionsWithFeedback: uniquePredictionsWithFeedback.size,
      targetRate: 0.05, // 5%
      targetFeedback: Math.ceil((totalPredictions || 0) * 0.05),
      inferredFeedback,
      manualFeedback,
      bySource,
      recentActivity
    });
  } catch (error: any) {
    console.error('[Feedback Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get feedback stats', details: error.message },
      { status: 500 }
    );
  }
}
