/**
 * Performance Optimization API
 * Suggests performance improvements for code
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Performance Optimization API
 */

// Use dynamic require to avoid build-time errors
let performanceOptimizer: any = null;

try {
  const optimizerModule = require('../../../../../lib/mlops/performanceOptimizer');
  if (optimizerModule.PerformanceOptimizer) {
    performanceOptimizer = new optimizerModule.PerformanceOptimizer();
  } else {
    performanceOptimizer = optimizerModule;
  }
} catch (error) {
  console.warn('[Performance Optimization API] Module not available:', error);
}

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

    if (!performanceOptimizer) {
      return NextResponse.json(
        { error: 'Performance optimizer not available' },
        { status: 503 }
      );
    }

    const optimizations = await performanceOptimizer.getOptimizations(
      code,
      options.filePath || '',
      options.metrics || {}
    );

    return NextResponse.json({ optimizations });
  } catch (error: any) {
    console.error('Performance optimization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize performance' },
      { status: 500 }
    );
  }
}
