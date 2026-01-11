/**
 * API Documentation Generator
 * Uses BEAST MODE's LLM to generate API documentation (OpenAPI, etc.)
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
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

const log = createLogger('APIDocumentationGenerator');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class APIDocumentationGenerator {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate API documentation
   * @param {string} code - API code
   * @param {string} format - Output format (openapi, markdown, etc.)
   * @param {Object} options - Options
   * @returns {Promise<string>} API documentation
   */
  async generateAPIDocumentation(code, format = 'openapi', options = {}) {
    const cacheKey = `${format}-${code.substring(0, 500)}`;
    if (this.cache.has(cacheKey) && !options.force) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `api-doc-generation-${Date.now()}`,
        message: `Generate ${format.toUpperCase()} API documentation for this code:

\`\`\`javascript
${code}
\`\`\`

${format === 'openapi' ? `Generate OpenAPI 3.0 specification with:
- All endpoints
- Request/response schemas
- Authentication requirements
- Error responses
- Examples` : `Generate Markdown API documentation with:
- Endpoint descriptions
- Request/response formats
- Authentication
- Error codes
- Usage examples`}

Return ONLY the ${format} documentation, no code blocks around it.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        let documentation = response.data.message.trim();
        
        // Remove markdown code blocks if present
        if (format === 'openapi') {
          documentation = documentation.replace(/```(?:yaml|json|openapi)?\n?/g, '').replace(/```\n?/g, '');
        } else {
          documentation = documentation.replace(/```markdown\n?/g, '').replace(/```\n?/g, '');
        }
        
        this.cache.set(cacheKey, documentation);
        return documentation;
      }

      throw new Error('No API documentation in response');
    } catch (error) {
      log.error('Failed to generate API documentation:', error.message);
      // Fallback to basic API documentation
      return this.generateFallbackAPIDocs(code, format);
    }
  }

  /**
   * Generate and save API documentation
   * @param {string} code - API code
   * @param {string} outputPath - Output file path
   * @param {string} format - Output format
   * @returns {Promise<string>} Path to documentation file
   */
  async generateAndSave(code, outputPath, format = 'openapi') {
    const documentation = await this.generateAPIDocumentation(code, format);
    
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Determine file extension
    const ext = format === 'openapi' ? '.yaml' : '.md';
    const finalPath = outputPath.endsWith(ext) ? outputPath : `${outputPath}${ext}`;
    
    await fs.writeFile(finalPath, documentation, 'utf8');
    
    log.info(`API documentation saved to ${finalPath}`);
    return finalPath;
  }

  /**
   * Generate OpenAPI specification
   * @param {Array} endpoints - API endpoints
   * @returns {Promise<string>} OpenAPI spec
   */
  async generateOpenAPISpec(endpoints) {
    try {
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `openapi-spec-${Date.now()}`,
        message: `Generate OpenAPI 3.0 specification for these endpoints:

${JSON.stringify(endpoints, null, 2)}

Include:
- Complete OpenAPI 3.0 structure
- All endpoints with methods
- Request/response schemas
- Authentication schemes
- Error responses
- Examples

Return ONLY the YAML OpenAPI specification.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        return response.data.message.trim();
      }
    } catch (error) {
      log.error('Failed to generate OpenAPI spec:', error.message);
    }

    return null;
  }

  /**
   * Generate fallback API documentation
   */
  generateFallbackAPIDocs(code, format) {
    if (format === 'openapi') {
      return `openapi: 3.0.0
info:
  title: API Documentation
  version: 1.0.0
  description: Auto-generated API documentation

paths:
  /api/endpoint:
    get:
      summary: API endpoint
      responses:
        '200':
          description: Success
`;
    } else {
      return `# API Documentation

## Endpoints

### GET /api/endpoint

Description: API endpoint

**Response:**
\`\`\`json
{
  "status": "success"
}
\`\`\`
`;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new APIDocumentationGenerator();
