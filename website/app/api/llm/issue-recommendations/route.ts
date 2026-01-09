/**
 * Issue Recommendations API
 * Provides LLM-generated recommendations for code issues
 */

import { NextRequest, NextResponse } from 'next/server';
import issueRecommender from '../../../../../lib/mlops/issueRecommender';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issue, code, filePath, options = {} } = body;

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue description is required' },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    const recommendations = await issueRecommender.getRecommendations(
      issue,
      code,
      filePath,
      options
    );

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error('Issue recommendations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
