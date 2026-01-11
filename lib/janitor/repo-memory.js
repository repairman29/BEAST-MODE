/**
 * BEAST MODE Repo-Level Memory
 * Semantic Graph of Project Architecture
 * 
 * Solves: The "90% Wall" - AI forgets architecture as codebase grows
 * 
 * Features:
 * - Semantic graph of entire codebase
 * - Architecture understanding
 * - Context preservation across changes
 * - Architectural rules enforcement
 */

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

const log = createLogger('RepoMemory');

class RepoMemory {
    constructor(options = {}) {
        this.options = {
            enabled: true,
            graphFile: '.beast-mode/repo-graph.json',
            updateOnChange: true,
            ...options
        };

        this.graph = {
            nodes: new Map(), // file -> node
            edges: new Map(), // file -> [dependencies]
            architecture: {
                layers: [], // frontend, api, database, etc.
                patterns: [], // patterns detected
                rules: [] // architectural rules
            },
            semantic: {
                functions: new Map(), // function -> metadata
                components: new Map(), // component -> metadata
                apis: new Map(), // api -> metadata
                dataFlow: [] // data flow paths
            },
            lastUpdated: null
        };

        this.initialized = false;
    }

    /**
     * Initialize repo memory
     */
    async initialize() {
        if (this.initialized) return;

        log.info('🧠 Initializing Repo-Level Memory...');

        // Load existing graph if available
        await this.loadGraph();

        // Build graph if empty or stale
        if (this.graph.nodes.size === 0 || this.isStale()) {
            await this.buildGraph();
        }

        this.initialized = true;
        log.info(`✅ Repo Memory ready (${this.graph.nodes.size} files, ${this.graph.edges.size} dependencies)`);
    }

    /**
     * Build semantic graph of codebase
     */
    async buildGraph() {
        log.info('🔍 Building semantic graph of codebase...');

        const codebasePath = process.cwd();
        const files = await this.getAllCodeFiles(codebasePath);

        // Reset graph
        this.graph.nodes.clear();
        this.graph.edges.clear();

        // Analyze each file
        for (const file of files) {
            try {
                const node = await this.analyzeFile(file, codebasePath);
                if (node) {
                    this.graph.nodes.set(file, node);
                    
                    // Add edges (dependencies)
                    if (node.dependencies && node.dependencies.length > 0) {
                        this.graph.edges.set(file, node.dependencies);
                    }
                }
            } catch (error) {
                log.debug(`Failed to analyze ${file}:`, error.message);
            }
        }

        // Detect architecture layers
        await this.detectArchitecture();

        // Detect patterns
        await this.detectPatterns();

        // Save graph
        await this.saveGraph();

        this.graph.lastUpdated = new Date().toISOString();
        log.info(`✅ Graph built: ${this.graph.nodes.size} files analyzed`);
    }

    /**
     * Analyze a file and extract semantic information
     */
    async analyzeFile(filePath, rootPath) {
        const content = await fs.readFile(filePath, 'utf8');
        const relativePath = path.relative(rootPath, filePath);
        const ext = path.extname(filePath);
        const dir = path.dirname(relativePath);

        const node = {
            path: relativePath,
            absolutePath: filePath,
            type: this.detectFileType(filePath, dir),
            layer: this.detectLayer(dir, filePath),
            dependencies: [],
            exports: [],
            imports: [],
            functions: [],
            components: [],
            apis: [],
            metadata: {}
        };

        // Extract dependencies (imports)
        const imports = this.extractImports(content);
        node.imports = imports;
        node.dependencies = imports.map(imp => this.resolveImport(imp, filePath, rootPath)).filter(Boolean);

        // Extract exports
        node.exports = this.extractExports(content);

        // Extract functions
        if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
            node.functions = this.extractFunctions(content);
            node.components = this.extractComponents(content);
            node.apis = this.extractAPIs(content, filePath);
        }

        // Store in semantic map
        for (const func of node.functions) {
            this.graph.semantic.functions.set(`${relativePath}:${func.name}`, {
                file: relativePath,
                name: func.name,
                type: func.type,
                line: func.line
            });
        }

