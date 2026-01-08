/**
 * Documentation Generator
 * Uses BEAST MODE's LLM to auto-generate documentation from code
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { createLogger } = require('../utils/logger');

const log = createLogger('DocumentationGenerator');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class DocumentationGenerator {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate documentation for code
   * @param {string} code - Code to document
   * @param {string} filePath - File path
   * @param {string} language - Programming language
   * @param {Object} options - Options
   * @returns {Promise<string>} Generated documentation
   */
  async generateDocumentation(code, filePath, language = 'javascript', options = {}) {
    const cacheKey = `${filePath}-${code.substring(0, 500)}`;
    if (this.cache.has(cacheKey) && !options.force) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `doc-generation-${Date.now()}`,
        message: `Generate comprehensive documentation for this ${language} code:

File: ${filePath}

Code:
\`\`\`${language}
${code}
\`\`\`

Generate documentation in Markdown format that includes:
1. Overview - What this code does
2. Functions/Classes - Description of each
3. Parameters - For each function
4. Return Values - What each function returns
5. Usage Examples - Code examples
6. Edge Cases - Important edge cases
7. Dependencies - What this code depends on

Format as clean Markdown. Return ONLY the documentation, no code blocks around it.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        let documentation = response.data.message.trim();
        
        // Remove markdown code blocks if present
        documentation = documentation.replace(/```markdown\n?/g, '').replace(/```\n?/g, '');
        
        this.cache.set(cacheKey, documentation);
        return documentation;
      }

      throw new Error('No documentation in response');
    } catch (error) {
      log.error('Failed to generate documentation:', error.message);
      // Fallback to basic documentation
      return this.generateFallbackDocumentation(code, filePath, language);
    }
  }

  /**
   * Generate and save documentation file
   * @param {string} code - Code to document
   * @param {string} filePath - Source file path
   * @param {Object} options - Options
   * @returns {Promise<string>} Path to documentation file
   */
  async generateAndSave(code, filePath, options = {}) {
    const language = options.language || this.detectLanguage(filePath);
    const documentation = await this.generateDocumentation(code, filePath, language, options);
    
    // Determine output path
    const outputPath = options.outputPath || this.getOutputPath(filePath);
    const outputDir = path.dirname(outputPath);
    
    // Create directory if needed
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write documentation
    await fs.writeFile(outputPath, documentation, 'utf8');
    
    log.info(`Documentation saved to ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate API documentation
   * @param {string} code - API code
   * @param {string} format - Output format (markdown, openapi, etc.)
   * @returns {Promise<string>} API documentation
   */
  async generateAPIDocumentation(code, format = 'markdown') {
    try {
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `api-doc-${Date.now()}`,
        message: `Generate ${format.toUpperCase()} API documentation for this code:

\`\`\`javascript
${code}
\`\`\`

${format === 'openapi' ? 'Generate OpenAPI 3.0 specification.' : 'Generate Markdown API documentation.'}

Include:
- Endpoint descriptions
- Request/response schemas
- Authentication requirements
- Error codes
- Examples

Return ONLY the documentation in ${format} format.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        return response.data.message.trim();
      }
    } catch (error) {
      log.error('Failed to generate API documentation:', error.message);
    }

    return null;
  }

  /**
   * Generate README for a project
   * @param {Object} projectInfo - Project information
   * @returns {Promise<string>} README content
   */
  async generateREADME(projectInfo) {
    try {
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `readme-generation-${Date.now()}`,
        message: `Generate a comprehensive README.md for this project:

Project Name: ${projectInfo.name || 'Project'}
Description: ${projectInfo.description || ''}
Main Files: ${projectInfo.mainFiles?.join(', ') || ''}
Technologies: ${projectInfo.technologies?.join(', ') || ''}

Include:
- Project overview
- Installation instructions
- Usage examples
- API documentation (if applicable)
- Contributing guidelines
- License information

Return ONLY the README content in Markdown format.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        return response.data.message.trim();
      }
    } catch (error) {
      log.error('Failed to generate README:', error.message);
    }

    return null;
  }

  /**
   * Detect language from file path
   */
  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c'
    };
    return languageMap[ext] || 'javascript';
  }

  /**
   * Get output path for documentation
   */
  getOutputPath(filePath) {
    const dir = path.dirname(filePath);
    const name = path.basename(filePath, path.extname(filePath));
    return path.join(dir, `${name}.md`);
  }

  /**
   * Generate fallback documentation
   */
  generateFallbackDocumentation(code, filePath, language) {
    const fileName = path.basename(filePath);
    return `# ${fileName}

## Overview

This file contains ${language} code.

## Functions

${this.extractFunctions(code, language).map(f => `### ${f.name}\n${f.description || 'No description available.'}`).join('\n\n')}

## Notes

This documentation was auto-generated. Please review and enhance as needed.
`;
  }

  /**
   * Extract function names from code
   */
  extractFunctions(code, language) {
    const functions = [];
    
    if (language === 'javascript' || language === 'typescript') {
      // Match function declarations
      const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function)|class\s+(\w+))/g;
      let match;
      while ((match = functionRegex.exec(code)) !== null) {
        const name = match[1] || match[2] || match[3];
        if (name) {
          functions.push({ name, description: null });
        }
      }
    }
    
    return functions;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new DocumentationGenerator();
