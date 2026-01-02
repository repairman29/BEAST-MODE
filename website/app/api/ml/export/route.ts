import { NextRequest, NextResponse } from 'next/server';

// Optional imports - services may not be available
async function getExportServices() {
  try {
    // @ts-ignore - Dynamic import, module may not exist
    const middleware = await import(/* webpackIgnore: true */ '../../../../lib/api-middleware').catch(() => null);
    return {
      exportForBI: middleware?.exportForBI || null,
      getPerformanceStats: middleware?.getPerformanceStats || null
    };
  } catch {
    return {
      exportForBI: null,
      getPerformanceStats: null
    };
  }
}

/**
 * BI Export API
 * 
 * Exports performance data for BI tools
 * 
 * Phase 1, Week 3: Enterprise Unification & Security Enhancement
 */

export async function GET(request: NextRequest) {
  try {
    const services = await getExportServices();
    if (!services.getPerformanceStats) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Performance monitor not available',
        timestamp: new Date().toISOString()
      });
    }
    
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type') || 'performance';

    const stats = await services.getPerformanceStats();
    
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
    if (!services.exportForBI) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'BI integration not available',
        timestamp: new Date().toISOString()
      });
    }

    const exported = await services.exportForBI(exportData, format);

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



