/**
 * Survey Feedback API
 * Collect structured survey responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMultiTypeFeedbackCollector } from '../../../../lib/mlops/multiTypeFeedbackCollector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { predictionId, questions, responses, rating, context = {} } = body;

    if (!predictionId) {
      return NextResponse.json(
        { success: false, error: 'predictionId is required' },
        { status: 400 }
      );
    }

    if (!responses || Object.keys(responses).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Survey responses are required' },
        { status: 400 }
      );
    }

    const collector = getMultiTypeFeedbackCollector();
    
    const result = await collector.collectSurveyFeedback(predictionId, {
      questions,
      responses,
      rating,
      context
    });

    return NextResponse.json({
      success: true,
      predictionId: predictionId,
      feedbackType: 'survey',
      rating: result.rating,
      message: 'Survey feedback collected successfully'
    });
  } catch (error: any) {
    console.error('[Feedback Survey] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

