/**
 * BEAST MODE Accessibility Utilities
 * 
 * Helper functions for improving accessibility
 */

import React from 'react';

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Focus management - trap focus within element
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleTab(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  element.addEventListener('keydown', handleTab);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTab);
  };
}

/**
 * Get keyboard shortcut description
 */
export function getKeyboardShortcut(key: string): string {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? '⌘' : 'Ctrl';
  
  const shortcuts: Record<string, string> = {
    'k': `${modifier}+K`,
    'b': `${modifier}+B`,
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    'escape': 'Esc',
  };

  return shortcuts[key.toLowerCase()] || key;
}

/**
 * Skip to main content link
 */
export function SkipToMainContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
    >
      Skip to main content
    </a>
  );
}

/**
 * Screen reader only class
 */
export const srOnly = 'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

