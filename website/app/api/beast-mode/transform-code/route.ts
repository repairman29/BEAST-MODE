import { NextRequest, NextResponse } from 'next/server';

/**
 * Code Transformation API
 * 
 * Transforms code: language conversion, modernization, optimization
 */
export async function POST(request: NextRequest) {
  try {
    const { code, sourceLanguage, transformationType, targetLanguage } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Build transformation prompt
    let prompt = '';
    
    switch (transformationType) {
      case 'convert-language':
        if (!targetLanguage) {
          return NextResponse.json(
            { error: 'Target language is required for conversion' },
            { status: 400 }
          );
        }
        prompt = `Convert this ${sourceLanguage} code to ${targetLanguage}:

\`\`\`${sourceLanguage}
${code}
\`\`\`

Requirements:
- Maintain the same functionality
- Use ${targetLanguage} best practices
- Preserve comments and structure
- Return only the converted code`;
        break;

      case 'modernize':
        prompt = `Modernize this ${sourceLanguage} code to use current best practices:

\`\`\`${sourceLanguage}
${code}
\`\`\`

Requirements:
- Use modern syntax and features
- Follow current best practices
- Maintain backward compatibility if possible
- Return the modernized code`;
        break;

      case 'optimize':
        prompt = `Optimize this ${sourceLanguage} code for performance:

\`\`\`${sourceLanguage}
${code}
\`\`\`

Requirements:
- Improve performance
- Maintain functionality
- Add performance comments
- Return the optimized code`;
        break;

      case 'add-error-handling':
        prompt = `Add comprehensive error handling to this ${sourceLanguage} code:

\`\`\`${sourceLanguage}
${code}
\`\`\`

Requirements:
- Add try-catch blocks where needed
- Handle edge cases
- Provide meaningful error messages
- Return the code with error handling`;
        break;

      case 'add-type-safety':
        prompt = `Add type safety to this ${sourceLanguage} code:

\`\`\`${sourceLanguage}
${code}
\`\`\`

Requirements:
- Add type annotations
- Use strict typing
- Maintain functionality
- Return the typed code`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid transformation type' },
          { status: 400 }
        );
    }

    // Use BEAST MODE conversation API
    const response = await fetch(`${request.nextUrl.origin}/api/beast-mode/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        context: {
          type: 'code_transformation',
          transformationType,
          sourceLanguage,
          targetLanguage,
        },
        task: 'transform_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to transform code');
    }

    const data = await response.json();
    let transformedCode = data.response || data.code || '';

    // Extract code from markdown if present
    if (transformedCode.includes('```')) {
      const codeMatch = transformedCode.match(/```[\w]*\n([\s\S]*?)```/);
      if (codeMatch) {
        transformedCode = codeMatch[1];
      }
    }

    return NextResponse.json({
      code: transformedCode,
      transformedCode,
      language: transformationType === 'convert-language' ? targetLanguage : sourceLanguage,
    });
  } catch (error: any) {
    console.error('Code transformation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transform code' },
      { status: 500 }
    );
  }
}
