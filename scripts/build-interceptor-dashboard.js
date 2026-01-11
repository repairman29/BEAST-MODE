#!/usr/bin/env node

/**
 * Build Interceptor Dashboard using BEAST MODE APIs
 * 
 * Uses BEAST MODE's codebase chat API to generate the Interceptor Dashboard component
 * 
 * Usage:
 *   node scripts/build-interceptor-dashboard.js --user-id=YOUR_USER_ID
 */

const BASE_URL = process.env.BEAST_MODE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://beast-mode.dev';
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Parse command line arguments
const args = process.argv.slice(2);
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const userId = userIdArg ? userIdArg.split('=')[1] : process.env.TEST_USER_ID || null;

if (!userId) {
  console.error('❌ User ID required');
  console.error('   Usage: node scripts/build-interceptor-dashboard.js --user-id=YOUR_USER_ID');
  process.exit(1);
}

/**
 * Make HTTP request to BEAST MODE API
 */
async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `github_oauth_user_id=${userId}`,
    ...options.headers
  };
  
  try {
    const response = await axios({
      url: fullUrl,
      method: options.method || 'POST',
      headers,
      data: options.body || options.data,
      timeout: 120000 // 2 minute timeout for code generation
    });
    
    return {
      ok: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      ok: false,
      status: error.response?.status || 500,
      data: error.response?.data || { error: error.message }
    };
  }
}

/**
 * Generate component using BEAST MODE API
 */
