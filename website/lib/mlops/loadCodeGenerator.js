/**
 * Wrapper to load LLMCodeGenerator with proper module resolution
 * This ensures relative requires work correctly in bundled environments
 */

const path = require('path');
const fs = require('fs');

function loadCodeGenerator(mlopsPath) {
  // Resolve mlopsPath to absolute path
  const absoluteMlopsPath = path.isAbsolute(mlopsPath) 
    ? mlopsPath 
    : path.resolve(process.cwd(), mlopsPath);
  
  // Verify path exists
  if (!fs.existsSync(absoluteMlopsPath)) {
    throw new Error(`mlops directory not found: ${absoluteMlopsPath}`);
  }
  
  // Load all dependencies with absolute paths first
  const modelRouterPath = path.join(absoluteMlopsPath, 'modelRouter.js');
  const knowledgeRAGPath = path.join(absoluteMlopsPath, 'knowledgeRAG.js');
  const llmCodeGeneratorPath = path.join(absoluteMlopsPath, 'llmCodeGenerator.js');
  
  // Verify files exist
  if (!fs.existsSync(modelRouterPath)) {
    throw new Error(`modelRouter.js not found: ${modelRouterPath}`);
  }
  if (!fs.existsSync(knowledgeRAGPath)) {
    throw new Error(`knowledgeRAG.js not found: ${knowledgeRAGPath}`);
  }
  if (!fs.existsSync(llmCodeGeneratorPath)) {
    throw new Error(`llmCodeGenerator.js not found: ${llmCodeGeneratorPath}`);
  }
  
  // Patch require to resolve relative paths from mlops directory
  const Module = require('module');
  const originalResolveFilename = Module._resolveFilename;
  
  // Override to handle relative requires from mlops files
  Module._resolveFilename = function(request, parent, isMain, options) {
    // If this is a relative require from a file in mlops directory
    if (parent && parent.filename && parent.filename.includes('mlops')) {
      if (request.startsWith('./') || request.startsWith('../')) {
        const parentDir = path.dirname(parent.filename);
        const resolvedPath = path.resolve(parentDir, request);
        
        // Try with .js extension if needed
        if (fs.existsSync(resolvedPath)) {
          return resolvedPath;
        }
        if (fs.existsSync(resolvedPath + '.js')) {
          return resolvedPath + '.js';
        }
      }
    }
    // Use default resolution for everything else
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };
  
  try {
    // Load dependencies with absolute paths
    const { getModelRouter } = require(modelRouterPath);
    const { getKnowledgeRAG } = require(knowledgeRAGPath);
    
    // Load llmCodeGenerator class (not instance)
    const LLMCodeGenerator = require(llmCodeGeneratorPath);
    
    // Create instance with injected dependencies
    return new LLMCodeGenerator({ getModelRouter, getKnowledgeRAG });
  } finally {
    // Restore original resolution
    Module._resolveFilename = originalResolveFilename;
  }
}

module.exports = { loadCodeGenerator };
