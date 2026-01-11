/**
 * LLM Code Generator
 * 
 * Handles LLM API calls for code generation.
 * Supports OpenAI, Anthropic, and custom models via modelRouter.
 */

const path = require('path');

// Factory function to create LLMCodeGenerator with proper module resolution
// This allows us to pass the mlopsPath at runtime instead of relying on relative requires
function createLLMCodeGenerator(mlopsPath) {
  const modelRouterPath = path.join(mlopsPath, 'modelRouter.js');
  const knowledgeRAGPath = path.join(mlopsPath, 'knowledgeRAG.js');
  
  const { getModelRouter } = require(modelRouterPath);
  const { getKnowledgeRAG } = require(knowledgeRAGPath);
  
  // Return the class with dependencies injected
  return { getModelRouter, getKnowledgeRAG };
}

// Don't load dependencies at module load time - only when factory is called
// This prevents Next.js from trying to resolve relative requires at build time
let getModelRouter, getKnowledgeRAG;

class LLMCodeGenerator {
  constructor(options = {}) {
    this.openai = null;
    this.anthropic = null;
    this.modelRouter = null;
    // Allow injection of dependencies
    this.getModelRouter = options.getModelRouter;
    this.getKnowledgeRAG = options.getKnowledgeRAG;
  }

  /**
   * Initialize model router
   */
  async initializeModelRouter() {
    if (!this.modelRouter) {
      this.modelRouter = getModelRouter();
      await this.modelRouter.initialize();
    }
    return this.modelRouter;
  }

  /**
   * Initialize OpenAI client
   */
  initializeOpenAI(apiKey) {
    try {
      // Try to load OpenAI SDK
      const OpenAI = require('openai');
      this.openai = new OpenAI({ apiKey });
      return true;
    } catch (error) {
      console.warn('[LLM Code Generator] OpenAI SDK not available:', error.message);
      return false;
    }
  }

  /**
   * Initialize Anthropic client
   */
  initializeAnthropic(apiKey) {
    try {
      // Try to load Anthropic SDK
      const Anthropic = require('@anthropic-ai/sdk');
      this.anthropic = new Anthropic({ apiKey });
      return true;
    } catch (error) {
      console.warn('[LLM Code Generator] Anthropic SDK not available:', error.message);
      return false;
    }
  }

  /**
   * Generate code using model router (supports custom models and providers)
   * Now enhanced with Knowledge RAG for context-aware generation
   */
  async generateWithModelRouter(prompt, options = {}) {
    const {
      model = 'openai:gpt-4', // Default to OpenAI, but can be "custom:my-model"
      temperature = 0.7,
      maxTokens = 4000,
      systemPrompt = 'You are an expert software developer. Generate production-ready code that follows best practices, includes error handling, tests, and documentation. Match the codebase style and patterns exactly.',
      userId = '',
      customModelId = null,
      userApiKey = null,
      useKnowledgeRAG = true, // Enable RAG by default
      codebaseContext = '',
    } = options;

    await this.initializeModelRouter();

    // Enhance prompt with knowledge if RAG is enabled
    let enhancedPrompt = prompt;
    let enhancedSystemPrompt = systemPrompt;
    
    if (useKnowledgeRAG) {
      try {
        // Use injected getKnowledgeRAG
        if (!this.getKnowledgeRAG) {
          throw new Error('getKnowledgeRAG not available');
        }
        const rag = this.getKnowledgeRAG();
        
        // Get relevant knowledge for the prompt
        const knowledge = await rag.getRelevantKnowledge(prompt, 3);
        
        if (knowledge.length > 0) {
          // Build knowledge context
          const knowledgeContext = knowledge.map(k => 
            `**${k.title}**: ${k.content}`
          ).join('\n\n');
          
          // Enhance system prompt with knowledge
          enhancedSystemPrompt = `${systemPrompt}\n\nApply these principles:\n${knowledgeContext}`;
          
          // Enhance user prompt with codebase context if available
          if (codebaseContext) {
            enhancedPrompt = `${prompt}\n\nCodebase Context:\n${codebaseContext}`;
          }
        }
      } catch (error) {
        console.warn('[LLM Code Generator] RAG enhancement failed, continuing without knowledge:', error.message);
        // Continue without RAG if it fails
      }
    }

    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      { role: 'user', content: enhancedPrompt },
    ];

