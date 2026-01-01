import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../lib/api-middleware';

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
        const reportType = searchParams.get('reportType') || 'summary';
        const report = await analytics.generateReport(reportType);
        return NextResponse.json({
          status: 'ok',
          data: { report },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Advanced analytics API ready',
        operations: ['status', 'report'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'analyze') {
        const { data, analysisType } = body;
        const analysis = await analytics.analyzeData(data, analysisType);
        return NextResponse.json({
          status: 'ok',
          data: { analysis },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'insights') {
        const { timeRange, filters } = body;
        const insights = await analytics.getInsights(timeRange, filters);
        return NextResponse.json({
          status: 'ok',
          data: { insights },
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

export const GET = withProductionIntegration(handler);
export const POST = withProductionIntegration(handler);

