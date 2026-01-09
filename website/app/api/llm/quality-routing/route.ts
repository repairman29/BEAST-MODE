/**
 * Quality-Based Routing API
 * Routes requests based on predicted quality
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Quality-Based Routing API
 */

// Use dynamic require to avoid build-time errors
let qualityRouter: any = null;

try {
  const routerModule = require('../../../../../lib/mlops/qualityRouter');
  if (routerModule.QualityRouter) {
    qualityRouter = new routerModule.QualityRouter();
  } else {
    qualityRouter = routerModule;
  }
} catch (error) {
  console.warn('[Quality Routing API] Module not available:', error);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { request: llmRequest, options = {} } = body;

    if (!llmRequest) {
      return NextResponse.json(
        { error: 'LLM request is required' },
        { status: 400 }
      );
    }

    if (!qualityRouter) {
      return NextResponse.json(
        { error: 'Quality router not available' },
        { status: 503 }
      );
    }

    const routing = await qualityRouter.routeByQuality(
      llmRequest,
      options.context || {}
    );

    return NextResponse.json({ routing });
  } catch (error: any) {
    console.error('Quality routing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to route request' },
      { status: 500 }
    );
  }
}
