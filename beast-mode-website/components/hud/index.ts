/**
 * HUD Component Library - 3046 Edition
 *
 * Exports all HUD components for easy import
 */

// Core components
export { default as HudPanel } from './HudPanel';
export { default as HudButton } from './HudButton';
export { default as StatusBar } from './StatusBar';
export { default as NotificationWidget } from './NotificationWidget';

// Context and controller
export { HudController, useHUD, useWidget, WIDGET_CONFIGS } from './HudController';
export type { HUDContext, WidgetConfig } from './HudController';
export type { Notification } from './NotificationWidget';

// Widgets
export { default as MissionWidget } from './widgets/MissionWidget';
export { default as CrewWidget } from './widgets/CrewWidget';
export { default as ShipDiagnostics } from './widgets/ShipDiagnostics';
