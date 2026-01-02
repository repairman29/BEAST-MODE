/**
 * Submit Feedback API
 * Record feedback for a prediction
 */

import { NextRequest, NextResponse } from 'next/server';
// Optional import - handled dynamically

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { predictionId, actualValue, context = {} } = body;

    if (!predictionId) {
      return NextResponse.json(
        { success: false, error: 'predictionId is required' },
        { status: 400 }
      );
    }

    if (typeof actualValue !== 'number' || actualValue < 0 || actualValue > 1) {
      return NextResponse.json(
        { success: false, error: 'actualValue must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    const collector = await getFeedbackCollector();
    
    // Record outcome
    const result = await collector.recordOutcome(
      predictionId,
      actualValue,
      {
        ...context,
        source: 'api',
        submittedAt: new Date().toISOString()
      }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to record feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      predictionId: predictionId,
      actualValue: actualValue,
      error: result.error,
      message: 'Feedback recorded successfully'
    });
  } catch (error: any) {
    console.error('[Feedback Submit] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

