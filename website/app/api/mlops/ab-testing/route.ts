import { NextRequest, NextResponse } from 'next/server';

/**
 * A/B Testing API
 * 
 * Provides A/B testing functionality for ML models
 * 
 * Phase 3: Model Management Integration
 */

async function handler(req: NextRequest) {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'A/B testing API ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}

