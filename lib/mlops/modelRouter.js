/**
 * Model Router
 * Routes requests to appropriate models (provider or custom)
 */

const { createLogger } = require('../utils/logger');
const { getCustomModelMonitoring } = require('./customModelMonitoring');
const log = createLogger('ModelRouter');

class ModelRouter {
  constructor() {
    this.supabase = null;
    this.initialized = false;
  }

  /**
   * Initialize Supabase connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load .env.local from website directory
      const path = require('path');
      const fs = require('fs');
      
      try {
        const envPath = path.join(__dirname, '../../website/.env.local');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          envContent.split('\n').forEach(line => {
            const match = line.match(/^([^#=]+)=(.*)$/);
            if (match) {
              const key = match[1].trim();
              const value = match[2].trim().replace(/^["']|["']$/g, '');
              if (!process.env[key]) {
                process.env[key] = value;
              }
            }
          });
        }
      } catch (error) {
        // Ignore
      }

      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || 
                         process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                         process.env.SUPABASE_ANON_KEY ||
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        log.warn('⚠️  Supabase credentials not found');
        this.supabase = null;
        this.initialized = true;
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.initialized = true;
      log.info('✅ Model router initialized');
    } catch (error) {
      log.error('Failed to initialize model router:', error.message);
      this.supabase = null;
      this.initialized = true;
    }
  }

  /**
   * Decrypt API key
   */
  decryptApiKey(encrypted, iv) {
    if (!encrypted || !iv) return null;

    try {
      const crypto = require('crypto');
      const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(encryptionKey.slice(0, 32), 'utf8'),
        Buffer.from(iv, 'hex')
      );
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      log.error('Failed to decrypt API key:', error);
      return null;
    }
  }

  /**
   * Get custom model configuration
   */
  async getCustomModel(modelId, userId) {
    if (!this.initialized) await this.initialize();
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('custom_models')
        .select('*')
        .eq('model_id', modelId)
        .eq('is_active', true)
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .single();

      if (error || !data) {
        return null;
      }

      // Decrypt API key if present
      let apiKey = null;
      if (data.api_key_encrypted && data.api_key_iv) {
        apiKey = this.decryptApiKey(data.api_key_encrypted, data.api_key_iv);
      }

      return {
        id: data.id,
        modelId: data.model_id,
        modelName: data.model_name,
        endpointUrl: data.endpoint_url,
        provider: data.provider,
        apiKey,
        headers: data.headers || {},
        config: data.config || {}
      };
    } catch (error) {
      log.error('Failed to get custom model:', error);
      return null;
    }
  }

  /**
   * Route to custom model
   */
  async routeToCustomModel(modelId, request, userId) {
    const model = await this.getCustomModel(modelId, userId);
    if (!model) {
      throw new Error(`Custom model not found: ${modelId}`);
    }

    const axios = require('axios');
    const { messages, temperature, maxTokens, stream } = request;

    // Prepare request based on provider type
    let requestConfig = {
      url: model.endpointUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...model.headers
      },
      data: {}
    };

    // Add API key to headers if present
    if (model.apiKey) {
      if (model.provider === 'openai-compatible') {
        requestConfig.headers['Authorization'] = `Bearer ${model.apiKey}`;
      } else if (model.provider === 'anthropic-compatible') {
        requestConfig.headers['x-api-key'] = model.apiKey;
      }
    }

    // Format request based on provider
    if (model.provider === 'openai-compatible') {
      requestConfig.url = model.endpointUrl.endsWith('/chat/completions') 
        ? model.endpointUrl 
        : `${model.endpointUrl}/chat/completions`;
      requestConfig.data = {
        model: model.modelId.replace('custom:', ''),
        messages,
        temperature: temperature || model.config.temperature || 0.7,
        max_tokens: maxTokens || model.config.max_tokens || 4000,
        stream: stream || false
      };
    } else if (model.provider === 'anthropic-compatible') {
      requestConfig.url = model.endpointUrl.endsWith('/messages')
        ? model.endpointUrl
        : `${model.endpointUrl}/messages`;
      requestConfig.data = {
        model: model.modelId.replace('custom:', ''),
        max_tokens: maxTokens || model.config.max_tokens || 4000,
        temperature: temperature || model.config.temperature || 0.7,
        messages
      };
    } else {
      // Custom provider - pass through as-is
      requestConfig.data = {
        ...request,
        model: model.modelId
      };
    }

    const startTime = Date.now();
    let success = false;
    let usage = null;
    
    try {
      const response = await axios(requestConfig);
      success = true;
      
      // Parse response based on provider
      let result;
      if (model.provider === 'openai-compatible') {
        result = {
          content: response.data.choices[0]?.message?.content || '',
          model: response.data.model || model.modelId,
          usage: response.data.usage
        };
        usage = response.data.usage;
      } else if (model.provider === 'anthropic-compatible') {
        result = {
          content: response.data.content[0]?.text || '',
          model: response.data.model || model.modelId,
          usage: response.data.usage
        };
        usage = response.data.usage;
      } else {
        // Custom provider - return as-is
        result = response.data;
        usage = response.data.usage || null;
      }
      
      // Track successful request
      const latency = Date.now() - startTime;
      try {
        const monitoring = getCustomModelMonitoring();
        monitoring.recordRequest(modelId, model.endpointUrl, latency, true, null, usage);
      } catch (monError) {
        // Non-critical - don't fail request if monitoring fails
        log.debug('Monitoring failed (non-critical):', monError.message);
      }
      
      return result;
    } catch (error) {
      // Track failed request
      const latency = Date.now() - startTime;
      try {
        const monitoring = getCustomModelMonitoring();
        monitoring.recordRequest(modelId, model.endpointUrl, latency, false, error, null);
      } catch (monError) {
        // Non-critical
        log.debug('Monitoring failed (non-critical):', monError.message);
      }
      
      log.error(`Failed to call custom model ${modelId}:`, error.message);
      throw new Error(`Custom model request failed: ${error.message}`);
    }
  }

  /**
   * Route to provider model (OpenAI, Anthropic, etc.)
   */
  async routeToProvider(modelId, request, userId) {
    // Extract provider and model from modelId (e.g., "openai:gpt-4")
    const [provider, model] = modelId.split(':');
    
    if (provider === 'openai') {
      return this.routeToOpenAI(model, request, userId);
    } else if (provider === 'anthropic') {
      return this.routeToAnthropic(model, request, userId);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Route to OpenAI
   */
  async routeToOpenAI(model, request, userId) {
    // Get user's OpenAI API key
    if (!this.initialized) await this.initialize();
    if (!this.supabase) {
      throw new Error('Database not available');
    }

    const { data } = await this.supabase
      .from('user_api_keys')
      .select('decrypted_key')
      .eq('user_id', userId)
      .eq('provider', 'openai')
      .eq('is_active', true)
      .single();

    if (!data?.decrypted_key) {
      throw new Error('OpenAI API key not found');
    }

    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: data.decrypted_key });

      const response = await openai.chat.completions.create({
        model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 4000
      });

      return {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: response.usage
      };
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('OpenAI SDK not installed. Install with: npm install openai');
      }
      throw error;
    }
  }

  /**
   * Route to Anthropic
   */
  async routeToAnthropic(model, request, userId) {
    // Get user's Anthropic API key
    if (!this.initialized) await this.initialize();
    if (!this.supabase) {
      throw new Error('Database not available');
    }

    const { data } = await this.supabase
      .from('user_api_keys')
      .select('decrypted_key')
      .eq('user_id', userId)
      .eq('provider', 'anthropic')
      .eq('is_active', true)
      .single();

    if (!data?.decrypted_key) {
      throw new Error('Anthropic API key not found');
    }

    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: data.decrypted_key });

      const response = await anthropic.messages.create({
        model,
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature || 0.7,
        messages: request.messages
      });

      return {
        content: response.content[0]?.text || '',
        model: response.model,
        usage: response.usage
      };
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('Anthropic SDK not installed. Install with: npm install @anthropic-ai/sdk');
      }
      throw error;
    }
  }

  /**
   * Route request to appropriate model
   */
  async route(modelId, request, userId) {
    if (!modelId) {
      throw new Error('Model ID is required');
    }

    // Check if it's a custom model
    if (modelId.startsWith('custom:')) {
      return this.routeToCustomModel(modelId, request, userId);
    }

    // Route to provider model
    return this.routeToProvider(modelId, request, userId);
  }
}

// Singleton instance
let modelRouter = null;

function getModelRouter() {
  if (!modelRouter) {
    modelRouter = new ModelRouter();
  }
  return modelRouter;
}

module.exports = {
  ModelRouter,
  getModelRouter
};
