import { NextRequest, NextResponse } from 'next/server';

/**
 * Multi-File Generation API
 * 
 * Generates multiple related files with consistency
 */
export async function POST(request: NextRequest) {
  try {
    const { description, files, context } = await request.json();

    if (!description && !files) {
      return NextResponse.json(
        { error: 'Description or files specification is required' },
        { status: 400 }
      );
    }

    // Build prompt for multi-file generation
    let prompt = '';
    
    if (files && Array.isArray(files)) {
      // Generate specific files
      prompt = `Generate the following files with consistent structure and patterns:

Files to generate:
${files.map((f: any) => `- ${f.path} (${f.language || 'typescript'})`).join('\n')}

${description ? `Description: ${description}` : ''}

${context ? `Context:\n\`\`\`\n${JSON.stringify(context, null, 2)}\n\`\`\`` : ''}

Requirements:
- All files should work together
- Maintain consistent patterns
- Update imports/exports correctly
- Return JSON with files array: { "files": [{ "path": "...", "content": "...", "language": "..." }] }`;
    } else {
      // Generate based on description
      prompt = `Generate multiple related files based on this description:

${description}

${context ? `Context:\n\`\`\`\n${JSON.stringify(context, null, 2)}\n\`\`\`` : ''}

Requirements:
- Generate all necessary files
- Maintain consistency across files
- Proper imports/exports
- Return JSON with files array: { "files": [{ "path": "...", "content": "...", "language": "..." }] }`;
    }

    // Use BEAST MODE conversation API
    const response = await fetch(`${request.nextUrl.origin}/api/beast-mode/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        context: {
          type: 'multi_file_generation',
          files,
        },
        task: 'generate_multiple_files',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate files');
    }

    const data = await response.json();
    
    // Parse response
    let generatedFiles: Array<{ path: string; content: string; language: string }> = [];
    
    if (data.code && Array.isArray(data.code.files)) {
      generatedFiles = data.code.files;
    } else if (data.response) {
      try {
        // Try to parse JSON from response
        const parsed = JSON.parse(data.response);
        if (parsed.files && Array.isArray(parsed.files)) {
          generatedFiles = parsed.files;
        }
      } catch {
        // If not JSON, try to extract from markdown
        const codeBlocks = data.response.match(/```[\w]*\n([\s\S]*?)```/g);
        if (codeBlocks) {
          generatedFiles = codeBlocks.map((block: string, index: number) => {
            const content = block.replace(/```[\w]*\n/, '').replace(/```$/, '');
            return {
              path: `file${index + 1}.ts`,
              content: content.trim(),
              language: 'typescript',
            };
          });
        }
      }
    }

    return NextResponse.json({
      files: generatedFiles,
      count: generatedFiles.length,
    });
  } catch (error: any) {
    console.error('Multi-file generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate files' },
      { status: 500 }
    );
  }
}
