"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface GraphNode {
  id: string;
  label: string;
  type: 'file' | 'component' | 'function' | 'module';
  connections: string[];
}

export default function RepoMemoryGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/beast-mode/janitor/repo-memory/graph');
      if (response.ok) {
        const data = await response.json();
        setNodes(data.nodes || []);
      } else {
        // Mock data
        setNodes([
          {
            id: '1',
            label: 'src/components/Header.jsx',
            type: 'component',
            connections: ['2', '3']
          },
          {
            id: '2',
            label: 'src/utils/auth.js',
            type: 'module',
            connections: ['4']
          },
          {
            id: '3',
            label: 'src/hooks/useAuth.js',
            type: 'function',
            connections: ['2']
          },
          {
            id: '4',
            label: 'src/api/auth.js',
            type: 'module',
            connections: []
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load graph:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="text-cyan-400 text-center">Loading graph...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Repo Memory Graph</CardTitle>
        <CardDescription className="text-slate-400">
          Semantic graph of your codebase architecture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {nodes.map((node) => (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`p-4 bg-slate-800/50 rounded-lg border transition-all text-left ${
                selectedNode?.id === node.id
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant="outline"
                  className={
                    node.type === 'component'
                      ? 'border-blue-500/30 text-blue-400'
                      : node.type === 'module'
                      ? 'border-purple-500/30 text-purple-400'
                      : 'border-green-500/30 text-green-400'
                  }
                >
                  {node.type}
                </Badge>
                <div className="text-xs text-slate-500">{node.connections.length} connections</div>
              </div>
              <div className="text-sm font-semibold text-white truncate">{node.label}</div>
            </button>
          ))}
        </div>

        {selectedNode && (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="text-sm font-semibold text-white mb-3">Connections</div>
            <div className="space-y-2">
              {selectedNode.connections.length === 0 ? (
                <div className="text-xs text-slate-500">No connections</div>
              ) : (
                selectedNode.connections.map((connId) => {
                  const connectedNode = nodes.find(n => n.id === connId);
                  return connectedNode ? (
                    <div
                      key={connId}
                      className="p-2 bg-slate-900 rounded text-xs text-slate-300"
                    >
                      {connectedNode.label}
                    </div>
                  ) : null;
                })
              )}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t border-slate-800">
          <Button
            onClick={loadGraph}
            variant="outline"
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Refresh Graph
          </Button>
          <Button
            onClick={() => {
              // TODO: Trigger graph rebuild
              console.log('Rebuilding graph...');
            }}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            Rebuild Graph
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

