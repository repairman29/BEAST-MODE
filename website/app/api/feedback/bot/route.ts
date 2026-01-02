/**
 * Bot/AI System Feedback API
 * Collect feedback from AI systems and bots
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMultiTypeFeedbackCollector } from '../../../../lib/mlops/multiTypeFeedbackCollector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      predictionId, 
      outcome, 
      confidence, 
      reasoning, 
      metrics,
      systemName,
      evaluation,
      score,
      context = {} 
    } = body;

    if (!predictionId) {
      return NextResponse.json(
        { success: false, error: 'predictionId is required' },
        { status: 400 }
      );
    }

    const collector = getMultiTypeFeedbackCollector();
    
    // Determine if it's bot feedback or AI system feedback
    let result;
    if (systemName || evaluation) {
      // AI system feedback
      result = await collector.collectAISystemFeedback(predictionId, {
        systemName,
        evaluation,
        score,
        reasoning,
        metrics,
        context
      });
    } else {
      // Bot feedback
      result = await collector.collectBotFeedback(predictionId, {
        outcome,
        confidence,
        reasoning,
        metrics,
        context
      });
    }

    return NextResponse.json({
      success: true,
      predictionId: predictionId,
      feedbackType: result.feedbackType,
      message: 'Bot/AI feedback collected successfully'
    });
  } catch (error: any) {
    console.error('[Feedback Bot] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

