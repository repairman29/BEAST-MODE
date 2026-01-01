import { NextRequest, NextResponse } from 'next/server';
import { withProductionIntegration } from '../../../lib/api-middleware';

/**
 * Model Registry API
 * 
 * Provides model registry and versioning functionality
 * 
 * Phase 3: Model Management Integration
 */

async function handler(req: NextRequest) {
  try {
    const path = require('path');
    const mlflowPath = path.join(process.cwd(), '../../../lib/mlops/mlflowService');
    const { getMLflowService } = require(mlflowPath);
    const mlflow = getMLflowService();

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const operation = searchParams.get('operation') || 'list';

      if (operation === 'list') {
        const models = await mlflow.listModels();
        return NextResponse.json({
          status: 'ok',
          data: { models },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'get') {
        const modelName = searchParams.get('modelName');
        if (!modelName) {
          return NextResponse.json(
            { error: 'modelName required' },
            { status: 400 }
          );
        }
        const model = await mlflow.getModel(modelName);
        return NextResponse.json({
          status: 'ok',
          data: { model },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'versions') {
        const modelName = searchParams.get('modelName');
        if (!modelName) {
          return NextResponse.json(
            { error: 'modelName required' },
            { status: 400 }
          );
        }
        const versions = await mlflow.getModelVersions(modelName);
        return NextResponse.json({
          status: 'ok',
          data: { versions },
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        status: 'ok',
        message: 'Model registry API ready',
        operations: ['list', 'get', 'versions'],
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { operation } = body;

      if (operation === 'register') {
        const { modelName, modelPath, metadata } = body;
        const registered = await mlflow.registerModel(modelName, modelPath, metadata);
        return NextResponse.json({
          status: 'ok',
          data: { model: registered },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'version') {
        const { modelName, modelPath, version } = body;
        const versioned = await mlflow.createModelVersion(modelName, modelPath, version);
        return NextResponse.json({
          status: 'ok',
          data: { version: versioned },
          timestamp: new Date().toISOString()
        });
      }

      if (operation === 'transition') {
        const { modelName, version, stage } = body;
        const transitioned = await mlflow.transitionModelVersionStage(modelName, version, stage);
        return NextResponse.json({
          status: 'ok',
          data: { transitioned },
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

