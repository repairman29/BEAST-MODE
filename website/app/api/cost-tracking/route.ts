import { NextRequest, NextResponse } from 'next/server';

/**
 * Cost Tracking API
 * 
 * Provides cost tracking and savings analytics
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const costTrackingPath = path.join(process.cwd(), '../../../shared-utils/cost-tracking');
    const { getCostTrackingService } = require(costTrackingPath);
    const costTracking = getCostTrackingService();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const period = searchParams.get('period') || 'all';
      const report = searchParams.get('report') || 'summary';

      if (report === 'summary') {
        const summary = costTracking.getCostSummary(period);
        return NextResponse.json({
          status: 'ok',
          data: summary,
          timestamp: new Date().toISOString()
        });
      }

      if (report === 'savings') {
        const savings = costTracking.getSavingsReport();
        return NextResponse.json({
          status: 'ok',
          data: savings,
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Cost tracking API ready',
        reports: ['summary', 'savings'],
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

