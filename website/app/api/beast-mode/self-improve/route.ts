import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

/**
 * Self-Improvement Analysis API
 * 
 * Analyzes the BEAST MODE website itself and provides improvement recommendations
 */
async function analyzeCodebase() {
  const issues: any[] = [];
  const recommendations: any[] = [];
  let totalFiles = 0;
  let totalLines = 0;
  let hasErrorBoundary = false;
  let hasAnalytics = false;
  let hasSEO = false;
  let hasLazyLoading = false;
  let largeComponents = 0;

  try {
    // Analyze components directory
    const componentsPath = join(process.cwd(), 'components');
    const files = await getAllFiles(componentsPath);
    
    for (const file of files) {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        totalFiles++;
        const content = await readFile(file, 'utf-8');
        const lines = content.split('\n').length;
        totalLines += lines;

        // Check for error boundaries
        if (content.includes('ErrorBoundary') || content.includes('componentDidCatch')) {
          hasErrorBoundary = true;
        }

        // Check for analytics
        if (content.includes('analytics') || content.includes('gtag') || content.includes('plausible')) {
          hasAnalytics = true;
        }

        // Check for lazy loading
        if (content.includes('lazy') || content.includes('dynamic') || content.includes('React.lazy')) {
          hasLazyLoading = true;
        }

        // Check for large components (>500 lines)
        if (lines > 500) {
          largeComponents++;
          issues.push({
            type: 'maintainability',
            file: file.replace(process.cwd(), ''),
            message: `Large component file (${lines} lines) - consider splitting into smaller components`,
            priority: 'medium'
          });
        }

        // Check for missing error handling
        if (content.includes('fetch(') && !content.includes('catch') && !content.includes('try')) {
          issues.push({
            type: 'reliability',
            file: file.replace(process.cwd(), ''),
            message: 'Missing error handling for fetch calls',
            priority: 'high'
          });
        }

        // Check for console.logs in production code
        if (content.includes('console.log') && !file.includes('.test.')) {
          issues.push({
            type: 'code-quality',
            file: file.replace(process.cwd(), ''),
            message: 'Remove console.log statements from production code',
            priority: 'low'
          });
        }
      }
    }

    // Check layout.tsx for SEO
    try {
      const layoutPath = join(process.cwd(), 'app', 'layout.tsx');
      const layoutContent = await readFile(layoutPath, 'utf-8');
      if (layoutContent.includes('metadata') && layoutContent.includes('openGraph')) {
        hasSEO = true;
      }
    } catch {
      // Layout file might not exist
    }

    // Generate recommendations based on findings
    if (!hasErrorBoundary) {
      recommendations.push({
        title: 'Implement Error Boundaries',
        description: 'Add React error boundaries to prevent full page crashes when components fail.',
        priority: 'high',
        category: 'reliability',
        action: 'Create an ErrorBoundary component and wrap main app sections'
      });
    }

    if (!hasAnalytics) {
      recommendations.push({
        title: 'Add Analytics Tracking',
        description: 'Implement analytics to track user behavior and improve UX decisions.',
        priority: 'medium',
        category: 'analytics',
        action: 'Integrate analytics service (e.g., Plausible, Vercel Analytics)'
      });
    }

    if (!hasSEO) {
      recommendations.push({
        title: 'Enhance SEO Metadata',
        description: 'Add comprehensive meta tags and Open Graph data for better search visibility.',
        priority: 'medium',
        category: 'seo',
        action: 'Update layout.tsx with complete metadata object'
      });
    }

    if (!hasLazyLoading && totalFiles > 10) {
      recommendations.push({
        title: 'Implement Code Splitting',
        description: 'Use lazy loading for better initial page load performance.',
        priority: 'high',
        category: 'performance',
        action: 'Implement React.lazy() for route-based code splitting'
      });
    }

    if (largeComponents > 0) {
      recommendations.push({
        title: 'Refactor Large Components',
        description: `${largeComponents} component(s) exceed 500 lines. Split them into smaller, more maintainable pieces.`,
        priority: 'medium',
        category: 'maintainability',
        action: 'Break down large components into smaller, focused components'
      });
    }

    // Calculate quality score
    let score = 100;
    score -= issues.filter(i => i.priority === 'high').length * 5;
    score -= issues.filter(i => i.priority === 'medium').length * 2;
    score -= issues.filter(i => i.priority === 'low').length * 1;
    score = Math.max(50, Math.min(100, score));

    return {
      currentScore: Math.round(score),
      totalFiles,
      totalLines,
      issues: issues.slice(0, 20), // Limit to top 20 issues
      recommendations,
      metrics: {
        hasErrorBoundary,
        hasAnalytics,
        hasSEO,
        hasLazyLoading,
        largeComponents
      }
    };
  } catch (error: any) {
    console.error('Codebase analysis error:', error);
    throw error;
  }
}

async function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): Promise<string[]> {
  try {
    const files = await readdir(dirPath);

    for (const file of files) {
      const filePath = join(dirPath, file);
      const fileStat = await stat(filePath);
      
      if (fileStat.isDirectory()) {
        arrayOfFiles = await getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    }
  } catch (error) {
    // Directory might not exist or be accessible
  }

  return arrayOfFiles;
}

export async function POST(request: NextRequest) {
  try {
    const analysis = await analyzeCodebase();

    return NextResponse.json({
      ...analysis,
      analyzedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Self-improvement analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    );
  }
}

