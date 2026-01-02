/**
 * Bot/AI System Feedback API
 * Collect feedback from AI systems and bots
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

    const collector = await getMultiTypeFeedbackCollector();
    
    if (!collector) {
      return NextResponse.json({
        success: false,
        error: 'Multi-type feedback collector not available'
      }, { status: 503 });
    }
    
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

