import { NextRequest, NextResponse } from 'next/server';

// Optional import - service may not be available
async function getTriggerAutoOptimization() {
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const middleware = await import(/* webpackIgnore: true */ '../../../../lib/api-middleware').catch(() => null);
    return middleware?.triggerAutoOptimization || null;
  } catch {
    return null;
  }
}

/**
 * Auto-Optimization API
 * 
 * Triggers automatic optimization based on current performance
 * 
 * Phase 1, Week 2: High-Impact Services Integration
 */

export async function POST(request: NextRequest) {
  try {
    const triggerAutoOptimization = await getTriggerAutoOptimization();
    if (!triggerAutoOptimization) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Auto-optimizer not available',
        timestamp: new Date().toISOString()
      });
    }
    const optimization = await triggerAutoOptimization();

    if (!optimization) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Auto-optimizer not available',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      optimization,
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

export async function GET(request: NextRequest) {
  try {
    const triggerAutoOptimization = await getTriggerAutoOptimization();
    if (!triggerAutoOptimization) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Auto-optimizer not available',
        timestamp: new Date().toISOString()
      });
    }
    const optimization = await triggerAutoOptimization();

    if (!optimization) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Auto-optimizer not available',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      optimization,
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



