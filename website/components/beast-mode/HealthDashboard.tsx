"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

/**
 * BEAST MODE Health Monitoring & Self-Healing Dashboard
 *
 * Real-time health monitoring with automatic recovery capabilities
 */
function HealthDashboard() {
  const [healthData, setHealthData] = useState(null);
  const [healthHistory, setHealthHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [healingInProgress, setHealingInProgress] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [componentFilter, setComponentFilter] = useState('');
  const [healingResult, setHealingResult] = useState<any>(null);

  useEffect(() => {
    fetchHealthData();

    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 5000); // Refresh every 5 seconds for real-time feel
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Track health history for charts
  useEffect(() => {
    if (healthData) {
      const timestamp = new Date().toISOString();
      const overallStatus = healthData.history && healthData.history.length > 0 
        ? healthData.history[healthData.history.length - 1].overall 
        : 'unknown';
      
      setHealthHistory(prev => {
        const newHistory = [...prev, {
          timestamp,
          overall: overallStatus,
          healthyComponents: Object.values(healthData.components || {}).filter((c: any) => c.status === 'healthy').length,
          totalComponents: Object.keys(healthData.components || {}).length,
          alerts: healthData.alerts?.length || 0
        }];
        // Keep last 50 data points
        return newHistory.slice(-50);
      });
    }
  }, [healthData]);

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
        setHealingResult({
          success: true,
          message: result.message,
          component: result.component,
          timestamp: new Date()
        });
        // Refresh health data after healing
        await fetchHealthData();
        // Clear result after 5 seconds
        setTimeout(() => setHealingResult(null), 5000);
      } else {
        const error = await response.json();
        setHealingResult({
          success: false,
          message: error.error || 'Healing failed',
          timestamp: new Date()
        });
        setTimeout(() => setHealingResult(null), 5000);
      }
    } catch (error) {
      console.error('Self-healing failed:', error);
    } finally {
      setHealingInProgress(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-amber-400';
      case 'failed': return 'text-red-400';
      default: return 'text-cyan-400';
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
      <Card className="bg-slate-900/90 border-slate-800 w-full max-w-6xl">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mr-4"></div>
          <span className="text-cyan-400">Loading health status...</span>
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return (
      <Card className="bg-slate-900/90 border-slate-800 w-full max-w-6xl">
        <CardContent className="text-center py-12">
          <div className="text-red-400 text-lg mb-2">❌ Health monitoring unavailable</div>
          <p className="text-slate-400 text-sm">Unable to fetch health data. Please try again later.</p>
          <Button onClick={fetchHealthData} className="mt-4 bg-white text-black hover:bg-slate-100">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { isMonitoring, lastCheck, components, alerts, history } = healthData;
  const overallStatus = history && history.length > 0 ? history[history.length - 1].overall : 'unknown';
  
  // Filter alerts
  const filteredAlerts = alerts.filter((alert: any) => {
    if (alertFilter === 'all') return true;
    return alert.severity === alertFilter;
  }).sort((a: any, b: any) => {
    // Sort by severity (critical > warning > info) then by timestamp
    const severityOrder = { critical: 3, warning: 2, info: 1 };
    const severityDiff = (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                        (severityOrder[a.severity as keyof typeof severityOrder] || 0);
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Filter components
  const filteredComponents = Object.entries(components).filter(([name]) => {
    if (!componentFilter) return true;
    return name.toLowerCase().includes(componentFilter.toLowerCase());
  });

  return (
    <div className="w-full max-w-7xl space-y-6 mx-auto">
      {/* Header */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl">🏥 BEAST MODE Health Monitor</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                className={autoRefresh ? 'bg-green-500/20 border-green-500/50 text-green-400' : ''}
              >
                {autoRefresh ? '⏸️ Pause' : '▶️ Resume'}
              </Button>
              <Button onClick={fetchHealthData} variant="outline" size="sm" className="border-slate-800">
                🔄 Refresh
              </Button>
              <Button
                onClick={() => setShowTrends(!showTrends)}
                variant="outline"
                size="sm"
                className={showTrends ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'border-slate-800'}
              >
                {showTrends ? '📊 Hide Trends' : '📊 Show Trends'}
              </Button>
              <Button
                onClick={() => triggerSelfHealing()}
                disabled={healingInProgress}
                variant="outline"
                size="sm"
                className="border-slate-800"
              >
                {healingInProgress ? '🔧 Healing...' : '🩹 Heal All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>

        {/* Overall Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor(overallStatus)}`}>
              {getStatusIcon(overallStatus)}
            </div>
            <div className="text-sm text-slate-400">Overall Status</div>
            <div className={`text-sm font-semibold ${getStatusColor(overallStatus)}`}>
              {overallStatus.toUpperCase()}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {Object.keys(components).length}
            </div>
            <div className="text-sm text-slate-400">Components</div>
            <div className="text-sm text-cyan-400">
              {Object.values(components).filter((c: any) => c.status === 'healthy').length} Healthy
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">
              {alerts.length}
            </div>
            <div className="text-sm text-slate-400">Active Alerts</div>
            <div className="text-sm text-cyan-400">
              {alerts.filter((a: any) => a.severity === 'critical').length} Critical
              {alerts.filter((a: any) => a.severity === 'warning').length > 0 && 
                ` • ${alerts.filter((a: any) => a.severity === 'warning').length} Warning`
              }
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {isMonitoring ? '🟢' : '🔴'}
            </div>
            <div className="text-sm text-slate-400">Monitoring</div>
            <div className="text-sm text-cyan-400">
              {lastCheck ? new Date(lastCheck).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Health Trend Charts */}
      {showTrends && healthHistory.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">📈 Health Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Overall Health Trend */}
              <div>
                <div className="text-sm text-slate-400 mb-3">Overall Health Status Over Time</div>
                <div className="flex items-end gap-1 h-32">
                  {healthHistory.slice(-20).map((point, idx) => {
                    const statusValue = point.overall === 'healthy' ? 100 : point.overall === 'degraded' ? 50 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group">
                        <div className="w-full bg-slate-800 rounded-t relative">
                          <div
                            className={`w-full rounded-t transition-all ${
                              statusValue === 100 ? 'bg-green-500' :
                              statusValue === 50 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ height: `${statusValue}%` }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                              {new Date(point.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Healthy Components Trend */}
              <div>
                <div className="text-sm text-slate-400 mb-3">Healthy Components Count</div>
                <div className="flex items-end gap-1 h-24">
                  {healthHistory.slice(-20).map((point, idx) => {
                    const maxComponents = Math.max(...healthHistory.map(p => p.totalComponents), 1);
                    const height = (point.healthyComponents / maxComponents) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-slate-800 rounded-t">
                          <div
                            className="w-full bg-green-500/60 rounded-t"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-600 mt-1">
                          {point.healthyComponents}/{point.totalComponents}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alerts Trend */}
              {healthHistory.some(p => p.alerts > 0) && (
                <div>
                  <div className="text-sm text-slate-400 mb-3">Active Alerts Over Time</div>
                  <div className="flex items-end gap-1 h-24">
                    {healthHistory.slice(-20).map((point, idx) => {
                      const maxAlerts = Math.max(...healthHistory.map(p => p.alerts), 1);
                      const height = maxAlerts > 0 ? (point.alerts / maxAlerts) * 100 : 0;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-slate-800 rounded-t">
                            <div
                              className="w-full bg-red-500/60 rounded-t"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-600 mt-1">
                            {point.alerts}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Healing Result Notification */}
      {healingResult && (
        <Card className={`bg-slate-900/90 border-2 ${
          healingResult.success ? 'border-green-500/50' : 'border-red-500/50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{healingResult.success ? '✅' : '❌'}</span>
              <div className="flex-1">
                <div className={`font-semibold ${
                  healingResult.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {healingResult.success ? 'Healing Successful' : 'Healing Failed'}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  {healingResult.message}
                </div>
              </div>
              <Button
                onClick={() => setHealingResult(null)}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Health Grid */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">🔧 Component Health</CardTitle>
            <input
              type="text"
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
              placeholder="Search components..."
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComponents.map(([name, component]: [string, any]) => (
            <div
              key={name}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-cyan-500/50 transition-colors"
              onClick={() => setSelectedComponent(component)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-400 font-semibold capitalize">
                  {name.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={`text-lg ${getStatusColor(component.status)}`}>
                  {getStatusIcon(component.status)}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={`${getStatusColor(component.status)} font-semibold`}>
                    {component.status}
                  </span>
                </div>

                {component.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Response:</span>
                    <span className="text-cyan-400">
                      {component.responseTime}ms
                    </span>
                  </div>
                )}

                {component.consecutiveFailures > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Failures:</span>
                    <span className="text-amber-400">
                      {component.consecutiveFailures}
                    </span>
                  </div>
                )}
              </div>

              {component.status !== 'healthy' && (
                <div className="mt-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerSelfHealing(name);
                    }}
                    size="sm"
                    disabled={healingInProgress}
                    variant="outline"
                    className="w-full border-slate-800"
                  >
                    🩹 Heal
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">🚨 Recent Alerts ({filteredAlerts.length})</CardTitle>
              <div className="flex gap-2">
                {(['all', 'critical', 'warning', 'info'] as const).map((filter) => (
                  <Button
                    key={filter}
                    onClick={() => setAlertFilter(filter)}
                    variant={alertFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    className={`text-xs ${
                      alertFilter === filter
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    {filter !== 'all' && (
                      <span className="ml-1">
                        ({alerts.filter((a: any) => a.severity === filter).length})
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
          <div className="space-y-3">
            {filteredAlerts.slice(0, 10).map((alert: any, index: number) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === 'critical'
                    ? 'bg-red-500/10 border-red-500'
                    : alert.severity === 'warning'
                    ? 'bg-amber-500/10 border-amber-500'
                    : 'bg-cyan-500/10 border-cyan-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${
                    alert.severity === 'critical'
                      ? 'text-red-400'
                      : alert.severity === 'warning'
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                  }`}>
                    {alert.severity.toUpperCase()}: {alert.component}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-slate-300 mt-1">
                  {alert.message}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Component Details Modal */}
      {selectedComponent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <Card className="bg-slate-950 border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white capitalize">
                  {selectedComponent.name?.replace(/([A-Z])/g, ' $1').trim() || 'Component'} Details
                </CardTitle>
                <Button onClick={() => setSelectedComponent(null)} variant="ghost" size="sm">
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-sm">Status:</span>
                  <div className={`mt-1 font-semibold ${getStatusColor(selectedComponent.status)}`}>
                    {selectedComponent.status}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">Last Check:</span>
                  <div className="mt-1 text-cyan-400">
                    {selectedComponent.lastCheck ? new Date(selectedComponent.lastCheck).toLocaleString() : 'Never'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">Response Time:</span>
                  <div className="mt-1 text-cyan-400">
                    {selectedComponent.responseTime ? `${selectedComponent.responseTime}ms` : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-sm">Consecutive Failures:</span>
                  <div className="mt-1 text-amber-400">
                    {selectedComponent.consecutiveFailures || 0}
                  </div>
                </div>
              </div>

              {selectedComponent.alerts && selectedComponent.alerts.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Recent Alerts:</h4>
                  <div className="space-y-2">
                    {selectedComponent.alerts.slice(0, 3).map((alert: any, index: number) => (
                      <div key={index} className="text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                        <div className={`font-semibold ${
                          alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {alert.type}: {alert.message}
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Info */}
      <div className="mt-6 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
        <div className="text-xs text-slate-400 text-center">
          🔍 Last health check: {lastCheck ? new Date(lastCheck).toLocaleString() : 'Never'} |
          🔔 Alerts: {alerts.length} |
          🤖 Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
        </div>
      </div>
    </div>
  );
}

export default HealthDashboard;