async function generateComponent(componentName, description, requirements) {
  console.log(`\n🤖 Generating ${componentName} using BEAST MODE API...`);
  console.log('='.repeat(60));
  
  const prompt = `Generate a complete, production-ready React TypeScript component for BEAST MODE.

Component: ${componentName}
Description: ${description}

Requirements:
${requirements}

Context:
- This is for BEAST MODE (beast-mode.dev) - an enterprise quality intelligence platform
- Use Next.js 14+ App Router patterns
- Use TypeScript with strict types
- Use Tailwind CSS for styling
- Follow existing BEAST MODE component patterns
- Use shadcn/ui components where applicable (Card, Button, etc.)
- Include proper error handling
- Include loading states
- Make it responsive and accessible

Reference existing components:
- website/components/beast-mode/JanitorDashboard.tsx (for dashboard patterns)
- website/components/beast-mode/BeastModeDashboard.tsx (for tab/view patterns)
- website/components/ui/card.tsx (for Card components)

Return ONLY the complete TypeScript React component code. No markdown, no explanations, just the code.
The component should be ready to use immediately.`;

  const result = await request('/api/codebase/chat', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: `build-${componentName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      message: prompt,
      repo: 'BEAST-MODE-PRODUCT',
      useLLM: true,
      // Auto-selects best model (custom or provider)
    })
  });
  
  if (result.ok && result.data) {
    let code = result.data.code || result.data.message || '';
    
    // Extract code from markdown if present
    if (code.includes('```')) {
      const codeBlockMatch = code.match(/```(?:tsx|typescript|ts)?\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        code = codeBlockMatch[1].trim();
      } else {
        // Remove markdown code blocks
        code = code.replace(/```(?:tsx|typescript|ts)?\n?/g, '').replace(/```\n?/g, '').trim();
      }
    }
    
    if (code.length > 100) {
      console.log(`   ✅ Code generated!`);
      console.log(`   📝 Code length: ${code.length} characters`);
      console.log(`   🤖 Model: ${result.data.model || 'auto-selected'}`);
      return code;
    } else {
      console.log(`   ⚠️  Generated code too short (${code.length} chars)`);
      return null;
    }
  } else {
    console.log(`   ❌ Generation failed: ${result.data?.error || 'Unknown error'}`);
    return null;
  }
}

/**
 * Build Interceptor Dashboard
 */
async function buildInterceptorDashboard() {
  console.log('🛡️  Building Interceptor Dashboard');
  console.log('='.repeat(60));
  
  const componentDir = path.join(__dirname, '../website/components/beast-mode');
  const componentPath = path.join(componentDir, 'InterceptorDashboard.tsx');
  
  // Ensure directory exists
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }
  
  const requirements = `
1. Component Name: InterceptorDashboard
2. Purpose: Display intercepted commits from Brand/Reputation/Secret Interceptor
3. Features:
   - List of intercepted commits with filters (repo, status, severity)
   - Statistics cards (total intercepted, by type, by severity)
   - Issue details with expandable cards
   - Status management (mark as reviewed, approved, rejected)
   - Real-time updates
   - Search and filter functionality
   - Export capabilities

4. API Integration:
   - GET /api/intercepted-commits - Fetch intercepted commits
   - POST /api/intercepted-commits - Update status
   - Use fetch with proper error handling

5. UI Requirements:
   - Use Card components for statistics
   - Use Table or Card list for intercepted commits
   - Include filters (repo dropdown, status filter, severity filter)
   - Include search input
   - Show loading states
   - Show empty states
   - Responsive design
   - Dark mode compatible

6. Data Structure:
   - Each intercepted commit has: id, repo_name, file_path, issues[], status, intercepted_at
   - Issues have: type, severity, name, message, file, line

7. State Management:
   - Use React hooks (useState, useEffect)
   - Fetch data on mount
   - Handle filters and search
   - Optimistic updates for status changes

8. Styling:
   - Use Tailwind CSS
   - Match BEAST MODE design system
   - Use cyan/magenta accent colors
   - Dark background (slate-950)
`;

  const code = await generateComponent(
    'InterceptorDashboard',
    'Dashboard for viewing and managing intercepted commits from Brand/Reputation/Secret Interceptor',
    requirements
  );
  
  if (code) {
    // Write component file
    fs.writeFileSync(componentPath, code, 'utf8');
    console.log(`\n✅ Component written to: ${componentPath}`);
    
    // Also create a stats API endpoint
    console.log('\n📊 Generating stats API endpoint...');
    await buildStatsAPI();
    
    return true;
  } else {
    console.log('\n❌ Failed to generate component');
    return false;
  }
}

/**
 * Build stats API endpoint
 */
async function buildStatsAPI() {
  const apiDir = path.join(__dirname, '../website/app/api/intercepted-commits');
  const statsPath = path.join(apiDir, 'stats/route.ts');
  
  // Ensure directory exists
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  if (!fs.existsSync(path.join(apiDir, 'stats'))) {
    fs.mkdirSync(path.join(apiDir, 'stats'), { recursive: true });
  }
  
  const requirements = `
1. Endpoint: GET /api/intercepted-commits/stats
2. Purpose: Get statistics about intercepted commits
3. Features:
   - Total count
   - Count by type (secret, internal_document, business_content)
   - Count by severity (critical, high, medium, low)
   - Count by status (intercepted, reviewed, approved, rejected)
   - Recent activity (last 7 days, 30 days)
   - Top repositories by interception count

4. Implementation:
   - Use Supabase to query intercepted_commits table
   - Aggregate data using SQL
   - Return JSON response
   - Handle errors gracefully

5. Response Format:
   {
     "total": number,
     "byType": { "secret": number, "internal_document": number, "business_content": number },
     "bySeverity": { "critical": number, "high": number, "medium": number, "low": number },
     "byStatus": { "intercepted": number, "reviewed": number, "approved": number, "rejected": number },
     "recent": { "last7Days": number, "last30Days": number },
     "topRepos": Array<{ repo_name: string, count: number }>
   }
`;

  const code = await generateComponent(
    'Stats API Endpoint',
    'API endpoint for intercepted commits statistics',
    requirements
  );
  
  if (code) {
    // Ensure it's a proper Next.js API route
    let apiCode = code;
    if (!code.includes('export async function GET')) {
      // Wrap in Next.js API route format
      apiCode = `import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

${code}`;
    }
    
    fs.writeFileSync(statsPath, apiCode, 'utf8');
    console.log(`   ✅ Stats API written to: ${statsPath}`);
    return true;
  } else {
    console.log(`   ⚠️  Stats API generation failed, creating basic version...`);
    // Create basic version
    const basicStats = `import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/intercepted-commits/stats
 * 
 * Get statistics about intercepted commits
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all intercepted commits
    const { data: commits, error } = await supabase
      .from('intercepted_commits')
      .select('*');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch stats', details: error.message },
        { status: 500 }
      );
    }

    const stats = {
      total: commits?.length || 0,
      byType: {},
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byStatus: {},
      recent: {
        last7Days: 0,
        last30Days: 0
      },
      topRepos: []
    };

    // Calculate stats
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    commits?.forEach(commit => {
      // Count by type
      commit.issues?.forEach((issue: any) => {
        stats.byType[issue.type] = (stats.byType[issue.type] || 0) + 1;
        stats.bySeverity[issue.severity] = (stats.bySeverity[issue.severity] || 0) + 1;
      });

      // Count by status
      stats.byStatus[commit.status] = (stats.byStatus[commit.status] || 0) + 1;

      // Count recent
      const interceptedAt = new Date(commit.intercepted_at);
      if (interceptedAt >= sevenDaysAgo) stats.recent.last7Days++;
      if (interceptedAt >= thirtyDaysAgo) stats.recent.last30Days++;
    });

    // Top repos
    const repoCounts: Record<string, number> = {};
    commits?.forEach(commit => {
      repoCounts[commit.repo_name] = (repoCounts[commit.repo_name] || 0) + 1;
    });
    stats.topRepos = Object.entries(repoCounts)
      .map(([repo_name, count]) => ({ repo_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Error in stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
`;
    fs.writeFileSync(statsPath, basicStats, 'utf8');
    console.log(`   ✅ Basic stats API created`);
    return true;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Building Interceptor Dashboard with BEAST MODE APIs\n');
  console.log(`📡 API URL: ${BASE_URL}`);
  console.log(`👤 User ID: ${userId}\n`);
  
  const success = await buildInterceptorDashboard();
  
  if (success) {
    console.log('\n✅ Interceptor Dashboard build complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Review generated component');
    console.log('   2. Add to BeastModeDashboard.tsx (add "interceptor" view)');
    console.log('   3. Test the dashboard');
    console.log('   4. Deploy to Vercel');
  } else {
    console.log('\n❌ Build failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { buildInterceptorDashboard, generateComponent };
