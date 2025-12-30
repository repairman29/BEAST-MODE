"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface ScanResult {
  repo: string;
  score: number;
  issues: number;
  improvements: number;
  status: 'scanning' | 'completed' | 'error';
  report?: any;
}

export default function GitHubScanForm() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    // Extract owner/repo from URL (supports various formats)
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,
      /^([^\/]+)\/([^\/]+)$/,
      /git@github\.com:([^\/]+)\/([^\/]+)\.git/
    ];

    let match = null;
    let owner = '';
    let repo = '';

    for (const pattern of patterns) {
      match = repoUrl.match(pattern);
      if (match) {
        [, owner, repo] = match;
        break;
      }
    }

    if (!match) {
      setError('Invalid GitHub URL. Format: https://github.com/owner/repo or owner/repo');
      return;
    }

    const fullRepo = `${owner}/${repo}`;

    setIsScanning(true);
    setError(null);

    // Add scanning state
    const newScan: ScanResult = {
      repo: fullRepo,
      score: 0,
      issues: 0,
      improvements: 0,
      status: 'scanning'
    };
    setScanResults(prev => [newScan, ...prev]);

    try {
      const response = await fetch('/api/github/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: fullRepo, url: repoUrl })
      });

      if (!response.ok) {
        throw new Error('Scan failed');
      }

      const data = await response.json();

      // Update with results
      setScanResults(prev => prev.map(s => 
        s.repo === fullRepo 
          ? { ...s, ...data, status: 'completed' as const }
          : s
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to scan repository');
      setScanResults(prev => prev.map(s => 
        s.repo === fullRepo 
          ? { ...s, status: 'error' as const }
          : s
      ));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card className="bg-slate-950/50 border-slate-900">
        <CardHeader>
          <CardTitle className="text-white">Scan GitHub Repository</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              disabled={isScanning}
            />
            <Button 
              onClick={handleScan}
              disabled={isScanning}
              className="bg-white text-black hover:bg-slate-100"
            >
              {isScanning ? 'Scanning...' : 'Scan Repo'}
            </Button>
          </div>
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-lg font-semibold">Recent Scans</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScanResults([])}
              className="border-slate-800 text-slate-400 hover:bg-slate-900"
            >
              Clear All
            </Button>
          </div>
          {scanResults.map((result, idx) => (
            <Card key={idx} className="bg-slate-950/50 border-slate-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-white font-semibold">{result.repo}</h4>
                    <p className="text-slate-400 text-sm">
                      {result.status === 'scanning' && (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full"></span>
                      Scanning repository...
                    </span>
                  )}
                      {result.status === 'completed' && (
                        <span className="flex items-center gap-2 text-green-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Scan completed
                        </span>
                      )}
                      {result.status === 'error' && (
                        <span className="flex items-center gap-2 text-red-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Scan failed
                        </span>
                      )}
                    </p>
                  </div>
                  {result.status === 'completed' && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gradient-cyan">{result.score}</div>
                      <div className="text-xs text-slate-500">/100</div>
                    </div>
                  )}
                </div>
                {result.status === 'completed' && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-slate-400">Issues Found</div>
                      <div className="text-xl font-semibold text-white">{result.issues}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Improvements</div>
                      <div className="text-xl font-semibold text-white">{result.improvements}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

