import { NextRequest, NextResponse } from 'next/server';

/**
 * ML Monitoring API
 * 
 * Provides production monitoring data for ML system
 * 
 * Month 3: Week 1 - Production Monitoring
 */

export async function GET(request: NextRequest) {
  try {
    // Try to load production monitoring
    let monitoring = null;
    try {
      const path = require('path');
      const monitoringPath = path.join(process.cwd(), '../lib/mlops/productionMonitoring');
      const { getProductionMonitoring } = require(monitoringPath);
      monitoring = getProductionMonitoring();
    } catch (error) {
      console.debug('[ML Monitoring API] Monitoring not available:', error.message);
    }

    if (!monitoring) {
      return NextResponse.json({
        status: 'monitoring_not_available',
        message: 'Production monitoring not initialized',
        timestamp: new Date().toISOString()
      });
    }

    // Get dashboard data
    const dashboard = monitoring.getDashboard();
    const summary = monitoring.getSummary();

    return NextResponse.json({
      status: 'ok',
      dashboard,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ML Monitoring API] Error:', error);
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

/**
 * POST endpoint to record prediction
 */
export async function POST(request: NextRequest) {
  try {
    const { prediction, metadata } = await request.json();

    if (!prediction) {
      return NextResponse.json(
        { error: 'Prediction data is required' },
        { status: 400 }
      );
    }

    // Try to load production monitoring
    let monitoring = null;
    try {
      const path = require('path');
      const monitoringPath = path.join(process.cwd(), '../lib/mlops/productionMonitoring');
      const { getProductionMonitoring } = require(monitoringPath);
      monitoring = getProductionMonitoring();
    } catch (error) {
      console.debug('[ML Monitoring API] Monitoring not available:', error.message);
    }

    if (!monitoring) {
      return NextResponse.json({
        status: 'monitoring_not_available',
        message: 'Production monitoring not initialized'
      });
    }

    // Record prediction
    const result = monitoring.recordPrediction(prediction, metadata);

    return NextResponse.json({
      status: 'ok',
      recorded: result.recorded,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ML Monitoring API] Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

