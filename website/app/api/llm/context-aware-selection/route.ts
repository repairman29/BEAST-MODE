/**
 * Context-Aware Model Selection API
 * Selects the best model based on code context
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Context-Aware Model Selection API
 */

// Use dynamic require to avoid build-time errors
let contextAwareModelSelector: any = null;

try {
  const selectorModule = require('@/lib/mlops/contextAwareModelSelector');
  const getContextAwareModelSelector = selectorModule.getContextAwareModelSelector;
  if (getContextAwareModelSelector) {
    contextAwareModelSelector = getContextAwareModelSelector();
  } else if (selectorModule.ContextAwareModelSelector) {
    contextAwareModelSelector = new selectorModule.ContextAwareModelSelector();
  }
} catch (error) {
  console.warn('[Context-Aware Selection API] Module not available:', error);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, task, options = {} } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    if (!contextAwareModelSelector) {
      return NextResponse.json(
        { error: 'Model selector not available' },
        { status: 503 }
      );
    }

    const selection = contextAwareModelSelector.selectModel({
      code,
      task,
      ...options
    });

    return NextResponse.json({ selection });
  } catch (error: any) {
    console.error('Context-aware selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to select model' },
      { status: 500 }
    );
  }
}
