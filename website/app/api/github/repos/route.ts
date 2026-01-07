import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '../../../../lib/github-token';
import { createOctokit } from '../../../../lib/github';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GitHub Repositories API
 * 
 * Fetches user's GitHub repositories (including private repos if connected)
 */
export async function GET(request: NextRequest) {
  console.log('🟡 [GitHub Repos] GET request received');
  try {
    // Get user's GitHub token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('beastModeToken')?.value;
    
    // Get userId from cookie (set during OAuth)
    const oauthUserId = request.cookies.get('github_oauth_user_id')?.value;
    
    let githubToken: string | null = null;
    
    // Try to get token from oauth userId
    if (oauthUserId) {
      try {
        githubToken = await getDecryptedToken(oauthUserId);
        console.log('   Token found for OAuth user ID:', !!githubToken);
      } catch (error: any) {
        console.warn('   Error getting token for OAuth user ID:', error.message);
      }
    }
    
    // If not found, try token-based user ID
    if (!githubToken && token) {
      try {
        const userId = `user-${token.slice(0, 8)}`;
        githubToken = await getDecryptedToken(userId);
        console.log('   Token found for user ID:', !!githubToken);
      } catch (error: any) {
        console.warn('   Error getting token for user ID:', error.message);
      }
    }
    
    // If still not found, check all session-based IDs (get the most recent)
    if (!githubToken) {
      const globalForTokenStore = globalThis as unknown as {
        tokenStore?: Map<string, any>;
      };
      
      // Initialize tokenStore if it doesn't exist
      if (!globalForTokenStore.tokenStore) {
        globalForTokenStore.tokenStore = new Map();
      }
      
      const store = globalForTokenStore.tokenStore;
      
      if (store) {
        let mostRecent: { key: string; data: any; time: number } | null = null;
        // ARCHITECTURE: Moved to API route
// const entries = Array.from(store.entries());
        for (const [key, value] of entries) {
        if (key.startsWith('session-') || key.startsWith('user-')) {
          const time = new Date(value.connectedAt).getTime();
          if (!mostRecent || time > mostRecent.time) {
            mostRecent = { key, data: value, time };
          }
        }
      }
      if (mostRecent) {
        try {
          githubToken = await getDecryptedToken(mostRecent.key);
          console.log('   Token found for most recent user ID:', !!githubToken);
        } catch (error: any) {
          console.warn('   Error getting token for most recent user ID:', error.message);
        }
      }
    }

    if (!githubToken) {
      console.log('❌ [GitHub Repos] No GitHub token found');
      return NextResponse.json({
        repos: [],
        connected: false,
        message: 'GitHub account not connected'
      });
    }

    console.log('✅ [GitHub Repos] Fetching repositories...');
    
    // Create Octokit instance with user's token
    const octokit = createOctokit(githubToken);
    
    // Fetch all repositories (including private)
    let repos: any[] = [];
    try {
      const response = await octokit.repos.listForAuthenticatedUser({
        type: 'all', // all, owner, member
        sort: 'updated',
        direction: 'desc',
        per_page: 100, // Get up to 100 repos
      });
      repos = response.data || [];
    } catch (apiError: any) {
      console.error('❌ [GitHub Repos] GitHub API error:', apiError.message);
      console.error('   Status:', apiError.status);
      console.error('   Response:', apiError.response?.data);
      
      // If it's an auth error, return not connected
      if (apiError.status === 401 || apiError.status === 403) {
        return NextResponse.json({
          repos: [],
          connected: false,
          message: 'GitHub token is invalid or expired. Please reconnect your GitHub account.',
          error: 'Authentication failed'
        }, { status: 401 });
      }
      
      // Re-throw other errors to be caught by outer catch
      throw apiError;
    }

    console.log(`✅ [GitHub Repos] Found ${repos.length} repositories`);

    // Format repos for frontend
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      description: repo.description || '',
      private: repo.private,
      language: repo.language || 'Unknown',
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      updatedAt: repo.updated_at,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
    }));

    return NextResponse.json({
      repos: formattedRepos,
      connected: true,
      count: formattedRepos.length,
    });
  } catch (error: any) {
    console.error('❌ [GitHub Repos] Error fetching repositories:', error);
    console.error('   Stack:', error.stack);
    return NextResponse.json(
      { 
        repos: [],
        connected: false,
        error: 'Failed to fetch repositories',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