        for (const component of node.components) {
            this.graph.semantic.components.set(`${relativePath}:${component.name}`, {
                file: relativePath,
                name: component.name,
                props: component.props,
                line: component.line
            });
        }

        for (const api of node.apis) {
            this.graph.semantic.apis.set(`${relativePath}:${api.path}`, {
                file: relativePath,
                method: api.method,
                path: api.path,
                line: api.line
            });
        }

        return node;
    }

    /**
     * Detect file type
     */
    detectFileType(filePath, dir) {
        const ext = path.extname(filePath).toLowerCase();
        const name = path.basename(filePath).toLowerCase();

        if (name.includes('test') || name.includes('spec')) return 'test';
        if (name.includes('config')) return 'config';
        if (ext === '.jsx' || ext === '.tsx') return 'component';
        if (ext === '.js' || ext === '.ts') {
            if (dir.includes('api') || dir.includes('routes')) return 'api';
            if (dir.includes('utils') || dir.includes('helpers')) return 'utility';
            return 'module';
        }
        if (ext === '.css' || ext === '.scss') return 'style';
        if (ext === '.json') return 'config';
        return 'other';
    }

    /**
     * Detect architecture layer
     */
    detectLayer(dir, filePath) {
        const lowerDir = dir.toLowerCase();
        const lowerPath = filePath.toLowerCase();

        if (lowerDir.includes('components') || lowerDir.includes('pages') || lowerDir.includes('app')) {
            return 'frontend';
        }
        if (lowerDir.includes('api') || lowerDir.includes('routes') || lowerDir.includes('server')) {
            return 'api';
        }
        if (lowerDir.includes('database') || lowerDir.includes('db') || lowerDir.includes('models')) {
            return 'database';
        }
        if (lowerDir.includes('utils') || lowerDir.includes('helpers') || lowerDir.includes('lib')) {
            return 'shared';
        }
        if (lowerPath.includes('test') || lowerPath.includes('spec')) {
            return 'test';
        }
        return 'unknown';
    }

    /**
     * Extract imports from file
     */
    extractImports(content) {
        const imports = [];
        
        // ES6 imports
        const es6Imports = content.matchAll(/import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g);
        for (const match of es6Imports) {
            imports.push(match[1]);
        }

        // CommonJS requires
        const cjsImports = content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
        for (const match of cjsImports) {
            imports.push(match[1]);
        }

        return imports.filter(imp => !imp.startsWith('.') || imp.startsWith('./') || imp.startsWith('../'));
    }

    /**
     * Extract exports from file
     */
    extractExports(content) {
        const exports = [];

        // ES6 exports
        const es6Exports = content.matchAll(/export\s+(?:default\s+)?(?:function|const|class|let|var)\s+(\w+)/g);
        for (const match of es6Exports) {
            exports.push(match[1]);
        }

        // Named exports
        const namedExports = content.matchAll(/export\s+\{([^}]+)\}/g);
        for (const match of namedExports) {
            const names = match[1].split(',').map(n => n.trim().split(' as ')[0].trim());
            exports.push(...names);
        }

        return exports;
    }

    /**
     * Extract functions from file
     */
    extractFunctions(content) {
        const functions = [];
        const lines = content.split('\n');

        // Function declarations
        const funcPatterns = [
            /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g,
            /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/g,
            /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(/g
        ];

        for (const pattern of funcPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const funcName = match[1];
                const line = content.substring(0, match.index).split('\n').length;
                functions.push({
                    name: funcName,
                    type: 'function',
                    line
                });
            }
        }

        return functions;
    }

    /**
     * Extract React components
     */
    extractComponents(content) {
        const components = [];
        const lines = content.split('\n');

        // React component patterns
        const componentPatterns = [
            /(?:export\s+)?(?:default\s+)?(?:function|const)\s+(\w+)\s*(?:\([^)]*\)\s*=>|{)/g,
            /(?:export\s+)?class\s+(\w+)\s+extends\s+(?:React\.)?Component/g
        ];

        for (const pattern of componentPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const componentName = match[1];
                if (componentName[0] === componentName[0].toUpperCase()) {
                    const line = content.substring(0, match.index).split('\n').length;
                    // Extract props
                    const propsMatch = content.substring(match.index).match(/\(([^)]*)\)/);
                    const props = propsMatch ? propsMatch[1].split(',').map(p => p.trim()).filter(Boolean) : [];
                    
                    components.push({
                        name: componentName,
                        props,
                        line
                    });
                }
            }
        }

        return components;
    }

    /**
     * Extract API endpoints
     */
    extractAPIs(content, filePath) {
        const apis = [];
        const lines = content.split('\n');

        // Express/Next.js API patterns
        const apiPatterns = [
            /(?:export\s+default\s+)?(?:async\s+)?function\s+(?:GET|POST|PUT|DELETE|PATCH)\s*\(/gi,
            /\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi,
            /router\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi
        ];

        for (const pattern of apiPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const method = match[1]?.toUpperCase() || 'GET';
                const path = match[2] || '/';
                const line = content.substring(0, match.index).split('\n').length;
                
                apis.push({
                    method,
                    path,
                    line
                });
            }
        }

        return apis;
    }

    /**
     * Resolve import to file path
     */
    resolveImport(importPath, fromFile, rootPath) {
        if (importPath.startsWith('.')) {
            // Relative import
            const fromDir = path.dirname(fromFile);
            const resolved = path.resolve(fromDir, importPath);
            // Try different extensions
            const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json'];
            for (const ext of extensions) {
                const withExt = resolved + ext;
                if (this.graph.nodes.has(withExt)) {
                    return withExt;
                }
            }
        }
        // External package - skip for now
        return null;
    }

    /**
     * Detect architecture layers
     */
    async detectArchitecture() {
        const layers = {
            frontend: [],
            api: [],
            database: [],
            shared: [],
            test: []
        };

        for (const [file, node] of this.graph.nodes) {
            if (layers[node.layer]) {
                layers[node.layer].push(file);
            }
        }

        this.graph.architecture.layers = Object.entries(layers)
            .filter(([_, files]) => files.length > 0)
            .map(([name, files]) => ({
                name,
                files: files.length,
                percentage: (files.length / this.graph.nodes.size) * 100
            }));

        log.info(`Architecture detected: ${this.graph.architecture.layers.map(l => l.name).join(', ')}`);
    }

    /**
     * Detect patterns
     */
    async detectPatterns() {
        const patterns = [];

        // Check for common patterns
        // MVC pattern
        const hasModels = Array.from(this.graph.nodes.values()).some(n => 
            n.layer === 'database' || n.type === 'model'
        );
        const hasViews = Array.from(this.graph.nodes.values()).some(n => 
            n.layer === 'frontend' || n.type === 'component'
        );
        const hasControllers = Array.from(this.graph.nodes.values()).some(n => 
            n.layer === 'api' || n.type === 'api'
        );

        if (hasModels && hasViews && hasControllers) {
            patterns.push({
                name: 'MVC',
                confidence: 0.8,
                description: 'Model-View-Controller pattern detected'
            });
        }

        // API-first pattern
        const apiFiles = Array.from(this.graph.nodes.values()).filter(n => n.layer === 'api');
        if (apiFiles.length > 0 && apiFiles.length / this.graph.nodes.size > 0.1) {
            patterns.push({
                name: 'API-First',
                confidence: 0.7,
                description: 'API-first architecture detected'
            });
        }

        this.graph.architecture.patterns = patterns;
    }

    /**
     * Get all code files
     */
    async getAllCodeFiles(rootPath, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
        const files = [];

        async function walkDir(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

                    if (entry.name.startsWith('.') || 
                        entry.name === 'node_modules' || 
                        entry.name === 'dist' ||
                        entry.name === 'build' ||
                        entry.name === '.next') {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        await walkDir(fullPath);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name);
                        if (extensions.includes(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        }

        await walkDir(rootPath);
        return files;
    }

    /**
     * Check if graph is stale
     */
    isStale() {
        if (!this.graph.lastUpdated) return true;
        const lastUpdate = new Date(this.graph.lastUpdated);
        const now = new Date();
        const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate > 1; // Stale if older than 1 day
    }

    /**
     * Get architectural context for a file
     */
    getContext(filePath) {
        const node = this.graph.nodes.get(filePath);
        if (!node) return null;

        return {
            file: node.path,
            type: node.type,
            layer: node.layer,
            dependencies: node.dependencies.map(dep => {
                const depNode = this.graph.nodes.get(dep);
                return depNode ? {
                    path: depNode.path,
                    type: depNode.type,
                    layer: depNode.layer
                } : null;
            }).filter(Boolean),
            dependents: Array.from(this.graph.edges.entries())
                .filter(([_, deps]) => deps.includes(filePath))
                .map(([file]) => file),
            architecture: this.graph.architecture
        };
    }

    /**
     * Enforce architectural rules
     */
    enforceRules(filePath, proposedChange) {
        const context = this.getContext(filePath);
        if (!context) return { allowed: true };

        const violations = [];

        // Rule: No database logic in frontend
        if (context.layer === 'frontend' && proposedChange.includes('database')) {
            violations.push({
                rule: 'no-db-in-frontend',
                severity: 'high',
                message: 'Database logic detected in frontend layer',
                suggestion: 'Move database logic to API layer'
            });
        }

        // Rule: No frontend imports in API
        if (context.layer === 'api' && proposedChange.includes('react')) {
            violations.push({
                rule: 'no-frontend-in-api',
                severity: 'medium',
                message: 'Frontend dependency detected in API layer',
                suggestion: 'Remove React/frontend dependencies from API'
            });
        }

        return {
            allowed: violations.length === 0,
            violations
        };
    }

    /**
     * Load graph from disk
     */
    async loadGraph() {
        try {
            const graphPath = path.join(process.cwd(), this.options.graphFile);
            const data = JSON.parse(await fs.readFile(graphPath, 'utf8'));
            
            // Reconstruct Maps
            this.graph.nodes = new Map(data.nodes || []);
            this.graph.edges = new Map(data.edges || []);
            this.graph.architecture = data.architecture || this.graph.architecture;
            this.graph.semantic.functions = new Map(data.semantic?.functions || []);
            this.graph.semantic.components = new Map(data.semantic?.components || []);
            this.graph.semantic.apis = new Map(data.semantic?.apis || []);
            this.graph.lastUpdated = data.lastUpdated;
        } catch (error) {
            // No existing graph
            log.debug('No existing graph found, will build new one');
        }
    }

    /**
     * Save graph to disk
     */
    async saveGraph() {
        try {
            const graphPath = path.join(process.cwd(), this.options.graphFile);
            const dir = path.dirname(graphPath);
            await fs.mkdir(dir, { recursive: true });

            const data = {
                nodes: Array.from(this.graph.nodes.entries()),
                edges: Array.from(this.graph.edges.entries()),
                architecture: this.graph.architecture,
                semantic: {
                    functions: Array.from(this.graph.semantic.functions.entries()),
                    components: Array.from(this.graph.semantic.components.entries()),
                    apis: Array.from(this.graph.semantic.apis.entries())
                },
                lastUpdated: this.graph.lastUpdated
            };

            await fs.writeFile(graphPath, JSON.stringify(data, null, 2), 'utf8');
            log.debug('Graph saved to disk');
        } catch (error) {
            log.warn('Failed to save graph:', error.message);
        }
    }

    /**
     * Get graph statistics
     */
    getStats() {
        return {
            files: this.graph.nodes.size,
            dependencies: Array.from(this.graph.edges.values()).reduce((sum, deps) => sum + deps.length, 0),
            layers: this.graph.architecture.layers.length,
            patterns: this.graph.architecture.patterns.length,
            functions: this.graph.semantic.functions.size,
            components: this.graph.semantic.components.size,
            apis: this.graph.semantic.apis.size,
            lastUpdated: this.graph.lastUpdated
        };
    }
}

module.exports = { RepoMemory };

