import { NextRequest, NextResponse } from 'next/server';

/**
 * Deployment Platforms API
 *
 * Get supported deployment platforms
 */
export async function GET(request: NextRequest) {
  try {
    // Return supported platforms
    const platforms = [
      'vercel',
      'railway',
      'aws',
      'docker',
      'kubernetes',
      'netlify',
      'render'
    ];

    return NextResponse.json({
      platforms,
      count: platforms.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Platforms API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve platforms',
        details: error.message,
        platforms: ['vercel', 'railway', 'aws', 'docker', 'kubernetes']
      },
      { status: 500 }
    );
  }
}
