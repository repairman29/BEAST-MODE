import { NextRequest, NextResponse } from 'next/server';

/**
 * Deployment Strategies API
 *
 * Get supported deployment strategies
 */
export async function GET(request: NextRequest) {
  try {
    // Return supported deployment strategies
    const strategies = [
      'instant',
      'blue-green',
      'canary',
      'rolling'
    ];

    return NextResponse.json({
      strategies,
      count: strategies.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Strategies API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve strategies',
        details: error.message,
        strategies: ['instant', 'blue-green', 'canary', 'rolling']
      },
      { status: 500 }
    );
  }
}

