import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Advanced AI Recommendations API
 * 
 * Neural code generation, context-aware completions, pattern recognition
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, filePath, language, cursorPosition, surroundingCode, userId } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Import and use AdvancedRecommendations
    let AdvancedRecommendations;
    try {
      const module = await import(/* webpackIgnore: true */ '../../../../../../lib/intelligence/advanced-recommendations').catch(() => null);
      AdvancedRecommendations = module?.default || module;
      if (!AdvancedRecommendations) {
        return NextResponse.json({
          status: 'error',
          error: 'Intelligence module not available',
          timestamp: new Date().toISOString()
        }, { status: 503 });
      }
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        error: 'Intelligence module not available',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    const recommendations = new AdvancedRecommendations();

    const suggestions = await recommendations.generateCodeSuggestions({
      code,
      filePath: filePath || 'unknown',
      language: language || 'javascript',
      cursorPosition: cursorPosition || { line: 0, column: 0 },
      surroundingCode: surroundingCode || ''
    });

    // If userId provided, get personalized recommendations
    if (userId) {
      const personalized = await recommendations.getPersonalizedRecommendations(userId, {
        code,
        filePath,
        language
      });
      return NextResponse.json({
        ...personalized,
        personalized: true
      });
    }

    return NextResponse.json(suggestions);

  } catch (error: any) {
    console.error('Advanced Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: error.message },
      { status: 500 }
    );
  }
}

