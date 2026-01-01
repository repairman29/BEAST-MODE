import { NextRequest, NextResponse } from 'next/server';
import { checkScalingNeeds, getAdvancedScalerService } from "../../../../lib/api-middleware';

/**
 * Scaling API
 * 
 * Provides scaling decisions and management
 * 
 * Phase 2, Week 3: Advanced Scaling Features
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation') || 'check';

    const scaler = await getAdvancedScalerService();
    
    if (!scaler) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Advanced scaler not available',
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'check') {
      const scaling = await checkScalingNeeds();
      return NextResponse.json({
        status: 'ok',
        scaling,
        timestamp: new Date().toISOString()
      });
    }

    if (operation === 'history') {
      const history = scaler.getScalingHistory(50);
      return NextResponse.json({
        status: 'ok',
        history,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Scaling API ready',
      operations: ['check', 'history'],
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

export async function POST(request: NextRequest) {
  try {
    const { operation, metrics } = await request.json();

    const scaler = await getAdvancedScalerService();
    
    if (!scaler) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Advanced scaler not available',
        timestamp: new Date().toISOString()
      });
    }

    switch (operation) {
      case 'predictive-scale':
        if (!metrics) {
          return NextResponse.json(
            { error: 'metrics required' },
            { status: 400 }
          );
        }
        const predictive = await scaler.predictiveScale(metrics);
        return NextResponse.json({
          status: 'ok',
          scaling: predictive,
          timestamp: new Date().toISOString()
        });

      case 'schedule-scaling':
        const { schedule, targetInstances } = await request.json();
        if (!schedule || !targetInstances) {
          return NextResponse.json(
            { error: 'schedule and targetInstances required' },
            { status: 400 }
          );
        }
        const scheduled = await scaler.scheduleScaling(schedule, targetInstances);
        return NextResponse.json({
          status: 'ok',
          scheduled,
          timestamp: new Date().toISOString()
        });

      case 'cost-aware-scale':
        if (!metrics) {
          return NextResponse.json(
            { error: 'metrics required' },
            { status: 400 }
          );
        }
        const costAware = await scaler.costAwareScale(metrics);
        return NextResponse.json({
          status: 'ok',
          scaling: costAware,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }
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



