import { NextRequest, NextResponse } from 'next/server';
import { optimizeQuery, getDatabaseOptimizerService } from '../../../../lib/api-middleware';

/**
 * Database Optimization API
 * 
 * Optimizes database queries and provides recommendations
 * 
 * Phase 1, Week 3: Enterprise Unification & Security Enhancement
 */

export async function POST(request: NextRequest) {
  try {
    const { query, params = [] } = await request.json();

    if (!query) {
      return NextResponse.json(
        {
          error: 'Query is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const optimized = await optimizeQuery(query, params);

    return NextResponse.json({
      status: 'ok',
      original: query,
      optimized: optimized.query,
      analysis: optimized.analysis,
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

export async function GET(request: NextRequest) {
  try {
    const optimizer = await getDatabaseOptimizerService();
    
    if (!optimizer) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Database optimizer not available',
        timestamp: new Date().toISOString()
      });
    }

    const stats = optimizer.getQueryStatistics();
    const recommendations = optimizer.getIndexRecommendations();

    return NextResponse.json({
      status: 'ok',
      statistics: stats,
      recommendations,
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



