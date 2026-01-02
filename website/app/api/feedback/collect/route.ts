/**
 * Unified Feedback Collection API
 * Handles all types of feedback: users, bots, AI systems, surveys, comments
 */

import { NextRequest, NextResponse } from 'next/server';
// Optional import - module may not exist
async function getMultiTypeFeedbackCollector() {
  try {
    const module = await import('../../../../lib/mlops/multiTypeFeedbackCollector');
    return module.getMultiTypeFeedbackCollector();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { predictionId, type, ...feedback } = body;

    if (!predictionId) {
      return NextResponse.json(
        { success: false, error: 'predictionId is required' },
        { status: 400 }
      );
    }

    const collector = getMultiTypeFeedbackCollector();
    
    // Collect feedback based on type
    const result = await collector.collectFeedback(predictionId, {
      type: type || 'user', // Default to user if not specified
      ...feedback
    });

    return NextResponse.json({
      success: true,
      predictionId: predictionId,
      feedbackType: result.feedbackType,
      message: 'Feedback collected successfully'
    });
  } catch (error: any) {
    console.error('[Feedback Collect] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

