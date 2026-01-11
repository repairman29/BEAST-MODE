/**
 * Error Message Enhancement API
 * Enhances error messages with helpful context
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Error Message Enhancement API
 */

// Use dynamic require to avoid build-time errors
// Skip this module during build to avoid webpack issues with axios dependencies
let errorMessageEnhancer: any = null;

if (typeof window === 'undefined') {
  // Only load on server-side, skip during build
  try {
    // Use dynamic import path to prevent webpack from analyzing
    const path = require('path');
    const enhancerPath = path.join(process.cwd(), '../../lib/utils/errorMessageEnhancer');
    const enhancerModule = require(enhancerPath);
    if (enhancerModule.ErrorMessageEnhancer) {
      errorMessageEnhancer = new enhancerModule.ErrorMessageEnhancer();
    } else {
      errorMessageEnhancer = enhancerModule;
    }
  } catch (error) {
    // Module not available, will return error in POST handler
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!errorMessageEnhancer) {
      return NextResponse.json(
        { error: 'Error enhancement service not available' },
        { status: 503 }
      );
    }
    
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
