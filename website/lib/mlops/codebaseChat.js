/**
 * Codebase Chat
 * 
 * Conversational interface for code generation and assistance.
 * Similar to Cursor's chat feature.
 */

const codebaseIndexer = require('./codebaseIndexer');
const llmCodeGenerator = require('./llmCodeGenerator');
const codebaseContextBuilder = require('./codebaseContextBuilder');

class CodebaseChat {
  constructor() {
    this.conversationHistory = new Map(); // sessionId -> [messages]
    this.contextCache = new Map(); // repo -> context
    this.supabase = null; // Lazy-loaded Supabase client
    this.dbInitialized = false; // Track if DB is initialized
    this.pendingSaves = new Map(); // Track pending saves to batch them
  }

  /**
   * Initialize Supabase client (lazy loading)
   */
  async getSupabase() {
    if (this.supabase) {
      return this.supabase;
    }

    try {
      const { getSupabaseClient } = require('../../website/lib/supabase');
      this.supabase = await getSupabaseClient();
      this.dbInitialized = true;
      return this.supabase;
    } catch (error) {
      console.warn('[Codebase Chat] Supabase not available, using in-memory only:', error.message);
      this.dbInitialized = false;
      return null;
    }
  }

  /**
   * Load session from database
   */
  async loadSessionFromDB(sessionId) {
    try {
      const supabase = await this.getSupabase();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('codebase_chat_sessions')
        .select('conversation_history, context_cache, repo, current_file')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found - that's okay
          return null;
        }
        throw error;
      }

      if (data) {
        // Restore conversation history
        if (data.conversation_history && Array.isArray(data.conversation_history)) {
          this.conversationHistory.set(sessionId, data.conversation_history);
        }

        // Restore context cache if available
        if (data.context_cache && data.repo) {
          this.contextCache.set(data.repo, data.context_cache);
        }

        return {
          history: data.conversation_history || [],
          contextCache: data.context_cache || {},
          repo: data.repo,
          currentFile: data.current_file,
        };
      }

