/**
 * Git Service
 * 
 * Handles all Git operations for the IDE
 * Connects to BEAST MODE's Git integration
 */

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  staged: string[];
  untracked: string[];
  conflicts: string[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
}

export class GitService {
  private static instance: GitService;
  private repoPath: string | null = null;

  private constructor() {}

  static getInstance(): GitService {
    if (!GitService.instance) {
      GitService.instance = new GitService();
    }
    return GitService.instance;
  }

  async initialize(repoPath?: string): Promise<void> {
    // In browser, we'll use API endpoints
    // In Electron, we could use nodegit or isogit
    this.repoPath = repoPath || null;
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const response = await fetch('/api/git/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: this.repoPath }),
      });

      if (!response.ok) {
        throw new Error(`Git status failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Git status error:', error);
      // Return empty status on error
      return {
        branch: 'unknown',
        ahead: 0,
        behind: 0,
        modified: [],
        staged: [],
        untracked: [],
        conflicts: [],
      };
    }
  }

  async getBranches(): Promise<string[]> {
    try {
      const response = await fetch('/api/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: this.repoPath }),
      });

      if (!response.ok) {
        throw new Error(`Git branches failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.branches || [];
    } catch (error: any) {
      console.error('Git branches error:', error);
      return [];
    }
  }

  async switchBranch(branch: string): Promise<void> {
    try {
      const response = await fetch('/api/git/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: this.repoPath, branch }),
      });

      if (!response.ok) {
        throw new Error(`Git checkout failed: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Git checkout error:', error);
      throw error;
    }
  }

  async createBranch(branch: string): Promise<void> {
    try {
      const response = await fetch('/api/git/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: this.repoPath, branch, create: true }),
      });

      if (!response.ok) {
        throw new Error(`Git branch creation failed: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Git branch creation error:', error);
      throw error;
    }
  }

  async stageFile(file: string): Promise<void> {
    try {
      const response = await fetch('/api/git/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: this.repoPath, files: [file] }),
      });

      if (!response.ok) {
        throw new Error(`Git stage failed: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Git stage error:', error);
      throw error;
    }
  }

  async unstageFile(file: string): Promise<void> {
    try {
      const response = await fetch('/api/git/unstage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: this.repoPath, files: [file] }),
      });

      if (!response.ok) {
        throw new Error(`Git unstage failed: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Git unstage error:', error);
      throw error;
    }
  }

  async commit(message: string, files?: string[]): Promise<string> {
    try {
      const response = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: this.repoPath,
          message,
          files,
        }),
      });

      if (!response.ok) {
        throw new Error(`Git commit failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.hash || '';
    } catch (error: any) {
      console.error('Git commit error:', error);
      throw error;
    }
  }

  async push(branch?: string): Promise<void> {
    try {
      const response = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoPath: this.repoPath,
          branch: branch || 'current',
        }),
      });

      if (!response.ok) {
        throw new Error(`Git push failed: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Git push error:', error);
      throw error;
    }
  }

  async pull(): Promise<void> {
    try {
      const response = await fetch('/api/git/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: this.repoPath }),
      });

      if (!response.ok) {
        throw new Error(`Git pull failed: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Git pull error:', error);
      throw error;
    }
  }

  async getDiff(file: string): Promise<string> {
    try {
      const response = await fetch('/api/git/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: this.repoPath, file }),
      });

      if (!response.ok) {
        throw new Error(`Git diff failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.diff || '';
    } catch (error: any) {
      console.error('Git diff error:', error);
      return '';
    }
  }

  async getCommitHistory(limit: number = 20): Promise<GitCommit[]> {
    try {
      const response = await fetch('/api/git/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: this.repoPath, limit }),
      });

      if (!response.ok) {
        throw new Error(`Git log failed: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.commits || []).map((c: any) => ({
        ...c,
        date: new Date(c.date),
      }));
    } catch (error: any) {
      console.error('Git log error:', error);
      return [];
    }
  }

  async getFileAtCommit(file: string, commit: string): Promise<string> {
    try {
      const response = await fetch('/api/git/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: this.repoPath, file, commit }),
      });

      if (!response.ok) {
        throw new Error(`Git file fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content || '';
    } catch (error: any) {
      console.error('Git file fetch error:', error);
      return '';
    }
  }
}

export const gitService = GitService.getInstance();
