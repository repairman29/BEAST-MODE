"use client";

import React, { useState, useEffect } from 'react';
import HudPanel from '../hud/HudPanel';
import HudButton from '../hud/HudButton';
import StatusBar from '../hud/StatusBar';

interface Mission {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  progress: number;
  priority: string;
  deadline: string;
  successPrediction?: {
    probability: number;
    confidence: number;
  };
  timelineEstimation?: {
    estimatedHours: number;
    confidence: number;
  };
  tasks?: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
  }>;
}

/**
 * BEAST MODE Mission Guidance Dashboard
 *
 * AI-powered mission planning and execution for complex refactoring tasks
 */
function MissionDashboard() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showCreateMission, setShowCreateMission] = useState(false);
  const [newMission, setNewMission] = useState({
    name: '',
    description: '',
    type: 'code-refactor',
    priority: 'medium',
    deadline: '',
    objectives: ['']
  });

  useEffect(() => {
    fetchMissions();
    fetchRecommendations();
  }, []);

  const fetchMissions = async () => {
    try {
      const response = await fetch('/api/beast-mode/missions');
      if (response.ok) {
        const data = await response.json();
        setMissions(data.missions || []);
      }
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/beast-mode/missions/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qualityScore: 75,
          techDebt: 40,
          hasSecurityIssues: false,
          performanceIssues: true,
          languages: ['javascript', 'typescript'],
          teamSize: 'small'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const createMission = async () => {
    if (!newMission.name || !newMission.description) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/beast-mode/missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newMission,
          objectives: newMission.objectives.filter(obj => obj.trim())
        })
      });

      if (response.ok) {
        const mission = await response.json();
        setMissions(prev => [...prev, mission]);
        setShowCreateMission(false);
        setNewMission({
          name: '',
          description: '',
          type: 'code-refactor',
          priority: 'medium',
          deadline: '',
          objectives: ['']
        });
      }
    } catch (error) {
      console.error('Failed to create mission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startMission = async (missionId: string) => {
    try {
      const response = await fetch(`/api/beast-mode/missions/${missionId}/start`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchMissions(); // Refresh missions
      }
    } catch (error) {
      console.error('Failed to start mission:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-holo-green';
      case 'active': return 'text-holo-cyan';
      case 'planning': return 'text-holo-amber';
      case 'cancelled': return 'text-holo-red';
      default: return 'text-holo-gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-holo-red';
      case 'high': return 'text-holo-amber';
      case 'medium': return 'text-holo-cyan';
      case 'low': return 'text-holo-green';
      default: return 'text-holo-gray';
    }
  };

  const missionTemplates = [
    { value: 'code-refactor', label: 'Code Refactoring', description: 'Improve code quality and maintainability' },
    { value: 'security-audit', label: 'Security Audit', description: 'Comprehensive security review and fixes' },
    { value: 'performance-optimization', label: 'Performance Optimization', description: 'Optimize application performance' },
    { value: 'architecture-modernization', label: 'Architecture Modernization', description: 'Modernize legacy architecture' }
  ];

  return (
    <div className="w-full max-w-7xl space-y-6">
      {/* Header */}
      <HudPanel>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-holo-cyan font-bold text-xl">🎯 Mission Guidance</h2>
          <div className="flex gap-2">
            <HudButton onClick={() => setShowCreateMission(true)}>
              ➕ New Mission
            </HudButton>
            <HudButton onClick={fetchMissions}>
              🔄 Refresh
            </HudButton>
          </div>
        </div>

        {/* Mission Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-holo-cyan">
              {missions.length}
            </div>
            <div className="text-holo-cyan/70 text-sm">Total Missions</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-green">
              {missions.filter(m => m.status === 'completed').length}
            </div>
            <div className="text-holo-cyan/70 text-sm">Completed</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-amber">
              {missions.filter(m => m.status === 'active').length}
            </div>
            <div className="text-holo-cyan/70 text-sm">Active</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-holo-purple">
              {recommendations.length}
            </div>
            <div className="text-holo-cyan/70 text-sm">Recommendations</div>
          </div>
        </div>
      </HudPanel>

      {/* Mission Recommendations */}
      {recommendations.length > 0 && (
        <HudPanel>
          <h3 className="text-holo-cyan font-bold text-lg mb-4">💡 AI Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map((rec, index) => (
              <div key={index} className="bg-holo-black/30 border border-holo-cyan/30 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-holo-cyan font-semibold">{rec.name}</h4>
                  <div className={`text-sm font-bold ${rec.priority === 'critical' ? 'text-holo-red' : rec.priority === 'high' ? 'text-holo-amber' : 'text-holo-cyan'}`}>
                    {rec.priority.toUpperCase()}
                  </div>
                </div>
                <p className="text-holo-cyan/80 text-sm mb-3">{rec.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-holo-green">🎯</span>
                    <span className="text-holo-cyan">{Math.round(rec.successProbability * 100)}% success</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-holo-purple">⏱️</span>
                    <span className="text-holo-cyan">{rec.estimatedHours}h</span>
                  </div>
                </div>
                <HudButton
                  onClick={() => setNewMission(prev => ({ ...prev, name: rec.name, description: rec.description, type: rec.template }))}
                  className="w-full mt-3"
                  size="sm"
                >
                  Use Template
                </HudButton>
              </div>
            ))}
          </div>
        </HudPanel>
      )}

      {/* Active Missions */}
      {missions.filter(m => m.status !== 'completed').length > 0 && (
        <HudPanel>
          <h3 className="text-holo-cyan font-bold text-lg mb-4">🚀 Active Missions</h3>
          <div className="space-y-4">
            {missions.filter(m => m.status !== 'completed').map((mission) => (
              <div
                key={mission.id}
                className="bg-holo-black/30 border border-holo-cyan/30 rounded-lg p-4 cursor-pointer hover:border-holo-cyan/50 transition-colors"
                onClick={() => setSelectedMission(mission)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-holo-cyan font-bold text-lg">{mission.name}</h4>
                    <p className="text-holo-cyan/80 text-sm mt-1">{mission.description}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getStatusColor(mission.status)}`}>
                      {mission.status.toUpperCase()}
                    </div>
                    <div className={`text-xs ${getPriorityColor(mission.priority)}`}>
                      {mission.priority}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-holo-cyan/70">Progress</span>
                      <span className="text-holo-cyan">{mission.progress}%</span>
                    </div>
                    <div className="w-full bg-holo-black/50 rounded-full h-2">
                      <div
                        className="bg-holo-cyan h-2 rounded-full transition-all duration-300"
                        style={{ width: `${mission.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {mission.successPrediction && (
                    <div className="text-center">
                      <div className="text-holo-green font-bold">
                        {Math.round(mission.successPrediction.probability * 100)}%
                      </div>
                      <div className="text-xs text-holo-cyan/70">Success</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-holo-cyan/70">
                      📅 Due: {new Date(mission.deadline).toLocaleDateString()}
                    </span>
                    {mission.tasks && (
                      <span className="text-holo-cyan/70">
                        📋 Tasks: {mission.tasks.filter(t => t.status === 'completed').length}/{mission.tasks.length}
                      </span>
                    )}
                  </div>

                  {mission.status === 'planning' && (
                    <HudButton
                      onClick={(e) => {
                        e.stopPropagation();
                        startMission(mission.id);
                      }}
                      size="sm"
                    >
                      🚀 Start
                    </HudButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </HudPanel>
      )}

      {/* Completed Missions */}
      {missions.filter(m => m.status === 'completed').length > 0 && (
        <HudPanel>
          <h3 className="text-holo-cyan font-bold text-lg mb-4">✅ Completed Missions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.filter(m => m.status === 'completed').slice(0, 4).map((mission) => (
              <div key={mission.id} className="bg-holo-green/10 border border-holo-green/30 rounded-lg p-4">
                <h4 className="text-holo-green font-semibold">{mission.name}</h4>
                <p className="text-holo-cyan/80 text-sm mt-1">{mission.description}</p>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-holo-cyan/70">
                    Completed {new Date(mission.deadline).toLocaleDateString()}
                  </span>
                  <span className="text-holo-green font-bold">100%</span>
                </div>
              </div>
            ))}
          </div>
        </HudPanel>
      )}

      {/* Create Mission Modal */}
      {showCreateMission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <HudPanel className="w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-holo-cyan font-bold text-lg">🎯 Create New Mission</h3>
              <HudButton onClick={() => setShowCreateMission(false)}>
                ✕
              </HudButton>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-holo-cyan/70 text-sm mb-1">Mission Name</label>
                <input
                  type="text"
                  value={newMission.name}
                  onChange={(e) => setNewMission(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan placeholder-holo-cyan/50 focus:outline-none focus:border-holo-cyan"
                  placeholder="Enter mission name"
                />
              </div>

              <div>
                <label className="block text-holo-cyan/70 text-sm mb-1">Description</label>
                <textarea
                  value={newMission.description}
                  onChange={(e) => setNewMission(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan placeholder-holo-cyan/50 focus:outline-none focus:border-holo-cyan h-20 resize-none"
                  placeholder="Describe the mission objectives"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-holo-cyan/70 text-sm mb-1">Mission Type</label>
                  <select
                    value={newMission.type}
                    onChange={(e) => setNewMission(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan focus:outline-none focus:border-holo-cyan"
                  >
                    {missionTemplates.map(template => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-holo-cyan/70 text-sm mb-1">Priority</label>
                  <select
                    value={newMission.priority}
                    onChange={(e) => setNewMission(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan focus:outline-none focus:border-holo-cyan"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-holo-cyan/70 text-sm mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  value={newMission.deadline}
                  onChange={(e) => setNewMission(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full bg-holo-black/50 border border-holo-cyan/30 rounded px-3 py-2 text-holo-cyan focus:outline-none focus:border-holo-cyan"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <HudButton
                  onClick={createMission}
                  disabled={isLoading || !newMission.name || !newMission.description}
                  className="flex-1"
                >
                  {isLoading ? 'Creating...' : '🎯 Create Mission'}
                </HudButton>
                <HudButton
                  onClick={() => setShowCreateMission(false)}
                  variant="ghost"
                >
                  Cancel
                </HudButton>
              </div>
            </div>
          </HudPanel>
        </div>
      )}

      {/* Mission Details Modal */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <HudPanel className="w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-holo-cyan font-bold text-lg">{selectedMission.name}</h3>
              <HudButton onClick={() => setSelectedMission(null)}>
                ✕
              </HudButton>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-holo-amber font-semibold mb-2">📋 Description</h4>
                <p className="text-holo-cyan/80">{selectedMission.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-holo-cyan/70 text-sm">Status</span>
                  <div className={`font-semibold ${getStatusColor(selectedMission.status)}`}>
                    {selectedMission.status}
                  </div>
                </div>
                <div>
                  <span className="text-holo-cyan/70 text-sm">Progress</span>
                  <div className="text-holo-cyan font-semibold">{selectedMission.progress}%</div>
                </div>
                <div>
                  <span className="text-holo-cyan/70 text-sm">Priority</span>
                  <div className={`font-semibold ${getPriorityColor(selectedMission.priority)}`}>
                    {selectedMission.priority}
                  </div>
                </div>
                <div>
                  <span className="text-holo-cyan/70 text-sm">Deadline</span>
                  <div className="text-holo-cyan font-semibold">
                    {new Date(selectedMission.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {selectedMission.successPrediction && (
                <div>
                  <h4 className="text-holo-amber font-semibold mb-2">🎯 AI Success Prediction</h4>
                  <div className="bg-holo-black/30 border border-holo-cyan/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-holo-cyan">Success Probability</span>
                      <span className="text-holo-green font-bold text-lg">
                        {Math.round(selectedMission.successPrediction.probability * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-holo-black/50 rounded-full h-2 mb-2">
                      <div
                        className="bg-holo-green h-2 rounded-full transition-all duration-300"
                        style={{ width: `${selectedMission.successPrediction.probability * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-holo-cyan/70">
                      Confidence: {Math.round(selectedMission.successPrediction.confidence * 100)}%
                    </div>
                  </div>
                </div>
              )}

              {selectedMission.tasks && selectedMission.tasks.length > 0 && (
                <div>
                  <h4 className="text-holo-amber font-semibold mb-2">📝 Tasks</h4>
                  <div className="space-y-2">
                    {selectedMission.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 bg-holo-black/30 border border-holo-cyan/30 rounded-lg p-3">
                        <div className={`w-3 h-3 rounded-full ${
                          task.status === 'completed' ? 'bg-holo-green' :
                          task.status === 'in-progress' ? 'bg-holo-cyan' :
                          'bg-holo-gray'
                        }`}></div>
                        <span className="text-holo-cyan flex-1">{task.name}</span>
                        <span className="text-holo-cyan/70 text-sm">{task.progress}%</span>
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
          🎯 Mission Guidance | 📊 {missions.length} missions | 🚀 {missions.filter(m => m.status === 'active').length} active |
          ✅ {missions.filter(m => m.status === 'completed').length} completed | 🤖 AI recommendations: {recommendations.length}
        </div>
      </div>
    </div>
  );
}

export default MissionDashboard;

