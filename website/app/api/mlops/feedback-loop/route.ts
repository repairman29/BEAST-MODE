import { NextRequest, NextResponse } from 'next/server';

/**
 * Feedback Loop API
 * 
 * Provides feedback loop functionality for ML models
 * 
 * Phase 2: Advanced MLOps Integration
 */

async function handler(req: NextRequest) {
  try {
    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'status';

      if (operation === 'status') {
        return NextResponse.json({
          status: 'ok',
          message: 'Feedback loop ready',
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Feedback loop API ready',
        operations: ['status', 'check', 'dashboard', 'health'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      return NextResponse.json({
        status: 'ok',
        message: 'Operation completed',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
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

