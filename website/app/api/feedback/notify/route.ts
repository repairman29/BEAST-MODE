/**
 * Feedback Notification API
 * Send notifications when feedback rate is low
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeedbackCollector } from '@/lib/mlops/feedbackCollector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threshold = 0.01, email = null } = body;

    const collector = await getFeedbackCollector();
    const stats = await collector.getFeedbackStats();

    // Check if feedback rate is below threshold
    if (stats.feedbackRate < threshold) {
      const message = {
        subject: '⚠️ Low Feedback Rate Alert',
        body: `Feedback rate is ${(stats.feedbackRate * 100).toFixed(2)}%, below threshold of ${(threshold * 100).toFixed(2)}%`,
        stats: {
          totalPredictions: stats.totalPredictions,
          withActuals: stats.withActuals,
          feedbackRate: stats.feedbackRate,
          targetRate: 0.05
        },
        recommendations: [
          'Enable auto-collection service',
          'Add feedback prompts to UI',
          'Review service integration',
          'Check predictionId flow'
        ]
      };

      // TODO: Send email if email provided
      if (email) {
        // await sendEmail(email, message.subject, message.body);
        console.log('[Feedback Notify] Would send email to:', email);
      }

      return NextResponse.json({
        success: true,
        alert: true,
        message: message
      });
    }

    return NextResponse.json({
      success: true,
      alert: false,
      message: 'Feedback rate is healthy'
    });
  } catch (error: any) {
    console.error('[Feedback Notify] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

