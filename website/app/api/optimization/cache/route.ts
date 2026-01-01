import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../../lib/api-middleware';

/**
 * Cache Optimization API
 * 
 * Provides cache optimization functionality
 * 
 * Phase 4: Performance Optimization
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const cachePath = path.join(process.cwd(), '../../../lib/scale/multiLevelCache');
    const { getMultiLevelCache } = require(cachePath);
    const cache = getMultiLevelCache();
    await cache.initialize();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'status';

      if (operation === 'status') {
        const stats = cache.getStats();
        return NextResponse.json({
          status: 'ok',
          data: { stats },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'get') {
        const key = searchParams.get('key');
        if (!key) {
          return NextResponse.json(
            { error: 'key required' },
            { status: 400 }
          );
        }
        const value = await cache.get(key);
        return NextResponse.json({
          status: 'ok',
          data: { value },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Cache optimization API ready',
        operations: ['status', 'get'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'set') {
        const { key, value, ttl } = body;
        await cache.set(key, value, ttl);
        return NextResponse.json({
          status: 'ok',
          message: 'Value cached',
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'clear') {
        const { pattern } = body;
        await cache.clear(pattern);
        return NextResponse.json({
          status: 'ok',
          message: 'Cache cleared',
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json(
        { error: `Unknown operation: ${operation}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
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

export async function GET(req: NextRequest) {
  return withProductionIntegration(handler)(req);
}
export async function POST(req: NextRequest) {
  return withProductionIntegration(handler)(req);
}

