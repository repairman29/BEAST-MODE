import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedToken } from '../../../../lib/github-token';
import { createOctokit } from '../../../../lib/github';

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
      githubToken = await getDecryptedToken(oauthUserId);
      console.log('   Token found for OAuth user ID:', !!githubToken);
    }
    
    // If not found, try token-based user ID
    if (!githubToken && token) {
      const userId = `user-${token.slice(0, 8)}`;
      githubToken = await getDecryptedToken(userId);
      console.log('   Token found for user ID:', !!githubToken);
    }
    
    // If still not found, check all session-based IDs (get the most recent)
    if (!githubToken) {
      const globalForTokenStore = globalThis as unknown as {
        tokenStore: Map<string, any>;
      };
      const store = globalForTokenStore.tokenStore;
      
      let mostRecent: { key: string; data: any; time: number } | null = null;
      for (const [key, value] of store.entries()) {
        if (key.startsWith('session-') || key.startsWith('user-')) {
          const time = new Date(value.connectedAt).getTime();
          if (!mostRecent || time > mostRecent.time) {
            mostRecent = { key, data: value, time };
          }
        }
      }
      if (mostRecent) {
        githubToken = await getDecryptedToken(mostRecent.key);
        console.log('   Token found for most recent user ID:', !!githubToken);
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
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      type: 'all', // all, owner, member
      sort: 'updated',
      direction: 'desc',
      per_page: 100, // Get up to 100 repos
    });

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

