"use client";

import React from 'react';
import { cn } from './utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
}

/**
 * Responsive Container
 * Provides mobile-first responsive layout utilities
 */
export default function ResponsiveContainer({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = ''
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        // Base mobile styles
        'w-full px-4 py-4',
        mobileClassName,
        // Tablet styles
        'md:px-6 md:py-6',
        tabletClassName,
        // Desktop styles
        'lg:px-8 lg:py-8 xl:max-w-7xl xl:mx-auto',
        desktopClassName,
        className
      )}
    >
      {children}
  </div>
  );
}

/**
 * Responsive Grid
 * Mobile-first grid layout
 */
export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className = ''
}: {
  children: React.ReactNode;
  cols?: { mobile?: number; tablet?: number; desktop?: number };
  gap?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${cols.mobile || 1}`,
        `md:grid-cols-${cols.tablet || 2}`,
        `lg:grid-cols-${cols.desktop || 3}`,
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Responsive Flex
 * Mobile-first flex layout
 */
export function ResponsiveFlex({
  children,
  direction = { mobile: 'col', desktop: 'row' },
  gap = 4,
  className = ''
}: {
  children: React.ReactNode;
  direction?: { mobile?: 'col' | 'row'; desktop?: 'col' | 'row' };
  gap?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex',
        `flex-${direction.mobile || 'col'}`,
        `md:flex-${direction.desktop || 'row'}`,
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}
