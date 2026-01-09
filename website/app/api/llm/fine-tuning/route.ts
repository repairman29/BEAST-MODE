/**
 * Model Fine-Tuning API
 * Collects training data and prepares for fine-tuning
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Model Fine-Tuning API
 */

// Use dynamic require to avoid build-time errors
let modelFineTuner: any = null;

try {
  const fineTunerModule = require('../../../../../lib/mlops/modelFineTuner');
  if (fineTunerModule.ModelFineTuner) {
    modelFineTuner = new fineTunerModule.ModelFineTuner();
  } else {
    modelFineTuner = fineTunerModule;
  }
} catch (error) {
  console.warn('[Fine-Tuning API] Module not available:', error);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, options = {} } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (collect, prepare, or train)' },
        { status: 400 }
      );
    }

    if (!modelFineTuner) {
      return NextResponse.json(
        { error: 'Model fine-tuner not available' },
        { status: 503 }
      );
    }

    let result;
    switch (action) {
      case 'collect':
        result = await modelFineTuner.collectTrainingData(options.repoPath || '', options);
        break;
      case 'prepare':
        result = await modelFineTuner.prepareTrainingData(options);
        break;
      case 'train':
        result = await modelFineTuner.fineTuneModel(options);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: collect, prepare, or train' },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Fine-tuning error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process fine-tuning request' },
      { status: 500 }
    );
  }
}
