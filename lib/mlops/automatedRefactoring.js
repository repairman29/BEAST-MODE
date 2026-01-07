/**
 * Automated Refactoring System
 * 
 * Automatically refactors code to improve quality.
 * Unique differentiator - competitors don't have this.
 */

const codebaseIndexer = require('./codebaseIndexer');
const { fileQualityScorer } = require('./fileQualityScorer');
const llmCodeGenerator = require('./llmCodeGenerator');

class AutomatedRefactoring {
  constructor() {
    this.refactoringHistory = new Map(); // filePath -> [refactorings]
    this.patterns = new Map(); // pattern -> refactoring strategy
  }

  /**
   * Analyze code for refactoring opportunities
   * @param {string} filePath - File to analyze
   * @param {string} fileContent - File content
   * @param {Object} options - Refactoring options
   * @returns {Promise<Object>} Refactoring opportunities
   */
  async analyzeRefactoring(filePath, fileContent, options = {}) {
    const {
      minQualityImprovement = 0.1, // Minimum 10% improvement
      maxChanges = 10, // Maximum number of refactorings
    } = options;

    try {
      // 1. Score current file
      const currentScore = await fileQualityScorer.scoreFile(
        filePath,
        fileContent,
        {}
      );

      // 2. Detect refactoring opportunities
      const opportunities = this.detectRefactoringOpportunities(
        filePath,
        fileContent,
        currentScore
      );

      // 3. Estimate improvements
      const estimatedImprovements = opportunities.map(opp => ({
        ...opp,
        estimatedImprovement: this.estimateImprovement(opp, currentScore),
      }));

      // 4. Filter by minimum improvement
      const filtered = estimatedImprovements.filter(
        opp => opp.estimatedImprovement >= minQualityImprovement
      );

      // 5. Sort by impact
      const sorted = filtered.sort(
        (a, b) => b.estimatedImprovement - a.estimatedImprovement
      );

      return {
        success: true,
        filePath,
        currentScore: currentScore.overallScore || 0,
        opportunities: sorted.slice(0, maxChanges),
        totalOpportunities: sorted.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Detect refactoring opportunities
   */
  detectRefactoringOpportunities(filePath, content, currentScore) {
    const opportunities = [];

    // 1. Long functions (>50 lines)
    const longFunctions = this.detectLongFunctions(content);
    opportunities.push(...longFunctions.map(func => ({
      type: 'extract_function',
      description: `Extract function "${func.name}" into smaller functions`,
      location: { line: func.line, column: 0 },
      severity: 'medium',
      impact: 'maintainability',
    })));

    // 2. Duplicate code
    const duplicates = this.detectDuplicateCode(content);
    opportunities.push(...duplicates.map(dup => ({
      type: 'extract_common',
      description: `Extract duplicate code into shared function`,
      location: { line: dup.line, column: 0 },
      severity: 'high',
      impact: 'maintainability',
    })));

    // 3. Complex conditionals
    const complexConditions = this.detectComplexConditions(content);
    opportunities.push(...complexConditions.map(cond => ({
      type: 'simplify_conditional',
      description: `Simplify complex conditional logic`,
      location: { line: cond.line, column: 0 },
      severity: 'medium',
      impact: 'readability',
    })));

    // 4. Magic numbers
    const magicNumbers = this.detectMagicNumbers(content);
    opportunities.push(...magicNumbers.map(num => ({
      type: 'extract_constant',
      description: `Extract magic number ${num.value} into named constant`,
      location: { line: num.line, column: 0 },
      severity: 'low',
      impact: 'maintainability',
    })));

    // 5. Deep nesting (>3 levels)
    const deepNesting = this.detectDeepNesting(content);
    opportunities.push(...deepNesting.map(nest => ({
      type: 'reduce_nesting',
      description: `Reduce nesting depth (currently ${nest.depth} levels)`,
      location: { line: nest.line, column: 0 },
      severity: 'medium',
      impact: 'readability',
    })));

    // 6. Large classes (>500 lines)
    const largeClasses = this.detectLargeClasses(content);
    opportunities.push(...largeClasses.map(cls => ({
      type: 'split_class',
      description: `Split large class "${cls.name}" into smaller classes`,
      location: { line: cls.line, column: 0 },
      severity: 'high',
      impact: 'maintainability',
    })));

    // 7. Missing error handling
    const missingErrorHandling = this.detectMissingErrorHandling(content);
    opportunities.push(...missingErrorHandling.map(err => ({
      type: 'add_error_handling',
      description: `Add error handling for ${err.context}`,
      location: { line: err.line, column: 0 },
      severity: 'high',
      impact: 'reliability',
    })));

    return opportunities;
  }

  /**
   * Detect long functions
   */
  detectLongFunctions(content) {
    const functions = [];
    const lines = content.split('\n');
    let inFunction = false;
    let functionStart = 0;
    let functionName = '';
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect function start
      if (line.match(/(?:function|const|let|var|async\s+function)\s+(\w+)\s*[=:]?\s*(?:\([^)]*\)|async\s*\([^)]*\))\s*[=>{]/)) {
        const match = line.match(/(?:function|const|let|var|async\s+function)\s+(\w+)/);
        if (match) {
          inFunction = true;
          functionStart = i;
          functionName = match[1];
          braceCount = 0;
        }
      }

      if (inFunction) {
        // Count braces
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        // Function ends when braces balance
        if (braceCount === 0 && line.includes('}')) {
          const functionLength = i - functionStart;
          if (functionLength > 50) {
            functions.push({
              name: functionName,
              line: functionStart + 1,
              length: functionLength,
            });
          }
          inFunction = false;
        }
      }
    }

    return functions;
  }

  /**
   * Detect duplicate code
   */
  detectDuplicateCode(content) {
    const duplicates = [];
    const lines = content.split('\n');

    // Simple duplicate detection - look for repeated blocks
    for (let i = 0; i < lines.length - 10; i++) {
      const block = lines.slice(i, i + 5).join('\n');
      
      // Check if this block appears elsewhere
      for (let j = i + 10; j < lines.length - 5; j++) {
        const otherBlock = lines.slice(j, j + 5).join('\n');
        if (block === otherBlock && block.trim().length > 20) {
          duplicates.push({
            line: i + 1,
            duplicateAt: j + 1,
            length: 5,
          });
          break; // Only report once per block
        }
      }
    }

    return duplicates;
  }

  /**
   * Detect complex conditionals
   */
  detectComplexConditions(content) {
    const complex = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count logical operators
      const andCount = (line.match(/\s+&&\s+/g) || []).length;
      const orCount = (line.match(/\s+\|\|\s+/g) || []).length;
      const totalOperators = andCount + orCount;

      if (totalOperators > 3) {
        complex.push({
          line: i + 1,
          operators: totalOperators,
        });
      }
    }

    return complex;
  }

