"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  config: {
    webhookUrl?: string;
    channel?: string;
    email?: string;
  };
}

export default function IntegrationsManager({ userId }: { userId?: string }) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'slack',
      name: 'Slack',
      icon: '💬',
      description: 'Get quality alerts, mission notifications, and team updates in Slack',
      connected: false,
      config: {}
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: '🎮',
      description: 'Community notifications, plugin updates, and system status',
      connected: false,
      config: {}
    },
    {
      id: 'email',
      name: 'Email',
      icon: '📧',
      description: 'Weekly quality reports, critical alerts, and plugin update summaries',
      connected: false,
      config: {}
    }
  ]);

  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channel, setChannel] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchIntegrations();
  }, [userId]);

  const fetchIntegrations = async () => {
    if (!userId) return;

    try {
      // Fetch integration statuses
      const [slackRes, discordRes, emailRes] = await Promise.all([
        fetch(`/api/integrations/slack?userId=${userId}`),
        fetch(`/api/integrations/discord?userId=${userId}`),
        fetch(`/api/integrations/email?userId=${userId}`)
      ]);

      const updates: Partial<Integration>[] = [];

      if (slackRes.ok) {
        const slackData = await slackRes.json();
        updates.push({
          id: 'slack',
          connected: slackData.connected || false,
          config: { webhookUrl: slackData.webhookUrl, channel: slackData.channel }
        });
      }

      if (discordRes.ok) {
        const discordData = await discordRes.json();
        updates.push({
          id: 'discord',
          connected: discordData.connected || false,
          config: { webhookUrl: discordData.webhookUrl }
        });
      }

      if (emailRes.ok) {
        const emailData = await emailRes.json();
        updates.push({
          id: 'email',
          connected: !!emailData.email,
          config: { email: emailData.email }
        });
      }

      setIntegrations(prev => prev.map(integration => {
        const update = updates.find(u => u.id === integration.id);
        return update ? { ...integration, ...update } : integration;
      }));
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    }
  };

  const handleConnect = async (integrationId: string) => {
    setEditingIntegration(integrationId);
    const integration = integrations.find(i => i.id === integrationId);
    if (integration) {
      setWebhookUrl(integration.config.webhookUrl || '');
      setChannel(integration.config.channel || '');
      setEmail(integration.config.email || '');
    }
  };

  const handleSave = async (integrationId: string) => {
    try {
      if (integrationId === 'slack') {
        await fetch('/api/integrations/slack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl,
            channel,
            message: 'BEAST MODE integration test',
            type: 'info'
          })
        });
      } else if (integrationId === 'discord') {
        await fetch('/api/integrations/discord', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl,
            message: 'BEAST MODE integration test',
            type: 'info'
          })
        });
      } else if (integrationId === 'email') {
        await fetch('/api/integrations/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: 'BEAST MODE Integration Test',
            text: 'This is a test email from BEAST MODE.'
          })
        });
      }

      setEditingIntegration(null);
      await fetchIntegrations();

      if (typeof window !== 'undefined') {
        const event = new CustomEvent('beast-mode-notification', {
          detail: {
            type: 'success',
            message: `${integrations.find(i => i.id === integrationId)?.name} integration connected!`
          }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to save integration:', error);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm(`Disconnect ${integrations.find(i => i.id === integrationId)?.name}?`)) {
      return;
    }

    setIntegrations(prev => prev.map(i =>
      i.id === integrationId ? { ...i, connected: false, config: {} } : i
    ));

    if (typeof window !== 'undefined') {
      const event = new CustomEvent('beast-mode-notification', {
        detail: {
          type: 'success',
          message: `${integrations.find(i => i.id === integrationId)?.name} disconnected`
        }
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="space-y-4">
      {integrations.map((integration) => (
        <Card
          key={integration.id}
          className={`bg-slate-900/90 border-slate-800 ${
            integration.connected ? 'border-green-500/50' : ''
          }`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{integration.icon}</div>
                <div>
                  <CardTitle className="text-white text-lg">{integration.name}</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    {integration.description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {integration.connected ? (
                  <>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      Connected
                    </span>
                    <Button
                      onClick={() => handleDisconnect(integration.id)}
                      variant="outline"
                      className="border-red-700 text-red-400 hover:bg-red-900/20 text-xs"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleConnect(integration.id)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {editingIntegration === integration.id && (
            <CardContent className="pt-0">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
                {integration.id === 'slack' && (
                  <>
                    <div>
                      <label className="text-slate-300 text-sm mb-1 block">Webhook URL</label>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://hooks.slack.com/services/..."
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 text-sm mb-1 block">Channel (optional)</label>
                      <input
                        type="text"
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        placeholder="#beast-mode"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </>
                )}

                {integration.id === 'discord' && (
                  <div>
                    <label className="text-slate-300 text-sm mb-1 block">Webhook URL</label>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {integration.id === 'email' && (
                  <div>
                    <label className="text-slate-300 text-sm mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSave(integration.id)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditingIntegration(null)}
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

