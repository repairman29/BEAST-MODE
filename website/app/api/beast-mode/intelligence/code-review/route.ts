import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Automated Code Review API
 * 
 * AI-powered code review suggestions and pattern analysis
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { changes, options } = body;

    if (!changes || !Array.isArray(changes)) {
      return NextResponse.json(
        { error: 'Changes array is required' },
        { status: 400 }
      );
    }

    const AutomatedCodeReview = require('../../../../../../lib/intelligence/automated-code-review');
    const codeReview = new AutomatedCodeReview(options || {});

    const review = await codeReview.reviewCodeChanges(changes);

    return NextResponse.json(review);

  } catch (error: any) {
    console.error('Code Review API error:', error);
    return NextResponse.json(
      { error: 'Failed to review code', details: error.message },
      { status: 500 }
    );
  }
}

