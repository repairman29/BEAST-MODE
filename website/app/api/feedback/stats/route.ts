/**
 * Feedback Statistics API
 * Get feedback collection statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeedbackCollector } from '@/lib/mlops/feedbackCollector';

export async function GET(request: NextRequest) {
  try {
    const collector = await getFeedbackCollector();
    
    // Get statistics
    const stats = await collector.getFeedbackStats();
    
    // Get predictions needing feedback
    const needingFeedback = await collector.getPredictionsNeedingFeedback({
      limit: 100
    });

    // Analyze by service
    const byService: Record<string, any> = {};
    for (const pred of needingFeedback) {
      const service = pred.service_name || 'unknown';
      if (!byService[service]) {
        byService[service] = {
          total: 0,
          recent: 0,
          old: 0,
          withContext: 0
        };
      }
      byService[service].total++;
      
      const age = Date.now() - new Date(pred.created_at).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        byService[service].recent++;
      } else if (age > 7 * 24 * 60 * 60 * 1000) {
        byService[service].old++;
      }
      
      if (pred.context && Object.keys(pred.context).length > 0) {
        byService[service].withContext++;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalPredictions: stats.totalPredictions,
        withActuals: stats.withActuals,
        withoutActuals: stats.withoutActuals,
        feedbackRate: stats.feedbackRate,
        targetRate: 0.05, // 5%
        health: stats.feedbackRate >= 0.05 ? 'healthy' : 
                stats.feedbackRate >= 0.01 ? 'needs-attention' : 'critical'
      },
      byService: byService,
      needingFeedback: needingFeedback.length
    });
  } catch (error: any) {
    console.error('[Feedback Stats] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

