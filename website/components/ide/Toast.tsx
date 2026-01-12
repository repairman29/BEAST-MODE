'use client';

/**
 * Toast Notification Component
 * 
 * Displays temporary notifications for user actions
 */

import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const colors = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    info: 'bg-blue-600 border-blue-500',
    warning: 'bg-yellow-600 border-yellow-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div
      className={`${colors[toast.type]} border-l-4 text-white px-4 py-3 shadow-lg rounded-r-lg mb-2 flex items-center justify-between min-w-[300px] max-w-[500px] animate-slide-in`}
      role="alert"
    >
      <div className="flex items-center">
        <span className="mr-2 text-lg">{icons[toast.type]}</span>
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-4 text-white hover:text-gray-200 text-lg"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Listen for toast events
    const handleToast = (e: CustomEvent<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        ...e.detail,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };
      setToasts((prev) => [...prev, toast]);
    };

    window.addEventListener('show-toast' as any, handleToast as EventListener);
    return () => {
      window.removeEventListener('show-toast' as any, handleToast as EventListener);
    };
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  const event = new CustomEvent('show-toast', {
    detail: { message, type, duration },
  });
  window.dispatchEvent(event);
}
