import axios from 'axios';
import * as vscode from 'vscode';

export class BeastModeClient {
  private apiUrl: string;
  private sessionId: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.sessionId = `vscode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async analyzeQuality(filePath: string, content: string) {
    try {
      const repo = this.getRepoFromPath(filePath);
      const response = await axios.post(`${this.apiUrl}/api/repos/quality`, {
        repo,
        features: this.extractFeatures(content),
      });

      return {
        success: true,
        quality: response.data.quality,
        factors: response.data.factors,
        recommendations: response.data.recommendations,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getSuggestions(filePath: string, content: string, line: number, column: number) {
    try {
      const repo = this.getRepoFromPath(filePath);
      const response = await axios.post(`${this.apiUrl}/api/codebase/suggestions`, {
        repo,
        filePath,
        content,
        cursorLine: line + 1,
        cursorColumn: column,
        useLLM: false, // Can be configured
      });

      return {
        success: true,
        suggestions: response.data.suggestions || [],
        qualityHint: response.data.qualityHint,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        suggestions: [],
      };
    }
  }

  async chat(message: string, repo: string, currentFile?: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/codebase/chat`, {
        sessionId: this.sessionId,
        message,
        repo,
        currentFile,
        useLLM: false, // Can be configured
      });

      return {
        success: true,
        message: response.data.message,
        code: response.data.code,
        files: response.data.files || [],
        suggestions: response.data.suggestions || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async generateTests(filePath: string, content: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/codebase/tests/generate`, {
        filePath,
        fileContent: content,
        testFramework: 'auto',
        coverageTarget: 0.8,
        useLLM: false, // Can be configured
      });

      return {
        success: true,
        testFile: response.data.testFile,
        analysis: response.data.analysis,
        framework: response.data.framework,
        estimatedCoverage: response.data.estimatedCoverage,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async analyzeRefactoring(filePath: string, content: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/codebase/refactor`, {
        action: 'analyze',
        filePath,
        fileContent: content,
      });

      return {
        success: true,
        filePath: response.data.filePath,
        currentScore: response.data.currentScore,
        opportunities: response.data.opportunities || [],
        totalOpportunities: response.data.totalOpportunities || 0,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        opportunities: [],
      };
    }
  }

  async applyRefactoring(filePath: string, content: string, opportunity: any) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/codebase/refactor`, {
        action: 'apply',
        filePath,
        fileContent: content,
        opportunity,
        useLLM: false, // Can be configured
      });

      return {
        success: true,
        originalCode: response.data.originalCode,
        refactoredCode: response.data.refactoredCode,
        originalScore: response.data.originalScore,
        newScore: response.data.newScore,
        improvement: response.data.improvement,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async indexCodebase(workspacePath: string) {
    try {
      // Extract repo name from workspace
      const repo = this.getRepoFromPath(workspacePath);
      
      const response = await axios.post(`${this.apiUrl}/api/codebase/index`, {
        repo,
      });

      return {
        success: true,
        repo: response.data.repo,
        indexing: response.data.indexing,
        stats: response.data.stats,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private getRepoFromPath(filePath: string): string {
    // Extract repo name from file path
    // In production, this would be more sophisticated
    const parts = filePath.split(/[/\\]/);
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    if (workspaceFolder) {
      const workspaceName = workspaceFolder.name;
      return `user/${workspaceName}`;
    }
    
    return 'user/repo';
  }

  private extractFeatures(content: string): any {
    // Extract basic features from content
    return {
      lines: content.split('\n').length,
      hasTests: content.includes('test') || content.includes('spec'),
      hasComments: (content.match(/\/\//g) || []).length > 0,
      complexity: this.estimateComplexity(content),
    };
  }

  private estimateComplexity(content: string): number {
    // Simple complexity estimation
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+/g) || []).length;
    const conditionals = (content.match(/if\s*\(/g) || []).length;
    
    return Math.min(100, (lines / 10) + (functions * 5) + (conditionals * 3));
  }
}

