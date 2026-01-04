"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/user-context';
import { LicenseGate } from '../licensing/LicenseGate';
import { TierBadge } from '../licensing/TierBadge';

interface APIKey {
  id: string;
  key_name: string;
  provider: string;
  is_active: boolean;
  created_at: string;
}

export function APIKeyManager() {
  const { user } = useUser();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyProvider, setNewKeyProvider] = useState('openai');
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchAPIKeys();
    }
  }, [user?.id]);

  async function fetchAPIKeys() {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/api-keys?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createAPIKey() {
    if (!newKeyName || !user?.id) return;

    try {
      const response = await fetch('/api/customer/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          provider: newKeyProvider,
          keyName: newKeyName
        })
      });

      if (!response.ok) throw new Error('Failed to create API key');
      const data = await response.json();
      setNewKey(data.apiKey);
      setShowCreate(false);
      setNewKeyName('');
      fetchAPIKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    }
  }

  async function revokeAPIKey(keyId: string) {
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      const response = await fetch(`/api/customer/api-keys/${keyId}`, {
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
    <LicenseGate feature="api-keys" requireTier="developer">
      <div className="p-6 bg-slate-900 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
          >
            Create API Key
          </button>
        </div>

        {newKey && (
          <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg">
            <p className="text-green-300 mb-2">✅ API Key created successfully!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-slate-800 rounded text-cyan-400">{newKey}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newKey);
                  alert('Copied to clipboard!');
                }}
                className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-slate-400 mt-2">⚠️ Save this key now - it won't be shown again!</p>
            <button
              onClick={() => setNewKey(null)}
              className="mt-2 text-sm text-cyan-400 hover:text-cyan-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {showCreate && (
          <div className="mb-6 p-4 bg-slate-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="My API Key"
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Provider</label>
                <select
                  value={newKeyProvider}
                  onChange={(e) => setNewKeyProvider(e.target.value)}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="replicate">Replicate</option>
                  <option value="groq">Groq</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createAPIKey}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
                >
                  Create
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
            No API keys found. Create your first API key to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="p-4 bg-slate-800 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{key.key_name}</span>
                    <span className="text-xs px-2 py-1 bg-slate-700 rounded">{key.provider}</span>
                    {key.is_active ? (
                      <span className="text-xs px-2 py-1 bg-green-900 text-green-300 rounded">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded">Revoked</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    Created {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
                {key.is_active && (
                  <button
                    onClick={() => revokeAPIKey(key.id)}
                    className="px-3 py-1 bg-red-900 text-red-300 rounded hover:bg-red-800"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </LicenseGate>
  );
}

