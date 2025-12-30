"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface User {
  id: string;
  email: string;
  name?: string;
  plan?: 'free' | 'developer' | 'team' | 'enterprise';
}

export default function AuthSection() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setUser(data.user);
      localStorage.setItem('beastModeToken', data.token);
      
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
      <Card className="bg-slate-950/50 border-slate-900">
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
    <Card className="bg-slate-950/50 border-slate-900">
      <CardHeader>
        <CardTitle className="text-white">
          {isSignIn ? 'Sign In' : 'Sign Up'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isSignIn && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                required={!isSignIn}
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
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

