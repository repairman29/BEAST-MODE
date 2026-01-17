import { NextRequest, NextResponse } from 'next/server';

/**
 * Inline Suggestions API
 * 
 * Provides real-time AI suggestions while typing
 */
export async function POST(request: NextRequest) {
  try {
    const { file, context, prefix, line, column, openFiles, codebase } = await request.json();

    if (!file || !context) {
      return NextResponse.json(
        { error: 'File and context are required' },
        { status: 400 }
      );
    }

    // Build prompt for inline suggestions
    const prompt = `Given the following code context, suggest the next few tokens to complete the current line.

File: ${file}
Line: ${line}, Column: ${column}

Context:
\`\`\`
${context}
\`\`\`

Current prefix: "${prefix}"

Provide 3-5 short completion suggestions (just the text to insert, not full explanations).
Return as JSON array: ["suggestion1", "suggestion2", ...]`;

    // Use BEAST MODE conversation API for suggestions
    const response = await fetch(`${request.nextUrl.origin}/api/beast-mode/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        context: {
          type: 'inline_suggestion',
          file,
          line,
          column,
          openFiles,
          codebase,
        },
        task: 'inline_suggestion',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get suggestions from BEAST MODE');
    }

    const data = await response.json();
    
    // Parse suggestions from response
    let suggestions: string[] = [];
    if (data.response) {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(data.response);
        if (Array.isArray(parsed)) {
          suggestions = parsed;
        } else if (typeof parsed === 'string') {
          suggestions = [parsed];
        }
      } catch {
        // If not JSON, try to extract suggestions from text
        const lines = data.response.split('\n').filter((l: string) => l.trim());
        suggestions = lines.slice(0, 5);
      }
    }

    // Format as inline suggestions
    const formattedSuggestions = suggestions.map((text, index) => ({
      text: text.trim(),
      confidence: 0.9 - (index * 0.1), // Higher confidence for first suggestion
    }));

    return NextResponse.json({
      suggestions: formattedSuggestions,
    });
  } catch (error: any) {
    console.error('Inline suggestions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
