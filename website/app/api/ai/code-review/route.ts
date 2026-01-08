import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Code Review Automation API
 */

let codeReview: any;

try {
  const codeReviewModule = loadModule('../../../../../lib/ai/codeReviewAutomation') ||
                           require('../../../../../lib/ai/codeReviewAutomation');
  codeReview = codeReviewModule?.getCodeReviewAutomation
    ? codeReviewModule.getCodeReviewAutomation()
    : codeReviewModule;
} catch (error) {
  console.warn('[Code Review API] Module not available:', error);
}

/**
 * POST /api/ai/code-review
 * Review code automatically
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, filePath, files, options = {} } = body;
    const userId = request.cookies.get('github_oauth_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!codeReview) {
      return NextResponse.json(
        { error: 'Code review not available' },
        { status: 503 }
      );
    }

    if (files && Array.isArray(files)) {
      // Review codebase
      const result = codeReview.reviewCodebase(files, options);
      return NextResponse.json({
        success: true,
        result
      });
    } else if (code && filePath) {
      // Review single file
      const result = codeReview.reviewCode(code, filePath, options);
      return NextResponse.json({
        success: true,
        result
      });
    } else {
      return NextResponse.json(
        { error: 'code and filePath, or files array required' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Code Review API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to review code', details: error.message },
      { status: 500 }
    );
  }
}
