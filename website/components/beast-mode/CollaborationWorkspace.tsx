"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface CollaborationSession {
  id: string;
  userId: string;
  repoUrl: string;
  sessionType: string;
  title: string;
  createdAt: string;
  status: string;
  participants: string[];
}

interface Annotation {
  id: string;
  userId: string;
  filePath: string;
  lineNumber: number | null;
  content: string;
  type: string;
  createdAt: string;
  resolved: boolean;
}

export default function CollaborationWorkspace({ userId }: { userId?: string }) {
  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<CollaborationSession | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newAnnotation, setNewAnnotation] = useState({ filePath: '', lineNumber: '', content: '' });
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSession, setNewSession] = useState({ repoUrl: '', title: '', sessionType: 'code-review' });

  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionDetails();
      fetchAnnotations();
      // Poll for updates every 5 seconds
      const interval = setInterval(() => {
        fetchSessionDetails();
        fetchAnnotations();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/collaboration/sessions?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchSessionDetails = async () => {
    if (!selectedSession) return;

    try {
      const response = await fetch(`/api/collaboration/sessions?sessionId=${selectedSession}`);
      if (response.ok) {
        const data = await response.json();
        setSessionDetails(data.session);
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error);
    }
  };

  const fetchAnnotations = async () => {
    if (!selectedSession) return;

    try {
      const response = await fetch(`/api/collaboration/annotations?sessionId=${selectedSession}`);
      if (response.ok) {
        const data = await response.json();
        setAnnotations(data.annotations || []);
      }
    } catch (error) {
      console.error('Failed to fetch annotations:', error);
    }
  };

  const handleCreateSession = async () => {
    if (!userId || !newSession.repoUrl) return;

    try {
      const response = await fetch('/api/collaboration/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          repoUrl: newSession.repoUrl,
          title: newSession.title,
          sessionType: newSession.sessionType
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSessions([...sessions, data.session]);
        setSelectedSession(data.session.id);
        setIsCreatingSession(false);
        setNewSession({ repoUrl: '', title: '', sessionType: 'code-review' });
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleAddAnnotation = async () => {
    if (!selectedSession || !userId || !newAnnotation.content || !newAnnotation.filePath) return;

    try {
      const response = await fetch('/api/collaboration/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession,
          userId,
          filePath: newAnnotation.filePath,
          lineNumber: newAnnotation.lineNumber ? parseInt(newAnnotation.lineNumber) : null,
          content: newAnnotation.content,
          type: 'comment'
        })
      });

      if (response.ok) {
        setNewAnnotation({ filePath: '', lineNumber: '', content: '' });
        fetchAnnotations();
      }
    } catch (error) {
      console.error('Failed to add annotation:', error);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/collaboration/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId })
      });

      if (response.ok) {
        setSelectedSession(sessionId);
        fetchSessions();
      }
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sessions List */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">👥 Collaboration Sessions</CardTitle>
            <Button
              onClick={() => setIsCreatingSession(!isCreatingSession)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              + New Session
            </Button>
          </div>
          <CardDescription className="text-slate-400">
            Create or join live code review sessions and team workspaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCreatingSession && (
            <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
              <input
                type="text"
                value={newSession.repoUrl}
                onChange={(e) => setNewSession({ ...newSession, repoUrl: e.target.value })}
                placeholder="Repository URL (e.g., owner/repo)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
              <input
                type="text"
                value={newSession.title}
                onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                placeholder="Session title (optional)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
              <select
                value={newSession.sessionType}
                onChange={(e) => setNewSession({ ...newSession, sessionType: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="code-review">Code Review</option>
                <option value="workspace">Team Workspace</option>
                <option value="pair-programming">Pair Programming</option>
              </select>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateSession}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Create
                </Button>
                <Button
                  onClick={() => setIsCreatingSession(false)}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No active sessions. Create one to get started!
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border ${
                    selectedSession === session.id
                      ? 'bg-cyan-500/10 border-cyan-500/50'
                      : 'bg-slate-800/30 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{session.title}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        {session.repoUrl} • {session.sessionType} • {session.participants.length} participants
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedSession !== session.id && (
                        <Button
                          onClick={() => handleJoinSession(session.id)}
                          size="sm"
                          className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          Join
                        </Button>
                      )}
                      <Button
                        onClick={() => setSelectedSession(session.id)}
                        size="sm"
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        {selectedSession === session.id ? 'Open' : 'View'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Details & Annotations */}
      {selectedSession && sessionDetails && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">{sessionDetails.title}</CardTitle>
            <CardDescription className="text-slate-400">
              {sessionDetails.repoUrl} • {sessionDetails.participants.length} participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Annotation */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <h4 className="text-white font-semibold mb-3">Add Annotation</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newAnnotation.filePath}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, filePath: e.target.value })}
                  placeholder="File path (e.g., src/components/Button.tsx)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
                <input
                  type="number"
                  value={newAnnotation.lineNumber}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, lineNumber: e.target.value })}
                  placeholder="Line number (optional)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
                <textarea
                  value={newAnnotation.content}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, content: e.target.value })}
                  placeholder="Your comment or suggestion..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
                <Button
                  onClick={handleAddAnnotation}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Add Annotation
                </Button>
              </div>
            </div>

            {/* Annotations List */}
            <div>
              <h4 className="text-white font-semibold mb-3">Annotations ({annotations.length})</h4>
              <div className="space-y-3">
                {annotations.length === 0 ? (
                  <div className="text-center py-4 text-slate-400">
                    No annotations yet. Add one above!
                  </div>
                ) : (
                  annotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className="bg-slate-800/50 p-4 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-slate-400 mb-1">
                            {annotation.filePath}
                            {annotation.lineNumber && `:${annotation.lineNumber}`}
                          </div>
                          <div className="text-white">{annotation.content}</div>
                          <div className="text-xs text-slate-500 mt-2">
                            {new Date(annotation.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {annotation.resolved && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