    try {
      const response = await this.modelRouter.route(
        customModelId || model,
        {
          messages,
          temperature,
          maxTokens,
        },
        userId
      );

      return response.content || '';
    } catch (error) {
      console.error('[LLM Code Generator] Model router error:', error);
      throw error;
    }
  }

  /**
   * Generate code using OpenAI (legacy method - use generateWithModelRouter instead)
   */
  async generateWithOpenAI(prompt, options = {}) {
    const {
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 4000,
      systemPrompt = 'You are an expert software developer. Generate production-ready code that follows best practices, includes error handling, tests, and documentation. Match the codebase style and patterns exactly.',
      userId = '',
      customModelId = null,
      userApiKey = null,
    } = options;

    // If custom model is specified, use model router
    if (customModelId || model.startsWith('custom:')) {
      return this.generateWithModelRouter(prompt, {
        model: customModelId || model,
        temperature,
        maxTokens,
        systemPrompt,
        userId,
        customModelId,
        userApiKey,
      });
    }

    // Otherwise, use direct OpenAI call (legacy)
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('[LLM Code Generator] OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Generate code using Anthropic
   */
  async generateWithAnthropic(prompt, options = {}) {
    const {
      model = 'claude-3-opus-20240229',
      temperature = 0.7,
      maxTokens = 4000,
      systemPrompt = 'You are an expert software developer. Generate production-ready code that follows best practices, includes error handling, tests, and documentation. Match the codebase style and patterns exactly.',
    } = options;

    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    try {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt },
        ],
      });

      return response.content[0]?.text || '';
    } catch (error) {
      console.error('[LLM Code Generator] Anthropic API error:', error);
      throw error;
    }
  }

  /**
   * Parse generated code into file structure
   */
  parseGeneratedCode(generatedCode, context) {
    const files = [];
    
    // Try to extract file blocks (common in LLM outputs)
    // Pattern: ```language:filename or ```filename or ```language
    const filePattern = /```(?:(\w+):)?([^\n]+)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = filePattern.exec(generatedCode)) !== null) {
      const language = match[1] || 'javascript';
      const fileName = match[2].trim() || `generated-${files.length + 1}.${this.getExtension(language)}`;
      const code = match[3].trim();
      
      // Skip if it's a markdown code block without file info
      if (!fileName.includes('.') && !fileName.includes('/')) {
        continue;
      }
      
      files.push({
        fileName: fileName.replace(/^[^\/]+:/, ''), // Remove language prefix if present
        code,
        language: this.mapLanguage(language),
      });
    }
    
    // If no file blocks found, treat entire output as single file
    if (files.length === 0) {
      const primaryLanguage = context?.techStack?.languages?.[0] || 'JavaScript';
      const ext = this.getExtension(primaryLanguage);
      files.push({
        fileName: `generated-feature.${ext}`,
        code: generatedCode,
        language: primaryLanguage,
      });
    }
    
    return files;
  }

  /**
   * Get file extension from language
   */
  getExtension(language) {
    const extMap = {
      'javascript': 'js',
      'typescript': 'ts',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'python': 'py',
      'rust': 'rs',
      'go': 'go',
      'java': 'java',
      'json': 'json',
      'yaml': 'yml',
      'markdown': 'md',
    };
    return extMap[language.toLowerCase()] || 'js';
  }

  /**
   * Map language name
   */
  mapLanguage(language) {
    const langMap = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'jsx': 'JavaScript',
      'tsx': 'TypeScript',
      'python': 'Python',
      'rust': 'Rust',
      'go': 'Go',
      'java': 'Java',
    };
    return langMap[language.toLowerCase()] || language;
  }
}

// Export factory function and class
module.exports = LLMCodeGenerator;
module.exports.createLLMCodeGenerator = createLLMCodeGenerator;
// Don't export default instance - must use loadCodeGenerator() instead

