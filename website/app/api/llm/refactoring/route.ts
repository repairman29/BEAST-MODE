/**
 * Refactoring Suggestions API
 * Provides refactoring suggestions and code improvements
 */

import { NextRequest, NextResponse } from 'next/server';
// Use @/ alias for website/lib/mlops (copied from root lib/mlops)
import refactoringSuggestions from '@/lib/mlops/refactoringSuggestions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, options = {} } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    const suggestions = await refactoringSuggestions.getSuggestions(
      code,
      language,
      options
    );

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Refactoring suggestions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate refactoring suggestions' },
      { status: 500 }
    );
  }
}
