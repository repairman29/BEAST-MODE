/**
 * Comment Feedback API
 * Collect open-ended text feedback
 */

import { NextRequest, NextResponse } from 'next/server';
// Optional import - module may not exist
async function getMultiTypeFeedbackCollector() {
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const module = await import(/* webpackIgnore: true */ '../../../../lib/mlops/multiTypeFeedbackCollector').catch(() => null);
    return module?.getMultiTypeFeedbackCollector || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { predictionId, text, sentiment, rating, context = {} } = body;

    if (!predictionId) {
      return NextResponse.json(
        { success: false, error: 'predictionId is required' },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const collector = await getMultiTypeFeedbackCollector();
    
    if (!collector) {
      return NextResponse.json({
        success: false,
        error: 'Multi-type feedback collector not available'
      }, { status: 503 });
    }
    
    const result = await collector.collectCommentFeedback(predictionId, {
      text,
      sentiment,
      rating,
      context
    });

    return NextResponse.json({
      success: true,
      predictionId: predictionId,
      feedbackType: 'comment',
      rating: result.rating,
      message: 'Comment feedback collected successfully'
    });
  } catch (error: any) {
    console.error('[Feedback Comment] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

