/**
 * Model Router
 * Routes requests to appropriate models (provider or custom)
 */

// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}
const { getCustomModelMonitoring } = require('./customModelMonitoring');
const crypto = require('crypto');
const { LLMCache } = require('./llmCache');
const { getMultiTierCache } = require('./multiTierCache');
const log = createLogger('ModelRouter');

class ModelRouter {
  constructor() {
    this.supabase = null;
    this.initialized = false;
    // Use multi-tier cache if available, fallback to single-tier
    try {
      this.cache = getMultiTierCache({
        l1Enabled: true,
        l2Enabled: true, // Redis (graceful degradation if not available)
        l3Enabled: true, // Database (graceful degradation if not available)
        l1Ttl: 3600000, // 1 hour
        l2Ttl: 7200000, // 2 hours
        l3Ttl: 86400000, // 24 hours
        semanticSimilarity: true
      });
      log.info('✅ Multi-tier cache initialized');
    } catch (error) {
      log.warn('⚠️  Multi-tier cache failed, using single-tier:', error.message);
      this.cache = new LLMCache({ enabled: true, ttl: 3600000 }); // Fallback
    }
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
      
      // If no API key in custom model, try to get from user_api_keys
      if (!apiKey && userId) {
        try {
          // For OpenAI-compatible endpoints, try to get API key
          if (data.provider === 'openai-compatible') {
            // Check for 'together' provider first (Together AI)
            let keyData = null;
            if (data.endpoint_url && data.endpoint_url.includes('together')) {
              const { data: togetherKey } = await this.supabase
                .from('user_api_keys')
                .select('encrypted_key')
                .eq('user_id', userId)
                .eq('provider', 'together')
                .eq('is_active', true)
                .single();
              keyData = togetherKey;
            }
            
            // Fallback to 'openai' provider
            if (!keyData) {
              const { data: openaiKey } = await this.supabase
                .from('user_api_keys')
                .select('encrypted_key')
                .eq('user_id', userId)
                .eq('provider', 'openai')
                .eq('is_active', true)
                .single();
              keyData = openaiKey;
            }
            
            if (keyData && keyData.encrypted_key) {
              // Decrypt using the same method as api-keys-decrypt.ts
              const parts = keyData.encrypted_key.split(':');
              if (parts.length === 3) {
                const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 
                                     process.env.ENCRYPTION_KEY || 
                                     'default_key_change_in_production';
                const key = crypto.createHash('sha256').update(encryptionKey).digest();
                const iv = Buffer.from(parts[0], 'hex');
                const authTag = Buffer.from(parts[1], 'hex');
                const encrypted = Buffer.from(parts[2], 'hex');
                
                const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
                decipher.setAuthTag(authTag);
                let decrypted = decipher.update(encrypted);
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                apiKey = decrypted.toString('utf8');
              }
            }
          }
        } catch (error) {
          log.debug('Failed to get API key from user_api_keys:', error.message);
        }
      }

      // Parse config if it's a string
      let config = data.config || {};
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch (e) {
          log.warn('Failed to parse config JSON, using as-is');
        }
      }

