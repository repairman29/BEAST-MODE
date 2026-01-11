/**
 * Security Analyzer
 * Uses BEAST MODE's LLM to analyze code for security vulnerabilities
 */

const axios = require('axios');
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

const log = createLogger('SecurityAnalyzer');

const BEAST_MODE_API = process.env.BEAST_MODE_API_URL || 'https://beast-mode.dev';

class SecurityAnalyzer {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Analyze code for security vulnerabilities
   * @param {string} code - Code to analyze
   * @param {string} filePath - File path
   * @param {Object} options - Options
   * @returns {Promise<Object>} Security analysis results
   */
  async analyzeSecurity(code, filePath, options = {}) {
    const cacheKey = `${filePath}-${code.substring(0, 500)}`;
    if (this.cache.has(cacheKey) && !options.force) {
      return this.cache.get(cacheKey);
    }

    try {
      // Use BEAST MODE's codebase chat API
      const response = await axios.post(`${BEAST_MODE_API}/api/codebase/chat`, {
        sessionId: `security-analysis-${Date.now()}`,
        message: `Analyze this code for security vulnerabilities:

File: ${filePath}

Code:
\`\`\`javascript
${code}
\`\`\`

Check for:
1. SQL injection vulnerabilities
2. XSS (Cross-Site Scripting) vulnerabilities
3. Authentication/authorization issues
4. Data exposure (secrets, sensitive data)
5. Insecure dependencies
6. Input validation issues
7. CSRF vulnerabilities
8. Insecure random number generation
9. Path traversal vulnerabilities
10. Command injection

For each vulnerability found, provide:
- Type of vulnerability
- Severity (critical, high, medium, low)
- Location (line numbers if possible)
- Description
- Recommended fix

Return as JSON array of vulnerability objects with: type, severity, location, description, recommendation.`,
        repo: 'BEAST-MODE-PRODUCT',
        model: 'custom:beast-mode-code-model',
        useLLM: true
      });

      if (response.data && response.data.message) {
        let vulnerabilities = [];
        try {
          // Try to parse as JSON
          const jsonMatch = response.data.message.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            vulnerabilities = JSON.parse(jsonMatch[0]);
          } else {
            // Parse as structured text
            vulnerabilities = this.parseVulnerabilities(response.data.message);
          }
        } catch (parseError) {
          log.warn('Failed to parse vulnerabilities as JSON, using text parser');
          vulnerabilities = this.parseVulnerabilities(response.data.message);
        }

        const result = {
          vulnerabilities,
          severity: this.calculateSeverity(vulnerabilities),
          safe: vulnerabilities.length === 0,
          timestamp: new Date().toISOString()
        };

        this.cache.set(cacheKey, result);
        return result;
      }

      throw new Error('No security analysis in response');
    } catch (error) {
      log.error('Failed to analyze security:', error.message);
      // Fallback to basic pattern matching
      return this.basicSecurityCheck(code, filePath);
    }
  }

  /**
   * Parse vulnerabilities from text
   */
  parseVulnerabilities(text) {
    const vulnerabilities = [];
    const lines = text.split('\n');
    let currentVuln = null;

    for (const line of lines) {
      if (line.match(/^\d+\./)) {
        if (currentVuln) vulnerabilities.push(currentVuln);
        currentVuln = {
          type: line.replace(/^\d+\.\s*/, '').trim(),
          severity: 'medium',
          location: null,
          description: '',
          recommendation: ''
        };
      } else if (currentVuln) {
        if (line.toLowerCase().includes('severity:')) {
          const severityMatch = line.match(/severity:\s*(\w+)/i);
          if (severityMatch) currentVuln.severity = severityMatch[1].toLowerCase();
        } else if (line.toLowerCase().includes('location:')) {
          currentVuln.location = line.replace(/.*location:\s*/i, '').trim();
        } else if (line.toLowerCase().includes('recommendation:') || line.toLowerCase().includes('fix:')) {
          currentVuln.recommendation = line.replace(/.*(?:recommendation|fix):\s*/i, '').trim();
        } else if (line.trim()) {
          currentVuln.description += (currentVuln.description ? ' ' : '') + line.trim();
        }
      }
    }
    if (currentVuln) vulnerabilities.push(currentVuln);

    return vulnerabilities;
  }

  /**
   * Calculate overall severity
   */
  calculateSeverity(vulnerabilities) {
    if (vulnerabilities.length === 0) return 'none';
    
    const severities = vulnerabilities.map(v => v.severity);
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Basic security check using pattern matching
   */
  basicSecurityCheck(code, filePath) {
    const vulnerabilities = [];
    const lines = code.split('\n');

    // Check for common patterns
    const patterns = [
      { pattern: /eval\s*\(/, type: 'Code Injection', severity: 'critical' },
      { pattern: /innerHTML\s*=/, type: 'XSS Vulnerability', severity: 'high' },
      { pattern: /password\s*=\s*['"]/, type: 'Hardcoded Password', severity: 'critical' },
      { pattern: /api[_-]?key\s*=\s*['"]/, type: 'Hardcoded API Key', severity: 'high' },
      { pattern: /SELECT.*\+.*FROM/i, type: 'Potential SQL Injection', severity: 'high' },
      { pattern: /\.query\s*\([^)]*\+/, type: 'SQL Injection Risk', severity: 'high' }
    ];

    lines.forEach((line, index) => {
      patterns.forEach(({ pattern, type, severity }) => {
        if (pattern.test(line)) {
          vulnerabilities.push({
            type,
            severity,
            location: `${filePath}:${index + 1}`,
            description: `Found ${type.toLowerCase()} pattern: ${line.trim()}`,
            recommendation: `Review and fix this security issue`
          });
        }
      });
    });

    return {
      vulnerabilities,
      severity: this.calculateSeverity(vulnerabilities),
      safe: vulnerabilities.length === 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new SecurityAnalyzer();
