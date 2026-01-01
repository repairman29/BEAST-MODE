"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface SSOProvider {
  provider: string;
  configured: boolean;
  configuredAt?: string;
}

interface EnterpriseSSOProps {
  userId?: string;
}

export default function EnterpriseSSO({ userId }: EnterpriseSSOProps) {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [config, setConfig] = useState<any>({});
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/beast-mode/enterprise/sso?action=list');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers.map((p: string) => ({
          provider: p,
          configured: false
        })));
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigure = async (provider: string) => {
    setSelectedProvider(provider);
    setConfig({});
    setTestResult(null);
  };

  const handleSaveConfig = async () => {
    if (!selectedProvider) return;

    try {
      const response = await fetch('/api/beast-mode/enterprise/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure',
          provider: selectedProvider,
          config: config
        })
      });

      if (response.ok) {
        const result = await response.json();
        setProviders(prev => prev.map(p => 
          p.provider === selectedProvider 
            ? { ...p, configured: true, configuredAt: result.configuredAt }
            : p
        ));
        setSelectedProvider(null);
      }
    } catch (error) {
      console.error('Failed to configure SSO:', error);
    }
  };

  const handleTest = async (provider: string) => {
    try {
      const response = await fetch(`/api/beast-mode/enterprise/sso?action=test&provider=${provider}`);
      if (response.ok) {
        const result = await response.json();
        setTestResult({ provider, ...result });
      }
    } catch (error) {
      console.error('Failed to test SSO:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
          <span className="text-cyan-400 text-sm">Loading SSO providers...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">🔐 Enterprise SSO</CardTitle>
              <CardDescription className="text-slate-400">
                Configure single sign-on for your organization
              </CardDescription>
            </div>
            <Button
              onClick={() => window.open('/docs/ENTERPRISE', '_blank')}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              📚 Docs
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Providers List */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Available Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <div
                key={provider.provider}
                className={`p-4 rounded-lg border ${
                  provider.configured
                    ? 'bg-green-950/50 border-green-800'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-white font-semibold capitalize">{provider.provider}</div>
                  {provider.configured && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      Configured
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => handleConfigure(provider.provider)}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                  >
                    {provider.configured ? 'Edit' : 'Configure'}
                  </Button>
                  {provider.configured && (
                    <Button
                      onClick={() => handleTest(provider.provider)}
                      variant="outline"
                      className="border-cyan-700 text-cyan-300 hover:bg-cyan-900/20 text-xs"
                    >
                      Test
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      {selectedProvider && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Configure {selectedProvider.toUpperCase()} SSO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProvider === 'saml' && (
              <>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Entity ID</label>
                  <input
                    type="text"
                    value={config.entityId || ''}
                    onChange={(e) => setConfig({ ...config, entityId: e.target.value })}
                    placeholder="beast-mode"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">SSO URL</label>
                  <input
                    type="url"
                    value={config.ssoUrl || ''}
                    onChange={(e) => setConfig({ ...config, ssoUrl: e.target.value })}
                    placeholder="https://idp.example.com/sso"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Certificate</label>
                  <textarea
                    value={config.certificate || ''}
                    onChange={(e) => setConfig({ ...config, certificate: e.target.value })}
                    placeholder="Paste X.509 certificate"
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                </div>
              </>
            )}

            {selectedProvider === 'oauth' && (
              <>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Client ID</label>
                  <input
                    type="text"
                    value={config.clientId || ''}
                    onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={config.clientSecret || ''}
                    onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Authorization URL</label>
                  <input
                    type="url"
                    value={config.authorizationUrl || ''}
                    onChange={(e) => setConfig({ ...config, authorizationUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Token URL</label>
                  <input
                    type="url"
                    value={config.tokenUrl || ''}
                    onChange={(e) => setConfig({ ...config, tokenUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </>
            )}

            {selectedProvider === 'okta' && (
              <>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Okta Domain</label>
                  <input
                    type="text"
                    value={config.domain || ''}
                    onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                    placeholder="your-org.okta.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Client ID</label>
                  <input
                    type="text"
                    value={config.clientId || ''}
                    onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={config.clientSecret || ''}
                    onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </>
            )}

            {selectedProvider === 'azure' && (
              <>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Tenant ID</label>
                  <input
                    type="text"
                    value={config.tenantId || ''}
                    onChange={(e) => setConfig({ ...config, tenantId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Client ID</label>
                  <input
                    type="text"
                    value={config.clientId || ''}
                    onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={config.clientSecret || ''}
                    onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSaveConfig}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                Save Configuration
              </Button>
              <Button
                onClick={() => setSelectedProvider(null)}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Result */}
      {testResult && (
        <Card className={`bg-slate-900/90 border-slate-800 ${
          testResult.success ? 'border-green-800' : 'border-red-800'
        }`}>
          <CardContent className="p-4">
            <div className={`text-sm ${
              testResult.success ? 'text-green-400' : 'text-red-400'
            }`}>
              {testResult.success ? '✅' : '❌'} {testResult.message || testResult.error}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