      return {
        id: data.id,
        modelId: data.model_id,
        modelName: data.model_name,
        endpointUrl: data.endpoint_url,
        provider: data.provider,
        apiKey,
        headers: data.headers || {},
        config: config
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
    if (!model.apiKey) {
      log.warn(`Custom model ${modelId} has no API key - request will likely fail`);
    } else {
      if (model.provider === 'openai-compatible') {
        requestConfig.headers['Authorization'] = `Bearer ${model.apiKey}`;
      } else if (model.provider === 'anthropic-compatible') {
        requestConfig.headers['x-api-key'] = model.apiKey;
      }
      log.debug(`Using API key for custom model ${modelId} (length: ${model.apiKey.length})`);
    }

    // Format request based on provider
    if (model.provider === 'openai-compatible') {
      requestConfig.url = model.endpointUrl.endsWith('/chat/completions') 
        ? model.endpointUrl 
        : `${model.endpointUrl}/chat/completions`;
      
      // Use model from config if available, otherwise use modelId
      const modelName = model.config?.model || model.modelId.replace('custom:', '');
      
      requestConfig.data = {
        model: modelName,
        messages,
        temperature: temperature || model.config?.temperature || 0.7,
        max_tokens: maxTokens || model.config?.max_tokens || 4000,
        stream: stream || false
      };
    } else if (model.provider === 'anthropic-compatible') {
      requestConfig.url = model.endpointUrl.endsWith('/messages')
        ? model.endpointUrl
        : `${model.endpointUrl}/messages`;
      
      // Use model from config if available, otherwise use modelId
      const modelName = model.config?.model || model.modelId.replace('custom:', '');
      
      requestConfig.data = {
        model: modelName,
        max_tokens: maxTokens || model.config?.max_tokens || 4000,
        temperature: temperature || model.config?.temperature || 0.7,
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
    let error = null;
    
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
    } catch (err) {
      // Track failed request (IMPORTANT: Track before throwing)
      error = err;
      const latency = Date.now() - startTime;
      try {
        const monitoring = getCustomModelMonitoring();
        monitoring.recordRequest(modelId, model.endpointUrl, latency, false, error, null);
      } catch (monError) {
        // Non-critical
        log.debug('Monitoring failed (non-critical):', monError.message);
      }
      
      // Enhanced error messages with actionable tips
      
      // Enhanced error messages with context and actionable tips
      let errorMessage = `Custom model request failed: ${error.message}`;
      let actionableTips = [];
      
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          errorMessage = `Custom model authentication failed for ${modelId}`;
          actionableTips = [
            'Check your API key in the custom model configuration',
            'Verify the API key is valid and not expired',
            'Ensure the API key has the correct permissions'
          ];
        } else if (status === 404) {
          errorMessage = `Custom model endpoint not found: ${model.endpointUrl}`;
          actionableTips = [
            'Verify the endpoint URL is correct',
            'Check if the endpoint is accessible',
            'Ensure the endpoint path is correct (e.g., /v1/chat/completions)'
          ];
        } else if (status >= 500) {
          errorMessage = `Custom model server error (${status})`;
          actionableTips = [
            'The model endpoint is experiencing issues',
            'Try again in a few moments',
            'Check the model endpoint status'
          ];
        } else {
          errorMessage = `Custom model error (${status}): ${error.response.data?.error?.message || error.message}`;
        }
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to custom model endpoint: ${model.endpointUrl}`;
        actionableTips = [
          'Verify the endpoint URL is correct',
          'Check if the endpoint is running',
          'Ensure network connectivity to the endpoint'
        ];
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = `Custom model request timed out after ${requestConfig.timeout || 30000}ms`;
        actionableTips = [
          'The endpoint took too long to respond',
          'Check if the model endpoint is overloaded',
          'Consider increasing the timeout or optimizing the model'
        ];
      }
      
      // Create enhanced error with context
      const enhancedError = new Error(errorMessage);
      enhancedError.modelId = modelId;
      enhancedError.endpoint = model.endpointUrl;
      enhancedError.statusCode = error.response?.status;
      enhancedError.actionableTips = actionableTips;
      enhancedError.originalError = error.message;
      
      log.error(`Failed to call custom model ${modelId}:`, errorMessage);
      if (actionableTips.length > 0) {
        log.info(`Actionable tips: ${actionableTips.join('; ')}`);
      }
      
      throw enhancedError;
    }
  }

  /**
   * Check if user can use provider models (paid tier only)
   */
  async canUseProviderModels(userId) {
    if (!userId) {
      return false; // No user = free tier
    }

    try {
      if (!this.initialized) await this.initialize();
      if (!this.supabase) {
        return false; // No DB = free tier
      }

      const PAID_TIERS = ['developer', 'team', 'enterprise'];

      // Get user's subscription
      const { data: subscription } = await this.supabase
        .from('beast_mode_subscriptions')
        .select('tier, status, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Check if subscription is active and not expired
      if (subscription) {
        if (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date()) {
          return PAID_TIERS.includes(subscription.tier);
        }
      }

      // Check API key tier as fallback
      const { data: apiKey } = await this.supabase
        .from('beast_mode_api_keys')
        .select('tier')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (apiKey && PAID_TIERS.includes(apiKey.tier)) {
        return true;
      }

      return false; // Free tier
    } catch (error) {
      log.debug('Error checking tier (defaulting to free):', error.message);
      return false; // On error, default to free (most restrictive)
    }
  }

  /**
   * Route to provider model (OpenAI, Anthropic, etc.)
   * Only allowed for paid tier users
   */
  async routeToProvider(modelId, request, userId) {
    // Check if user can use provider models (paid tier only)
    const canUse = await this.canUseProviderModels(userId);
    if (!canUse) {
      throw new Error('Provider models (OpenAI, Anthropic, etc.) are only available for paid tier users. Please upgrade or use a custom model.');
    }

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
   * Track request in monitoring (success or failure)
   */
  trackRequest(modelId, request, latency, success, error, usage, fromCache, endpoint = null) {
    try {
      const monitoring = getCustomModelMonitoring();
      
      // Extract endpoint for custom models
      if (!endpoint && modelId.startsWith('custom:')) {
        // For custom models, we'll get endpoint from the model config
        // For now, use modelId as endpoint identifier
        endpoint = modelId;
      } else if (!endpoint) {
        endpoint = modelId; // Provider model identifier
      }
      
      monitoring.recordRequest(
        modelId,
        endpoint,
        latency,
        success,
        error,
        usage
      );
      
      // Also track cache hits separately
      if (fromCache) {
        log.debug(`Cache hit tracked for ${modelId}`);
      }
    } catch (monError) {
      // Non-critical - don't fail request if monitoring fails
      log.debug('Monitoring failed (non-critical):', monError.message);
    }
  }

  /**
   * Route request to appropriate model
   */
  async route(modelId, request, userId) {
    if (!modelId) {
      throw new Error('Model ID is required');
    }

    const startTime = Date.now();
    let success = false;
    let error = null;
    let result = null;
    let usage = null;
    let fromCache = false;

    try {
    // Check cache first (if enabled and not streaming)
    if (this.cache && !request.stream) {
      const cacheKey = this.cache.generateKey({ ...request, model: modelId });
      const cached = await this.cache.get({ ...request, model: modelId });
      if (cached) {
        log.debug(`Cache hit for model ${modelId}`);
        fromCache = true;
        const latency = Date.now() - startTime;
        // Track cache hit
        this.trackRequest(modelId, request, latency, true, null, null, true);
        return cached;
      }
    }

      // Check if it's a custom model
      if (modelId.startsWith('custom:')) {
        result = await this.routeToCustomModel(modelId, request, userId);
        // routeToCustomModel already tracks, but we'll track at top level too for consistency
        usage = result?.usage || null;
      } else {
        // Check if user can use provider models (paid tier only)
        const canUseProvider = await this.canUseProviderModels(userId);
        if (!canUseProvider) {
          const latency = Date.now() - startTime;
          error = new Error('Provider models (OpenAI, Anthropic, etc.) are only available for paid tier users. Free tier users must use custom models. Please upgrade your subscription or register a custom model.');
          // Track failed request BEFORE throwing
          this.trackRequest(modelId, request, latency, false, error, null, false);
          throw error;
        }

        // Route to provider model
        result = await this.routeToProvider(modelId, request, userId);
        usage = result?.usage || null;
      }

      success = true;

      // Cache result if enabled and not streaming
      if (this.cache && result && !request.stream) {
        await this.cache.set({ ...request, model: modelId }, result);
      }

      // Track successful request (if not already tracked by routeToCustomModel)
      if (!modelId.startsWith('custom:')) {
        const latency = Date.now() - startTime;
        this.trackRequest(modelId, request, latency, true, null, usage, false);
      }

      return result;
    } catch (err) {
      error = err;
      success = false;
      
      // Track failed request (CRITICAL - before throwing)
      const latency = Date.now() - startTime;
      this.trackRequest(modelId, request, latency, false, error, null, false);
      
      throw err;
    }
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
