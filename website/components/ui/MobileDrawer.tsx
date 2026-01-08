"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from './utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  side?: 'left' | 'right';
}

export default function MobileDrawer({
  isOpen,
  onClose,
  children,
  title,
  side = 'left'
}: MobileDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 bottom-0 z-50 w-80 bg-slate-900 border-r border-slate-800 shadow-xl transition-transform duration-300 md:hidden",
          side === 'left' ? 'left-0' : 'right-0',
          isOpen ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h2 id="drawer-title" className="text-white font-semibold">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        <div className="overflow-y-auto h-full">
          {children}
        </div>
      </div>
    </>
  );
}
