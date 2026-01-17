/**
 * Enhanced Context Builder
 * 
 * Builds comprehensive context for AI code generation including:
 * - All open files
 * - Recent changes
 * - Git status
 * - Error messages
 * - Test results
 * - Codebase structure
 */

export interface EnhancedContext {
  // Current file context
  activeFile?: string | null;
  activeFileContent?: string | null;
  selectedText?: string | null;
  
  // All open files
  openFiles: Array<{
    path: string;
    content: string;
    language: string;
    isDirty: boolean;
  }>;
  
  // Recent changes
  recentChanges: Array<{
    file: string;
    change: 'created' | 'modified' | 'deleted';
    timestamp: Date;
    diff?: string;
  }>;
  
  // Git status
  gitStatus: {
    branch: string;
    modified: string[];
    staged: string[];
    untracked: string[];
    ahead: number;
    behind: number;
  };
  
  // Error messages
  errors: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  
  // Test results
  testResults: {
    passed: number;
    failed: number;
    total: number;
    failures: Array<{
      file: string;
      test: string;
      message: string;
    }>;
  };
  
  // Codebase context
  codebase: {
    structure: string;
    architecture: string[];
    patterns: string[];
    relatedFiles: string[];
    dependencies: string[];
  };
  
  // Conversation history
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export class EnhancedContextBuilder {
  private static instance: EnhancedContextBuilder;
  
  private constructor() {}
  
  static getInstance(): EnhancedContextBuilder {
    if (!EnhancedContextBuilder.instance) {
      EnhancedContextBuilder.instance = new EnhancedContextBuilder();
    }
    return EnhancedContextBuilder.instance;
  }
  
  /**
   * Build enhanced context from IDE state
   */
  async buildContext(params: {
    activeFile?: string | null;
    activeFileContent?: string | null;
    selectedText?: string | null;
    openFiles?: Array<{ path: string; content: string; language: string; isDirty: boolean }>;
    recentChanges?: Array<{ file: string; change: 'created' | 'modified' | 'deleted'; timestamp: Date; diff?: string }>;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<EnhancedContext> {
    const {
      activeFile,
      activeFileContent,
      selectedText,
      openFiles = [],
      recentChanges = [],
      conversationHistory = [],
    } = params;
    
    // Fetch Git status
    const gitStatus = await this.fetchGitStatus();
    
    // Fetch errors (from editor/linter)
    const errors = await this.fetchErrors(activeFile);
    
    // Fetch test results
    const testResults = await this.fetchTestResults();
    
    // Fetch codebase context
    const codebase = await this.fetchCodebaseContext(activeFile);
    
    return {
      activeFile,
      activeFileContent,
      selectedText,
      openFiles,
      recentChanges,
      gitStatus,
      errors,
      testResults,
      codebase,
      conversationHistory,
    };
  }
  
  private async fetchGitStatus(): Promise<EnhancedContext['gitStatus']> {
    try {
      const response = await fetch('/api/git/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Failed to fetch git status');
      
      const data = await response.json();
      
      // Fetch branch
      const branchResponse = await fetch('/api/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const branchData = await branchResponse.ok ? await branchResponse.json() : { branches: [] };
      const currentBranch = branchData.branches?.find((b: string) => !b.includes('/')) || branchData.current || 'main';
      
      return {
        branch: currentBranch,
        modified: data.modified || [],
        staged: data.staged || [],
        untracked: data.untracked || [],
        ahead: 0, // TODO: Calculate from git log
        behind: 0, // TODO: Calculate from git log
      };
    } catch (error) {
      console.warn('Failed to fetch git status:', error);
      return {
        branch: 'main',
        modified: [],
        staged: [],
        untracked: [],
        ahead: 0,
        behind: 0,
      };
    }
  }
  
  private async fetchErrors(file?: string | null): Promise<EnhancedContext['errors']> {
    // In a real implementation, this would fetch from the editor's error service
    // For now, return empty array
    return [];
  }
  
  private async fetchTestResults(): Promise<EnhancedContext['testResults']> {
    // In a real implementation, this would fetch from test runner
    // For now, return empty results
    return {
      passed: 0,
      failed: 0,
      total: 0,
      failures: [],
    };
  }
  
  private async fetchCodebaseContext(file?: string | null): Promise<EnhancedContext['codebase']> {
    try {
      const { codebaseContext } = await import('./codebaseContext');
      const context = await codebaseContext.getContext(file || '', undefined);
      
      return {
        structure: context.structure.architecture.structure || 'unknown',
        architecture: context.structure.architecture.patterns || [],
        patterns: context.structure.architecture.patterns || [],
        relatedFiles: context.relatedFiles || [],
        dependencies: context.dependencies || [],
      };
    } catch (error) {
      console.warn('Failed to fetch codebase context:', error);
      return {
        structure: 'unknown',
        architecture: [],
        patterns: [],
        relatedFiles: [],
        dependencies: [],
      };
    }
  }
  
  /**
   * Format context for AI prompt
   */
  formatContextForPrompt(context: EnhancedContext): string {
    let prompt = 'CONTEXT FOR CODE GENERATION:\n\n';
    
    // Active file
    if (context.activeFile) {
      prompt += `CURRENT FILE: ${context.activeFile}\n`;
      if (context.selectedText) {
        prompt += `SELECTED TEXT:\n${context.selectedText}\n\n`;
      }
    }
    
    // Open files
    if (context.openFiles.length > 0) {
      prompt += `OPEN FILES (${context.openFiles.length}):\n`;
      context.openFiles.slice(0, 5).forEach(file => {
        prompt += `- ${file.path} (${file.language}${file.isDirty ? ', modified' : ''})\n`;
      });
      prompt += '\n';
    }
    
    // Recent changes
    if (context.recentChanges.length > 0) {
      prompt += `RECENT CHANGES:\n`;
      context.recentChanges.slice(0, 5).forEach(change => {
        prompt += `- ${change.change}: ${change.file}\n`;
      });
      prompt += '\n';
    }
    
    // Git status
    if (context.gitStatus.modified.length > 0 || context.gitStatus.staged.length > 0) {
      prompt += `GIT STATUS:\n`;
      prompt += `Branch: ${context.gitStatus.branch}\n`;
      if (context.gitStatus.modified.length > 0) {
        prompt += `Modified: ${context.gitStatus.modified.join(', ')}\n`;
      }
      if (context.gitStatus.staged.length > 0) {
        prompt += `Staged: ${context.gitStatus.staged.join(', ')}\n`;
      }
      prompt += '\n';
    }
    
    // Errors
    if (context.errors.length > 0) {
      prompt += `CURRENT ERRORS:\n`;
      context.errors.slice(0, 5).forEach(error => {
        prompt += `- ${error.file}:${error.line}:${error.column} - ${error.message}\n`;
      });
      prompt += '\n';
    }
    
    // Codebase structure
    prompt += `CODEBASE STRUCTURE: ${context.codebase.structure}\n`;
    if (context.codebase.architecture.length > 0) {
      prompt += `Architecture Patterns: ${context.codebase.architecture.join(', ')}\n`;
    }
    if (context.codebase.relatedFiles.length > 0) {
      prompt += `Related Files: ${context.codebase.relatedFiles.slice(0, 5).join(', ')}\n`;
    }
    prompt += '\n';
    
    return prompt;
  }
}

export const enhancedContextBuilder = EnhancedContextBuilder.getInstance();
