"use client";

import React from 'react';

interface HudPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'minimal' | 'elevated';
  corners?: boolean;
  glow?: 'none' | 'soft' | 'medium' | 'bright';
}

/**
 * 3046 Holographic Panel Component
 *
 * Replaces heavy borders with translucent backgrounds and edge glows
 */
export default function HudPanel({
  children,
  className = '',
  variant = 'default',
  corners = false,
  glow = 'soft'
}: HudPanelProps) {

  const baseStyles = "relative font-mono";

  const variantStyles = {
    default: "bg-void-surface/60 backdrop-blur-hud p-4",
    minimal: "bg-transparent p-2",
    elevated: "bg-void-surface/80 backdrop-blur-overlay p-6"
  };

  const glowStyles = {
    none: '',
    soft: 'shadow-holo-soft',
    medium: 'shadow-holo-medium',
    bright: 'shadow-holo-edge-bright'
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${glowStyles[glow]} ${className}`}>
      {/* Corner accents (optional L-shaped corners) */}
      {corners && (
        <>
          <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-holo-amber-faint" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-holo-amber-faint" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-holo-amber-faint" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-holo-amber-faint" />
        </>
      )}

      {children}
    </div>
  );
}
