import { NextRequest, NextResponse } from 'next/server';

/**
 * Feature Store API
 * 
 * Provides feature store functionality
 * 
 * Phase 3: Feature Store & Advanced Analytics Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const featureStorePath = path.join(process.cwd(), '../../../lib/mlops/featureStore');
    const { FeatureStore } = require(featureStorePath);
    const featureStore = new FeatureStore();
    await featureStore.initialize();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'list';

      if (operation === 'list') {
        const stats = featureStore.getStats();
        return NextResponse.json({
          status: 'ok',
          data: { stats },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'get') {
        const featureName = searchParams.get('featureName');
        const version = searchParams.get('version') || 'latest';
        if (!featureName) {
          return NextResponse.json(
            { error: 'featureName required' },
            { status: 400 }
          );
        }
        const feature = await featureStore.retrieve(featureName, version);
        return NextResponse.json({
          status: 'ok',
          data: { feature },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'versions') {
        const featureName = searchParams.get('featureName');
        if (!featureName) {
          return NextResponse.json(
            { error: 'featureName required' },
            { status: 400 }
          );
        }
        const versions = await featureStore.getVersions(featureName);
        return NextResponse.json({
          status: 'ok',
          data: { versions },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Feature store API ready',
        operations: ['list', 'get', 'versions'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'store') {
        const { featureName, features, metadata } = body;
        const stored = await featureStore.store(featureName, features, metadata);
        return NextResponse.json({
          status: 'ok',
          data: { stored },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'search') {
        const { query } = body;
        const results = await featureStore.search(query || {});
        return NextResponse.json({
          status: 'ok',
          data: { results },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'delete') {
        const { featureName, version } = body;
        const deleted = await featureStore.delete(featureName, version);
        return NextResponse.json({
          status: 'ok',
          data: { deleted },
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

let withProductionIntegration: any = null;
try {
  /* webpackIgnore: true */
  const middleware = require(`../../../../lib/api-middleware`);
  withProductionIntegration = middleware.withProductionIntegration;
} catch (error) {
  // Middleware not available
}

export async function GET(req: NextRequest) {
    try {
    } catch (error) {
      // Fall through to direct handler
    }
  }
}

export async function POST(req: NextRequest) {
  if (withProductionIntegration) {
    try {
      const wrappedHandler = withProductionIntegration(handler);
      return wrappedHandler(req);
    } catch (error) {
      // Fall through to direct handler
    }
  }
  return handler(req);
}

