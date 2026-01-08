import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Learning System API
 */

let learningSystem: any;

try {
  const learningModule = loadModule('../../../../../lib/ai/learningSystem') ||
                         require('../../../../../lib/ai/learningSystem');
  learningSystem = learningModule?.getLearningSystem
    ? learningModule.getLearningSystem()
    : learningModule;
} catch (error) {
  console.warn('[Learning System API] Module not available:', error);
}

/**
 * POST /api/ai/learning
 * Learn from user preferences or recognize patterns
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, preference, codebase } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!learningSystem) {
      return NextResponse.json(
        { error: 'Learning system not available' },
        { status: 503 }
      );
    }

    if (action === 'learn') {
      if (!preference) {
        return NextResponse.json(
          { error: 'preference is required' },
          { status: 400 }
        );
      }

      const result = learningSystem.learnPreference(userId, preference);
      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'recognize_patterns') {
      if (!codebase) {
        return NextResponse.json(
          { error: 'codebase is required' },
          { status: 400 }
        );
      }

      const result = learningSystem.recognizePatterns(codebase);
      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === 'adapt_model') {
      const { task, context } = body;
      if (!task) {
        return NextResponse.json(
          { error: 'task is required' },
          { status: 400 }
        );
      }

      const result = learningSystem.adaptModelSelection(userId, task, context);
      return NextResponse.json({
        success: true,
        result
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Learning System API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process learning request', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/learning
 * Get user preferences or patterns
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const codebaseId = searchParams.get('codebaseId');
    const type = searchParams.get('type') || 'preferences';

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!learningSystem) {
      return NextResponse.json(
        { error: 'Learning system not available' },
        { status: 503 }
      );
    }

    if (type === 'preferences') {
      const preferences = learningSystem.getUserPreferences(userId);
      return NextResponse.json({
        success: true,
        preferences
      });
    }

    if (type === 'patterns' && codebaseId) {
      const patterns = learningSystem.getPatterns(codebaseId);
      return NextResponse.json({
        success: true,
        patterns
      });
    }

    return NextResponse.json(
      { error: 'Invalid type or missing codebaseId' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Learning System API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get learning data', details: error.message },
      { status: 500 }
    );
  }
}
