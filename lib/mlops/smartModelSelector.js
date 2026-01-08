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
   * Get model selection with helpful message
   */
  async selectModel(userId, requestedModel = null) {
    // If user explicitly requested a model, use it
    if (requestedModel) {
      return {
        modelId: requestedModel,
        modelName: requestedModel,
        type: requestedModel.startsWith('custom:') ? 'custom' : 'provider',
        reason: 'Using your requested model',
        savings: requestedModel.startsWith('custom:') ? '97% cost savings' : null
      };
    }

    // Otherwise, auto-select best model
    return await this.getUserModel(userId);
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
