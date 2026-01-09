import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for serverless functions
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Health Check API
 * 
 * Simple, reliable health check that always returns JSON
 * No external dependencies to avoid webpack/build issues
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'basic';

    // Get basic info from environment
    const version = process.env.npm_package_version || '1.0.0';
    const environment = process.env.NODE_ENV || 'development';

    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: version,
      environment: environment
    };

    // Only add extra info if requested and we can do it safely
    if (level === 'full') {
      try {
        health.system = {
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            unit: 'MB'
          },
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        };
      } catch (error) {
        // Ignore system metrics errors
      }
    }

    // Always return 200 with JSON
    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    // Even on error, return JSON with 200 status
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
