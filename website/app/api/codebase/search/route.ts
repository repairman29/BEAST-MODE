import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

/**
 * Codebase Search API
 * 
 * Searches codebase for files matching query
 */
export async function POST(request: NextRequest) {
  try {
    const { query, repoPath } = await request.json();
    const cwd = repoPath || process.cwd();

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const results: any[] = [];
    const queryLower = query.toLowerCase();

    function searchDirectory(dir: string, basePath: string = '') {
      try {
        const entries = readdirSync(dir);
        
        for (const entry of entries) {
          if (entry.startsWith('.') || 
              entry === 'node_modules' || 
              entry === 'dist' || 
              entry === 'build' ||
              entry === '.next' ||
              entry === '.git') {
            continue;
          }

          const fullPath = join(dir, entry);
          const relativePath = basePath ? `${basePath}/${entry}` : entry;
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            searchDirectory(fullPath, relativePath);
          } else if (stat.isFile()) {
            // Match filename
            if (entry.toLowerCase().includes(queryLower)) {
              results.push({
                path: relativePath,
                type: 'filename',
                score: 10,
              });
            }

            // Match content
            const ext = extname(entry).toLowerCase();
            const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.md'];
            
            if (codeExtensions.includes(ext)) {
              try {
                const content = readFileSync(fullPath, 'utf8');
                const contentLower = content.toLowerCase();
                
                if (contentLower.includes(queryLower)) {
                  const matches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
                  results.push({
                    path: relativePath,
                    type: 'content',
                    score: matches,
                    preview: content.substring(0, 200),
                  });
                }
              } catch (e) {
                // Skip files that can't be read
              }
            }
          }
        }
      } catch (e) {
        // Skip directories that can't be accessed
      }
    }

    searchDirectory(cwd);

    // Sort by score and limit results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map(r => ({
        path: r.path,
        preview: r.preview,
      }));

    return NextResponse.json({ files: sortedResults });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to search codebase' },
      { status: 500 }
    );
  }
}
