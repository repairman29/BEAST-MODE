import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

/**
 * Apply Fix API
 * 
 * Applies recommended fixes to the codebase with real file modifications
 */

interface FixResult {
  success: boolean;
  message: string;
  filesModified: string[];
  changes: string[];
  error?: string;
}

async function removeConsoleLogs(filePath: string): Promise<FixResult> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const originalContent = content;
    
    // Remove console.log statements (but keep console.error and console.warn)
    const modified = content
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        // Remove standalone console.log lines
        if (trimmed.startsWith('console.log(') || trimmed.match(/^\s*console\.log\(/)) {
          return false;
        }
        // Remove console.log from inline code (be careful with this)
        return true;
      })
      .join('\n')
      .replace(/console\.log\([^)]*\);?\s*/g, '');

    if (modified !== originalContent) {
      await writeFile(filePath, modified, 'utf-8');
      const removedCount = (originalContent.match(/console\.log\(/g) || []).length;
      return {
        success: true,
        message: `Removed ${removedCount} console.log statement(s)`,
        filesModified: [filePath],
        changes: [`Removed ${removedCount} console.log statement(s) from ${filePath}`]
      };
    }

    return {
      success: true,
      message: 'No console.log statements found',
      filesModified: [],
      changes: []
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to remove console.log statements',
      filesModified: [],
      changes: [],
      error: error.message
    };
  }
}

async function addErrorHandling(filePath: string): Promise<FixResult> {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    // Check if file already has error handling
    if (content.includes('try {') && content.includes('catch')) {
      return {
        success: true,
        message: 'Error handling already present',
        filesModified: [],
        changes: []
      };
    }

    // Find fetch calls without error handling
    const fetchRegex = /(fetch\([^)]+\))/g;
    const matches = content.match(fetchRegex);
    
    if (!matches || matches.length === 0) {
      return {
        success: true,
        message: 'No fetch calls found',
        filesModified: [],
        changes: []
      };
    }

    let modified = content;
    let changes: string[] = [];

    // Wrap fetch calls in try-catch blocks
    matches.forEach((match, index) => {
      const fetchCall = match;
      // Check if already wrapped
      if (!content.includes(`try {`) || !content.includes(`catch`)) {
        // Simple approach: wrap the entire function or add try-catch around fetch
        // This is a simplified implementation - in production, use AST parsing
        const wrapped = `try {\n      ${fetchCall}\n    } catch (error) {\n      console.error('Fetch error:', error);\n      throw error;\n    }`;
        modified = modified.replace(fetchCall, wrapped);
        changes.push(`Added error handling for fetch call ${index + 1}`);
      }
    });

    if (modified !== content) {
      await writeFile(filePath, modified, 'utf-8');
      return {
        success: true,
        message: `Added error handling to ${matches.length} fetch call(s)`,
        filesModified: [filePath],
        changes
      };
    }

    return {
      success: true,
      message: 'Error handling already present',
      filesModified: [],
      changes: []
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to add error handling',
      filesModified: [],
      changes: [],
      error: error.message
    };
  }
}

async function createErrorBoundary(): Promise<FixResult> {
  try {
    const componentsDir = join(process.cwd(), 'components', 'ui');
    const errorBoundaryPath = join(componentsDir, 'ErrorBoundary.tsx');

    // Check if already exists
    if (existsSync(errorBoundaryPath)) {
      return {
        success: true,
        message: 'ErrorBoundary component already exists',
        filesModified: [],
        changes: []
      };
    }

    // Ensure directory exists
    await mkdir(componentsDir, { recursive: true });

    const errorBoundaryCode = `"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-slate-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
`;

    await writeFile(errorBoundaryPath, errorBoundaryCode, 'utf-8');

    return {
      success: true,
      message: 'Created ErrorBoundary component',
      filesModified: [errorBoundaryPath],
      changes: ['Created ErrorBoundary component at components/ui/ErrorBoundary.tsx']
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to create ErrorBoundary',
      filesModified: [],
      changes: [],
      error: error.message
    };
  }
}

