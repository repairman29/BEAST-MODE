/**
 * Feedback Notification API
 * Send notifications when feedback rate is low
 */

import { NextRequest, NextResponse } from 'next/server';

// Optional import - module may not exist
async function getFeedbackCollector() {
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const module = await import(/* webpackIgnore: true */ '@/lib/mlops/feedbackCollector').catch(() => null);
    return module?.getFeedbackCollector || null;
  } catch {
    return null;
  }
}

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

      // Send email if email provided
      if (email) {
        try {
          // Use BEAST MODE email integration API
          const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/integrations/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              subject: message.subject,
              html: `
                <h2>${message.subject}</h2>
                <p>${message.body}</p>
                <h3>Statistics:</h3>
                <ul>
                  <li>Total Predictions: ${message.stats.totalPredictions}</li>
                  <li>With Feedback: ${message.stats.withActuals}</li>
                  <li>Feedback Rate: ${(message.stats.feedbackRate * 100).toFixed(2)}%</li>
                  <li>Target Rate: ${(message.stats.targetRate * 100).toFixed(0)}%</li>
                </ul>
                <h3>Recommendations:</h3>
                <ul>
                  ${message.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
              `,
              text: `${message.body}\n\nStatistics:\n- Total Predictions: ${message.stats.totalPredictions}\n- With Feedback: ${message.stats.withActuals}\n- Feedback Rate: ${(message.stats.feedbackRate * 100).toFixed(2)}%\n\nRecommendations:\n${message.recommendations.map(rec => `- ${rec}`).join('\n')}`
            })
          });

          if (emailResponse.ok) {
            console.log('[Feedback Notify] Email sent to:', email);
          } else {
            console.warn('[Feedback Notify] Failed to send email:', await emailResponse.text());
          }
        } catch (err: any) {
          console.warn('[Feedback Notify] Error sending email:', err.message);
        }
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

