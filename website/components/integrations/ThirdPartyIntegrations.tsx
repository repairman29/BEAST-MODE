"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  MessageSquare, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  TestTube,
  Bell,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface IntegrationConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  webhookUrl?: string;
  channel?: string;
  email?: string;
  preferences?: {
    qualityAlerts?: boolean;
    missionNotifications?: boolean;
    weeklyReports?: boolean;
    pluginUpdates?: boolean;
    criticalAlerts?: boolean;
  };
}

interface ThirdPartyIntegrationsProps {
  userId?: string;
}

export default function ThirdPartyIntegrations({ userId }: ThirdPartyIntegrationsProps) {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([
    {
      id: 'slack',
      name: 'Slack',
      icon: <MessageSquare className="w-5 h-5" />,
      connected: false,
      preferences: {
        qualityAlerts: true,
        missionNotifications: true,
        criticalAlerts: true
      }
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: <MessageSquare className="w-5 h-5" />,
      connected: false,
      preferences: {
        qualityAlerts: true,
        pluginUpdates: true,
        criticalAlerts: true
      }
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      connected: false,
      preferences: {
        weeklyReports: true,
        criticalAlerts: true,
        pluginUpdates: true,
        qualityAlerts: false
      }
    }
  ]);
  const [activeTab, setActiveTab] = useState<'slack' | 'discord' | 'email'>('slack');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, [userId]);

  const fetchIntegrations = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const [slackRes, discordRes, emailRes] = await Promise.all([
        fetch(`/api/integrations/slack?userId=${userId}`),
        fetch(`/api/integrations/discord?userId=${userId}`),
        fetch(`/api/integrations/email?userId=${userId}`)
      ]);

      const updates: Partial<IntegrationConfig>[] = [];

      if (slackRes.ok) {
        const data = await slackRes.json();
        updates.push({
          id: 'slack',
          connected: data.connected || false,
          webhookUrl: data.webhookUrl,
          channel: data.channel
        });
      }

      if (discordRes.ok) {
        const data = await discordRes.json();
        updates.push({
          id: 'discord',
          connected: data.connected || false,
          webhookUrl: data.webhookUrl
        });
      }

      if (emailRes.ok) {
        const data = await emailRes.json();
        updates.push({
          id: 'email',
          connected: !!data.email,
          email: data.email,
          preferences: data.preferences
        });
      }

      setIntegrations(prev => prev.map(integration => {
        const update = updates.find(u => u.id === integration.id);
        return update ? { ...integration, ...update } : integration;
      }));
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (integrationId: string, config: any) => {
    setIsLoading(true);
    setTestResult(null);

    try {
      let response;
      if (integrationId === 'slack') {
        response = await fetch('/api/integrations/slack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            channelId: config.channel || '#beast-mode',
            webhookUrl: config.webhookUrl
          })
        });
      } else if (integrationId === 'discord') {
        response = await fetch('/api/integrations/discord', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: config.webhookUrl,
            message: 'BEAST MODE Discord integration connected! 🎉',
            type: 'success'
          })
        });
      } else if (integrationId === 'email') {
        response = await fetch('/api/integrations/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: config.email,
            subject: 'BEAST MODE Email Integration Test',
            template: 'quality-report',
            data: { repository: 'test', qualityScore: 95 }
          })
        });
      }

      if (response?.ok) {
        await fetchIntegrations();
        setTestResult({ success: true, message: 'Integration connected successfully!' });
      } else {
        const error = await response?.json();
        setTestResult({ success: false, message: error?.error || 'Failed to connect' });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Connection failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async (integrationId: string) => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const integration = integrations.find(i => i.id === integrationId);
      if (!integration) return;

      let response;
      if (integrationId === 'slack') {
        response = await fetch('/api/integrations/slack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'notify',
            channelId: integration.channel || '#beast-mode',
            message: '🧪 Test notification from BEAST MODE!'
          })
        });
      } else if (integrationId === 'discord') {
        response = await fetch('/api/integrations/discord', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: integration.webhookUrl,
            message: '🧪 Test notification from BEAST MODE!',
            type: 'info'
          })
        });
      } else if (integrationId === 'email') {
        response = await fetch('/api/integrations/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: integration.email,
            subject: 'BEAST MODE Test Email',
            template: 'quality-report',
            data: { repository: 'test', qualityScore: 95, issuesCount: 0, warningsCount: 0 }
          })
        });
      }

      if (response?.ok) {
        setTestResult({ success: true, message: 'Test notification sent successfully!' });
      } else {
        const error = await response?.json();
        setTestResult({ success: false, message: error?.error || 'Test failed' });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const currentIntegration = integrations.find(i => i.id === activeTab);

  return (
    <Card className="bg-slate-900/90 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Third-Party Integrations
            </CardTitle>
            <CardDescription className="text-slate-400">
              Connect Slack, Discord, and Email for notifications
            </CardDescription>
          </div>
          <Button
            onClick={fetchIntegrations}
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="slack" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Slack
            </TabsTrigger>
            <TabsTrigger value="discord" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Discord
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* Slack */}
          <TabsContent value="slack" className="space-y-4 mt-4">
            <IntegrationConfigForm
              integration={currentIntegration!}
              onConnect={handleConnect}
              onTest={handleTest}
              isTesting={isTesting}
              testResult={testResult}
              fields={[
                {
                  name: 'webhookUrl',
                  label: 'Webhook URL',
                  type: 'url',
                  placeholder: 'https://hooks.slack.com/services/...',
                  required: true,
                  help: 'Create a webhook in Slack → Apps → Incoming Webhooks'
                },
                {
                  name: 'channel',
                  label: 'Channel',
                  type: 'text',
                  placeholder: '#beast-mode',
                  required: false,
                  help: 'Channel name (e.g., #beast-mode)'
                }
              ]}
              preferences={[
                { key: 'qualityAlerts', label: 'Quality Alerts' },
                { key: 'missionNotifications', label: 'Mission Notifications' },
                { key: 'criticalAlerts', label: 'Critical Alerts' }
              ]}
            />
          </TabsContent>

          {/* Discord */}
          <TabsContent value="discord" className="space-y-4 mt-4">
            <IntegrationConfigForm
              integration={currentIntegration!}
              onConnect={handleConnect}
              onTest={handleTest}
              isTesting={isTesting}
              testResult={testResult}
              fields={[
                {
                  name: 'webhookUrl',
                  label: 'Webhook URL',
                  type: 'url',
                  placeholder: 'https://discord.com/api/webhooks/...',
                  required: true,
                  help: 'Create a webhook in Discord → Server Settings → Integrations → Webhooks'
                }
              ]}
              preferences={[
                { key: 'qualityAlerts', label: 'Quality Alerts' },
                { key: 'pluginUpdates', label: 'Plugin Updates' },
                { key: 'criticalAlerts', label: 'Critical Alerts' }
              ]}
            />
          </TabsContent>

          {/* Email */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <IntegrationConfigForm
              integration={currentIntegration!}
              onConnect={handleConnect}
              onTest={handleTest}
              isTesting={isTesting}
              testResult={testResult}
              fields={[
                {
                  name: 'email',
                  label: 'Email Address',
                  type: 'email',
                  placeholder: 'your-email@example.com',
                  required: true,
                  help: 'Email address to receive notifications'
                }
              ]}
              preferences={[
                { key: 'weeklyReports', label: 'Weekly Reports' },
                { key: 'criticalAlerts', label: 'Critical Alerts' },
                { key: 'pluginUpdates', label: 'Plugin Updates' },
                { key: 'qualityAlerts', label: 'Quality Alerts' }
              ]}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Setup Guide */}
        <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
          <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Setup Instructions
          </h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• <strong>Slack:</strong> Create webhook at slack.com → Apps → Incoming Webhooks</li>
            <li>• <strong>Discord:</strong> Create webhook in Server Settings → Integrations → Webhooks</li>
            <li>• <strong>Email:</strong> Enter your email address to receive notifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

interface IntegrationConfigFormProps {
  integration: IntegrationConfig;
  onConnect: (id: string, config: any) => Promise<void>;
  onTest: (id: string) => Promise<void>;
  isTesting: boolean;
  testResult: { success: boolean; message: string } | null;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    placeholder: string;
    required: boolean;
    help?: string;
  }>;
  preferences: Array<{ key: string; label: string }>;
}

