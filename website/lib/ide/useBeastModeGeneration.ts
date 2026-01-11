/**
 * BEAST MODE Code Generation Hook
 * 
 * Uses BEAST MODE APIs to generate code from user stories
 * Dogfooding: Using our own tools to build our IDE
 */

import { useState, useCallback } from 'react';

interface GenerationOptions {
  story: {
    id: string;
    title: string;
    category: string;
    as: string;
    want: string;
    soThat: string;
    criteria: string[];
  };
  context?: string;
}

export function useBeastModeGeneration() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCode = useCallback(async (options: GenerationOptions): Promise<string> => {
    setGenerating(true);
    setError(null);

    try {
      const prompt = `Generate React/TypeScript code for this user story:

Title: ${options.story.title}
Category: ${options.story.category}
As: ${options.story.as}
Want: ${options.story.want}
So That: ${options.story.soThat}
Criteria: ${options.story.criteria.join(', ')}

Context: This is for BEAST MODE IDE web application using:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Monaco Editor (@monaco-editor/react)
- xterm.js (@xterm/xterm)
- Tailwind CSS

${options.context || ''}

Generate a complete, production-ready component or feature that implements this user story. Include:
1. Full TypeScript code
2. Proper error handling
3. User feedback
4. Accessibility considerations
5. Performance optimizations

Return only the code, no explanations.`;

      const response = await fetch('/api/beast-mode/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const code = data.text || data.content || data.message || '';

      return code;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  return {
    generateCode,
    generating,
    error,
  };
}
