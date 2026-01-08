import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '@/lib/supabase';

/**
 * List Models API
 * 
 * Get list of available models (both provider models and custom models)
 */

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    const supabase = await getSupabaseClientOrNull();

    // Standard provider models
    const providerModels = [
      {
        modelId: 'openai:gpt-4',
        modelName: 'GPT-4',
        provider: 'openai',
        type: 'provider'
      },
      {
        modelId: 'openai:gpt-4-turbo',
        modelName: 'GPT-4 Turbo',
        provider: 'openai',
        type: 'provider'
      },
      {
        modelId: 'openai:gpt-3.5-turbo',
        modelName: 'GPT-3.5 Turbo',
        provider: 'openai',
        type: 'provider'
      },
      {
        modelId: 'anthropic:claude-3-opus',
        modelName: 'Claude 3 Opus',
        provider: 'anthropic',
        type: 'provider'
      },
      {
        modelId: 'anthropic:claude-3-sonnet',
        modelName: 'Claude 3 Sonnet',
        provider: 'anthropic',
        type: 'provider'
      },
      {
        modelId: 'anthropic:claude-3-haiku',
        modelName: 'Claude 3 Haiku',
        provider: 'anthropic',
        type: 'provider'
      }
    ];

    // Get custom models if user is authenticated
    let customModels: any[] = [];
    if (userId && supabase) {
      const { data, error } = await supabase
        .from('custom_models')
        .select('*')
        .eq('is_active', true)
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        customModels = data.map(model => ({
          modelId: model.model_id,
          modelName: model.model_name,
          provider: model.provider,
          type: 'custom',
          endpointUrl: model.endpoint_url,
          description: model.description,
          isPublic: model.is_public,
          config: model.config
        }));
      }
    }

    return NextResponse.json({
      success: true,
      models: [
        ...providerModels,
        ...customModels
      ],
      total: providerModels.length + customModels.length,
      custom: customModels.length
    });

  } catch (error: any) {
    console.error('[List Models API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to list models', details: error.message },
      { status: 500 }
    );
  }
}
