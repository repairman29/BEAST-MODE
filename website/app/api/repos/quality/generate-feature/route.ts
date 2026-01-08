import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '../../../../../lib/github-token';

// Dynamic require for Node.js modules
// Use module loader for better production compatibility
import { loadModule } from '../../../../../lib/api-module-loader';

let featureGenerator: any;
let codebaseContextBuilder: any;

// Load modules with error handling and fallback
try {
  featureGenerator = loadModule('../../../../../lib/mlops/featureGenerator') || require('../../../../../lib/mlops/featureGenerator');
  codebaseContextBuilder = loadModule('../../../../../lib/mlops/codebaseContextBuilder') || require('../../../../../lib/mlops/codebaseContextBuilder');
} catch (error) {
  console.warn('[Feature Generation API] Module loading issue:', error);
  // Try direct require as fallback
  try {
    featureGenerator = require('../../../../../lib/mlops/featureGenerator');
    codebaseContextBuilder = require('../../../../../lib/mlops/codebaseContextBuilder');
  } catch (fallbackError) {
    console.error('[Feature Generation API] Failed to load modules:', fallbackError);
  }
}

if (!featureGenerator) {
  console.warn('[Feature Generation API] Feature generator module not available - may need to bundle for production');
}

/**
 * Feature/Application Generation API
 * 
 * Generates complete features or applications based on user requests and codebase context.
 * Uses quality insights to create code that matches existing patterns.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, featureRequest, files, useLLM = false, llmOptions = {}, llmProvider = 'openai', model } = body;
    
    // Get user ID for smart model selection
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository name is required (format: owner/repo)' },
        { status: 400 }
      );
    }
    
    if (!featureRequest) {
      return NextResponse.json(
        { error: 'Feature request is required' },
        { status: 400 }
      );
    }
    
    if (!featureGenerator) {
      return NextResponse.json(
        { error: 'Feature generator not available' },
        { status: 500 }
      );
    }
    
    // Determine if this is a custom model
    const isCustomModel = model?.startsWith('custom:');
    const customModelId: string | null = isCustomModel ? model : null;
    let requestedModel = model;

    // Auto-select model if not provided
    if (!requestedModel) {
      const { getSmartModelSelector } = loadModule('../../../../../lib/mlops/smartModelSelector') || require('../../../../../lib/mlops/smartModelSelector');
      const smartModelSelector = getSmartModelSelector();
      const selection = await smartModelSelector.selectModel(userId || '');
      requestedModel = selection.modelId;
      const effectiveCustomModelId = selection.type === 'custom' ? selection.modelId : null;
      if (effectiveCustomModelId) {
        // Update customModelId if auto-selected
        (customModelId as any) = effectiveCustomModelId;
      }
      console.log(`[Feature Gen API] Auto-selected model: ${requestedModel} (Reason: ${selection.message})`);
    }

    // Get user's API key if using LLM (provider models only)
    let userApiKey: string | null = null;
    if (useLLM && !customModelId) {
      try {
        if (userId) {
          // Use the proper decryption library
          const { getUserApiKey } = require('../../../../lib/api-keys-decrypt');
          
          // Determine provider from model
          const provider = requestedModel?.startsWith('anthropic:') ? 'anthropic' : 'openai';
          
          // Get and decrypt API key
          userApiKey = await getUserApiKey(userId, provider);
        }
      } catch (error) {
        console.warn('[Feature Generation API] Could not get user API key:', error);
      }
    }
    
    // Generate feature with model support
    const generateOptions = {
      useLLM: useLLM && (!!userApiKey || !!customModelId), // Use LLM if key or custom model available
      userApiKey: customModelId ? null : userApiKey, // Don't pass API key for custom models (router handles it)
      llmProvider,
      model: requestedModel, // Pass model to generator
      customModelId, // Pass custom model ID
      userId, // Pass user ID for model routing
      ...llmOptions,
    };
    
    const result = await featureGenerator.generateFeature(
      repo,
      featureRequest,
      files,
      generateOptions
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to generate feature', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      featureRequest,
      context: result.context,
      generatedFiles: result.generatedFiles.map((f: any) => ({
        fileName: f.fileName,
        actionType: f.actionType,
        language: f.language,
        estimatedImpact: f.estimatedImpact,
        codePreview: f.code.substring(0, 500) + '...', // Preview only
        fullCode: f.code, // Full code for download
      })),
      validation: result.validation,
      integrationInstructions: result.integrationInstructions,
      estimatedQualityImpact: result.estimatedQualityImpact,
      nextSteps: result.nextSteps,
      prompt: result.context?.generationPrompt || 'Not available',
    });
    
  } catch (error: any) {
    console.error('[Feature Generation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate feature', details: error.message },
      { status: 500 }
    );
  }
}

