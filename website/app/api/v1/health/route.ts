import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Backend API v1 - Health Check
 */
export async function GET(request: NextRequest) {
  try {
    // Simple health check - just verify the endpoint is working
    return NextResponse.json({
      status: 'ok',
      service: 'BEAST MODE Backend API v1',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      message: 'BEAST MODE Backend API is running',
    });
  } catch (error: any) {
    console.error('[BEAST MODE Health] Error:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}
