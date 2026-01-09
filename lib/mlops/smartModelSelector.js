/**
 * Smart Model Selector
 * 
 * Automatically selects the best model for users with zero configuration
 * - Auto-detects custom models
 * - Falls back to provider models
 * - Provides clear feedback
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('SmartModelSelector');
const contextAwareModelSelector = require('./contextAwareModelSelector');
const taskModelSelector = require('./taskModelSelector');
const qualityRouter = require('./qualityRouter');

class SmartModelSelector {
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
      const path = require('path');
      const fs = require('fs');
      
      // Load .env.local from website directory
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

      if (supabaseUrl && supabaseKey) {
        this.supabase = require('@supabase/supabase-js').createClient(
          supabaseUrl,
          supabaseKey
        );
        this.initialized = true;
        log.info('✅ Smart model selector initialized');
      } else {
        log.warn('⚠️  Supabase credentials not found');
        this.initialized = true; // Mark as initialized even without DB
      }
    } catch (error) {
      log.error('Failed to initialize smart model selector:', error.message);
      this.initialized = true; // Mark as initialized to prevent retries
    }
  }

  /**
   * Get user's best model (custom if available, otherwise provider default)
   */
  async getUserModel(userId) {
    await this.initialize();

    if (!userId || !this.supabase) {
      return this.getDefaultProviderModel();
    }

    try {
      // Get user's active custom models
      const { data: customModels, error } = await this.supabase
        .from('custom_models')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && customModels && customModels.length > 0) {
        const model = customModels[0];
        return {
          modelId: model.model_id,
          modelName: model.model_name,
          type: 'custom',
          reason: 'You have a custom model registered - using it automatically!',
          savings: '97% cost savings'
        };
      }
    } catch (error) {
      log.debug('Could not fetch custom models:', error.message);
    }

    // Fallback to provider model
    return this.getDefaultProviderModel();
  }

  /**
   * Get default provider model
   */
  getDefaultProviderModel() {
    return {
      modelId: 'openai:gpt-3.5-turbo',
      modelName: 'GPT-3.5 Turbo',
      type: 'provider',
      reason: 'Using default provider model',
      savings: null
    };
  }

  /**
   * Check if user can use provider models (paid tier only)
   */
  async canUseProviderModels(userId) {
    if (!userId) {
      return false; // No user = free tier
    }

    try {
      await this.initialize();
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
   * Get model selection with helpful message
   */
  async selectModel(userId, requestedModel = null, context = {}) {
    // If user explicitly requested a model, check if it's allowed
    if (requestedModel) {
      // Custom models are always allowed
      if (requestedModel.startsWith('custom:')) {
        return {
          modelId: requestedModel,
          type: 'custom',
          apiKey: null,
          message: 'Using your requested custom model'
        };
      }

      // Provider models require paid tier
      const canUseProvider = await this.canUseProviderModels(userId);
      if (!canUseProvider) {
        return {
          modelId: null,
          type: 'none',
          apiKey: null,
          message: 'Provider models are only available for paid tier users. Please upgrade or use a custom model.'
        };
      }

      // Paid tier users can use provider models
      const { getUserApiKeys } = require('../../website/lib/api-keys-decrypt');
      const userKeys = await getUserApiKeys(userId);
      const provider = requestedModel.split(':')[0];
      const apiKey = userKeys[provider] || null;

      return {
        modelId: requestedModel,
        type: 'provider',
        apiKey,
        message: `Using ${requestedModel} (provider model)`
      };
    }

    // Otherwise, auto-select best model
    await this.initialize();

    if (!userId || !this.supabase) {
      return {
        modelId: null,
        type: 'none',
        apiKey: null,
        message: 'No user ID provided'
      };
    }

    // Use context-aware or task-specific selection if context provided
    if (context.code && contextAwareModelSelector) {
      try {
        const contextSelection = await contextAwareModelSelector.selectModel(
          context.code,
          context.task || 'general',
          { userId }
        );
        if (contextSelection && contextSelection.modelId) {
          return {
            modelId: contextSelection.modelId,
            type: contextSelection.modelId.startsWith('custom:') ? 'custom' : 'provider',
            apiKey: null,
            message: `Context-aware selection: ${contextSelection.reason || 'optimized for your code'}`
          };
        }
      } catch (error) {
        log.debug('Context-aware selection failed, falling back:', error.message);
      }
    }

    if (context.task && taskModelSelector) {
      try {
        const taskSelection = await taskModelSelector.selectModel(
          context.task,
          { userId }
        );
        if (taskSelection && taskSelection.modelId) {
          return {
            modelId: taskSelection.modelId,
            type: taskSelection.modelId.startsWith('custom:') ? 'custom' : 'provider',
            apiKey: null,
            message: `Task-specific selection: ${taskSelection.reason || 'optimized for this task'}`
          };
        }
      } catch (error) {
        log.debug('Task-specific selection failed, falling back:', error.message);
      }
    }

    try {
      // Get user's active custom models
      const { data: customModels, error } = await this.supabase
        .from('custom_models')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && customModels && customModels.length > 0) {
        const model = customModels[0];
        return {
          modelId: model.model_id,
          type: 'custom',
          apiKey: null,
          message: 'Using your custom model automatically'
        };
      }
    } catch (error) {
      log.debug('Could not fetch custom models:', error.message);
    }

    // If no custom models, check if user can use provider models (paid tier only)
    const canUseProvider = await this.canUseProviderModels(userId);
    
    if (!canUseProvider) {
      return {
        modelId: null,
        type: 'none',
        apiKey: null,
        message: 'No custom models available. Provider models (OpenAI, Anthropic, etc.) are only available for paid tier users. Please upgrade your subscription or register a custom model.'
      };
    }

    // Paid tier users can use provider models
    // Try to get user's API keys for provider models
    const { getUserApiKeys } = require('../../website/lib/api-keys-decrypt');
    const userKeys = await getUserApiKeys(userId);
    
    if (userKeys.openai) {
      return {
        modelId: 'openai:gpt-3.5-turbo',
        type: 'provider',
        apiKey: userKeys.openai,
        message: 'Using OpenAI GPT-3.5 Turbo (provider model)'
      };
    }
    
    if (userKeys.anthropic) {
      return {
        modelId: 'anthropic:claude-3-haiku-20240307',
        type: 'provider',
        apiKey: userKeys.anthropic,
        message: 'Using Anthropic Claude 3 Haiku (provider model)'
      };
    }
    
    return {
      modelId: null,
      type: 'none',
      apiKey: null,
      message: 'No models available. Please register a custom model or add API keys.'
    };
  }

  /**
   * Get helpful message for model selection
   */
  getModelMessage(selection) {
    if (selection.type === 'custom') {
      return {
        message: `✨ Using your custom model: ${selection.modelName}`,
        submessage: `💰 ${selection.savings} vs provider models`,
        type: 'success'
      };
    } else {
      return {
        message: `Using ${selection.modelName}`,
        submessage: `💡 Tip: Register a custom model to save 97% on costs!`,
        type: 'info'
      };
    }
  }
}

// Singleton instance
let smartModelSelector = null;

function getSmartModelSelector() {
  if (!smartModelSelector) {
    smartModelSelector = new SmartModelSelector();
  }
  return smartModelSelector;
}

module.exports = {
  SmartModelSelector,
  getSmartModelSelector
};
