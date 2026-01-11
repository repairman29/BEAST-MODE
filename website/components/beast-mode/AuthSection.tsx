"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useUser } from '@/lib/user-context';

interface User {
  id: string;
  email: string;
  name?: string;
  plan?: 'free' | 'developer' | 'team' | 'enterprise';
}

interface AuthSectionProps {
  onAuthSuccess?: (user: User) => void;
}

export default function AuthSection({ onAuthSuccess }: AuthSectionProps) {
  const { user, setUser } = useUser();
  const [isSignIn, setIsSignIn] = useState(true);

  // Check URL params for initial action
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const auth = params.get('auth');
      const message = params.get('message');
      const githubUsername = params.get('github_username');
      
      // Handle ?auth=required (from dashboard redirect)
      if (auth === 'required') {
        setIsSignIn(true);
        setError('Please sign in to access the dashboard.');
        // Don't clear URL params yet - keep them so the form stays visible
      } else if (action === 'signup') {
        setIsSignIn(false);
      } else if (action === 'signin') {
        setIsSignIn(true);
      }
      
      // Show message if GitHub was connected but user needs to sign in
      if (message === 'github_connected' && githubUsername) {
        setError(`GitHub account (@${githubUsername}) connected! Please sign in with your email and password to continue.`);
        setIsSignIn(true);
        // Don't clear URL params yet - keep them so the form stays visible
      }
    }
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Sync with user context
  useEffect(() => {
    if (user) {
      // User is already logged in from context
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = isSignIn ? '/api/auth/signin' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: isSignIn ? undefined : name })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authentication failed');
      }

      const data = await response.json();
      const userData = data.user;
      setUser(userData);
      localStorage.setItem('beastModeToken', data.token);
      
      // Clear URL params after successful auth
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
      
      // Notify parent component
      if (onAuthSuccess) {
        onAuthSuccess(userData);
      }
      
      // Redirect to dashboard after successful sign-in
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
      
      // Show success message
      if (data.needsVerification) {
        alert('Account created! Please check your email to verify your account.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('beastModeToken');
  };

  if (user) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-400">Email</div>
              <div className="text-white font-semibold">{user.email}</div>
            </div>
            {user.name && (
              <div>
                <div className="text-sm text-slate-400">Name</div>
                <div className="text-white font-semibold">{user.name}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-slate-400">Plan</div>
              <div className="text-white font-semibold capitalize">{user.plan || 'Free'}</div>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="w-full border-slate-800">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-950/90 backdrop-blur-sm border-slate-800 shadow-2xl w-full">
      <CardHeader>
        <CardTitle className="text-white text-2xl">
          {isSignIn ? 'Sign In' : 'Sign Up'}
        </CardTitle>
        <p className="text-slate-400 text-sm mt-2">
          {isSignIn ? 'Welcome back! Sign in to your account.' : 'Create a new account to get started.'}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-5">
          {!isSignIn && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                required={!isSignIn}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              {isSignIn && (
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              required={!showPasswordReset}
              disabled={showPasswordReset}
            />
          </div>
          {showPasswordReset && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
              {resetSent ? (
                <div className="text-green-400 text-sm">
                  ✓ Password reset email sent! Check your inbox.
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={async () => {
                    if (!resetEmail) {
                      setError('Please enter your email');
                      return;
                    }
                    setIsLoading(true);
                    try {
                      const response = await fetch('/api/auth/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: resetEmail })
                      });
                      if (response.ok) {
                        setResetSent(true);
                        setError(null);
                      } else {
                        const data = await response.json();
                        throw new Error(data.error || 'Failed to send reset email');
                      }
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Send Reset Link
                </Button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowPasswordReset(false);
                  setResetEmail('');
                  setResetSent(false);
                  setError(null);
                }}
                className="w-full text-sm text-slate-400 hover:text-white"
              >
                Back to sign in
              </button>
            </div>
          )}
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-slate-100"
          >
            {isLoading ? 'Loading...' : (isSignIn ? 'Sign In' : 'Sign Up')}
          </Button>
          <button
            type="button"
            onClick={() => {
              setIsSignIn(!isSignIn);
              setError(null);
            }}
            className="w-full text-sm text-slate-400 hover:text-white"
          >
            {isSignIn ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

