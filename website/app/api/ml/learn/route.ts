import { NextRequest, NextResponse } from 'next/server';

// Optional imports - services may not be available
async function getLearningServices() {
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const middleware = await import(/* webpackIgnore: true */ '../../../../lib/api-middleware').catch(() => null);
    return {
      learnFromOutcome: middleware?.learnFromOutcome,
      getSelfLearningService: middleware?.getSelfLearningService
    };
  } catch {
    return { learnFromOutcome: null, getSelfLearningService: null };
  }
}

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

    const { learnFromOutcome } = await getLearningServices();
    if (!learnFromOutcome) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Self-learning service not available',
        timestamp: new Date().toISOString()
      });
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
    const { getSelfLearningService } = await getLearningServices();
    if (!getSelfLearningService) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Self-learning service not available',
        timestamp: new Date().toISOString()
      });
    }
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



