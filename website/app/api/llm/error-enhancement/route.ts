/**
 * Error Message Enhancement API
 * Enhances error messages with helpful context
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Error Message Enhancement API
 */

// Use dynamic require to avoid build-time errors
let errorMessageEnhancer: any = null;

try {
  const enhancerModule = require('../../../../../lib/utils/errorMessageEnhancer');
  if (enhancerModule.ErrorMessageEnhancer) {
    errorMessageEnhancer = new enhancerModule.ErrorMessageEnhancer();
  } else {
    errorMessageEnhancer = enhancerModule;
  }
} catch (error) {
  console.warn('[Error Enhancement API] Module not available:', error);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, context = {}, code, options = {} } = body;

    if (!error) {
      return NextResponse.json(
        { error: 'Error message is required' },
        { status: 400 }
      );
    }

    if (!errorMessageEnhancer) {
      return NextResponse.json(
        { error: 'Error enhancer not available' },
        { status: 503 }
      );
    }

    // enhanceError takes (error, context) - merge code and options into context
    const enhancedContext = {
      ...context,
      code,
      ...options
    };

    const enhanced = await errorMessageEnhancer.enhanceError(
      error,
      enhancedContext
    );

    return NextResponse.json({ enhanced });
  } catch (error: any) {
    console.error('Error enhancement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enhance error message' },
      { status: 500 }
    );
  }
}
