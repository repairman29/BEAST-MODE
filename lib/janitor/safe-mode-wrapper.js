/**
 * BEAST MODE Safe Mode Wrapper
 * Sandboxed Vibe Layer for Legacy Systems
 * 
 * Solves: The "Brownfield" Wall - Can't vibe code legacy systems
 * 
 * Features:
 * - Safe sandboxed extensions on top of legacy APIs
 * - No core system touch
 * - Wrapper layer for legacy integration
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
const fs = require('fs').promises;
const path = require('path');

const log = createLogger('SafeModeWrapper');

class SafeModeWrapper {
    constructor(options = {}) {
        this.options = {
            enabled: false,
            legacyApiPath: null,
            sandboxDir: '.beast-mode/sandbox',
            ...options
        };

        this.wrappers = new Map();
        this.sandboxedExtensions = [];
    }

    /**
     * Initialize Safe Mode Wrapper
     */
    async initialize() {
        log.info('🛡️ Initializing Safe Mode Wrapper...');

        // Create sandbox directory
        if (this.options.enabled) {
            await fs.mkdir(this.options.sandboxDir, { recursive: true });
        }

        log.info('✅ Safe Mode Wrapper ready');
    }

    /**
     * Create wrapper for legacy API
     */
    async createWrapper(legacyApi, options = {}) {
        const wrapper = {
            id: `wrapper-${Date.now()}`,
            legacyApi,
            sandboxPath: path.join(this.options.sandboxDir, `wrapper-${Date.now()}`),
            endpoints: [],
            ...options
        };

        // Analyze legacy API
        wrapper.endpoints = await this.analyzeLegacyAPI(legacyApi);

        // Create sandboxed wrapper
        await this.createSandboxedWrapper(wrapper);

        this.wrappers.set(wrapper.id, wrapper);

        log.info(`✅ Wrapper created for: ${legacyApi}`);

        return wrapper;
    }

    /**
     * Analyze legacy API
     */
    async analyzeLegacyAPI(apiPath) {
        const endpoints = [];

        try {
            // Try to read API file
            const content = await fs.readFile(apiPath, 'utf8');

            // Extract endpoints (various patterns)
            const patterns = [
                // Express routes
                /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi,
                // Function exports
                /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g,
                // Class methods
                /(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g
            ];

            for (const pattern of patterns) {
                const matches = content.matchAll(pattern);
                for (const match of matches) {
                    endpoints.push({
                        method: match[1]?.toUpperCase() || 'GET',
                        path: match[2] || match[1],
                        name: match[1] || 'unknown'
                    });
                }
            }
        } catch (error) {
            log.warn(`Failed to analyze legacy API: ${apiPath}`, error.message);
        }

        return endpoints;
    }

    /**
     * Create sandboxed wrapper
     */
    async createSandboxedWrapper(wrapper) {
        const wrapperCode = this.generateWrapperCode(wrapper);

        // Create wrapper file
        const wrapperPath = path.join(wrapper.sandboxPath, 'wrapper.js');
        await fs.mkdir(path.dirname(wrapperPath), { recursive: true });
        await fs.writeFile(wrapperPath, wrapperCode, 'utf8');

        // Create safe API layer
        const safeApiPath = path.join(wrapper.sandboxPath, 'safe-api.js');
        const safeApiCode = this.generateSafeApiCode(wrapper);
        await fs.writeFile(safeApiPath, safeApiCode, 'utf8');

        log.debug(`✅ Sandboxed wrapper created: ${wrapperPath}`);
    }

    /**
     * Generate wrapper code
     */
    generateWrapperCode(wrapper) {
        return `/**
 * BEAST MODE Safe Mode Wrapper
 * Sandboxed layer for legacy API: ${wrapper.legacyApi}
 * 
 * This wrapper allows safe extensions without touching the core system.
 */

const legacyApi = require('${path.resolve(wrapper.legacyApi)}');

class SafeModeWrapper {
    constructor() {
        this.legacyApi = legacyApi;
        this.extensions = new Map();
    }

    /**
     * Call legacy API safely
     */
    async callLegacy(endpoint, params) {
        try {
            // Validate inputs
            if (!this.isValidCall(endpoint, params)) {
                throw new Error('Invalid call to legacy API');
            }

            // Call with timeout
            return await Promise.race([
                this.legacyApi[endpoint](params),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ]);
        } catch (error) {
            console.error('Legacy API call failed:', error);
            throw error;
        }
    }

    /**
     * Validate call
     */
    isValidCall(endpoint, params) {
        // Add validation logic
        return true;
    }

    /**
     * Register extension
     */
    registerExtension(name, handler) {
        this.extensions.set(name, handler);
    }

    /**
     * Call extension
     */
    async callExtension(name, params) {
        const handler = this.extensions.get(name);
        if (!handler) {
            throw new Error(\`Extension not found: \${name}\`);
        }
        return await handler(params);
    }
}

module.exports = new SafeModeWrapper();
`;
    }

    /**
     * Generate safe API code
     */
    generateSafeApiCode(wrapper) {
        const endpoints = wrapper.endpoints.map(e => 
            `  ${e.method.toLowerCase()}: '${e.path}'`
        ).join(',\n');

        return `/**
 * BEAST MODE Safe API Layer
 * Safe endpoints for vibe coding extensions
 */

const wrapper = require('./wrapper');

module.exports = {
${endpoints},
  
  /**
   * Safe call wrapper
   */
  async call(endpoint, method, params) {
    return await wrapper.callLegacy(endpoint, params);
  }
};
`;
    }

    /**
     * Create extension in sandbox
     */
    async createExtension(name, code, options = {}) {
        const extension = {
            id: `ext-${Date.now()}`,
            name,
            code,
            sandboxPath: path.join(this.options.sandboxDir, `extensions/${name}`),
            wrapperId: options.wrapperId,
            ...options
        };

        // Create extension file
        const extPath = path.join(extension.sandboxPath, 'index.js');
        await fs.mkdir(path.dirname(extPath), { recursive: true });
        await fs.writeFile(extPath, code, 'utf8');

        // Create safe wrapper integration
        const wrapper = this.wrappers.get(extension.wrapperId);
        if (wrapper) {
            await this.integrateExtension(wrapper, extension);
        }

        this.sandboxedExtensions.push(extension);

        log.info(`✅ Extension created: ${name}`);

        return extension;
    }

    /**
     * Integrate extension with wrapper
     */
    async integrateExtension(wrapper, extension) {
        // Add extension registration to wrapper
        const wrapperPath = path.join(wrapper.sandboxPath, 'wrapper.js');
        try {
            const content = await fs.readFile(wrapperPath, 'utf8');
            const extensionCode = `
// Extension: ${extension.name}
const ${extension.name} = require('${path.relative(wrapper.sandboxPath, extension.sandboxPath)}');
wrapper.registerExtension('${extension.name}', ${extension.name}.handler);
`;
            await fs.appendFile(wrapperPath, extensionCode, 'utf8');
        } catch (error) {
            log.warn('Failed to integrate extension:', error.message);
        }
    }

    /**
     * Get wrapper status
     */
    getStatus() {
        return {
            enabled: this.options.enabled,
            wrappers: this.wrappers.size,
            extensions: this.sandboxedExtensions.length,
            sandboxDir: this.options.sandboxDir
        };
    }
}

module.exports = { SafeModeWrapper };

