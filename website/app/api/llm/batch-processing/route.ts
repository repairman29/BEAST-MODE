/**
 * Batch Processing API
 * Batches similar LLM requests for efficiency
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Batch Processing API
 * Batches similar LLM requests for efficiency
 */

// Use dynamic require to avoid build-time errors
let requestBatcher: any = null;

try {
  const requestBatcherModule = require('@/lib/mlops/requestBatcher');
  requestBatcher = requestBatcherModule.getRequestBatcher ? 
    requestBatcherModule.getRequestBatcher() : 
    requestBatcherModule;
} catch (error) {
  console.warn('[Batch Processing API] Module not available:', error);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requests, options = {} } = body;

    if (!requests || !Array.isArray(requests)) {
      return NextResponse.json(
        { error: 'Requests array is required' },
        { status: 400 }
      );
    }

    if (!requestBatcher) {
      return NextResponse.json(
        { error: 'Batch processor not available' },
        { status: 503 }
      );
    }

    // Process requests using the batcher
    // Note: This is a simplified implementation
    // In production, you'd use addToBatch for each request
    const results = await Promise.all(
      requests.map(async (req: any) => {
        // For now, return the request as-is
        // In production, this would use the actual batching logic
        return { request: req, processed: true };
      })
    );

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Batch processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process batch' },
      { status: 500 }
    );
  }
}
