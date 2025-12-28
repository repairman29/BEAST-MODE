"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * HUD Context - Game state that determines what UI to show
 */
export interface HUDContext {
  // Active states (what's happening NOW)
  inCombat: boolean;
  inDialogue: boolean;
  inShop: boolean;
  piloting: boolean;
  missionActive: boolean;
  trading: boolean;

  // Alerts (what needs ATTENTION)
  lowHealth: boolean;
  lowFuel: boolean;
  incomingMessage: boolean;
  missionUpdate: boolean;
  shipDamage: boolean;
  crewInjured: boolean;

  // Location context
  location: string;
  locationType: 'space' | 'station' | 'planet' | 'outpost' | 'unknown';

  // Player activity
  activity: 'idle' | 'traveling' | 'trading' | 'fighting' | 'exploring' | 'repairing';

  // UI state
  hudMode: 'minimal' | 'tactical' | 'operations' | 'full';
  activeWidget: string | null;
}

/**
 * Widget Priority System
 *
 * Determines which widgets should be visible based on context
 */
export interface WidgetConfig {
  id: string;
  priority: number; // Higher = more important
  requiredState?: Partial<HUDContext>;
  conflictsWith?: string[]; // Widget IDs that can't show simultaneously
}

const defaultContext: HUDContext = {
  inCombat: false,
  inDialogue: false,
  inShop: false,
  piloting: false,
  missionActive: false,
  trading: false,
  lowHealth: false,
  lowFuel: false,
  incomingMessage: false,
  missionUpdate: false,
  shipDamage: false,
  crewInjured: false,
  location: 'Unknown',
  locationType: 'space',
  activity: 'idle',
  hudMode: 'minimal',
  activeWidget: null
};

const HUDContextObject = createContext<{
  context: HUDContext;
  updateContext: (updates: Partial<HUDContext>) => void;
  shouldShowWidget: (widgetId: string) => boolean;
  registerWidget: (config: WidgetConfig) => void;
}>({
  context: defaultContext,
  updateContext: () => {},
  shouldShowWidget: () => false,
  registerWidget: () => {}
});

export const useHUD = () => useContext(HUDContextObject);

/**
 * HUD Controller Provider
 *
 * Wraps the app and manages HUD context
 */
export function HudController({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<HUDContext>(defaultContext);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  const updateContext = (updates: Partial<HUDContext>) => {
    setContext(prev => {
      const newContext = { ...prev, ...updates };

      // Auto-determine HUD mode based on state
      if (newContext.inCombat) {
        newContext.hudMode = 'tactical';
      } else if (newContext.trading || newContext.inShop) {
        newContext.hudMode = 'operations';
      } else if (newContext.missionActive || newContext.piloting) {
        newContext.hudMode = 'operations';
      } else {
        newContext.hudMode = 'minimal';
      }

      return newContext;
    });
  };

  const registerWidget = (config: WidgetConfig) => {
    setWidgets(prev => {
      const existing = prev.find(w => w.id === config.id);
      if (existing) return prev;
      return [...prev, config];
    });
  };

  const shouldShowWidget = (widgetId: string): boolean => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return false;

    // Check required state
    if (widget.requiredState) {
      for (const [key, value] of Object.entries(widget.requiredState)) {
        if (context[key as keyof HUDContext] !== value) {
          return false;
        }
      }
    }

    // Check conflicts
    if (widget.conflictsWith && context.activeWidget) {
      if (widget.conflictsWith.includes(context.activeWidget)) {
        return false;
      }
    }

    // Priority-based visibility (top 3 widgets shown in minimal mode)
    if (context.hudMode === 'minimal') {
      const visibleWidgets = widgets
        .filter(w => !w.requiredState || shouldShowWidget(w.id))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);

      return visibleWidgets.some(w => w.id === widgetId);
    }

    return true;
  };

  // Auto-detect alerts based on game state
  useEffect(() => {
    // This would connect to actual game state
    // For now, placeholder logic
  }, []);

  return (
    <HUDContextObject.Provider value={{ context, updateContext, shouldShowWidget, registerWidget }}>
      {children}
    </HUDContextObject.Provider>
  );
}

/**
 * Hook to register a widget with the HUD system
 */
export function useWidget(config: WidgetConfig) {
  const { registerWidget, shouldShowWidget } = useHUD();

  useEffect(() => {
    registerWidget(config);
  }, [config.id]);

  return shouldShowWidget(config.id);
}

/**
 * Pre-defined widget configurations
 */
export const WIDGET_CONFIGS: Record<string, WidgetConfig> = {
  STATUS_BAR: {
    id: 'status_bar',
    priority: 100, // Always show
  },
  COMBAT_HUD: {
    id: 'combat_hud',
    priority: 95,
    requiredState: { inCombat: true }
  },
  TRADING_TERMINAL: {
    id: 'trading_terminal',
    priority: 90,
    requiredState: { trading: true }
  },
  MISSION_BRIEF: {
    id: 'mission_brief',
    priority: 80,
    requiredState: { missionActive: true }
  },
  SHIP_DIAGNOSTICS: {
    id: 'ship_diagnostics',
    priority: 85,
    requiredState: { shipDamage: true }
  },
  CHRONICLER: {
    id: 'chronicler',
    priority: 70
  },
  NOTIFICATIONS: {
    id: 'notifications',
    priority: 100
  }
};
