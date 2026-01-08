import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * Custom Models API
 * 
 * Register and manage custom AI models (self-hosted, OpenAI-compatible, etc.)
 */

// Encryption key (should be from env in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

/**
 * Encrypt API key
 */
function encryptApiKey(apiKey: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf8'), iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encrypted,
    iv: iv.toString('hex')
  };
}

/**
 * Register a custom model
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      modelName,
      modelId,
      endpointUrl,
      provider = 'openai-compatible',
      apiKey,
      headers = {},
      config = {},
      description,
      isPublic = false
    } = body;

    // Validation
    if (!modelName || !modelId || !endpointUrl) {
      return NextResponse.json(
        { error: 'modelName, modelId, and endpointUrl are required' },
        { status: 400 }
      );
    }

    // Validate modelId format
    if (!modelId.startsWith('custom:')) {
      return NextResponse.json(
        { error: 'modelId must start with "custom:" prefix' },
        { status: 400 }
      );
    }

    // Get user ID
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await getSupabaseClientOrNull();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Encrypt API key if provided
    let apiKeyEncrypted = null;
    let apiKeyIv = null;
    if (apiKey) {
      const encrypted = encryptApiKey(apiKey);
      apiKeyEncrypted = encrypted.encrypted;
      apiKeyIv = encrypted.iv;
    }

    // Insert custom model
    const { data, error } = await supabase
      .from('custom_models')
      .insert({
        user_id: userId,
        model_name: modelName,
        model_id: modelId,
        endpoint_url: endpointUrl,
        provider,
        api_key_encrypted: apiKeyEncrypted,
        api_key_iv: apiKeyIv,
        headers,
        config,
        description,
        is_public: isPublic,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('[Custom Models API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to register custom model', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      model: {
        id: data.id,
        modelName: data.model_name,
        modelId: data.model_id,
        endpointUrl: data.endpoint_url,
        provider: data.provider,
        isActive: data.is_active,
        isPublic: data.is_public,
        description: data.description,
        createdAt: data.created_at
      }
    });

  } catch (error: any) {
    console.error('[Custom Models API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to register custom model', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get custom models for current user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('github_oauth_user_id')?.value;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await getSupabaseClientOrNull();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includePublic = searchParams.get('includePublic') === 'true';

    // Get user's models and public models
    let query = supabase
      .from('custom_models')
      .select('*')
      .eq('is_active', true);

    if (includePublic) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Custom Models API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch custom models', details: error.message },
        { status: 500 }
      );
    }

    // Return models without sensitive data
    const models = data.map(model => ({
      id: model.id,
      modelName: model.model_name,
      modelId: model.model_id,
      endpointUrl: model.endpoint_url,
      provider: model.provider,
      isActive: model.is_active,
      isPublic: model.is_public,
      description: model.description,
      config: model.config,
      headers: model.headers ? Object.keys(model.headers).length > 0 : false, // Don't expose actual headers
      createdAt: model.created_at,
      updatedAt: model.updated_at
    }));

    return NextResponse.json({
      success: true,
      models
    });

  } catch (error: any) {
    console.error('[Custom Models API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom models', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Update a custom model
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, ...updates } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required' },
        { status: 400 }
      );
    }

    const userId = request.cookies.get('github_oauth_user_id')?.value;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await getSupabaseClientOrNull();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Encrypt API key if provided
    const updateData: any = {};
    if (updates.modelName) updateData.model_name = updates.modelName;
    if (updates.endpointUrl) updateData.endpoint_url = updates.endpointUrl;
    if (updates.provider) updateData.provider = updates.provider;
    if (updates.headers) updateData.headers = updates.headers;
    if (updates.config) updateData.config = updates.config;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    if (updates.apiKey) {
      const encrypted = encryptApiKey(updates.apiKey);
      updateData.api_key_encrypted = encrypted.encrypted;
      updateData.api_key_iv = encrypted.iv;
    }

    const { data, error } = await supabase
      .from('custom_models')
      .update(updateData)
      .eq('user_id', userId)
      .eq('model_id', modelId)
      .select()
      .single();

    if (error) {
      console.error('[Custom Models API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update custom model', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      model: {
        id: data.id,
        modelName: data.model_name,
        modelId: data.model_id,
        endpointUrl: data.endpoint_url,
        provider: data.provider,
        isActive: data.is_active,
        isPublic: data.is_public,
        description: data.description,
        updatedAt: data.updated_at
      }
    });

  } catch (error: any) {
    console.error('[Custom Models API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update custom model', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Delete a custom model
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required' },
        { status: 400 }
      );
    }

    const userId = request.cookies.get('github_oauth_user_id')?.value;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await getSupabaseClientOrNull();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from('custom_models')
      .delete()
      .eq('user_id', userId)
      .eq('model_id', modelId);

    if (error) {
      console.error('[Custom Models API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to delete custom model', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Custom model deleted successfully'
    });

  } catch (error: any) {
    console.error('[Custom Models API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom model', details: error.message },
      { status: 500 }
    );
  }
}
