/**
 * Code Navigation Service
 * 
 * Provides "Go to Definition" and "Find References" functionality
 * Similar to Cursor's code navigation
 */

export interface SymbolLocation {
  file: string;
  line: number;
  column: number;
  name: string;
  kind: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'import';
}

export interface Reference {
  file: string;
  line: number;
  column: number;
  context: string;
}

export class CodeNavigationService {
  private static instance: CodeNavigationService;
  private cache: Map<string, SymbolLocation[]> = new Map();

  private constructor() {}

  static getInstance(): CodeNavigationService {
    if (!CodeNavigationService.instance) {
      CodeNavigationService.instance = new CodeNavigationService();
    }
    return CodeNavigationService.instance;
  }

  async goToDefinition(
    file: string,
    line: number,
    column: number,
    repoPath?: string
  ): Promise<SymbolLocation | null> {
    try {
      const response = await fetch('/api/codebase/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'definition',
          file,
          line,
          column,
          repoPath,
        }),
      });

      if (!response.ok) {
        throw new Error(`Navigation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.location || null;
    } catch (error: any) {
      console.error('Go to definition error:', error);
      return null;
    }
  }

  async findReferences(
    file: string,
    line: number,
    column: number,
    repoPath?: string
  ): Promise<Reference[]> {
    try {
      const response = await fetch('/api/codebase/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'references',
          file,
          line,
          column,
          repoPath,
        }),
      });

      if (!response.ok) {
        throw new Error(`Find references failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.references || [];
    } catch (error: any) {
      console.error('Find references error:', error);
      return [];
    }
  }

  async findSymbol(query: string, repoPath?: string): Promise<SymbolLocation[]> {
    try {
      const response = await fetch('/api/codebase/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'symbol',
          query,
          repoPath,
        }),
      });

      if (!response.ok) {
        throw new Error(`Symbol search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.symbols || [];
    } catch (error: any) {
      console.error('Symbol search error:', error);
      return [];
    }
  }
}

export const codeNavigation = CodeNavigationService.getInstance();
