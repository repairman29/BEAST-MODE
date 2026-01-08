/**
 * BEAST MODE - Code Roach Integration
 * 
 * Uses BEAST MODE's code generation to help Code Roach write better fixes
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('BeastModeCodeRoachIntegration');

class BeastModeCodeRoachIntegration {
  constructor() {
    this.codebaseChat = null;
    this.qualityAnalysis = null;
    this.initialized = false;
  }

  /**
   * Initialize dependencies
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Lazy load to avoid circular dependencies
      this.codebaseChat = require('../mlops/codebaseChat');
      
      // Try to load quality analysis if available
      try {
        this.qualityAnalysis = require('../mlops/qualityAnalysis');
      } catch (e) {
        log.warn('Quality analysis not available');
      }

      this.initialized = true;
      log.info('✅ BEAST MODE - Code Roach integration initialized');
    } catch (error) {
      log.error('Failed to initialize integration:', error);
      throw error;
    }
  }

  /**
   * Improve fix generation using BEAST MODE's code generation
   */
  async improveFixGeneration(issue, context = {}) {
    await this.initialize();

    const {
      repo = context.repo || 'unknown',
      files = context.files || [],
      model = 'custom:beast-mode-code-model',
      userId = 'code-roach',
      useLLM = true
    } = context;

    log.info(`🔧 Improving fix generation for issue: ${issue.type || issue.name}`);

    try {
      // Build improvement prompt
      const prompt = this.buildFixPrompt(issue, context);

      // Use BEAST MODE's codebase chat to generate improved fix
      const response = await this.codebaseChat.processMessage(
        `code-roach-fix-${Date.now()}`,
        prompt,
        {
          repo,
          model,
          customModelId: model.replace('custom:', ''),
          userId,
          useLLM,
          files
        }
      );

      // Extract code from response
      const improvedFix = this.extractCodeFromResponse(response);

      // Use BEAST MODE's quality analysis to validate the fix
      let quality = null;
      if (this.qualityAnalysis && improvedFix) {
        try {
          quality = await this.qualityAnalysis.analyzeCode(improvedFix);
        } catch (e) {
          log.warn('Quality analysis failed, using basic validation');
        }
      }

      // Return improved fix with quality score
      return {
        success: true,
        fix: improvedFix,
        quality: quality?.score || 0.7, // Default quality if analysis unavailable
        confidence: quality?.confidence || 0.8,
        recommendations: quality?.recommendations || [],
        source: 'beast-mode-enhanced'
      };
    } catch (error) {
      log.error('Failed to improve fix generation:', error);
      return {
        success: false,
        error: error.message,
        source: 'beast-mode-enhanced'
      };
    }
  }

  /**
   * Build fix prompt for Code Roach issue
   */
  buildFixPrompt(issue, context) {
    const issueDescription = issue.description || issue.message || 'Unknown issue';
    const issueType = issue.type || issue.name || 'general';
    const code = context.code || issue.code || '';
    const filePath = context.filePath || issue.filePath || '';

    return `Fix this ${issueType} issue in the code:

Issue: ${issueDescription}

File: ${filePath}

Current code:
\`\`\`javascript
${code}
\`\`\`

Requirements:
1. Fix the ${issueType} issue completely
2. Maintain existing functionality
3. Follow codebase patterns and conventions
4. Add error handling if missing
5. Ensure code quality and maintainability
6. Match the existing code style

Generate the fixed code:`;
  }

  /**
   * Extract code from response
   */
  extractCodeFromResponse(response) {
    if (typeof response === 'string') {
      // Try to extract code blocks
      const codeBlockMatch = response.match(/```(?:javascript|typescript|js|ts)?\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        return codeBlockMatch[1];
      }
      return response;
    }

    if (response.code) {
      return response.code;
    }

    if (response.message) {
      const codeBlockMatch = response.message.match(/```(?:javascript|typescript|js|ts)?\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        return codeBlockMatch[1];
      }
      return response.message;
    }

    return JSON.stringify(response, null, 2);
  }
}

// Singleton instance
let instance = null;

function getBeastModeCodeRoachIntegration() {
  if (!instance) {
    instance = new BeastModeCodeRoachIntegration();
  }
  return instance;
}

module.exports = {
  BeastModeCodeRoachIntegration,
  getBeastModeCodeRoachIntegration
};
