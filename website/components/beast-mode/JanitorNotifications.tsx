"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface Notification {
  id: string;
  timestamp: string;
  type: 'refactor-complete' | 'violation-blocked' | 'regression-detected' | 'test-failed' | 'scan-issue';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
}

export default function JanitorNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 15 seconds
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/beast-mode/janitor/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        // Mock data
        setNotifications([
          {
            id: '1',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            type: 'refactor-complete',
            title: 'Overnight Refactoring Complete',
            message: 'Fixed 23 issues and created 5 PRs',
            read: false,
            actionUrl: '/dashboard?view=janitor&tab=history'
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            type: 'violation-blocked',
            title: 'Architecture Violation Blocked',
            message: 'Prevented hardcoded API key in commit',
            read: false,
            actionUrl: '/dashboard?view=janitor&tab=rules'
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            type: 'regression-detected',
            title: 'Code Quality Regression Detected',
            message: 'Quality dropped by 12% - restore available',
            read: true,
            actionUrl: '/dashboard?view=janitor&tab=restoration'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/beast-mode/janitor/notifications/${id}/read`, {
        method: 'POST'
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'refactor-complete': '🧹',
      'violation-blocked': '🛡️',
      'regression-detected': '⚠️',
      'test-failed': '❌',
      'scan-issue': '🔍'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      'refactor-complete': 'border-green-500/30 bg-green-500/10',
      'violation-blocked': 'border-blue-500/30 bg-blue-500/10',
      'regression-detected': 'border-yellow-500/30 bg-yellow-500/10',
      'test-failed': 'border-red-500/30 bg-red-500/10',
      'scan-issue': 'border-orange-500/30 bg-orange-500/10'
    };
    return colors[type] || 'border-slate-700 bg-slate-800/50';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading && notifications.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="text-cyan-400 text-center">Loading notifications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="text-xl">🔔</div>
            <div className="text-white font-semibold">Notifications</div>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white border-0">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer hover:opacity-90 ${
                  notification.read
                    ? 'border-slate-700 bg-slate-800/30 opacity-60'
                    : getNotificationColor(notification.type)
                }`}
                onClick={() => {
                  markAsRead(notification.id);
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-sm font-semibold ${notification.read ? 'text-slate-400' : 'text-white'}`}>
                        {notification.title}
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      )}
                    </div>
                    <div className={`text-xs ${notification.read ? 'text-slate-500' : 'text-slate-300'}`}>
                      {notification.message}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

