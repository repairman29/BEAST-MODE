/**
 * Test Generation API
 * Generates comprehensive tests for code
 */

import { NextRequest, NextResponse } from 'next/server';
import testGenerator from '../../../../../lib/mlops/testGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, framework = 'jest', options = {} } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    const tests = await testGenerator.generateTests(
      code,
      framework,
      options
    );

    return NextResponse.json({ tests });
  } catch (error: any) {
    console.error('Test generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate tests' },
      { status: 500 }
    );
  }
}
