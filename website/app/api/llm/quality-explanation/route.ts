/**
 * Quality Explanation API
 * Provides LLM-generated explanations for quality scores
 */

import { NextRequest, NextResponse } from 'next/server';
import qualityExplainer from '@/lib/mlops/qualityExplainer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { score, code, issues, options = {} } = body;

    if (!score && score !== 0) {
      return NextResponse.json(
        { error: 'Quality score is required' },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    const explanation = await qualityExplainer.explainQuality(
      score,
      code,
      issues || [],
      options
    );

    return NextResponse.json({ explanation });
  } catch (error: any) {
    console.error('Quality explanation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quality explanation' },
      { status: 500 }
    );
  }
}
