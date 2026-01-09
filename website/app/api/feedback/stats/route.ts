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

    // Get feedback with actual values
    const { data: feedbackData, error: fError } = await supabase
      .from('ml_feedback')
      .select('service_name, prediction_id')
      .not('feedback_score', 'is', null);

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
      targetFeedback: Math.ceil((totalPredictions || 0) * 0.05)
    });
  } catch (error: any) {
    console.error('[Feedback Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get feedback stats', details: error.message },
      { status: 500 }
    );
  }
}
