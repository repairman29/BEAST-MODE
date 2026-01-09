/**
 * Ensemble Model Responses API
 * Combines responses from multiple models
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Ensemble Model Responses API
 */

// Use dynamic require to avoid build-time errors
let ensembleGenerator: any = null;

try {
  const ensembleModule = require('../../../../../lib/mlops/ensembleGenerator');
  if (ensembleModule.EnsembleGenerator) {
    ensembleGenerator = new ensembleModule.EnsembleGenerator();
  } else {
    ensembleGenerator = ensembleModule;
  }
} catch (error) {
  console.warn('[Ensemble API] Module not available:', error);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { responses, strategy = 'consensus', options = {} } = body;

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: 'Responses array is required' },
        { status: 400 }
      );
    }

    if (!ensembleGenerator) {
      return NextResponse.json(
        { error: 'Ensemble generator not available' },
        { status: 503 }
      );
    }

    // Use combineResults method
    const result = await ensembleGenerator.combineResults(
      responses.map((r: any) => ({ success: true, content: r })),
      strategy,
      options
    );

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Ensemble generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to combine responses' },
      { status: 500 }
    );
  }
}
