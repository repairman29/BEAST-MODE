"use client";

import * as React from "react";
import { cn } from "./utils";
import { Loader2 } from "lucide-react";

export interface ButtonEnhancedProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * Enhanced Button Component
 * 
 * UX Principles Applied:
 * - Clear visual hierarchy (size, color, contrast)
 * - Immediate feedback (hover, active, loading states)
 * - Accessibility (focus indicators, ARIA labels)
 * - Delightful micro-interactions (smooth transitions)
 */
const ButtonEnhanced = React.forwardRef<HTMLButtonElement, ButtonEnhancedProps>(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    loading = false,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          // Base styles - smooth transitions, clear focus
          "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "disabled:pointer-events-none disabled:opacity-50",
          "cursor-pointer relative z-50",
          "active:scale-[0.98] transform",
          
          // Variants with enhanced hover states
          {
            // Primary - high contrast, prominent
            'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-cyan-500 hover:to-blue-500': variant === 'default',
            
            // Destructive - clear but not overwhelming
            'bg-red-600 text-white shadow-lg shadow-red-500/25 hover:bg-red-700 hover:shadow-red-500/40': variant === 'destructive',
            
            // Outline - subtle, secondary action
            'border-2 border-slate-700 bg-transparent text-slate-300 hover:border-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10': variant === 'outline',
            
            // Secondary - medium prominence
            'bg-slate-800 text-white hover:bg-slate-700': variant === 'secondary',
            
            // Ghost - minimal, tertiary action
            'text-slate-400 hover:text-white hover:bg-slate-900/50': variant === 'ghost',
            
            // Link - text action
            'text-cyan-400 underline-offset-4 hover:underline hover:text-cyan-300': variant === 'link',
            
            // Gradient - premium, special actions
            'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400': variant === 'gradient',
          },
          
          // Sizes with consistent padding
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 px-3 text-xs': size === 'sm',
            'h-11 px-8 text-base': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
        )}
        {children && (
          <span className={loading ? 'opacity-70' : ''}>{children}</span>
        )}
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
        )}
      </button>
    );
  }
);
ButtonEnhanced.displayName = "ButtonEnhanced";

export { ButtonEnhanced };
