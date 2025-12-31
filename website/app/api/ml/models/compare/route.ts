import { NextRequest, NextResponse } from 'next/server';

/**
 * Model Comparison API
 * 
 * Compares performance of all available models
 * 
 * Month 6: Week 2 - Model Comparison API
 */

export async function POST(request: NextRequest) {
  try {
    const { testData } = await request.json();

    // Try to load model comparison service
    let modelComparison = null;
    try {
      const path = require('path');
      const compPath = path.join(process.cwd(), '../lib/mlops/modelComparison');
      const { getModelComparison } = require(compPath);
      modelComparison = getModelComparison();
      await modelComparison.initialize();
    } catch (error) {
      console.debug('[Compare API] Model comparison service not available:', error.message);
    }

    if (!modelComparison) {
      return NextResponse.json(
        { error: 'Model comparison service not available' },
        { status: 503 }
      );
    }

    if (!testData || !testData.X || !testData.y) {
      return NextResponse.json(
        { error: 'Test data (X, y) is required' },
        { status: 400 }
      );
    }

    // Run comparison
    const results = await modelComparison.compareModels(testData.X, testData.y);

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Compare API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Try to load model comparison service
  let modelComparison = null;
  try {
    const path = require('path');
    const compPath = path.join(process.cwd(), '../lib/mlops/modelComparison');
    const { getModelComparison } = require(compPath);
    modelComparison = getModelComparison();
  } catch (error) {
    // Service not available
  }

  const results = modelComparison ? modelComparison.getComparisonResults() : null;

  return NextResponse.json({
    endpoint: '/api/ml/models/compare',
    description: 'Compares performance of all available models',
    method: 'POST',
    body: {
      testData: {
        X: 'array (feature vectors)',
        y: 'array (target values)'
      }
    },
    response: {
      results: results || {
        comparisons: 'array',
        bestModel: 'object',
        timestamp: 'string'
      }
    },
    cachedResults: results
  });
}

