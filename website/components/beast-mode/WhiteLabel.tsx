"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface WhiteLabelConfig {
  branding: {
    logoUrl: string;
    companyName: string;
    productName: string;
    tagline: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  domain: {
    customDomain: string | null;
    sslEnabled: boolean;
  };
  theme: {
    colorScheme: string;
    fontFamily: string;
  };
}

interface WhiteLabelProps {
  userId?: string;
}

export default function WhiteLabel({ userId }: WhiteLabelProps) {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'branding' | 'domain' | 'theme'>('branding');
  const [branding, setBranding] = useState<any>({});
  const [domain, setDomain] = useState<any>({});
  const [theme, setTheme] = useState<any>({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/beast-mode/enterprise/white-label');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setBranding(data.branding || {});
        setDomain(data.domain || {});
        setTheme(data.theme || {});
      }
    } catch (error) {
      console.error('Failed to fetch white-label config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBranding = async () => {
    try {
      const response = await fetch('/api/beast-mode/enterprise/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure-branding',
          branding
        })
      });

      if (response.ok) {
        await fetchConfig();
      }
    } catch (error) {
      console.error('Failed to save branding:', error);
    }
  };

  const handleSaveDomain = async () => {
    try {
      const response = await fetch('/api/beast-mode/enterprise/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure-domain',
          domain
        })
      });

      if (response.ok) {
        await fetchConfig();
      }
    } catch (error) {
      console.error('Failed to save domain:', error);
    }
  };

  const handleVerifyDomain = async () => {
    if (!domain.customDomain) return;

    try {
      const response = await fetch('/api/beast-mode/enterprise/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-domain',
          domain: { customDomain: domain.customDomain }
        })
      });

      if (response.ok) {
        await fetchConfig();
      }
    } catch (error) {
      console.error('Failed to verify domain:', error);
    }
  };

  const handleSaveTheme = async () => {
    try {
      const response = await fetch('/api/beast-mode/enterprise/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure-theme',
          theme
        })
      });

      if (response.ok) {
        await fetchConfig();
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
          <span className="text-cyan-400 text-sm">Loading white-label configuration...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">🎨 White-Label Options</CardTitle>
          <CardDescription className="text-slate-400">
            Customize branding, domain, and theme for your organization
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {(['branding', 'domain', 'theme'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">Company Name</label>
              <input
                type="text"
                value={branding.companyName || ''}
                onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Product Name</label>
              <input
                type="text"
                value={branding.productName || ''}
                onChange={(e) => setBranding({ ...branding, productName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Tagline</label>
              <input
                type="text"
                value={branding.tagline || ''}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Logo URL</label>
              <input
                type="url"
                value={branding.logoUrl || ''}
                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Primary Color</label>
                <input
                  type="color"
                  value={branding.colors?.primary || '#06b6d4'}
                  onChange={(e) => setBranding({
                    ...branding,
                    colors: { ...branding.colors, primary: e.target.value }
                  })}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Secondary Color</label>
                <input
                  type="color"
                  value={branding.colors?.secondary || '#8b5cf6'}
                  onChange={(e) => setBranding({
                    ...branding,
                    colors: { ...branding.colors, secondary: e.target.value }
                  })}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Accent Color</label>
                <input
                  type="color"
                  value={branding.colors?.accent || '#ec4899'}
                  onChange={(e) => setBranding({
                    ...branding,
                    colors: { ...branding.colors, accent: e.target.value }
                  })}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-lg"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveBranding}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Save Branding
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Domain Tab */}
      {activeTab === 'domain' && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Custom Domain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">Custom Domain</label>
              <input
                type="text"
                value={domain.customDomain || ''}
                onChange={(e) => setDomain({ ...domain, customDomain: e.target.value })}
                placeholder="app.yourcompany.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={domain.sslEnabled !== false}
                onChange={(e) => setDomain({ ...domain, sslEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-slate-400 text-sm">Enable SSL</label>
            </div>
            {domain.customDomain && (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-sm mb-2">DNS Records to Add:</div>
                <div className="text-slate-300 text-xs font-mono space-y-1">
                  <div>CNAME: {domain.customDomain} → beastmode.dev</div>
                  <div>TXT: _beastmode.{domain.customDomain} → beastmode-verification=...</div>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleSaveDomain}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                Save Domain
              </Button>
              {domain.customDomain && (
                <Button
                  onClick={handleVerifyDomain}
                  variant="outline"
                  className="border-cyan-700 text-cyan-300 hover:bg-cyan-900/20"
                >
                  Verify Domain
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Theme Customization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">Color Scheme</label>
              <select
                value={theme.colorScheme || 'dark'}
                onChange={(e) => setTheme({ ...theme, colorScheme: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Font Family</label>
              <input
                type="text"
                value={theme.fontFamily || ''}
                onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
                placeholder="'Inter', sans-serif"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Custom CSS</label>
              <textarea
                value={theme.customCSS || ''}
                onChange={(e) => setTheme({ ...theme, customCSS: e.target.value })}
                placeholder=":root { --custom-var: value; }"
                rows={6}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
              />
            </div>
            <Button
              onClick={handleSaveTheme}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Save Theme
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

