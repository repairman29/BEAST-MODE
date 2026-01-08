import axios from 'axios';
import * as vscode from 'vscode';

export class BeastModeClient {
  private apiUrl: string;
  private sessionId: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.sessionId = `cursor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Chat with selected model
   */
  async chat(message: string, model?: string, repo?: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/codebase/chat`, {
        sessionId: this.sessionId,
        message,
        model, // Pass model to use custom model
        repo: repo || this.getRepoFromPath(),
        useLLM: !!model // Use LLM if model is specified
      });

      return {
        success: true,
        message: response.data.message,
        content: response.data.message,
        code: response.data.code,
        files: response.data.files || [],
        suggestions: response.data.suggestions || [],
        model: response.data.model || model
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Analyze code quality
   */
  async analyzeQuality(filePath: string, content: string, model?: string) {
    try {
      const repo = this.getRepoFromPath(filePath);
      const response = await axios.post(`${this.apiUrl}/api/repos/quality`, {
        repo,
        features: this.extractFeatures(content),
        model // Pass model if custom
      });

      return {
        success: true,
        quality: response.data.quality,
        factors: response.data.factors,
        recommendations: response.data.recommendations,
        model: response.data.model || model
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        quality: 0
      };
    }
  }

  /**
   * Get code suggestions
   */
  async getSuggestions(filePath: string, content: string, line: number, column: number, model?: string) {
    try {
      const repo = this.getRepoFromPath(filePath);
      const response = await axios.post(`${this.apiUrl}/api/codebase/suggestions`, {
        repo,
        filePath,
        content,
        cursorLine: line + 1,
        cursorColumn: column,
        model, // Pass model if custom
        useLLM: !!model
      });

      return {
        success: true,
        suggestions: response.data.suggestions || [],
        qualityHint: response.data.qualityHint
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  /**
   * Generate tests
   */
  async generateTests(filePath: string, content: string, model?: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/codebase/tests/generate`, {
        filePath,
        fileContent: content,
        testFramework: 'auto',
        coverageTarget: 0.8,
        model, // Pass model if custom
        useLLM: !!model
      });

      return {
        success: true,
        testFile: response.data.testFile,
        analysis: response.data.analysis,
        framework: response.data.framework,
        estimatedCoverage: response.data.estimatedCoverage
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refactor code
   */
  async refactor(filePath: string, content: string, model?: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/codebase/refactor`, {
        action: 'analyze',
        filePath,
        fileContent: content,
        model, // Pass model if custom
        useLLM: !!model
      });

      return {
        success: true,
        filePath: response.data.filePath,
        currentScore: response.data.currentScore,
        opportunities: response.data.opportunities || [],
        totalOpportunities: response.data.totalOpportunities || 0
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        opportunities: []
      };
    }
  }

  /**
   * Index codebase
   */
  async indexCodebase(workspacePath: string) {
    try {
      const repo = this.getRepoFromPath(workspacePath);
      const response = await axios.post(`${this.apiUrl}/api/codebase/index`, {
        repo
      });

      return {
        success: true,
        repo: response.data.repo,
        indexing: response.data.indexing,
        stats: response.data.stats
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get repo from path
   */
  private getRepoFromPath(filePath?: string): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      const workspaceName = workspaceFolder.name;
      return `user/${workspaceName}`;
    }
    return 'user/repo';
  }

  /**
   * Extract features from content
   */
  private extractFeatures(content: string): any {
    return {
      lines: content.split('\n').length,
      hasTests: content.includes('test') || content.includes('spec'),
      hasComments: (content.match(/\/\//g) || []).length > 0,
      complexity: this.estimateComplexity(content)
    };
  }

  /**
   * Estimate complexity
   */
  private estimateComplexity(content: string): number {
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+/g) || []).length;
    const conditionals = (content.match(/if\s*\(/g) || []).length;
    return Math.min(100, (lines / 10) + (functions * 5) + (conditionals * 3));
  }
}
