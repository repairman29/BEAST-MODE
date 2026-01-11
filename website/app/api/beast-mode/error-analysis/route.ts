import { NextRequest, NextResponse } from 'next/server';

/**
 * Error Analysis API
 * 
 * Provides insights and learning from code generation failures
 * Uses BEAST MODE's error analysis system
 */

// Dynamic require for server-side modules
let errorAnalysis: any;
async function loadErrorAnalysis() {
  if (errorAnalysis) return errorAnalysis;
  
  try {
    // Use @/ alias for website/lib/mlops (copied from root lib/mlops)
    const errorAnalysisModule = await import('@/lib/mlops/errorAnalysis').catch(() => {
      try {
        return require('@/lib/mlops/errorAnalysis');
      } catch (e) {
        // Fallback to relative path
        try {
          return require('../../lib/mlops/errorAnalysis');
        } catch (e2) {
          return null;
        }
      }
    });
    
    if (!errorAnalysisModule) {
      throw new Error('Failed to load errorAnalysis module');
    }
    
    errorAnalysis = errorAnalysisModule.getErrorAnalysis?.() || errorAnalysisModule.default;
    return errorAnalysis;
  } catch (error) {
    console.error('[Error Analysis API] Failed to load modules:', error);
    return null;
  }
}

/**
 * GET - Analyze errors and get insights
 */
export async function GET(request: NextRequest) {
  try {
    const analysisModule = await loadErrorAnalysis();
    if (!analysisModule) {
      return NextResponse.json(
        { error: 'Error analysis service unavailable' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '1000');

    const analysis = await analysisModule.analyzeErrors({
      days,
      limit
    });

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Error Analysis API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to analyze errors',
        success: false
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Generate improved prompt based on error patterns
 */
export async function POST(request: NextRequest) {
  try {
    const analysisModule = await loadErrorAnalysis();
    if (!analysisModule) {
      return NextResponse.json(
        { error: 'Error analysis service unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { prompt, context } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const improvedPrompt = await analysisModule.generateImprovedPrompt(prompt, context || {});

    return NextResponse.json({
      success: true,
      originalPrompt: prompt,
      improvedPrompt,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Error Analysis API] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate improved prompt',
        success: false
      },
      { status: 500 }
    );
  }
}
