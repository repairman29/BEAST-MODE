/**
 * Keyboard Shortcuts Manager
 * 
 * Handles all keyboard shortcuts for the IDE
 */

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export class KeyboardShortcuts {
  private shortcuts: Map<string, Shortcut> = new Map();
  private listeners: Map<string, (e: KeyboardEvent) => void> = new Map();

  register(shortcut: Shortcut) {
    const id = this.getShortcutId(shortcut);
    this.shortcuts.set(id, shortcut);
    this.updateListeners();
  }

  unregister(shortcut: Shortcut) {
    const id = this.getShortcutId(shortcut);
    this.shortcuts.delete(id);
    this.updateListeners();
  }

  private getShortcutId(shortcut: Shortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl || shortcut.meta) parts.push('mod');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  private updateListeners() {
    // Remove old listeners
    this.listeners.forEach((listener) => {
      document.removeEventListener('keydown', listener);
    });
    this.listeners.clear();

    // Add new listener
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      for (const shortcut of this.shortcuts.values()) {
        const matchesMod = (shortcut.ctrl || shortcut.meta) ? modKey : !modKey && !e.metaKey && !e.ctrlKey;
        const matchesShift = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const matchesAlt = shortcut.alt ? e.altKey : !e.altKey;
        const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (matchesMod && matchesShift && matchesAlt && matchesKey) {
          e.preventDefault();
          e.stopPropagation();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handler);
    this.listeners.set('main', handler);
  }

  getShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }
}

export const keyboardShortcuts = new KeyboardShortcuts();
