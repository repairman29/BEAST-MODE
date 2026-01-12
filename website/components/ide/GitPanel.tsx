'use client';

/**
 * Git Panel Component
 * 
 * Git integration panel for IDE
 * Shows status, staging area, and commit interface
 */

import { useState, useEffect } from 'react';
import { gitService, GitStatus, GitCommit } from '@/lib/ide/gitService';
import { showToast } from './Toast';

interface GitPanelProps {
  onFileSelect?: (file: string) => void;
}

export default function GitPanel({ onFileSelect }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [selectedTab, setSelectedTab] = useState<'status' | 'history' | 'branches'>('status');
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('');

  useEffect(() => {
    loadGitData();
    const interval = setInterval(loadGitData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadGitData = async () => {
    try {
      const [gitStatus, gitBranches, gitCommits] = await Promise.all([
        gitService.getStatus(),
        gitService.getBranches(),
        gitService.getCommitHistory(10),
      ]);

      setStatus(gitStatus);
      setBranches(gitBranches);
      setCurrentBranch(gitStatus.branch);
      setCommits(gitCommits);
    } catch (error) {
      console.error('Failed to load Git data:', error);
    }
  };

  const handleStage = async (file: string) => {
    try {
      await gitService.stageFile(file);
      showToast(`Staged: ${file}`, 'success');
      loadGitData();
    } catch (error: any) {
      showToast(`Failed to stage: ${error.message}`, 'error');
    }
  };

  const handleUnstage = async (file: string) => {
    try {
      await gitService.unstageFile(file);
      showToast(`Unstaged: ${file}`, 'info');
      loadGitData();
    } catch (error: any) {
      showToast(`Failed to unstage: ${error.message}`, 'error');
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      showToast('Please enter a commit message', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const hash = await gitService.commit(commitMessage.trim());
      showToast(`Committed: ${hash.substring(0, 7)}`, 'success');
      setCommitMessage('');
      loadGitData();
    } catch (error: any) {
      showToast(`Commit failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    setIsLoading(true);
    try {
      await gitService.push();
      showToast('Pushed to remote', 'success');
      loadGitData();
    } catch (error: any) {
      showToast(`Push failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    setIsLoading(true);
    try {
      await gitService.pull();
      showToast('Pulled from remote', 'success');
      loadGitData();
    } catch (error: any) {
      showToast(`Pull failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBranchSwitch = async (branch: string) => {
    setIsLoading(true);
    try {
      await gitService.switchBranch(branch);
      showToast(`Switched to ${branch}`, 'success');
      loadGitData();
    } catch (error: any) {
      showToast(`Branch switch failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <div className="text-center">
          <p>No Git repository found</p>
          <p className="text-xs mt-2">Open a folder with a Git repository</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">Git</span>
          <span className="text-xs px-2 py-1 bg-blue-600 rounded">{currentBranch}</span>
          {status.ahead > 0 && (
            <span className="text-xs px-2 py-1 bg-green-600 rounded">↑{status.ahead}</span>
          )}
          {status.behind > 0 && (
            <span className="text-xs px-2 py-1 bg-yellow-600 rounded">↓{status.behind}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePull}
            disabled={isLoading}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50"
            title="Pull"
          >
            ↓ Pull
          </button>
          <button
            onClick={handlePush}
            disabled={isLoading || status.ahead === 0}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
            title="Push"
          >
            ↑ Push
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="h-10 bg-slate-800 border-b border-slate-700 flex">
        <button
          onClick={() => setSelectedTab('status')}
          className={`px-4 text-sm font-medium ${
            selectedTab === 'status'
              ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Changes
        </button>
        <button
          onClick={() => setSelectedTab('history')}
          className={`px-4 text-sm font-medium ${
            selectedTab === 'history'
              ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setSelectedTab('branches')}
          className={`px-4 text-sm font-medium ${
            selectedTab === 'branches'
              ? 'bg-slate-900 text-slate-100 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Branches
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedTab === 'status' && (
          <div className="space-y-4">
            {/* Staged Changes */}
            {status.staged.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-400 mb-2">
                  Staged Changes ({status.staged.length})
                </h3>
                <div className="space-y-1">
                  {status.staged.map((file) => (
                    <div
                      key={file}
                      className="flex items-center justify-between p-2 bg-slate-800 rounded hover:bg-slate-750"
                    >
                      <span
                        className="text-sm text-slate-300 cursor-pointer flex-1"
                        onClick={() => onFileSelect?.(file)}
                      >
                        {file}
                      </span>
                      <button
                        onClick={() => handleUnstage(file)}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        Unstage
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modified Files */}
            {status.modified.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">
                  Modified ({status.modified.length})
                </h3>
                <div className="space-y-1">
                  {status.modified.map((file) => (
                    <div
                      key={file}
                      className="flex items-center justify-between p-2 bg-slate-800 rounded hover:bg-slate-750"
                    >
                      <span
                        className="text-sm text-slate-300 cursor-pointer flex-1"
                        onClick={() => onFileSelect?.(file)}
                      >
                        {file}
                      </span>
                      <button
                        onClick={() => handleStage(file)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Stage
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Untracked Files */}
            {status.untracked.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-2">
                  Untracked ({status.untracked.length})
                </h3>
                <div className="space-y-1">
                  {status.untracked.map((file) => (
                    <div
                      key={file}
                      className="flex items-center justify-between p-2 bg-slate-800 rounded hover:bg-slate-750"
                    >
                      <span
                        className="text-sm text-slate-300 cursor-pointer flex-1"
                        onClick={() => onFileSelect?.(file)}
                      >
                        {file}
                      </span>
                      <button
                        onClick={() => handleStage(file)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Stage
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conflicts */}
            {status.conflicts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-2">
                  Conflicts ({status.conflicts.length})
                </h3>
                <div className="space-y-1">
                  {status.conflicts.map((file) => (
                    <div
                      key={file}
                      className="p-2 bg-red-900/20 border border-red-700 rounded"
                    >
                      <span className="text-sm text-red-300">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status.staged.length === 0 && status.modified.length === 0 && status.untracked.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-8">
                No changes
              </div>
            )}

            {/* Commit Interface */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
                disabled={isLoading || status.staged.length === 0}
              />
              <button
                onClick={handleCommit}
                disabled={isLoading || !commitMessage.trim() || status.staged.length === 0}
                className="mt-2 w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded text-sm font-medium transition-colors"
              >
                {isLoading ? 'Committing...' : `Commit ${status.staged.length} file${status.staged.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}

        {selectedTab === 'history' && (
          <div className="space-y-2">
            {commits.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">No commits</div>
            ) : (
              commits.map((commit) => (
                <div
                  key={commit.hash}
                  className="p-3 bg-slate-800 rounded hover:bg-slate-750 cursor-pointer"
                  onClick={() => onFileSelect?.(commit.files[0])}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-blue-400">{commit.hash.substring(0, 7)}</span>
                    <span className="text-xs text-slate-500">{commit.date.toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-slate-200 font-medium">{commit.message}</div>
                  <div className="text-xs text-slate-400 mt-1">{commit.author}</div>
                  {commit.files.length > 0 && (
                    <div className="text-xs text-slate-500 mt-1">
                      {commit.files.length} file{commit.files.length !== 1 ? 's' : ''} changed
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'branches' && (
          <div className="space-y-2">
            <button
              onClick={() => {
                const branchName = prompt('Enter branch name:');
                if (branchName) {
                  gitService.createBranch(branchName).then(() => {
                    showToast(`Created branch: ${branchName}`, 'success');
                    loadGitData();
                  });
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
            >
              + Create Branch
            </button>
            {branches.map((branch) => (
              <div
                key={branch}
                className={`flex items-center justify-between p-3 rounded cursor-pointer ${
                  branch === currentBranch
                    ? 'bg-blue-600/20 border border-blue-500'
                    : 'bg-slate-800 hover:bg-slate-750'
                }`}
                onClick={() => branch !== currentBranch && handleBranchSwitch(branch)}
              >
                <span className="text-sm text-slate-200">
                  {branch === currentBranch && '● '}
                  {branch}
                </span>
                {branch !== currentBranch && (
                  <button className="text-xs text-blue-400 hover:text-blue-300">Switch</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
