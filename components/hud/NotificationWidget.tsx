"use client";

import React, { useEffect, useState } from 'react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

interface NotificationWidgetProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

/**
 * Toast-style notifications in bottom-right corner
 */
export default function NotificationWidget({ notifications, onDismiss }: NotificationWidgetProps) {

  const NotificationToast = ({ notification }: { notification: Notification }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(notification.id), 300);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    }, [notification]);

    const typeStyles = {
      info: 'border-holo-cyan text-holo-cyan',
      success: 'border-holo-green text-holo-green',
      warning: 'border-holo-amber text-holo-amber',
      error: 'border-holo-red text-holo-red'
    };

    const typeIcon = {
      info: 'ℹ️',
      success: '✓',
      warning: '⚠',
      error: '✗'
    };

    return (
      <div
        className={`
          relative bg-void-surface/90 backdrop-blur-hud p-3 mb-2
          border-l-2 ${typeStyles[notification.type]}
          shadow-holo-medium
          transform transition-all duration-300 ease-out
          ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        `}
      >
        <div className="flex items-start gap-3">
          <span className="text-lg">{typeIcon[notification.type]}</span>
          <span className="flex-1 text-sm font-mono">{notification.message}</span>
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => onDismiss(notification.id), 300);
            }}
            className="text-holo-amber-faint hover:text-holo-amber text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      {notifications.map(notification => (
        <NotificationToast key={notification.id} notification={notification} />
      ))}
    </div>
  );
}
