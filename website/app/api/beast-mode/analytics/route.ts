import { NextRequest, NextResponse } from 'next/server';

/**
 * BEAST MODE Analytics API
 * 
 * Privacy-first analytics endpoint that stores anonymized user engagement data
 */

declare global {
  var analyticsData: {
    events: any[];
    journeys: any[];
    lastFlush: number;
  } | undefined;
}

if (!global.analyticsData) {
  global.analyticsData = {
    events: [],
    journeys: [],
    lastFlush: Date.now()
  };
}

/**
 * POST /api/beast-mode/analytics
 * Store analytics events and journey data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, journey } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid request: events array required' },
        { status: 400 }
      );
    }

    // Store events (in production, this would go to a database)
    global.analyticsData.events.push(...events);

    // Store journey if provided
    if (journey) {
      global.analyticsData.journeys.push(journey);
    }

    // Keep only last 10,000 events (in production, use database)
    if (global.analyticsData.events.length > 10000) {
      global.analyticsData.events = global.analyticsData.events.slice(-10000);
    }

    // Keep only last 1,000 journeys
    if (global.analyticsData.journeys.length > 1000) {
      global.analyticsData.journeys = global.analyticsData.journeys.slice(-1000);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to store analytics data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/beast-mode/analytics
 * Get aggregated analytics data (for admin/dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const now = Date.now();
    
    // Calculate time range
    let startTime = now;
    switch (timeRange) {
      case '1d':
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90d':
        startTime = now - 90 * 24 * 60 * 60 * 1000;
        break;
    }

    const events = global.analyticsData?.events || [];
    const journeys = global.analyticsData?.journeys || [];

    // Filter by time range
    const filteredEvents = events.filter((e: any) => e.timestamp >= startTime);
    const filteredJourneys = journeys.filter((j: any) => j.startTime >= startTime);

    // Aggregate metrics
    const metrics = {
      totalEvents: filteredEvents.length,
      totalSessions: filteredJourneys.length,
      uniqueUsers: new Set(filteredEvents.map((e: any) => e.userId).filter(Boolean)).size,
      
      // Feature usage
      featureUsage: {} as Record<string, number>,
      
      // Tab views
      tabViews: {} as Record<string, number>,
      
      // Actions
      scans: filteredEvents.filter((e: any) => e.action === 'scan-complete').length,
      fixes: filteredEvents.filter((e: any) => e.action === 'fix-applied').length,
      missions: filteredEvents.filter((e: any) => e.action === 'mission-complete').length,
      pluginInstalls: filteredEvents.filter((e: any) => e.action === 'plugin-install').length,
      
      // Engagement
      avgSessionDuration: 0,
      avgActionsPerSession: 0,
      avgTabsPerSession: 0,
      
      // Conversion funnel
      visitors: filteredEvents.filter((e: any) => e.action === 'view' && e.label === '/').length,
      users: filteredEvents.filter((e: any) => e.action === 'start').length,
    };

    // Calculate feature usage
    filteredEvents.forEach((event: any) => {
      if (event.category === 'feature') {
        metrics.featureUsage[event.action] = (metrics.featureUsage[event.action] || 0) + 1;
      }
      if (event.category === 'navigation' && event.action === 'view') {
        metrics.tabViews[event.label || 'unknown'] = (metrics.tabViews[event.label || 'unknown'] || 0) + 1;
      }
    });

    // Calculate engagement metrics
    if (filteredJourneys.length > 0) {
      const totalDuration = filteredJourneys.reduce((sum: number, j: any) => sum + (j.duration || 0), 0);
      const totalEvents = filteredJourneys.reduce((sum: number, j: any) => sum + (j.events?.length || 0), 0);
      const totalTabs = filteredJourneys.reduce((sum: number, j: any) => sum + (j.tabsVisited?.length || 0), 0);

      metrics.avgSessionDuration = Math.round(totalDuration / filteredJourneys.length);
      metrics.avgActionsPerSession = Math.round((totalEvents / filteredJourneys.length) * 10) / 10;
      metrics.avgTabsPerSession = Math.round((totalTabs / filteredJourneys.length) * 10) / 10;
    }

    return NextResponse.json({
      timeRange,
      metrics,
      events: filteredEvents.slice(-100), // Last 100 events
      journeys: filteredJourneys.slice(-50) // Last 50 journeys
    });
  } catch (error: any) {
    console.error('Analytics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

