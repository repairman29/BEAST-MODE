/**
 * Code Comments API
 * Generates inline comments and documentation for code
 */

import { NextRequest, NextResponse } from 'next/server';
import commentGenerator from '@/lib/mlops/commentGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, style = 'detailed', options = {} } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Use dynamic require to avoid build-time errors
    let commentGen: any = null;
    try {
      commentGen = require('@/lib/mlops/commentGenerator');
    } catch (error) {
      console.warn('[Code Comments API] Module not available:', error);
    }

    if (!commentGen) {
      return NextResponse.json(
        { error: 'Comment generator not available' },
        { status: 503 }
      );
    }

    const result = await commentGen.generateComments(
      code,
      language || 'javascript',
      style,
      options
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Code comments error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate comments' },
      { status: 500 }
    );
  }
}
