import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../../lib/api-middleware';

/**
 * Advanced Analytics API
 * 
 * Provides advanced analytics functionality
 * 
 * Phase 3: Feature Store & Advanced Analytics Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const analyticsPath = path.join(process.cwd(), '../../../lib/mlops/advancedAnalytics');
    const { AdvancedAnalytics } = require(analyticsPath);
    const analytics = new AdvancedAnalytics();
    await analytics.initialize();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'status';

      if (operation === 'status') {
        return NextResponse.json({
          status: 'ok',
          message: 'Advanced analytics ready',
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'report') {
        const report = await analytics.generateReport();
        return NextResponse.json({
          status: 'ok',
          data: { report },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'dashboard') {
        const dashboard = await analytics.getDashboard();
        return NextResponse.json({
          status: 'ok',
          data: { dashboard },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Advanced analytics API ready',
        operations: ['status', 'report', 'dashboard'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'dashboard') {
        const dashboard = await analytics.getDashboard();
        return NextResponse.json({
          status: 'ok',
          data: { dashboard },
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
  return withProductionIntegration(handler)(req);
}
export async function POST(req: NextRequest) {
  return withProductionIntegration(handler)(req);
}

