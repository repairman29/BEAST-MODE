"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface Webhook {
  webhookId: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
}

interface Integration {
  integrationId: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  createdAt: string;
}

interface CustomIntegrationsProps {
  userId?: string;
}

export default function CustomIntegrations({ userId }: CustomIntegrationsProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[],
    secret: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [integrationsRes, eventsRes] = await Promise.all([
        fetch('/api/beast-mode/enterprise/integrations?action=list'),
        fetch('/api/beast-mode/enterprise/integrations?action=events')
      ]);

      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        setIntegrations(data.integrations || []);
        setWebhooks(data.webhooks || []);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setAvailableEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      return;
    }

    try {
      const response = await fetch('/api/beast-mode/enterprise/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-webhook',
          webhookConfig: newWebhook
        })
      });

      if (response.ok) {
        await fetchData();
        setShowCreateWebhook(false);
        setNewWebhook({ url: '', events: [], secret: '' });
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  const toggleEvent = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
          <span className="text-cyan-400 text-sm">Loading integrations...</span>
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
              <CardTitle className="text-white text-lg">🔌 Custom Integrations</CardTitle>
              <CardDescription className="text-slate-400">
                Create webhooks, API integrations, and custom plugins
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateWebhook(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              + Create Webhook
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create Webhook Form */}
      {showCreateWebhook && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Create Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">Webhook URL</label>
              <input
                type="url"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                placeholder="https://your-app.com/webhook"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">Subscribe to Events</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableEvents.map((category) => (
                  <div key={category.category} className="space-y-1">
                    <div className="text-slate-300 text-sm font-semibold capitalize">
                      {category.category}
                    </div>
                    {category.events.map((event: string) => (
                      <label
                        key={event}
                        className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newWebhook.events.includes(event)}
                          onChange={() => toggleEvent(event)}
                          className="w-4 h-4"
                        />
                        <span className="text-slate-400 text-sm">{event}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateWebhook}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                Create Webhook
              </Button>
              <Button
                onClick={() => {
                  setShowCreateWebhook(false);
                  setNewWebhook({ url: '', events: [], secret: '' });
                }}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks List */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Webhooks ({webhooks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-2">🔌</div>
              <div>No webhooks configured</div>
              <div className="text-sm mt-2">Create a webhook to receive real-time events</div>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.webhookId}
                  className="p-4 bg-slate-950 rounded-lg border border-slate-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-white font-semibold">{webhook.url}</div>
                      <div className="text-slate-400 text-sm mt-1">
                        {webhook.events.length} event(s) subscribed
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      webhook.enabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {webhook.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {webhook.events.slice(0, 3).map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300"
                      >
                        {event}
                      </span>
                    ))}
                    {webhook.events.length > 3 && (
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">
                        +{webhook.events.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integrations List */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Custom Integrations ({integrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-2">🔧</div>
              <div>No custom integrations</div>
              <div className="text-sm mt-2">Create API integrations or plugins</div>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div
                  key={integration.integrationId}
                  className="p-4 bg-slate-950 rounded-lg border border-slate-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-white font-semibold">{integration.name}</div>
                      <div className="text-slate-400 text-sm mt-1">{integration.description}</div>
                      <div className="text-slate-500 text-xs mt-1">
                        Type: {integration.type} • Created: {new Date(integration.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      integration.enabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {integration.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