async function enhanceSEOMetadata(): Promise<FixResult> {
  try {
    const layoutPath = join(process.cwd(), 'app', 'layout.tsx');
    
    if (!existsSync(layoutPath)) {
      return {
        success: false,
        message: 'layout.tsx not found',
        filesModified: [],
        changes: [],
        error: 'layout.tsx does not exist'
      };
    }

    const content = await readFile(layoutPath, 'utf-8');

    // Check if metadata already exists
    if (content.includes('export const metadata') && content.includes('openGraph')) {
      return {
        success: true,
        message: 'SEO metadata already enhanced',
        filesModified: [],
        changes: []
      };
    }

    // Add comprehensive metadata
    const metadataCode = `
export const metadata = {
  title: 'BEAST MODE - Enterprise Quality Intelligence Platform',
  description: 'AI-powered quality intelligence and marketplace platform for enterprise development teams. Improve code quality, reduce errors, and accelerate development.',
  keywords: ['code quality', 'AI', 'enterprise', 'development', 'quality intelligence'],
  authors: [{ name: 'BEAST MODE Team' }],
  openGraph: {
    title: 'BEAST MODE - Enterprise Quality Intelligence',
    description: 'AI-powered quality intelligence platform for enterprise development teams',
    type: 'website',
    locale: 'en_US',
    siteName: 'BEAST MODE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BEAST MODE - Enterprise Quality Intelligence',
    description: 'AI-powered quality intelligence platform',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};
`;

    // Insert metadata before the default export or at the top
    let modified = content;
    if (!content.includes('export const metadata')) {
      // Find a good insertion point (after imports, before component)
      const importEnd = content.lastIndexOf("import");
      const importEndLine = content.indexOf('\n', importEnd) + 1;
      modified = content.slice(0, importEndLine) + metadataCode + '\n' + content.slice(importEndLine);
    }

    if (modified !== content) {
      await writeFile(layoutPath, modified, 'utf-8');
      return {
        success: true,
        message: 'Enhanced SEO metadata',
        filesModified: [layoutPath],
        changes: ['Added comprehensive SEO metadata to layout.tsx']
      };
    }

    return {
      success: true,
      message: 'SEO metadata already enhanced',
      filesModified: [],
      changes: []
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to enhance SEO metadata',
      filesModified: [],
      changes: [],
      error: error.message
    };
  }
}

async function commitChanges(filesModified: string[], recommendationTitle: string, options: { commit?: boolean; push?: boolean; deploy?: boolean } = {}): Promise<{ success: boolean; message: string; commitHash?: string; error?: string }> {
  try {
    // Check if git is available
    try {
      execSync('git --version', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        message: 'Git is not available',
        error: 'Git command not found'
      };
    }

    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        message: 'Not in a git repository',
        error: 'No .git directory found'
      };
    }

    if (!options.commit) {
      return {
        success: true,
        message: 'Commit skipped (not requested)'
      };
    }

    // Stage modified files
    if (filesModified.length > 0) {
      filesModified.forEach(file => {
        try {
          const fullPath = join(process.cwd(), file);
          if (existsSync(fullPath)) {
            execSync(`git add "${fullPath}"`, { stdio: 'pipe' });
          }
        } catch (error) {
          console.warn(`Failed to stage ${file}:`, error);
        }
      });
    } else {
      // Stage all changes if no specific files
      execSync('git add .', { stdio: 'pipe' });
    }

    // Create commit message
    const commitMessage = `fix: ${recommendationTitle}

Applied via BEAST MODE Self-Improvement
Files modified: ${filesModified.length}
Timestamp: ${new Date().toISOString()}

${filesModified.slice(0, 5).map(f => `- ${f}`).join('\n')}${filesModified.length > 5 ? `\n- ... and ${filesModified.length - 5} more` : ''}`;

    // Commit
    execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    
    // Get commit hash
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

    let message = `Committed changes (${commitHash.substring(0, 7)})`;

    // Push if requested
    if (options.push) {
      try {
        execSync('git push origin HEAD', { stdio: 'pipe' });
        message += ' and pushed to remote';
      } catch (error: any) {
        return {
          success: true,
          message: `Committed but push failed: ${error.message}`,
          commitHash
        };
      }
    }

    // Deploy if requested (this would trigger your deployment workflow)
    if (options.deploy) {
      try {
        // Check if there's a deploy script
        const packageJsonPath = join(process.cwd(), 'package.json');
        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
          if (packageJson.scripts?.deploy) {
            execSync('npm run deploy', { stdio: 'pipe' });
            message += ' and deployed';
          } else {
            message += ' (deploy script not found)';
          }
        }
      } catch (error: any) {
        return {
          success: true,
          message: `${message} (deploy failed: ${error.message})`,
          commitHash
        };
      }
    }

    return {
      success: true,
      message,
      commitHash
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to commit changes',
      error: error.message
    };
  }
}

