"use client";

import React, { useState, useEffect } from 'react';
import HudPanel from '../hud/HudPanel';
import HudButton from '../hud/HudButton';
import StatusBar from '../hud/StatusBar';

/**
 * BEAST MODE Health Monitoring & Self-Healing Dashboard
 *
 * Real-time health monitoring with automatic recovery capabilities
 */
function HealthDashboard() {
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [healingInProgress, setHealingInProgress] = useState(false);

  useEffect(() => {
    fetchHealthData();

    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/beast-mode/health');
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSelfHealing = async (componentName = null) => {
    setHealingInProgress(true);
    try {
      const response = await fetch('/api/beast-mode/heal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ component: componentName })
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh health data after healing
        await fetchHealthData();

        // Show success notification
        console.log('Self-healing completed:', result);
      }
    } catch (error) {
      console.error('Self-healing failed:', error);
    } finally {
      setHealingInProgress(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-holo-green';
      case 'degraded': return 'text-holo-amber';
      case 'failed': return 'text-holo-red';
      default: return 'text-holo-cyan';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  if (isLoading) {
    return (
      <HudPanel className="w-full max-w-4xl">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-holo-cyan border-t-transparent rounded-full mr-4"></div>
          <span className="text-holo-cyan">Loading health status...</span>
        </div>
      </HudPanel>
    );
  }

  if (!healthData) {
    return (
      <HudPanel className="w-full max-w-4xl">
        <div className="text-center py-8">
          <span className="text-holo-red">❌ Health monitoring unavailable</span>
        </div>
      </HudPanel>
    );
  }

  const { isMonitoring, lastCheck, components, alerts, history } = healthData;
  const overallStatus = history && history.length > 0 ? history[history.length - 1].overall : 'unknown';

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Header */}
      <HudPanel>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-holo-cyan font-bold text-xl">🏥 BEAST MODE Health Monitor</h2>
          <div className="flex gap-2">
            <HudButton
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-holo-green/20' : ''}
            >
              {autoRefresh ? '⏸️ Pause' : '▶️ Resume'}
            </HudButton>
            <HudButton onClick={fetchHealthData}>
              🔄 Refresh
            </HudButton>
            <HudButton
              onClick={() => triggerSelfHealing()}
              disabled={healingInProgress}
            >
              {healingInProgress ? '🔧 Healing...' : '🩹 Heal All'}
            </HudButton>
          </div>
        </div>

        {/* Overall Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor(overallStatus)}`}>
              {getStatusIcon(overallStatus)}
            </div>
            <div className="text-sm text-holo-cyan/70">Overall Status</div>
            <div className={`text-sm font-semibold ${getStatusColor(overallStatus)}`}>
              {overallStatus.toUpperCase()}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-cyan">
              {Object.keys(components).length}
            </div>
            <div className="text-sm text-holo-cyan/70">Components</div>
            <div className="text-sm text-holo-cyan">
              {Object.values(components).filter((c: any) => c.status === 'healthy').length} Healthy
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-amber">
              {alerts.length}
            </div>
            <div className="text-sm text-holo-cyan/70">Active Alerts</div>
            <div className="text-sm text-holo-cyan">
              {alerts.filter(a => a.severity === 'critical').length} Critical
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-purple">
              {isMonitoring ? '🟢' : '🔴'}
            </div>
            <div className="text-sm text-holo-cyan/70">Monitoring</div>
            <div className="text-sm text-holo-cyan">
              {lastCheck ? new Date(lastCheck).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      </HudPanel>

      {/* Component Health Grid */}
      <HudPanel>
        <h3 className="text-holo-cyan font-bold text-lg mb-4">🔧 Component Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(components).map(([name, component]: [string, any]) => (
            <div
              key={name}
              className="bg-holo-black/30 border border-holo-cyan/30 rounded-lg p-4 cursor-pointer hover:border-holo-cyan/50 transition-colors"
              onClick={() => setSelectedComponent(component)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-holo-cyan font-semibold capitalize">
                  {name.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={`text-lg ${getStatusColor(component.status)}`}>
                  {getStatusIcon(component.status)}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-holo-cyan/70">Status:</span>
                  <span className={`${getStatusColor(component.status)} font-semibold`}>
                    {component.status}
                  </span>
                </div>

                {component.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-holo-cyan/70">Response:</span>
                    <span className="text-holo-cyan">
                      {component.responseTime}ms
                    </span>
                  </div>
                )}

                {component.consecutiveFailures > 0 && (
                  <div className="flex justify-between">
                    <span className="text-holo-cyan/70">Failures:</span>
                    <span className="text-holo-amber">
                      {component.consecutiveFailures}
                    </span>
                  </div>
                )}
              </div>

              {component.status !== 'healthy' && (
                <div className="mt-3">
                  <HudButton
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerSelfHealing(name);
                    }}
                    size="sm"
                    disabled={healingInProgress}
                    className="w-full"
                  >
                    🩹 Heal
                  </HudButton>
                </div>
              )}
            </div>
          ))}
        </div>
      </HudPanel>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <HudPanel>
          <h3 className="text-holo-cyan font-bold text-lg mb-4">🚨 Recent Alerts</h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert: any, index: number) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === 'critical'
                    ? 'bg-holo-red/10 border-holo-red'
                    : alert.severity === 'warning'
                    ? 'bg-holo-amber/10 border-holo-amber'
                    : 'bg-holo-cyan/10 border-holo-cyan'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${
                    alert.severity === 'critical'
                      ? 'text-holo-red'
                      : alert.severity === 'warning'
                      ? 'text-holo-amber'
                      : 'text-holo-cyan'
                  }`}>
                    {alert.severity.toUpperCase()}: {alert.component}
                  </span>
                  <span className="text-xs text-holo-cyan/70">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-holo-cyan mt-1">
                  {alert.message}
                </div>
              </div>
            ))}
          </div>
        </HudPanel>
      )}

      {/* Component Details Modal */}
      {selectedComponent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <HudPanel className="w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-holo-cyan font-bold text-lg capitalize">
                {selectedComponent.name.replace(/([A-Z])/g, ' $1').trim()} Details
              </h3>
              <HudButton onClick={() => setSelectedComponent(null)}>
                ✕
              </HudButton>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-holo-cyan/70">Status:</span>
                  <span className={`ml-2 font-semibold ${getStatusColor(selectedComponent.status)}`}>
                    {selectedComponent.status}
                  </span>
                </div>
                <div>
                  <span className="text-holo-cyan/70">Last Check:</span>
                  <span className="ml-2 text-holo-cyan">
                    {selectedComponent.lastCheck ? new Date(selectedComponent.lastCheck).toLocaleString() : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="text-holo-cyan/70">Response Time:</span>
                  <span className="ml-2 text-holo-cyan">
                    {selectedComponent.responseTime ? `${selectedComponent.responseTime}ms` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-holo-cyan/70">Consecutive Failures:</span>
                  <span className="ml-2 text-holo-amber">
                    {selectedComponent.consecutiveFailures || 0}
                  </span>
                </div>
              </div>

              {selectedComponent.alerts && selectedComponent.alerts.length > 0 && (
                <div>
                  <h4 className="text-holo-cyan font-semibold mb-2">Recent Alerts:</h4>
                  <div className="space-y-2">
                    {selectedComponent.alerts.slice(0, 3).map((alert: any, index: number) => (
                      <div key={index} className="text-sm bg-holo-black/30 p-2 rounded">
                        <div className={`font-semibold ${
                          alert.severity === 'critical' ? 'text-holo-red' : 'text-holo-amber'
                        }`}>
                          {alert.type}: {alert.message}
                        </div>
                        <div className="text-holo-cyan/70 text-xs">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </HudPanel>
        </div>
      )}

      {/* Status Info */}
      <div className="mt-6 p-3 bg-void-surface/50 rounded-lg border border-holo-cyan/20">
        <div className="text-xs text-holo-cyan/70 text-center">
          🔍 Last health check: {lastCheck ? new Date(lastCheck).toLocaleString() : 'Never'} |
          🔔 Alerts: {alerts.length} |
          🤖 Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
        </div>
      </div>
    </div>
  );
}

export default HealthDashboard;
