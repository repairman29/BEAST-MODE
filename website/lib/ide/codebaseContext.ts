/**
 * Codebase Context Service
 * 
 * Provides codebase-wide context for AI understanding
 * Indexes files, understands structure, tracks dependencies
 */

export interface CodebaseFile {
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
}

export interface CodebaseStructure {
  files: CodebaseFile[];
  dependencies: Record<string, string[]>;
  imports: Record<string, string[]>;
  exports: Record<string, string[]>;
  architecture: {
    patterns: string[];
    frameworks: string[];
    structure: 'monorepo' | 'monolith' | 'microservices' | 'unknown';
  };
}

export interface CodebaseContext {
  structure: CodebaseStructure;
  currentFile?: string;
  relatedFiles: string[];
  dependencies: string[];
  similarFiles: string[];
}

export class CodebaseContextService {
  private static instance: CodebaseContextService;
  private cache: Map<string, CodebaseStructure> = new Map();
  private index: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): CodebaseContextService {
    if (!CodebaseContextService.instance) {
      CodebaseContextService.instance = new CodebaseContextService();
    }
    return CodebaseContextService.instance;
  }

  async indexCodebase(repoPath?: string): Promise<CodebaseStructure> {
    const cacheKey = repoPath || 'default';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await fetch('/api/codebase/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath }),
      });

      if (!response.ok) {
        throw new Error(`Codebase indexing failed: ${response.statusText}`);
      }

      const structure = await response.json();
      this.cache.set(cacheKey, structure);
      return structure;
    } catch (error: any) {
      console.error('Codebase indexing error:', error);
      // Return empty structure on error
      return {
        files: [],
        dependencies: {},
        imports: {},
        exports: {},
        architecture: {
          patterns: [],
          frameworks: [],
          structure: 'unknown',
        },
      };
    }
  }

  async getContext(file: string, repoPath?: string): Promise<CodebaseContext> {
    const structure = await this.indexCodebase(repoPath);
    
    // Find related files (same directory, imports, exports)
    const relatedFiles = this.findRelatedFiles(file, structure);
    const dependencies = this.findDependencies(file, structure);
    const similarFiles = this.findSimilarFiles(file, structure);

    return {
      structure,
      currentFile: file,
      relatedFiles,
      dependencies,
      similarFiles,
    };
  }

  private findRelatedFiles(file: string, structure: CodebaseStructure): string[] {
    const related: string[] = [];
    const dir = file.substring(0, file.lastIndexOf('/') || 0);
    
    // Files in same directory
    structure.files.forEach(f => {
      if (f.path !== file && f.path.startsWith(dir)) {
        related.push(f.path);
      }
    });

    // Imported files
    const imports = structure.imports[file] || [];
    related.push(...imports);

    // Files that import this file
    Object.entries(structure.imports).forEach(([path, imported]) => {
      if (imported.includes(file)) {
        related.push(path);
      }
    });

    return [...new Set(related)].slice(0, 10); // Limit to 10
  }

  private findDependencies(file: string, structure: CodebaseStructure): string[] {
    return structure.dependencies[file] || [];
  }

  private findSimilarFiles(file: string, structure: CodebaseStructure): string[] {
    const current = structure.files.find(f => f.path === file);
    if (!current) return [];

    const ext = file.split('.').pop()?.toLowerCase();
    const similar = structure.files
      .filter(f => 
        f.path !== file && 
        f.path.split('.').pop()?.toLowerCase() === ext &&
        Math.abs(f.size - current.size) < current.size * 0.5 // Similar size
      )
      .map(f => f.path)
      .slice(0, 5);

    return similar;
  }

  async searchCodebase(query: string, repoPath?: string): Promise<CodebaseFile[]> {
    try {
      const response = await fetch('/api/codebase/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, repoPath }),
      });

      if (!response.ok) {
        throw new Error(`Codebase search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error: any) {
      console.error('Codebase search error:', error);
      return [];
    }
  }

  async getFileContent(file: string, repoPath?: string): Promise<string> {
    try {
      const response = await fetch('/api/codebase/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, repoPath }),
      });

      if (!response.ok) {
        throw new Error(`File fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content || '';
    } catch (error: any) {
      console.error('File fetch error:', error);
      return '';
    }
  }
}

export const codebaseContext = CodebaseContextService.getInstance();
