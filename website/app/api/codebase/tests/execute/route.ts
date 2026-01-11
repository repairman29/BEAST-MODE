import { NextRequest, NextResponse } from 'next/server';

// Dynamic require for Node.js modules
let testExecutor: any;
try {
  testExecutor = require('@/lib/mlops/testExecutor');
} catch (error) {
  console.error('[Test Execution API] Failed to load modules:', error);
}

/**
 * Test Execution API
 * 
 * Executes generated tests and reports results.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      testFilePath,
      framework = 'auto',
      timeout = 30000,
    } = body;

    if (!testFilePath) {
      return NextResponse.json(
        { error: 'Test file path is required' },
        { status: 400 }
      );
    }

    if (!testExecutor) {
      return NextResponse.json(
        { error: 'Test executor not available' },
        { status: 500 }
      );
    }

    // Execute tests
    const result = await testExecutor.executeTests(testFilePath, {
      framework,
      timeout,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Test execution failed', details: result.error },
        { status: 500 }
      );
    }

    // Get statistics if available
    const stats = testExecutor.getStats(testFilePath);

    return NextResponse.json({
      success: true,
      framework: result.framework,
      passed: result.passed,
      failed: result.failed,
      total: result.total,
      duration: result.duration,
      code: result.code,
      errors: result.errors || [],
      tests: result.tests || [],
      stats: stats || null,
    });

  } catch (error: any) {
    console.error('[Test Execution API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute tests', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get test execution history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testFilePath = searchParams.get('testFilePath');

    if (!testFilePath) {
      return NextResponse.json(
        { error: 'Test file path is required' },
        { status: 400 }
      );
    }

    if (!testExecutor) {
      return NextResponse.json(
        { error: 'Test executor not available' },
        { status: 500 }
      );
    }

    const history = testExecutor.getHistory(testFilePath);
    const latest = testExecutor.getLatestResults(testFilePath);
    const stats = testExecutor.getStats(testFilePath);

    return NextResponse.json({
      success: true,
      testFilePath,
      history,
      latest,
      stats,
    });

  } catch (error: any) {
    console.error('[Test Execution API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get test history', details: error.message },
      { status: 500 }
    );
  }
}

