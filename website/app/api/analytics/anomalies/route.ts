import { NextRequest, NextResponse } from 'next/server';
import { loadModule } from '../../../../lib/api-module-loader';

/**
 * Anomaly Detection API
 */

let anomalyDetector: any;

try {
  const anomalyDetectorModule = loadModule('../../../../../lib/mlops/anomalyDetector') ||
                                 require('../../../../../lib/mlops/anomalyDetector');
  anomalyDetector = anomalyDetectorModule?.getAnomalyDetector
    ? anomalyDetectorModule.getAnomalyDetector()
    : anomalyDetectorModule;
} catch (error) {
  console.warn('[Anomalies API] Module not available:', error);
}

/**
 * GET /api/analytics/anomalies
 * Get detected anomalies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const metric = searchParams.get('metric');
    const severity = searchParams.get('severity');

    if (anomalyDetector && typeof anomalyDetector.getAnomalies === 'function') {
      const anomalies = anomalyDetector.getAnomalies(metric || null, timeRange, severity || null);
      const stats = anomalyDetector.getStats(timeRange);

      return NextResponse.json({
        success: true,
        anomalies,
        stats,
        timeRange
      });
    }

    return NextResponse.json({
      success: true,
      anomalies: [],
      stats: { total: 0, byMetric: {}, bySeverity: { critical: 0, high: 0, medium: 0 }, recent: [] },
      timeRange,
      note: 'Anomaly detector not available'
    });

  } catch (error: any) {
    console.error('[Anomalies API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get anomalies', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/anomalies
 * Check for anomalies in a metric
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metricName, value, metadata } = body;

    if (!metricName || value === undefined) {
      return NextResponse.json(
        { error: 'metricName and value are required' },
        { status: 400 }
      );
    }

    if (anomalyDetector && typeof anomalyDetector.detectAnomaly === 'function') {
      const anomaly = anomalyDetector.detectAnomaly(metricName, value, metadata);
      return NextResponse.json({
        success: true,
        anomaly,
        hasAnomaly: !!anomaly
      });
    }

    return NextResponse.json(
      { error: 'Anomaly detector not available' },
      { status: 503 }
    );

  } catch (error: any) {
    console.error('[Anomalies API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to detect anomaly', details: error.message },
      { status: 500 }
    );
  }
}