async function addAnalytics(): Promise<FixResult> {
  try {
    const layoutPath = join(process.cwd(), 'app', 'layout.tsx');
    
    if (!existsSync(layoutPath)) {
      return {
        success: false,
        message: 'layout.tsx not found',
        filesModified: [],
        changes: [],
        error: 'layout.tsx does not exist'
      };
    }

    const content = await readFile(layoutPath, 'utf-8');

    // Check if analytics already exists
    if (content.includes('gtag') || content.includes('plausible') || content.includes('analytics')) {
      return {
        success: true,
        message: 'Analytics already configured',
        filesModified: [],
        changes: []
      };
    }

    // Add Vercel Analytics (simple approach)
    const analyticsScript = `
      {/* Analytics */}
      {process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID && (
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=" + process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID}
        />
      )}
      {process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID && (
        <script
          dangerouslySetInnerHTML={{
            __html: \`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '\${process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID}');
            \`,
          }}
        />
      )}
    `;

    // Find the closing </head> tag and insert before it
    const headEnd = content.indexOf('</head>');
    if (headEnd === -1) {
      return {
        success: false,
        message: 'Could not find </head> tag',
        filesModified: [],
        changes: [],
        error: 'Invalid HTML structure'
      };
    }

    const modified = content.slice(0, headEnd) + analyticsScript + '\n      ' + content.slice(headEnd);

    await writeFile(layoutPath, modified, 'utf-8');

    return {
      success: true,
      message: 'Added analytics tracking',
      filesModified: [layoutPath],
      changes: ['Added Google Analytics/Vercel Analytics script to layout.tsx']
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to add analytics',
      filesModified: [],
      changes: [],
      error: error.message
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recommendation, fixType, gitOptions = {} } = await request.json();

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation is required' },
        { status: 400 }
      );
    }

    // gitOptions: { commit: boolean, push: boolean, deploy: boolean }

    const title = recommendation.title || fixType || '';
    let result: FixResult;

    // Route to appropriate fix function based on recommendation title
    if (title.includes('Error Boundary') || title.includes('error boundary')) {
      result = await createErrorBoundary();
    } else if (title.includes('console.log') || title.includes('Remove console')) {
      // Find files with console.log
      const componentsPath = join(process.cwd(), 'components');
      const files: string[] = [];
      
      const getAllFiles = async (dir: string): Promise<void> => {
        try {
          if (!existsSync(dir)) return;
          const entries = await readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
              await getAllFiles(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
              try {
                const content = await readFile(fullPath, 'utf-8');
                if (content.includes('console.log')) {
                  files.push(fullPath);
                }
              } catch {
                // Skip files that can't be read
              }
            }
          }
        } catch {
          // Ignore errors
        }
      };

      await getAllFiles(componentsPath);
      
      if (files.length === 0) {
        result = {
          success: true,
          message: 'No files with console.log found',
          filesModified: [],
          changes: []
        };
      } else {
        const results = await Promise.all(files.slice(0, 5).map(file => removeConsoleLogs(file)));
        const allModified = results.flatMap(r => r.filesModified);
        const allChanges = results.flatMap(r => r.changes);
        result = {
          success: true,
          message: `Removed console.log from ${allModified.length} file(s)`,
          filesModified: allModified,
          changes: allChanges
        };
      }
    } else if (title.includes('error handling') || title.includes('Error handling')) {
      // Find files with fetch calls
      const componentsPath = join(process.cwd(), 'components');
      const files: string[] = [];
      
      const getAllFiles = async (dir: string): Promise<void> => {
        try {
          if (!existsSync(dir)) return;
          const entries = await readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
              await getAllFiles(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
              try {
                const content = await readFile(fullPath, 'utf-8');
                if (content.includes('fetch(') && !content.includes('try {')) {
                  files.push(fullPath);
                }
              } catch {
                // Skip files that can't be read
              }
            }
          }
        } catch {
          // Ignore errors
        }
      };

      await getAllFiles(componentsPath);
      
      if (files.length === 0) {
        result = {
          success: true,
          message: 'No files needing error handling found',
          filesModified: [],
          changes: []
        };
      } else {
        const results = await Promise.all(files.slice(0, 3).map(file => addErrorHandling(file)));
        const allModified = results.flatMap(r => r.filesModified);
        const allChanges = results.flatMap(r => r.changes);
        result = {
          success: true,
          message: `Added error handling to ${allModified.length} file(s)`,
          filesModified: allModified,
          changes: allChanges
        };
      }
    } else if (title.includes('SEO') || title.includes('metadata')) {
      result = await enhanceSEOMetadata();
    } else if (title.includes('Analytics') || title.includes('analytics')) {
      result = await addAnalytics();
    } else {
      // Generic fallback
      result = {
        success: false,
        message: `Fix type "${title}" not yet implemented`,
        filesModified: [],
        changes: [],
        error: 'Unknown fix type'
      };
    }

    // Commit changes if requested and fix was successful
    let gitResult = null;
    if (result.success && result.filesModified.length > 0 && gitOptions.commit) {
      gitResult = await commitChanges(
        result.filesModified.map(f => f.replace(process.cwd(), '')),
        title,
        gitOptions
      );
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      recommendation: title,
      filesModified: result.filesModified.map(f => f.replace(process.cwd(), '')),
      changes: result.changes,
      timestamp: new Date().toISOString(),
      error: result.error,
      git: gitResult ? {
        committed: gitResult.success,
        message: gitResult.message,
        commitHash: gitResult.commitHash,
        error: gitResult.error
      } : null
    });

  } catch (error: any) {
    console.error('Apply fix error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply fix',
        details: error.message,
        filesModified: [],
        changes: []
      },
      { status: 500 }
    );
  }
}
