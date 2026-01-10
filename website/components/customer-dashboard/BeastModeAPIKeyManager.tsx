"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/user-context';
import { TierBadge } from '../licensing/TierBadge';

interface BeastModeAPIKey {
  id: string;
  key_prefix: string;
  name: string;
  tier: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export function BeastModeAPIKeyManager() {
  const { user } = useUser();
  const [keys, setKeys] = useState<BeastModeAPIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [tier, setTier] = useState<string>('free');

  useEffect(() => {
    if (user?.id) {
      fetchAPIKeys();
    }
  }, [user?.id]);

  async function fetchAPIKeys() {
    try {
      setLoading(true);
      const response = await fetch(`/api/auth/api-keys?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const data = await response.json();
      setKeys(data.keys || []);
      setTier(data.tier || 'free');
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createAPIKey() {
    if (!newKeyName || !user?.id) return;

    try {
      const response = await fetch('/api/auth/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: newKeyName
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create API key');
      }

      const data = await response.json();
      setNewKey(data.apiKey);
      setShowCreate(false);
      setNewKeyName('');
      fetchAPIKeys();
    } catch (error: any) {
      console.error('Error creating API key:', error);
      alert(error.message || 'Failed to create API key');
    }
  }

  async function revokeAPIKey(keyId: string) {
    if (!confirm('Are you sure you want to revoke this API key? It will immediately stop working.')) return;

    try {
      const response = await fetch(`/api/auth/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });

      if (!response.ok) throw new Error('Failed to revoke API key');
      fetchAPIKeys();
    } catch (error) {
      console.error('Error revoking API key:', error);
      alert('Failed to revoke API key');
    }
  }

  return (
    <div className="p-6 bg-slate-900 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">BEAST MODE API Keys</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage API keys for accessing BEAST MODE cloud services
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TierBadge tier={tier} />
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
          >
            Generate API Key
          </button>
        </div>
      </div>

      {newKey && (
        <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg">
          <p className="text-green-300 mb-2 font-semibold">✅ API Key generated successfully!</p>
          <p className="text-sm text-slate-300 mb-3">
            ⚠️ <strong>Save this key now</strong> - it will not be shown again!
          </p>
          <div className="flex items-center gap-2 mb-3">
            <code className="flex-1 p-3 bg-slate-800 rounded text-cyan-400 font-mono text-sm break-all">
              {newKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKey);
                alert('Copied to clipboard!');
              }}
              className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 whitespace-nowrap"
            >
              Copy
            </button>
          </div>
          <div className="bg-slate-800 p-3 rounded text-sm text-slate-300">
            <p className="font-semibold mb-1">Usage:</p>
            <code className="text-cyan-400">
              export BEAST_MODE_API_KEY=&quot;{newKey}&quot;
            </code>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-3 text-sm text-cyan-400 hover:text-cyan-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {showCreate && (
        <div className="mb-6 p-4 bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Generate New API Key</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production Key, Development Key"
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createAPIKey();
                  }
                }}
              />
              <p className="text-xs text-slate-400 mt-1">
                Give your key a descriptive name to identify its purpose
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createAPIKey}
                disabled={!newKeyName}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Key
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewKeyName('');
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading API keys...</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p className="mb-2">No API keys found.</p>
          <p className="text-sm">Generate your first API key to start using BEAST MODE cloud services.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="p-4 bg-slate-800 rounded-lg flex justify-between items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{key.name}</span>
                  <TierBadge tier={key.tier} />
                  {key.is_active ? (
                    <span className="text-xs px-2 py-1 bg-green-900 text-green-300 rounded">Active</span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded">Revoked</span>
                  )}
                </div>
                <code className="text-sm text-slate-400 font-mono">{key.key_prefix}</code>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                  {key.last_used_at && (
                    <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              {key.is_active && (
                <button
                  onClick={() => revokeAPIKey(key.id)}
                  className="px-3 py-1 bg-red-900 text-red-300 rounded hover:bg-red-800 transition"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-800 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">📖 Documentation</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• <a href="https://beast-mode.dev/docs/api" className="text-cyan-400 hover:text-cyan-300">API Documentation</a></li>
          <li>• <a href="https://beast-mode.dev/docs/licensing" className="text-cyan-400 hover:text-cyan-300">Licensing & Subscriptions</a></li>
          <li>• <a href="https://beast-mode.dev/docs/security" className="text-cyan-400 hover:text-cyan-300">Security Best Practices</a></li>
        </ul>
      </div>
    </div>
  );
}

