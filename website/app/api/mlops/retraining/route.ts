import { NextRequest, NextResponse } from 'next/server';

/**
 * Model Retraining API
 * 
 * Provides automated model retraining functionality
 * 
 * Phase 3: MLOps Automation Integration
 */

async function handler(req: NextRequest) {
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

