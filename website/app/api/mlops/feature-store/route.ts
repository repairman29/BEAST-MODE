import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../lib/api-middleware';

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
        const features = featureStore.getAllFeatures();
        return NextResponse.json({
          status: 'ok',
          data: { features },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'get') {
        const featureName = searchParams.get('featureName');
        if (!featureName) {
          return NextResponse.json(
            { error: 'featureName required' },
            { status: 400 }
          );
        }
        const feature = featureStore.getFeature(featureName);
        return NextResponse.json({
          status: 'ok',
          data: { feature },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Feature store API ready',
        operations: ['list', 'get'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'create') {
        const { featureName, featureData, metadata } = body;
        const created = await featureStore.createFeature(featureName, featureData, metadata);
        return NextResponse.json({
          status: 'ok',
          data: { feature: created },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'update') {
        const { featureName, featureData } = body;
        const updated = await featureStore.updateFeature(featureName, featureData);
        return NextResponse.json({
          status: 'ok',
          data: { feature: updated },
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

export const GET = withProductionIntegration(handler);
export const POST = withProductionIntegration(handler);

