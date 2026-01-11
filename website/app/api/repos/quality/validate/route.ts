import { NextRequest, NextResponse } from 'next/server';

// Dynamic require for Node.js modules
let qualityValidator: any;
try {
  qualityValidator = require('@/lib/mlops/qualityValidator');
} catch (error) {
  console.error('[Quality Validation API] Failed to load modules:', error);
}

/**
 * Quality Validation API
 * 
 * Validates that generated code meets quality standards.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, generatedFiles, originalQuality } = body;
    
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      );
    }
    
    if (!generatedFiles || !Array.isArray(generatedFiles) || generatedFiles.length === 0) {
      return NextResponse.json(
        { error: 'Generated files are required' },
        { status: 400 }
      );
    }
    
    if (!qualityValidator) {
      return NextResponse.json(
        { error: 'Quality validator not available' },
        { status: 500 }
      );
    }
    
    // Validate generated code
    const validation = await qualityValidator.validateImprovement(
      repo,
      generatedFiles,
      originalQuality || {}
    );
    
    return NextResponse.json({
      success: true,
      validation,
      summary: {
        passed: validation.passed,
        score: validation.score,
        issuesCount: validation.issues.length,
        warningsCount: validation.warnings.length,
        recommendationsCount: validation.recommendations.length,
        improvement: validation.beforeAfter.improvement,
      },
    });
    
  } catch (error: any) {
    console.error('[Quality Validation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate quality', details: error.message },
      { status: 500 }
    );
  }
}

