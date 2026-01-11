/**
 * Task-Specific Model Selection API
 * Selects models optimized for specific tasks
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Task-Specific Model Selection API
 */

// Use dynamic require to avoid build-time errors
let taskModelSelector: any = null;

try {
  const selectorModule = require('@/lib/mlops/taskModelSelector');
  const getTaskModelSelector = selectorModule.getTaskModelSelector;
  if (getTaskModelSelector) {
    taskModelSelector = getTaskModelSelector();
  } else if (selectorModule.TaskModelSelector) {
    taskModelSelector = new selectorModule.TaskModelSelector();
  }
} catch (error) {
  console.warn('[Task Selection API] Module not available:', error);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, options = {} } = body;

    if (!task) {
      return NextResponse.json(
        { error: 'Task is required' },
        { status: 400 }
      );
    }

    if (!taskModelSelector) {
      return NextResponse.json(
        { error: 'Task model selector not available' },
        { status: 503 }
      );
    }

    const selection = taskModelSelector.selectModelForTask(
      task,
      options.context || {}
    );

    return NextResponse.json({ selection });
  } catch (error: any) {
    console.error('Task selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to select model' },
      { status: 500 }
    );
  }
}