      return null;
    } catch (error) {
      console.error('[Codebase Chat] Error loading session from DB:', error);
      return null;
    }
  }

  /**
   * Save session to database (debounced)
   */
  async saveSessionToDB(sessionId, context = {}) {
    try {
      const supabase = await this.getSupabase();
      if (!supabase) return; // DB not available, skip

      const history = this.conversationHistory.get(sessionId) || [];
      const { repo, currentFile, userId } = context;

      // Get context cache for this repo if available
      const contextCache = repo && this.contextCache.has(repo)
        ? this.contextCache.get(repo)
        : null;

      // Upsert session
      const { error } = await supabase
        .from('codebase_chat_sessions')
        .upsert({
          session_id: sessionId,
          user_id: userId || null,
          repo: repo || null,
          current_file: currentFile || null,
          conversation_history: history,
          context_cache: contextCache || {},
          last_activity: new Date().toISOString(),
        }, {
          onConflict: 'session_id',
        });

      if (error) {
        console.error('[Codebase Chat] Error saving session to DB:', error);
      }
    } catch (error) {
      console.error('[Codebase Chat] Error saving session to DB:', error);
      // Don't throw - DB errors shouldn't break chat functionality
    }
  }

  /**
   * Debounced save - batches saves to avoid too many DB writes
   */
  async debouncedSave(sessionId, context = {}) {
    // Clear existing timeout
    if (this.pendingSaves.has(sessionId)) {
      clearTimeout(this.pendingSaves.get(sessionId));
    }

    // Set new timeout (500ms debounce)
    const timeout = setTimeout(async () => {
      await this.saveSessionToDB(sessionId, context);
      this.pendingSaves.delete(sessionId);
    }, 500);

    this.pendingSaves.set(sessionId, timeout);
  }

  /**
   * Process chat message
   * @param {string} sessionId - Chat session ID
   * @param {string} message - User message
   * @param {Object} context - Chat context
   * @returns {Promise<Object>} Chat response
   */
  async processMessage(sessionId, message, context = {}) {
    const {
      repo,
      files = [],
      currentFile = null,
      userApiKey = null,
      useLLM = true,
      model = null, // Model ID (e.g., "custom:my-model" or "openai:gpt-4")
      customModelId = null, // Explicit custom model ID
      userId = '', // User ID for model routing
    } = context;

    try {
      // Get or create conversation history
      if (!this.conversationHistory.has(sessionId)) {
        // Try to load from database first
        const loaded = await this.loadSessionFromDB(sessionId);
        if (!loaded) {
          // No DB session found, create new
          this.conversationHistory.set(sessionId, []);
        }
      }
      const history = this.conversationHistory.get(sessionId);

      // Add user message to history
      history.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
      });

      // Build comprehensive context
      const chatContext = await this.buildChatContext(
        repo,
        files,
        currentFile,
        message,
        history
      );

      // Generate response
      let response;
      // Use LLM if explicitly requested OR if we have a custom model OR if we have an API key
      const shouldUseLLM = useLLM || customModelId || (model && model.startsWith('custom:')) || !!userApiKey;
      
      if (shouldUseLLM) {
        // Determine custom model ID from model parameter
        const effectiveCustomModelId = customModelId || (model?.startsWith('custom:') ? model : null);
        
        try {
          response = await this.generateLLMResponse(
            message,
            chatContext,
            history,
            userApiKey,
            effectiveCustomModelId,
            userId
          );
        } catch (error) {
          console.warn('[Codebase Chat] LLM generation failed, falling back to pattern:', error.message);
          response = await this.generatePatternResponse(
            message,
            chatContext,
            history
          );
        }
      } else {
        response = await this.generatePatternResponse(
          message,
          chatContext,
          history
        );
      }

      // Add assistant response to history
      history.push({
        role: 'assistant',
        content: response.text,
        code: response.code,
        timestamp: new Date(),
      });

      // Limit history size
      if (history.length > 20) {
        history.shift();
      }

      // Save to database (debounced)
      await this.debouncedSave(sessionId, {
        repo,
        currentFile,
        userId,
      });

      return {
        success: true,
        message: response.text,
        code: response.code,
        files: response.files || [],
        suggestions: response.suggestions || [],
        context: chatContext.summary,
      };
    } catch (error) {
      console.error('[Codebase Chat] Error:', error);
      return {
        success: false,
        error: error.message,
        message: 'I encountered an error. Please try again.',
      };
    }
  }

  /**
   * Build chat context
   */
  async buildChatContext(repo, files, currentFile, message, history) {
    const context = {
      repo,
      currentFile,
      codebase: null,
      relatedFiles: [],
      patterns: [],
      summary: {},
    };

    try {
      // Get codebase context if available
      if (repo) {
        // Check cache first
        if (this.contextCache.has(repo)) {
          const cached = this.contextCache.get(repo);
          context.codebase = cached;
        } else {
          // Build context using codebase context builder
          if (files && files.length > 0) {
            const builtContext = await codebaseContextBuilder.buildContext(
              repo,
              files,
              {},
              message
            );
            context.codebase = builtContext;
            this.contextCache.set(repo, builtContext);
          }
        }

        // Get related files from indexer
        if (currentFile) {
          const fileContext = codebaseIndexer.getFileContext(currentFile);
          if (fileContext) {
            context.relatedFiles = [
              ...fileContext.dependencies.slice(0, 5),
              ...fileContext.dependents.slice(0, 5),
            ];
          }
        }

        // Extract patterns
        context.patterns = this.extractPatterns(context.relatedFiles);
      }

      // Build summary
      context.summary = {
        repo,
        fileCount: files?.length || 0,
        currentFile: currentFile || 'none',
        conversationLength: history.length,
        hasCodebaseContext: !!context.codebase,
      };
    } catch (error) {
      console.warn('[Codebase Chat] Could not build full context:', error);
    }

    return context;
  }

  /**
   * Extract patterns from files
   */
  extractPatterns(files) {
    const patterns = [];

    for (const file of files) {
      if (!file) continue;

      for (const func of file.functions || []) {
        patterns.push({
          type: 'function',
          name: func.name,
          file: file.path,
        });
      }

      for (const cls of file.classes || []) {
        patterns.push({
          type: 'class',
          name: cls.name,
          file: file.path,
        });
      }
    }

    return patterns;
  }

  /**
   * Generate LLM response
   * Supports custom models via modelRouter
   */
  async generateLLMResponse(message, context, history, userApiKey, customModelId = null, userId = '') {
    const prompt = this.buildChatPrompt(message, context, history);

    try {
      // Use model router if custom model is specified
      if (customModelId) {
        const response = await llmCodeGenerator.generateWithModelRouter(prompt, {
          model: customModelId,
          temperature: 0.7,
          maxTokens: 2000,
          userId,
          customModelId,
          userApiKey,
        });

        // Parse response for code blocks
        const parsed = this.parseChatResponse(response, context);
        return parsed;
      }

      // Fallback to provider models ONLY if user is in paid tier
      if (userApiKey) {
        // Check if user can use provider models (paid tier only)
        try {
          const { getSupabaseClient } = require('../../website/lib/supabase');
          const supabase = await getSupabaseClient();
          const PAID_TIERS = ['developer', 'team', 'enterprise'];

          let canUseProvider = false;
          if (userId) {
            // Get user's subscription
            const { data: subscription } = await supabase
              .from('beast_mode_subscriptions')
              .select('tier, status, current_period_end')
              .eq('user_id', userId)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (subscription && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())) {
              canUseProvider = PAID_TIERS.includes(subscription.tier);
            }

            // Check API key tier as fallback
            if (!canUseProvider) {
              const { data: apiKey } = await supabase
                .from('beast_mode_api_keys')
                .select('tier')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              if (apiKey && PAID_TIERS.includes(apiKey.tier)) {
                canUseProvider = true;
              }
            }
          }

          if (!canUseProvider) {
            throw new Error('Provider models are only available for paid tier users. Free tier users must use custom models.');
          }

          // Use model router for provider models (supports OpenAI, Anthropic, etc.)
          const modelToUse = model || 'openai:gpt-3.5-turbo';
          try {
            const response = await llmCodeGenerator.generateWithModelRouter(prompt, {
              model: modelToUse,
              temperature: 0.7,
              maxTokens: 2000,
              userId,
              userApiKey,
            });

            // Parse response for code blocks
            const parsed = this.parseChatResponse(response, context);
            return parsed;
          } catch (error) {
            console.error('[Codebase Chat] Model router error:', error);
            // Fall back to direct OpenAI if model router fails
            if (llmCodeGenerator.initializeOpenAI(userApiKey)) {
              const response = await llmCodeGenerator.generateWithOpenAI(prompt, {
                ...context,
                model: 'gpt-3.5-turbo',
                temperature: 0.7,
                maxTokens: 2000,
                userId,
                userApiKey,
              });

              const parsed = this.parseChatResponse(response, context);
              return parsed;
            }
          }
        } catch (error) {
          console.error('[Codebase Chat] Provider model access denied:', error.message);
          throw new Error('Provider models are only available for paid tier users. Please upgrade or use a custom model.');
        }
      }

      throw new Error('No LLM available (need API key or custom model)');
    } catch (error) {
      console.error('[Codebase Chat] LLM error:', error);
      throw error;
    }
  }

  /**
   * Build chat prompt
   */
  buildChatPrompt(message, context, history) {
    let prompt = `You are an expert coding assistant helping with a codebase.

Current Repository: ${context.repo || 'Unknown'}
Current File: ${context.currentFile || 'None'}

`;

    // Add codebase context
    if (context.codebase) {
      prompt += `Codebase Context:
- Primary Language: ${context.codebase.techStack?.languages?.[0] || 'Unknown'}
- Frameworks: ${context.codebase.techStack?.frameworks?.join(', ') || 'None'}
- File Count: ${context.codebase.fileAnalysis?.fileCount || 0}
- Quality Score: ${((context.codebase.fileAnalysis?.averageScore || 0) * 100).toFixed(1)}%

`;
    }

    // Add conversation history (last 5 messages)
    if (history.length > 2) {
      prompt += `Recent Conversation:
`;
      const recentHistory = history.slice(-6, -1); // Last 5 messages (excluding current)
      for (const msg of recentHistory) {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      }
      prompt += `\n`;
    }

    // Add related files context
    if (context.relatedFiles.length > 0) {
      prompt += `Related Files:
${context.relatedFiles.slice(0, 5).map(f => `- ${f.path}`).join('\n')}

`;
    }

    // Add patterns
    if (context.patterns.length > 0) {
      prompt += `Common Patterns in Codebase:
${context.patterns.slice(0, 10).map(p => `- ${p.name} (${p.type})`).join('\n')}

`;
    }

    prompt += `User Request: ${message}

Please provide a helpful response. If the user is asking for code, generate it matching the codebase style and patterns. Include explanations when helpful.`;

    return prompt;
  }

  /**
   * Parse chat response for code blocks
   */
  parseChatResponse(response, context) {
    const result = {
      text: response,
      code: null,
      files: [],
      suggestions: [],
    };

    // Extract code blocks
    const codeBlockPattern = /```(?:(\w+):)?([^\n]+)\n([\s\S]*?)```/g;
    let match;
    const codeBlocks = [];

    while ((match = codeBlockPattern.exec(response)) !== null) {
      const language = match[1] || 'javascript';
      const fileName = match[2].trim() || `generated-${codeBlocks.length + 1}.${this.getExtension(language)}`;
      const code = match[3].trim();

      codeBlocks.push({
        fileName,
        code,
        language,
      });
    }

    if (codeBlocks.length > 0) {
      result.code = codeBlocks[0].code; // Primary code block
      result.files = codeBlocks;
    }

    // Extract suggestions from text
    const suggestionPattern = /(?:suggestion|recommendation|consider):\s*(.+)/gi;
    const suggestions = [];
    let suggestionMatch;
    while ((suggestionMatch = suggestionPattern.exec(response)) !== null) {
      suggestions.push(suggestionMatch[1].trim());
    }
    result.suggestions = suggestions;

    return result;
  }

  /**
   * Generate pattern-based response (fallback)
   */
  async generatePatternResponse(message, context, history) {
    const lowerMessage = message.toLowerCase();

    // Pattern matching for common requests
    if (lowerMessage.includes('test') || lowerMessage.includes('testing')) {
      return {
        text: 'I can help you generate tests. Would you like me to create test files for your current code?',
        code: null,
        suggestions: [
          'Generate unit tests',
          'Generate integration tests',
          'Add test coverage',
        ],
      };
    }

    if (lowerMessage.includes('refactor') || lowerMessage.includes('improve')) {
      return {
        text: 'I can help you refactor code. I can analyze your codebase and suggest improvements.',
        code: null,
        suggestions: [
          'Analyze code quality',
          'Suggest refactoring opportunities',
          'Generate improved code',
        ],
      };
    }

    if (lowerMessage.includes('bug') || lowerMessage.includes('error') || lowerMessage.includes('fix')) {
      return {
        text: 'I can help you find and fix bugs. I can analyze your code for common issues.',
        code: null,
        suggestions: [
          'Scan for bugs',
          'Analyze error logs',
          'Suggest fixes',
        ],
      };
    }

    // Default response
    return {
      text: 'I can help you with code generation, refactoring, testing, and more. What would you like to do?',
      code: null,
      suggestions: [
        'Generate code',
        'Refactor code',
        'Write tests',
        'Fix bugs',
        'Improve quality',
      ],
    };
  }

  /**
   * Get file extension from language
   */
  getExtension(language) {
    const extMap = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'rust': 'rs',
      'go': 'go',
    };
    return extMap[language.toLowerCase()] || 'js';
  }

  /**
   * Clear conversation history
   */
  async clearHistory(sessionId) {
    this.conversationHistory.delete(sessionId);
    
    // Also delete from database
    try {
      const supabase = await this.getSupabase();
      if (supabase) {
        await supabase
          .from('codebase_chat_sessions')
          .delete()
          .eq('session_id', sessionId);
      }
    } catch (error) {
      console.error('[Codebase Chat] Error clearing session from DB:', error);
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(sessionId) {
    // If not in memory, try to load from DB
    if (!this.conversationHistory.has(sessionId)) {
      await this.loadSessionFromDB(sessionId);
    }
    return this.conversationHistory.get(sessionId) || [];
  }

  /**
   * Add message to history (used by API route)
   */
  async addToHistory(sessionId, message) {
    if (!this.conversationHistory.has(sessionId)) {
      // Try to load from DB first
      await this.loadSessionFromDB(sessionId);
      if (!this.conversationHistory.has(sessionId)) {
        this.conversationHistory.set(sessionId, []);
      }
    }

    const history = this.conversationHistory.get(sessionId);
    history.push({
      ...message,
      timestamp: message.timestamp || new Date(),
    });

    // Limit history size
    if (history.length > 20) {
      history.shift();
    }

    // Save to database (debounced)
    await this.debouncedSave(sessionId);
  }
}

module.exports = new CodebaseChat();

