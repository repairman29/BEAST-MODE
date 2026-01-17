import { NextRequest, NextResponse } from 'next/server';

/**
 * Code Explanation API
 * 
 * Explains code blocks, errors, and algorithms
 */
export async function POST(request: NextRequest) {
  try {
    const { code, language, error, context } = await request.json();

    if (!code && !error) {
      return NextResponse.json(
        { error: 'Code or error is required' },
        { status: 400 }
      );
    }

    // Build explanation prompt
    let prompt = '';
    if (error) {
      prompt = `Explain this error and how to fix it:

Error:
\`\`\`
${error}
\`\`\`

${context ? `Context:\n\`\`\`\n${context}\n\`\`\`` : ''}

Provide a clear explanation and step-by-step fix.`;
    } else {
      prompt = `Explain this code in detail:

\`\`\`${language || 'typescript'}
${code}
\`\`\`

${context ? `Context:\n\`\`\`\n${context}\n\`\`\`` : ''}

Explain:
1. What the code does
2. How it works
3. Key concepts
4. Potential issues or improvements`;
    }

    // Use BEAST MODE conversation API
    const response = await fetch(`${request.nextUrl.origin}/api/beast-mode/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        context: {
          type: 'code_explanation',
          language,
        },
        task: 'explain_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get explanation from BEAST MODE');
    }

    const data = await response.json();
    const explanation = data.response || data.message || 'No explanation available';

    return NextResponse.json({
      explanation,
    });
  } catch (error: any) {
    console.error('Code explanation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to explain code' },
      { status: 500 }
    );
  }
}