function IntegrationConfigForm({
  integration,
  onConnect,
  onTest,
  isTesting,
  testResult,
  fields,
  preferences
}: IntegrationConfigFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [prefs, setPrefs] = useState<Record<string, boolean>>(integration.preferences || {});

  useEffect(() => {
    const initial: Record<string, string> = {};
    fields.forEach(field => {
      initial[field.name] = (integration as any)[field.name] || '';
    });
    setFormData(initial);
    setPrefs(integration.preferences || {});
  }, [integration, fields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConnect(integration.id, { ...formData, preferences: prefs });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {integration.icon}
          <span className="text-white font-semibold">{integration.name}</span>
        </div>
        <Badge className={integration.connected 
          ? 'bg-green-500/20 text-green-400 border-green-500/50'
          : 'bg-slate-500/20 text-slate-400 border-slate-500/50'
        }>
          {integration.connected ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Not Connected
            </>
          )}
        </Badge>
      </div>

      {/* Form Fields */}
      {fields.map(field => (
        <div key={field.name}>
          <label className="text-sm text-slate-300 mb-1 block">
            {field.label} {field.required && <span className="text-red-400">*</span>}
          </label>
          <input
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
          />
          {field.help && (
            <p className="text-xs text-slate-500 mt-1">{field.help}</p>
          )}
        </div>
      ))}

      {/* Preferences */}
      <div>
        <label className="text-sm text-slate-300 mb-2 block">Notification Preferences</label>
        <div className="space-y-2">
          {preferences.map(pref => (
            <label key={pref.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs[pref.key] || false}
                onChange={(e) => setPrefs({ ...prefs, [pref.key]: e.target.checked })}
                className="w-4 h-4 text-cyan-600 bg-slate-800 border-slate-700 rounded"
              />
              <span className="text-sm text-slate-400">{pref.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`p-3 rounded-lg ${
          testResult.success 
            ? 'bg-green-500/20 border border-green-500/50' 
            : 'bg-red-500/20 border border-red-500/50'
        }`}>
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.message}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {integration.connected ? 'Update' : 'Connect'}
        </Button>
        {integration.connected && (
          <Button
            type="button"
            onClick={() => onTest(integration.id)}
            disabled={isTesting}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Test
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
