import { Octokit } from '@octokit/rest';

const githubToken = process.env.GITHUB_TOKEN;

export const octokit = githubToken
  ? new Octokit({ auth: githubToken })
  : null;

/**
 * Create an Octokit instance with a specific token
 */
export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

export async function fetchRepository(owner: string, repo: string, client?: Octokit) {
  const activeClient = client || octokit;
  
  if (!activeClient) {
    throw new Error('GitHub token not configured');
  }

  try {
    const { data } = await activeClient.repos.get({
      owner,
      repo
    });

    return data;
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error('Repository not found');
    }
    if (error.status === 403) {
      throw new Error('Access denied. Repository may be private. Connect your GitHub account to scan private repos.');
    }
    throw error;
  }
}

export async function fetchRepositoryContents(owner: string, repo: string, path: string = '', client?: Octokit) {
  const activeClient = client || octokit;
  
  if (!activeClient) {
    throw new Error('GitHub token not configured');
  }

  try {
    const { data } = await activeClient.repos.getContent({
      owner,
      repo,
      path
    });

    return data;
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error('Path not found');
    }
    if (error.status === 403) {
      throw new Error('Access denied. Repository may be private.');
    }
    throw error;
  }
}

export async function fetchBranchCommitSha(owner: string, repo: string, branch: string, client?: Octokit) {
  const activeClient = client || octokit;
  
  if (!activeClient) {
    throw new Error('GitHub token not configured');
  }

  try {
    const { data } = await activeClient.repos.getBranch({
      owner,
      repo,
      branch
    });

    return data.commit.sha;
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error('Branch not found');
    }
    throw error;
  }
}

