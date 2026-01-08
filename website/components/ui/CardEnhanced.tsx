"use client";

import * as React from "react";
import { cn } from "./utils";

/**
 * Enhanced Card Component
 * 
 * UX Principles Applied:
 * - Visual hierarchy (clear structure, spacing)
 * - Progressive disclosure (hover reveals more)
 * - Feedback (hover states, transitions)
 * - Consistency (predictable patterns)
 */
const CardEnhanced = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
    interactive?: boolean;
  }
>(({ className, hover = false, interactive = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Base card styles
      "rounded-xl border border-slate-800/50 bg-slate-900/90 backdrop-blur-sm",
      "text-white shadow-lg relative z-10",
      "transition-all duration-300 ease-out",
      
      // Hover effects for discoverability
      hover && "hover:border-slate-700/50 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5",
      
      // Interactive cards (clickable)
      interactive && "cursor-pointer hover:bg-slate-900/95 active:scale-[0.98]",
      
      className
    )}
    {...props}
  />
));
CardEnhanced.displayName = "CardEnhanced";

const CardHeaderEnhanced = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6 pb-4",
      className
    )}
    {...props}
  />
));
CardHeaderEnhanced.displayName = "CardHeaderEnhanced";

const CardTitleEnhanced = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      // Clear typography hierarchy
      "text-2xl font-semibold leading-tight tracking-tight text-white",
      "mb-1",
      className
    )}
    {...props}
  />
));
CardTitleEnhanced.displayName = "CardTitleEnhanced";

const CardDescriptionEnhanced = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      // Secondary text - clear but not competing
      "text-sm text-slate-400 leading-relaxed",
      className
    )}
    {...props}
  />
));
CardDescriptionEnhanced.displayName = "CardDescriptionEnhanced";

const CardContentEnhanced = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "p-6 pt-4",
      className
    )} 
    {...props} 
  />
));
CardContentEnhanced.displayName = "CardContentEnhanced";

const CardFooterEnhanced = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between p-6 pt-4 border-t border-slate-800/50",
      className
    )}
    {...props}
  />
));
CardFooterEnhanced.displayName = "CardFooterEnhanced";

export { 
  CardEnhanced, 
  CardHeaderEnhanced, 
  CardFooterEnhanced, 
  CardTitleEnhanced, 
  CardDescriptionEnhanced, 
  CardContentEnhanced 
};
