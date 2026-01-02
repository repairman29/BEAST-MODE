/**
 * Feedback Service Health Check
 * Check if feedback service is running and healthy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeedbackCollector } from '@/lib/mlops/feedbackCollector';

export async function GET(request: NextRequest) {
  try {
    const collector = await getFeedbackCollector();
    const stats = await collector.getFeedbackStats();

    const health = {
      status: 'healthy',
      feedbackRate: stats.feedbackRate,
      targetRate: 0.05,
      totalPredictions: stats.totalPredictions,
      withActuals: stats.withActuals,
      withoutActuals: stats.withoutActuals,
      health: stats.feedbackRate >= 0.05 ? 'healthy' : 
              stats.feedbackRate >= 0.01 ? 'needs-attention' : 'critical',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      health: health
    });
  } catch (error: any) {
    console.error('[Feedback Health] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        health: {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

