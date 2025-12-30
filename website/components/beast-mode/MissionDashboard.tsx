"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

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
      case 'completed': return 'text-green-400';
      case 'active': return 'text-cyan-400';
      case 'planning': return 'text-amber-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-amber-400';
      case 'medium': return 'text-cyan-400';
      case 'low': return 'text-green-400';
      default: return 'text-slate-400';
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
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl">🎯 Mission Guidance</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateMission(true)} className="bg-white text-black hover:bg-slate-100">
                ➕ New Mission
              </Button>
              <Button onClick={fetchMissions} variant="outline" className="border-slate-800">
                🔄 Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mission Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {missions.length}
              </div>
              <div className="text-slate-400 text-sm">Total Missions</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {missions.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-slate-400 text-sm">Completed</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">
                {missions.filter(m => m.status === 'active').length}
              </div>
              <div className="text-slate-400 text-sm">Active</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {recommendations.length}
              </div>
              <div className="text-slate-400 text-sm">Recommendations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission Recommendations */}
      {recommendations.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">💡 AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.slice(0, 4).map((rec, index) => (
                <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-semibold">{rec.name}</h4>
                    <div className={`text-sm font-bold ${rec.priority === 'critical' ? 'text-red-400' : rec.priority === 'high' ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {rec.priority.toUpperCase()}
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{rec.description}</p>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">🎯</span>
                      <span className="text-cyan-400">{Math.round(rec.successProbability * 100)}% success</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">⏱️</span>
                      <span className="text-cyan-400">{rec.estimatedHours}h</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setNewMission(prev => ({ ...prev, name: rec.name, description: rec.description, type: rec.template }));
                      setShowCreateMission(true);
                    }}
                    className="w-full bg-white text-black hover:bg-slate-100"
                    size="sm"
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Missions */}
      {missions.filter(m => m.status !== 'completed').length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">🚀 Active Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {missions.filter(m => m.status !== 'completed').map((mission) => (
                <div
                  key={mission.id}
                  className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-cyan-500/50 transition-colors"
                  onClick={() => setSelectedMission(mission)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-lg">{mission.name}</h4>
                      <p className="text-slate-300 text-sm mt-1">{mission.description}</p>
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
                        <span className="text-slate-400">Progress</span>
                        <span className="text-cyan-400">{mission.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${mission.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {mission.successPrediction && (
                      <div className="text-center">
                        <div className="text-green-400 font-bold">
                          {Math.round(mission.successPrediction.probability * 100)}%
                        </div>
                        <div className="text-xs text-slate-400">Success</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">
                        📅 Due: {new Date(mission.deadline).toLocaleDateString()}
                      </span>
                      {mission.tasks && (
                        <span className="text-slate-400">
                          📋 Tasks: {mission.tasks.filter(t => t.status === 'completed').length}/{mission.tasks.length}
                        </span>
                      )}
                    </div>

                    {mission.status === 'planning' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          startMission(mission.id);
                        }}
                        size="sm"
                        className="bg-white text-black hover:bg-slate-100"
                      >
                        🚀 Start
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Missions */}
      {missions.filter(m => m.status === 'completed').length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">✅ Completed Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {missions.filter(m => m.status === 'completed').slice(0, 4).map((mission) => (
                <div key={mission.id} className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-semibold">{mission.name}</h4>
                  <p className="text-slate-300 text-sm mt-1">{mission.description}</p>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-slate-400">
                      Completed {new Date(mission.deadline).toLocaleDateString()}
                    </span>
                    <span className="text-green-400 font-bold">100%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Mission Modal */}
      {showCreateMission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <Card className="bg-slate-950 border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">🎯 Create New Mission</CardTitle>
                <Button onClick={() => setShowCreateMission(false)} variant="ghost" size="sm">
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Mission Name</label>
                  <input
                    type="text"
                    value={newMission.name}
                    onChange={(e) => setNewMission(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    placeholder="Enter mission name"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">Description</label>
                  <textarea
                    value={newMission.description}
                    onChange={(e) => setNewMission(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 h-20 resize-none"
                    placeholder="Describe the mission objectives"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Mission Type</label>
                    <select
                      value={newMission.type}
                      onChange={(e) => setNewMission(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      {missionTemplates.map(template => (
                        <option key={template.value} value={template.value}>
                          {template.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Priority</label>
                    <select
                      value={newMission.priority}
                      onChange={(e) => setNewMission(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">Deadline</label>
                  <input
                    type="datetime-local"
                    value={newMission.deadline}
                    onChange={(e) => setNewMission(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={createMission}
                    disabled={isLoading || !newMission.name || !newMission.description}
                    className="flex-1 bg-white text-black hover:bg-slate-100"
                  >
                    {isLoading ? 'Creating...' : '🎯 Create Mission'}
                  </Button>
                  <Button
                    onClick={() => setShowCreateMission(false)}
                    variant="outline"
                    className="border-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mission Details Modal */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <Card className="bg-slate-950 border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">{selectedMission.name}</CardTitle>
                <Button onClick={() => setSelectedMission(null)} variant="ghost" size="sm">
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-amber-400 font-semibold mb-2">📋 Description</h4>
                  <p className="text-slate-300">{selectedMission.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-400 text-sm">Status</span>
                    <div className={`mt-1 font-semibold ${getStatusColor(selectedMission.status)}`}>
                      {selectedMission.status}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Progress</span>
                    <div className="mt-1 text-cyan-400 font-semibold">{selectedMission.progress}%</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Priority</span>
                    <div className={`mt-1 font-semibold ${getPriorityColor(selectedMission.priority)}`}>
                      {selectedMission.priority}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Deadline</span>
                    <div className="mt-1 text-cyan-400 font-semibold">
                      {new Date(selectedMission.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {selectedMission.successPrediction && (
                  <div>
                    <h4 className="text-amber-400 font-semibold mb-2">🎯 AI Success Prediction</h4>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white">Success Probability</span>
                        <span className="text-green-400 font-bold text-lg">
                          {Math.round(selectedMission.successPrediction.probability * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 mb-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedMission.successPrediction.probability * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-slate-400">
                        Confidence: {Math.round(selectedMission.successPrediction.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                )}

                {selectedMission.tasks && selectedMission.tasks.length > 0 && (
                  <div>
                    <h4 className="text-amber-400 font-semibold mb-2">📝 Tasks</h4>
                    <div className="space-y-2">
                      {selectedMission.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                          <div className={`w-3 h-3 rounded-full ${
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in-progress' ? 'bg-cyan-500' :
                            'bg-slate-600'
                          }`}></div>
                          <span className="text-white flex-1">{task.name}</span>
                          <span className="text-slate-400 text-sm">{task.progress}%</span>
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
          🎯 Mission Guidance | 📊 {missions.length} missions | 🚀 {missions.filter(m => m.status === 'active').length} active |
          ✅ {missions.filter(m => m.status === 'completed').length} completed | 🤖 AI recommendations: {recommendations.length}
        </div>
      </div>
    </div>
  );
}

export default MissionDashboard;

