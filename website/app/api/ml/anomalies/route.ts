import { NextRequest, NextResponse } from 'next/server';
import { detectAnomalies, getPerformanceMonitor } from '../../../../lib/api-middleware';

/**
 * Anomalies API
 * 
 * Returns anomaly detection results
 * 
 * Phase 1, Week 2: High-Impact Services Integration
 */

async function getPerformanceMonitor() {
  try {
    const path = require('path');
    const monitorPath = path.join(process.cwd(), '../lib/scale/performanceMonitor');
    const { getPerformanceMonitor } = require(monitorPath);
    return getPerformanceMonitor();
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    const detector = await getAnomalyDetectorService();
    
    if (!detector) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Anomaly detector not available',
        timestamp: new Date().toISOString()
      });
    }

    // Get detection history
    const history = detector.getDetectionHistory(limit);
    
    if (history.length === 0) {
      return NextResponse.json({
        status: 'insufficient_data',
        message: 'Not enough data for anomaly detection',
        timestamp: new Date().toISOString()
      });
    }

    // Extract recent anomalies from history
    const recentAnomalies = history
      .flatMap(h => h.data || [])
      .slice(0, limit);

    return NextResponse.json({
      status: 'ok',
      endpoint,
      anomalies: recentAnomalies,
      total: recentAnomalies.length,
      history: history.slice(0, limit),
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

