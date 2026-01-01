"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface GitHubConnectionProps {
  userId?: string;
}

export default function GitHubConnection({ userId }: GitHubConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, [userId]);

  const checkConnection = async () => {
    console.log('🟡 [GitHubConnection] Checking connection status...');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('beastModeToken') : null;
      console.log('   Token present:', !!token);
      console.log('   Fetching /api/github/token...');
      
      const response = await fetch('/api/github/token', {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });

      console.log('   Response status:', response.status);
      console.log('   Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [GitHubConnection] Connection check result:', data);
        setIsConnected(data.connected || false);
        setGithubUsername(data.githubUsername || null);
      } else if (response.status === 404) {
        // Not connected - this is fine
        console.log('   Not connected (404)');
        setIsConnected(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [GitHubConnection] Connection check failed:', response.status, errorData);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('❌ [GitHubConnection] Error checking connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      console.log('   Connection check complete');
    }
  };

  const handleConnect = async () => {
    console.log('🔵 [GitHubConnection] Connect button clicked');
    setIsConnecting(true);
    try {
      console.log('   Redirecting to /api/github/oauth/authorize');
      // Redirect to GitHub OAuth
      window.location.href = '/api/github/oauth/authorize';
    } catch (error) {
      console.error('❌ [GitHubConnection] Error connecting GitHub:', error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/github/token', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('beastModeToken') || ''}`,
        },
      });

      if (response.ok) {
        setIsConnected(false);
        setGithubUsername(null);
      }
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
    }
  };

  // Check for OAuth callback success/error
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const oauthStatus = params.get('github_oauth');
      
      if (oauthStatus === 'success') {
        console.log('✅ GitHub OAuth success! Checking connection...');
        // Wait a moment for token to be stored
        setTimeout(() => {
          checkConnection();
        }, 500);
        // Remove query param
        window.history.replaceState({}, '', window.location.pathname);
      } else if (oauthStatus === 'error') {
        const error = params.get('error');
        console.error('❌ GitHub OAuth error:', error);
        alert(`GitHub connection failed: ${error || 'Unknown error'}`);
        // Remove query param
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span>🔗</span>
            GitHub Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-slate-400">Checking GitHub connection...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <span>🔗</span>
          GitHub Connection
        </CardTitle>
        <CardDescription className="text-slate-400">
          Connect your GitHub account to scan private repositories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div>
                <div className="text-green-400 font-semibold">✓ Connected</div>
                {githubUsername && (
                  <div className="text-sm text-slate-400 mt-1">
                    Connected as: <span className="text-slate-300">@{githubUsername}</span>
                  </div>
                )}
              </div>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Disconnect
              </Button>
            </div>
            <div className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg">
              <div className="font-semibold text-slate-300 mb-1">Benefits:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Scan your private repositories</li>
                <li>Access all your GitHub repos</li>
                <li>Get quality insights on private code</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="text-amber-400 font-semibold mb-2">Not Connected</div>
              <div className="text-sm text-slate-400">
                Connect your GitHub account to scan private repositories and access all your repos.
              </div>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white"
            >
              {isConnecting ? 'Connecting...' : '🔗 Connect GitHub Account'}
            </Button>
            <div className="text-xs text-slate-500 pt-2">
              You'll be redirected to GitHub to authorize BEAST MODE. We only request access to read your repositories.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

