import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations } from "../../../../lib/api-middleware';

/**
 * Recommendations API
 * 
 * Provides personalized recommendations
 * 
 * Phase 2, Week 2: Self-Learning & Recommendation Engine Integration
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'anonymous';
    const strategy = searchParams.get('strategy') || 'hybrid';
    const limit = parseInt(searchParams.get('limit') || '10');

    const context: any = {};
    searchParams.forEach((value, key) => {
      if (key !== 'userId' && key !== 'strategy' && key !== 'limit') {
        context[key] = value;
      }
    });

    const recommendations = await getRecommendations(userId, context);

    if (!recommendations) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Recommendation engine not available',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      userId,
      strategy,
      recommendations: recommendations.recommendations.slice(0, limit),
      count: recommendations.count,
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

export async function POST(request: NextRequest) {
  try {
    const { userId, context = {}, strategy = 'hybrid', limit = 10 } = await request.json();

    if (!userId) {
      return NextResponse.json(
        {
          error: 'userId is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const recommendations = await getRecommendations(userId, context);

    if (!recommendations) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'Recommendation engine not available',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      status: 'ok',
      userId,
      strategy,
      recommendations: recommendations.recommendations.slice(0, limit),
      count: recommendations.count,
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



