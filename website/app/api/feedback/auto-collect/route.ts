/**
 * Auto Feedback Collection API
 * Receives user actions and automatically collects feedback
 * 
 * Phase 3: Automated Feedback Collection
 */

import { NextRequest, NextResponse } from 'next/server';

// Optional import - module may not exist
async function getAutoFeedbackCollector() {
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const module = await import(/* webpackIgnore: true */ '../../../../../../lib/mlops/autoFeedbackCollector').catch(() => null);
    return module?.getAutoFeedbackCollector || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle inferred feedback (new format)
    if (body.predictionId && body.inferredValue !== undefined) {
      const { predictionId, inferredValue, context } = body;
      
      // Record inferred feedback directly
      try {
        const { getFeedbackCollector } = require('../../../../../lib/mlops/feedbackCollector');
        const collector = await getFeedbackCollector();
        
        if (collector) {
          await collector.recordOutcome(predictionId, inferredValue, {
            ...context,
            source: 'auto-inferred',
            inferred: true
          });
          
          return NextResponse.json({
            success: true,
            predictionId,
            inferredValue,
            message: 'Inferred feedback recorded'
          });
        }
      } catch (error: any) {
        console.warn('[Auto Feedback] Failed to record inferred feedback:', error.message);
        // Continue to fallback
      }
    }
    
    // Handle action tracking (legacy format)
    const { actions } = body;

    if (!actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: actions array or inferred feedback required' },
        { status: 400 }
      );
    }

    const getCollector = await getAutoFeedbackCollector();
    if (!getCollector) {
      // Silently fail - auto-collection is optional
      return NextResponse.json({
        success: false,
        message: 'Auto feedback collector not available'
      });
    }

    const collector = getCollector();
    let collected = 0;

    // Process each action
    for (const action of actions) {
      const { actionType, predictionId, metadata } = action;

      if (!actionType) continue;

      // Track the action
      collector.trackAction(actionType, predictionId || null, metadata || {});

      // If we have an outcome in metadata, track that too
      if (metadata?.outcome !== undefined) {
        collector.trackOutcome(predictionId || null, metadata.outcome, metadata);
      }

      collected++;
    }

    return NextResponse.json({
      success: true,
      collected,
      total: actions.length
    });
  } catch (error: any) {
    console.error('[Auto Feedback Collection] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

