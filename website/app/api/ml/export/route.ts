import { NextRequest, NextResponse } from 'next/server';
import { exportForBI, getPerformanceStats } from '../../../../lib/api-middleware';

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

    // Performance monitor not available
    if (!getPerformanceStats) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Performance monitor not available',
        timestamp: new Date().toISOString()
      });
    }

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
        const data = metricData as any;
        exportData.push({
          metric: metricName,
          count: data?.count || 0,
          avg: data?.avg || 0,
          min: data?.min || 0,
          max: data?.max || 0,
          timestamp: new Date().toISOString()
        });
      }
    } else if (type === 'alerts') {
      // Export alerts
      exportData = stats.alerts.active || [];
    }

    // BI export not available
    if (!exportForBI) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'BI integration not available',
        timestamp: new Date().toISOString()
      });
    }

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



