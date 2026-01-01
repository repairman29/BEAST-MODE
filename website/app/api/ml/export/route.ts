import { NextRequest, NextResponse } from 'next/server';
import { exportForBI } from '../../../../lib/api-middleware';
import { getPerformanceStats } from '../../../../lib/api-middleware';

/**
 * BI Export API
 * 
 * Exports performance data for BI tools
 * 
 * Phase 1, Week 3: Enterprise Unification & Security Enhancement
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type') || 'performance';

    // Get performance stats
    const stats = await getPerformanceStats();
    
    if (!stats) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Performance monitor not available',
        timestamp: new Date().toISOString()
      });
    }

    // Convert stats to exportable format
    let exportData: any[] = [];
    
    if (type === 'performance') {
      // Export performance metrics
      for (const [metricName, metricData] of Object.entries(stats.metrics)) {
        exportData.push({
          metric: metricName,
          count: (metricData as any)?.count || 0,
          avg: metricData.avg,
          min: metricData.min,
          max: metricData.max,
          timestamp: new Date().toISOString()
        });
      }
    } else if (type === 'alerts') {
      // Export alerts
      exportData = stats.alerts.active || [];
    }

    // Export for BI
    const exported = await exportForBI(exportData, format);

    if (!exported) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'BI integration not available',
        timestamp: new Date().toISOString()
      });
    }

    // Return exported data
    if (format === 'csv') {
      return new NextResponse(exported.data, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="beast-mode-${type}-${Date.now()}.csv"`
        }
      });
    } else if (format === 'json') {
      return NextResponse.json({
        status: 'ok',
        format,
        type,
        data: JSON.parse(exported.data),
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      format,
      type,
      data: exported.data,
      size: exported.size,
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



