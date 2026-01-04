/**
 * Feedback Service Health Check
 * Check if feedback service is running and healthy
 * 
 * Phase 2: Enhanced with feedback monitoring
 */

import { NextRequest, NextResponse } from 'next/server';

// Optional import - module may not exist
async function getFeedbackMonitor() {
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const module = await import(/* webpackIgnore: true */ '../../../../../../lib/mlops/feedbackMonitor').catch(() => null);
    return module?.getFeedbackMonitor || null;
  } catch {
    return null;
  }
}

async function getFeedbackCollector() {
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const module = await import(/* webpackIgnore: true */ '../../../../../../lib/mlops/feedbackCollector').catch(() => null);
    return module?.getFeedbackCollector || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to use feedback monitor first (Phase 2 enhancement)
    const getMonitor = await getFeedbackMonitor();
    if (getMonitor) {
      try {
        const monitor = await getMonitor();
        const health = await monitor.checkHealth();
        
        return NextResponse.json({
          success: true,
          health: {
            status: health.status,
            message: health.message,
            healthy: health.healthy,
            feedbackRate: health.stats?.feedbackRate || 0,
            targetRate: monitor.alertThreshold || 0.05,
            totalPredictions: health.stats?.totalPredictions || 0,
            predictionsWithFeedback: health.stats?.predictionsWithFeedback || 0,
            serviceBreakdown: health.stats?.serviceBreakdown || {},
            serviceIssues: health.serviceIssues || [],
            timestamp: new Date().toISOString()
          }
        });
      } catch (error: any) {
        console.warn('[Feedback Health] Monitor failed, falling back to collector:', error.message);
        // Fall through to collector
      }
    }

    // Fallback to feedback collector
    const collector = await getFeedbackCollector();
    if (!collector) {
      return NextResponse.json({
        success: false,
        health: {
          status: 'unavailable',
          message: 'Feedback collector not available',
          timestamp: new Date().toISOString()
        }
      }, { status: 503 });
    }
    const stats = await collector.getFeedbackStats();

    const health = {
      status: 'healthy',
      feedbackRate: stats.feedbackRate,
      targetRate: 0.05,
      totalPredictions: stats.totalPredictions,
      withActuals: stats.withActuals,
      withoutActuals: stats.withoutActuals,
      health: stats.feedbackRate >= 0.05 ? 'healthy' : 
              stats.feedbackRate >= 0.01 ? 'needs-attention' : 'critical',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      health: health
    });
  } catch (error: any) {
    console.error('[Feedback Health] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        health: {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
