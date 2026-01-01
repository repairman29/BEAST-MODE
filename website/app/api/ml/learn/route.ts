import { NextRequest, NextResponse } from 'next/server';
import { learnFromOutcome, getSelfLearningService } from '../../../lib/api-middleware';

/**
 * Learning API
 * 
 * Records learning outcomes for self-learning system
 * 
 * Phase 2, Week 2: Self-Learning & Recommendation Engine Integration
 */

export async function POST(request: NextRequest) {
  try {
    const { action, outcome, reward } = await request.json();

    if (!action || outcome === undefined || reward === undefined) {
      return NextResponse.json(
        {
          error: 'action, outcome, and reward are required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const learning = await learnFromOutcome(action, outcome, reward);

    if (!learning) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Self-learning service not available',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      learning,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const learning = await getSelfLearningService();
    
    if (!learning) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Self-learning service not available',
        timestamp: new Date().toISOString()
      });
    }

    const progress = learning.getLearningProgress();
    const history = learning.getLearningHistory(100);

    return NextResponse.json({
      status: 'ok',
      progress,
      history: history.slice(0, 100),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}



