"use client";

import React from 'react';

interface HudButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

/**
 * 3046 Holographic Button Component
 *
 * Minimal design with glow effects on interaction
 */
export default function HudButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}: HudButtonProps) {

  const baseStyles = `
    relative font-mono uppercase tracking-widest
    transition-all duration-200 ease-out
    disabled:opacity-30 disabled:cursor-not-allowed
  `;

  const variantStyles = {
    primary: `
      text-holo-amber bg-transparent
      shadow-[inset_0_0_0_1px_rgba(255,179,0,0.3)]
      hover:shadow-holo-edge-bright hover:text-holo-amber
      active:bg-holo-amber-glow
    `,
    secondary: `
      text-holo-amber-dim bg-transparent
      shadow-[inset_0_0_0_1px_rgba(255,179,0,0.2)]
      hover:shadow-[inset_0_0_0_1px_rgba(255,179,0,0.4)]
      hover:text-holo-amber
    `,
    danger: `
      text-holo-red bg-transparent
      shadow-[inset_0_0_0_1px_rgba(255,0,60,0.3)]
      hover:shadow-[inset_0_0_0_1px_rgba(255,0,60,0.6),0_0_20px_rgba(255,0,60,0.3)]
      active:bg-holo-red/10
    `,
    ghost: `
      text-holo-amber-faint bg-transparent
      hover:text-holo-amber-dim
    `
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
}
