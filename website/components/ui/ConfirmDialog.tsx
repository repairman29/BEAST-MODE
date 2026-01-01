"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'danger';
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default'
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="bg-slate-900/95 border-slate-700 max-w-md w-full shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 whitespace-pre-line">{message}</p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel || (() => {})}
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className={
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AlertDialogProps {
  open: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  variant?: 'success' | 'error' | 'info';
}

export function AlertDialog({
  open,
  title,
  message,
  buttonText = 'OK',
  onClose,
  variant = 'info'
}: AlertDialogProps) {
  if (!open) return null;

  const variantStyles = {
    success: 'border-green-500/50 bg-green-500/10',
    error: 'border-red-500/50 bg-red-500/10',
    info: 'border-cyan-500/50 bg-cyan-500/10'
  };

  const iconColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-cyan-400'
  };

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className={`bg-slate-900/95 ${variantStyles[variant]} max-w-md w-full shadow-2xl`}>
        <CardHeader>
          <CardTitle className={`${iconColors[variant]} text-xl flex items-center gap-2`}>
            <span className="text-2xl">{icons[variant]}</span>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 whitespace-pre-line">{message}</p>
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className={
                variant === 'error'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : variant === 'success'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }
            >
              {buttonText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

