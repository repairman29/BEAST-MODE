import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const execAsync = promisify(exec);

/**
 * Codebase Indexing API
 * 
 * Indexes the codebase structure, files, dependencies, and architecture
 */
export async function POST(request: NextRequest) {
  try {
    const { repoPath } = await request.json();
    const cwd = repoPath || process.cwd();

    const files: any[] = [];
    const dependencies: Record<string, string[]> = {};
    const imports: Record<string, string[]> = {};
    const exports: Record<string, string[]> = {};
    const patterns: string[] = [];
    const frameworks: string[] = [];

    // Detect structure type
    let structure: 'monorepo' | 'monolith' | 'microservices' | 'unknown' = 'unknown';
    if (readdirSync(cwd).includes('packages') || readdirSync(cwd).includes('apps')) {
      structure = 'monorepo';
    }

    // Detect frameworks
    const packageJsonPath = join(cwd, 'package.json');
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps['next']) frameworks.push('Next.js');
      if (deps['react']) frameworks.push('React');
      if (deps['vue']) frameworks.push('Vue');
      if (deps['angular']) frameworks.push('Angular');
      if (deps['express']) frameworks.push('Express');
      if (deps['fastify']) frameworks.push('Fastify');
      if (deps['nestjs']) frameworks.push('NestJS');
    } catch (e) {
      // No package.json
    }

    // Index files
    function indexDirectory(dir: string, basePath: string = '') {
      try {
        const entries = readdirSync(dir);
        
        for (const entry of entries) {
          // Skip common ignore patterns
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
            indexDirectory(fullPath, relativePath);
          } else if (stat.isFile()) {
            const ext = extname(entry).toLowerCase();
            const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c'];
            
            if (codeExtensions.includes(ext)) {
              try {
                const content = readFileSync(fullPath, 'utf8');
                const language = ext.substring(1);
                
                files.push({
                  path: relativePath,
                  content: content.substring(0, 10000), // Limit content size
                  language,
                  size: stat.size,
                  lastModified: stat.mtime,
                });

                // Extract imports/exports
                if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
                  const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"](.+?)['"]/g);
                  const importList: string[] = [];
                  for (const match of importMatches) {
                    importList.push(match[1]);
                  }
                  if (importList.length > 0) {
                    imports[relativePath] = importList;
                  }

                  const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g);
                  const exportList: string[] = [];
                  for (const match of exportMatches) {
                    exportList.push(match[1]);
                  }
                  if (exportList.length > 0) {
                    exports[relativePath] = exportList;
                  }
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

    indexDirectory(cwd);

    // Detect patterns
    if (files.some(f => f.path.includes('components'))) patterns.push('Component-based');
    if (files.some(f => f.path.includes('hooks'))) patterns.push('Custom Hooks');
    if (files.some(f => f.path.includes('utils'))) patterns.push('Utility Functions');
    if (files.some(f => f.path.includes('api'))) patterns.push('API Routes');
    if (files.some(f => f.path.includes('middleware'))) patterns.push('Middleware');

    return NextResponse.json({
      files: files.slice(0, 1000), // Limit to 1000 files
      dependencies,
      imports,
      exports,
      architecture: {
        patterns,
        frameworks,
        structure,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to index codebase' },
      { status: 500 }
    );
  }
}
