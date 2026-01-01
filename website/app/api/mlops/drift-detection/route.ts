import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../../lib/api-middleware';

/**
 * Drift Detection API
 * 
 * Provides data drift detection functionality
 * 
 * Phase 3: MLOps Automation Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const modelMonitoringPath = path.join(process.cwd(), '../../../lib/mlops/modelMonitoring');
    const { ModelMonitoring } = require(modelMonitoringPath);
    const monitoring = new ModelMonitoring();
    await monitoring.initialize();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'status';

      if (operation === 'status') {
        return NextResponse.json({
          status: 'ok',
          message: 'Drift detection ready',
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'check') {
        const drift = await monitoring.detectDrift();
        return NextResponse.json({
          status: 'ok',
          data: { drift },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'dashboard') {
        const dashboard = monitoring.getDashboardData();
        return NextResponse.json({
          status: 'ok',
          data: { dashboard },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'health') {
        const health = monitoring.getHealthStatus();
        return NextResponse.json({
          status: 'ok',
          data: { health },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Drift detection API ready',
        operations: ['status', 'check', 'dashboard', 'health'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'record') {
        const { prediction, actual, latency, metadata } = body;
        await monitoring.recordPrediction(prediction, actual, latency, metadata);
        return NextResponse.json({
          status: 'ok',
          message: 'Prediction recorded',
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json(
        { error: `Unknown operation: ${operation}` },
        { status: 400 }
      );
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
  const wrappedHandler = await withProductionIntegration(handler);
  return wrappedHandler(req);
}
export async function POST(req: NextRequest) {
  const wrappedHandler = await withProductionIntegration(handler);
  return wrappedHandler(req);
}

