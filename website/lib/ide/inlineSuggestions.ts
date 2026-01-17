/**
 * Inline Suggestions Service
 * 
 * Provides real-time AI suggestions while typing
 */

export interface InlineSuggestion {
  text: string;
  range: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  confidence: number;
}

export class InlineSuggestionsService {
  private static instance: InlineSuggestionsService;
  private cache: Map<string, InlineSuggestion[]> = new Map();
  private debounceTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): InlineSuggestionsService {
    if (!InlineSuggestionsService.instance) {
      InlineSuggestionsService.instance = new InlineSuggestionsService();
    }
    return InlineSuggestionsService.instance;
  }

  /**
   * Get inline suggestions for current cursor position
   */
  async getSuggestions(
    file: string,
    content: string,
    line: number,
    column: number,
    context?: {
      openFiles?: Array<{ path: string; content: string }>;
      codebase?: any;
    }
  ): Promise<InlineSuggestion[]> {
    // Debounce requests
    return new Promise((resolve) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        try {
          // Get context around cursor
          const lines = content.split('\n');
          const contextLines = lines.slice(Math.max(0, line - 10), line + 1);
          const contextText = contextLines.join('\n');
          const currentLine = lines[line - 1] || '';
          const prefix = currentLine.substring(0, column - 1);

          // Call AI API for suggestions
          const response = await fetch('/api/beast-mode/inline-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file,
              context: contextText,
              prefix,
              line,
              column,
              openFiles: context?.openFiles,
              codebase: context?.codebase,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to get suggestions');
          }

          const data = await response.json();
          const suggestions: InlineSuggestion[] = (data.suggestions || []).map((s: any) => ({
            text: s.text,
            range: {
              startLine: line,
              startColumn: column,
              endLine: line,
              endColumn: column,
            },
            confidence: s.confidence || 0.8,
          }));

          resolve(suggestions);
        } catch (error) {
          console.warn('Failed to get inline suggestions:', error);
          resolve([]);
        }
      }, 300); // 300ms debounce
    });
  }

  /**
   * Clear cache for a file
   */
  clearCache(file: string) {
    this.cache.delete(file);
  }
}

export const inlineSuggestions = InlineSuggestionsService.getInstance();