  /**
   * Detect magic numbers
   */
  detectMagicNumbers(content) {
    const magicNumbers = [];
    const lines = content.split('\n');

    // Pattern: numbers that aren't 0, 1, or part of common patterns
    const magicNumberPattern = /\b([2-9]|\d{2,})\b/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.matchAll(magicNumberPattern);

      for (const match of matches) {
        const num = parseInt(match[0]);
        // Skip common numbers and array indices
        if (num > 10 && !line.includes('[') && !line.includes('length')) {
          magicNumbers.push({
            line: i + 1,
            value: num,
            context: line.trim(),
          });
        }
      }
    }

    return magicNumbers;
  }

  /**
   * Detect deep nesting
   */
  detectDeepNesting(content) {
    const deepNesting = [];
    const lines = content.split('\n');
    let currentDepth = 0;
    let maxDepth = 0;
    let maxDepthLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count opening/closing braces
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;

      currentDepth += openBraces - closeBraces;

      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
        maxDepthLine = i + 1;
      }
    }

    if (maxDepth > 3) {
      deepNesting.push({
        line: maxDepthLine,
        depth: maxDepth,
      });
    }

    return deepNesting;
  }

  /**
   * Detect large classes
   */
  detectLargeClasses(content) {
    const largeClasses = [];
    const lines = content.split('\n');
    let inClass = false;
    let classStart = 0;
    let className = '';
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect class start
      if (line.match(/class\s+(\w+)/)) {
        const match = line.match(/class\s+(\w+)/);
        if (match) {
          inClass = true;
          classStart = i;
          className = match[1];
          braceCount = 0;
        }
      }

      if (inClass) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        if (braceCount === 0 && line.includes('}')) {
          const classLength = i - classStart;
          if (classLength > 500) {
            largeClasses.push({
              name: className,
              line: classStart + 1,
              length: classLength,
            });
          }
          inClass = false;
        }
      }
    }

    return largeClasses;
  }

  /**
   * Detect missing error handling
   */
  detectMissingErrorHandling(content) {
    const missing = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for async/await without try/catch
      if (line.includes('await') && !this.hasErrorHandling(lines, i)) {
        missing.push({
          line: i + 1,
          context: 'async operation',
        });
      }

      // Check for file operations without error handling
      if ((line.includes('fs.') || line.includes('readFile') || line.includes('writeFile')) &&
          !this.hasErrorHandling(lines, i)) {
        missing.push({
          line: i + 1,
          context: 'file operation',
        });
      }
    }

    return missing;
  }

  /**
   * Check if code has error handling
   */
  hasErrorHandling(lines, lineIndex) {
    // Check previous 10 lines for try/catch
    const start = Math.max(0, lineIndex - 10);
    const context = lines.slice(start, lineIndex + 1).join('\n');
    return context.includes('try') || context.includes('catch');
  }

  /**
   * Estimate quality improvement from refactoring
   */
  estimateImprovement(opportunity, currentScore) {
    const baseScore = currentScore.overallScore || 0.5;
    let improvement = 0;

    switch (opportunity.type) {
      case 'extract_function':
        improvement = 0.05; // 5% improvement
        break;
      case 'extract_common':
        improvement = 0.10; // 10% improvement
        break;
      case 'simplify_conditional':
        improvement = 0.03; // 3% improvement
        break;
      case 'extract_constant':
        improvement = 0.02; // 2% improvement
        break;
      case 'reduce_nesting':
        improvement = 0.05; // 5% improvement
        break;
      case 'split_class':
        improvement = 0.08; // 8% improvement
        break;
      case 'add_error_handling':
        improvement = 0.07; // 7% improvement
        break;
      default:
        improvement = 0.03;
    }

    // Scale by severity
    if (opportunity.severity === 'high') {
      improvement *= 1.5;
    } else if (opportunity.severity === 'low') {
      improvement *= 0.5;
    }

    return improvement;
  }

  /**
   * Apply refactoring
   */
  async applyRefactoring(filePath, fileContent, opportunity, options = {}) {
    const {
      useLLM = true,
      userApiKey = null,
    } = options;

    try {
      let refactoredCode;

      if (useLLM && userApiKey) {
        refactoredCode = await this.refactorWithLLM(
          filePath,
          fileContent,
          opportunity,
          userApiKey
        );
      } else {
        refactoredCode = this.refactorWithPatterns(
          filePath,
          fileContent,
          opportunity
        );
      }

      // Score refactored code
      const newScore = await fileQualityScorer.scoreFile(
        filePath,
        refactoredCode,
        {}
      );

      return {
        success: true,
        originalCode: fileContent,
        refactoredCode,
        originalScore: 0, // Would be from analysis
        newScore: newScore.overallScore || 0,
        improvement: (newScore.overallScore || 0) - 0,
        opportunity,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refactor with LLM
   */
  async refactorWithLLM(filePath, fileContent, opportunity, userApiKey) {
    const prompt = this.buildRefactoringPrompt(filePath, fileContent, opportunity);

    try {
      if (!llmCodeGenerator.initializeOpenAI(userApiKey)) {
        throw new Error('OpenAI not available');
      }

      const response = await llmCodeGenerator.generateWithOpenAI(prompt, {
        techStack: { languages: [this.getLanguage(filePath)] },
      }, {
        model: 'gpt-4',
        temperature: 0.3, // Lower temperature for refactoring (more deterministic)
        maxTokens: 2000,
      });

      return response;
    } catch (error) {
      console.error('[Automated Refactoring] LLM error:', error);
      throw error;
    }
  }

  /**
   * Build refactoring prompt
   */
  buildRefactoringPrompt(filePath, fileContent, opportunity) {
    return `Refactor this code to ${opportunity.description}.

File: ${filePath}
Language: ${this.getLanguage(filePath)}

Refactoring Type: ${opportunity.type}
Location: Line ${opportunity.location.line}

Original Code:
\`\`\`
${fileContent}
\`\`\`

Requirements:
1. Apply the refactoring: ${opportunity.description}
2. Maintain functionality (no breaking changes)
3. Improve code quality
4. Follow best practices
5. Preserve code style

Generate the refactored code:`;
  }

  /**
   * Refactor with patterns (fallback)
   */
  refactorWithPatterns(filePath, fileContent, opportunity) {
    // Simplified pattern-based refactoring
    // In production, use AST transformations
    let refactored = fileContent;

    switch (opportunity.type) {
      case 'extract_constant':
        // Would extract magic numbers
        break;
      case 'simplify_conditional':
        // Would simplify conditionals
        break;
      // Add more patterns
    }

    return refactored;
  }

  /**
   * Get language from file path
   */
  getLanguage(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'py': 'Python',
      'rs': 'Rust',
      'go': 'Go',
    };
    return langMap[ext] || 'JavaScript';
  }

  /**
   * Batch refactor multiple files
   */
  async batchRefactor(files, options = {}) {
    const {
      maxConcurrent = 3,
      minImprovement = 0.1,
    } = options;

    const results = [];

    // Process in batches
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          const analysis = await this.analyzeRefactoring(
            file.path,
            file.content,
            { minQualityImprovement: minImprovement }
          );

          if (analysis.success && analysis.opportunities.length > 0) {
            // Apply top opportunity
            const topOpp = analysis.opportunities[0];
            const result = await this.applyRefactoring(
              file.path,
              file.content,
              topOpp,
              options
            );
            return result;
          }

          return { success: false, file: file.path, reason: 'No opportunities' };
        })
      );

      results.push(...batchResults);
    }

    return {
      success: true,
      results,
      totalFiles: files.length,
      refactored: results.filter(r => r.success).length,
    };
  }
}

module.exports = new AutomatedRefactoring();

