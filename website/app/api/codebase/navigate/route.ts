import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

/**
 * Code Navigation API
 * 
 * Provides "Go to Definition" and "Find References"
 */
export async function POST(request: NextRequest) {
  try {
    const { action, file, line, column, query, repoPath } = await request.json();
    const cwd = repoPath || process.cwd();

    if (action === 'definition') {
      // Simple definition finding - look for function/class/variable definitions
      const filePath = join(cwd, file);
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const currentLine = lines[line - 1] || '';
      
      // Extract symbol name at cursor position
      const beforeCursor = currentLine.substring(0, column);
      const afterCursor = currentLine.substring(column);
      
      // Try to find the symbol name
      const symbolMatch = beforeCursor.match(/(\w+)\s*$/);
      if (!symbolMatch) {
        return NextResponse.json({ location: null });
      }
      
      const symbolName = symbolMatch[1];
      
      // Search for definition in current file and imports
      const definition = findDefinitionInFile(content, symbolName, file);
      if (definition) {
        return NextResponse.json({ location: definition });
      }
      
      // Search in imported files
      const imports = extractImports(content);
      for (const importPath of imports) {
        const importedFile = resolveImport(importPath, file, cwd);
        if (importedFile) {
          try {
            const importedContent = readFileSync(importedFile, 'utf8');
            const def = findDefinitionInFile(importedContent, symbolName, importedFile);
            if (def) {
              return NextResponse.json({ location: def });
            }
          } catch (e) {
            // File not found, continue
          }
        }
      }
      
      return NextResponse.json({ location: null });
    }

    if (action === 'references') {
      const filePath = join(cwd, file);
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const currentLine = lines[line - 1] || '';
      
      const symbolMatch = currentLine.substring(0, column).match(/(\w+)\s*$/);
      if (!symbolMatch) {
        return NextResponse.json({ references: [] });
      }
      
      const symbolName = symbolMatch[1];
      const references = findReferencesInCodebase(symbolName, cwd, file);
      
      return NextResponse.json({ references });
    }

    if (action === 'symbol') {
      if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
      }
      
      const symbols = findSymbolsInCodebase(query, cwd);
      return NextResponse.json({ symbols });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Navigation failed' },
      { status: 500 }
    );
  }
}

function findDefinitionInFile(content: string, symbolName: string, filePath: string): any | null {
  const lines = content.split('\n');
  
  // Look for function definitions
  const functionRegex = new RegExp(`(?:function|const|let|var|export\\s+(?:function|const|let|var|class|interface|type))\\s+${symbolName}\\s*[=(]`, 'g');
  // Look for class definitions
  const classRegex = new RegExp(`(?:class|interface|type)\\s+${symbolName}\\s*[<{=]`, 'g');
  
  for (let i = 0; i < lines.length; i++) {
    if (functionRegex.test(lines[i]) || classRegex.test(lines[i])) {
      return {
        file: filePath,
        line: i + 1,
        column: lines[i].indexOf(symbolName),
        name: symbolName,
        kind: lines[i].includes('class') ? 'class' : 
              lines[i].includes('interface') ? 'interface' :
              lines[i].includes('type') ? 'type' : 'function',
      };
    }
  }
  
  return null;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function resolveImport(importPath: string, currentFile: string, cwd: string): string | null {
  // Simple import resolution - handle relative and absolute paths
  if (importPath.startsWith('.')) {
    const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/'));
    const resolved = join(cwd, currentDir, importPath);
    
    // Try common extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
    for (const ext of extensions) {
      const withExt = resolved + ext;
      try {
        if (statSync(withExt).isFile()) {
          return withExt;
        }
      } catch (e) {
        // Try index file
        try {
          const indexFile = join(resolved, `index${ext}`);
          if (statSync(indexFile).isFile()) {
            return indexFile;
          }
        } catch (e2) {
          // Continue
        }
      }
    }
  }
  
  return null;
}

function findReferencesInCodebase(symbolName: string, cwd: string, excludeFile: string): any[] {
  const references: any[] = [];
  
  function searchDirectory(dir: string) {
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'node_modules') continue;
        
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = extname(entry);
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            const relativePath = fullPath.replace(cwd + '/', '');
            if (relativePath === excludeFile) continue;
            
            try {
              const content = readFileSync(fullPath, 'utf8');
              const lines = content.split('\n');
              
              lines.forEach((line, index) => {
                const regex = new RegExp(`\\b${symbolName}\\b`, 'g');
                let match;
                while ((match = regex.exec(line)) !== null) {
                  references.push({
                    file: relativePath,
                    line: index + 1,
                    column: match.index,
                    context: line.trim().substring(0, 80),
                  });
                }
              });
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
  return references.slice(0, 50); // Limit results
}

function findSymbolsInCodebase(query: string, cwd: string): any[] {
  const symbols: any[] = [];
  const queryLower = query.toLowerCase();
  
  function searchDirectory(dir: string) {
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'node_modules') continue;
        
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = extname(entry);
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            const relativePath = fullPath.replace(cwd + '/', '');
            
            try {
              const content = readFileSync(fullPath, 'utf8');
              const lines = content.split('\n');
              
              // Find function/class definitions
              const definitionRegex = /(?:function|class|interface|type|const|let|var|export\s+(?:function|class|interface|type|const|let|var))\s+(\w+)/g;
              
              lines.forEach((line, index) => {
                let match;
                while ((match = definitionRegex.exec(line)) !== null) {
                  const symbolName = match[1];
                  if (symbolName.toLowerCase().includes(queryLower)) {
                    symbols.push({
                      file: relativePath,
                      line: index + 1,
                      column: line.indexOf(symbolName),
                      name: symbolName,
                      kind: line.includes('class') ? 'class' :
                            line.includes('interface') ? 'interface' :
                            line.includes('type') ? 'type' :
                            line.includes('function') ? 'function' : 'variable',
                    });
                  }
                }
              });
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
  return symbols.slice(0, 20); // Limit results
}
