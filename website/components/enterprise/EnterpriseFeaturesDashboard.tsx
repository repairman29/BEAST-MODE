"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  role: string;
}

interface ComplianceStatus {
  compliant: boolean;
  policies: any[];
  requirements: any;
}

export default function EnterpriseFeaturesDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teams' | 'rbac' | 'compliance' | 'audit'>('teams');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    try {
      setLoading(true);
      
      if (activeTab === 'teams') {
        const res = await fetch('/api/enterprise/teams');
        const data = await res.json();
        setTeams(data.teams || []);
      } else if (activeTab === 'rbac') {
        const res = await fetch('/api/enterprise/rbac');
        const data = await res.json();
        setRoles(data.roles || []);
      } else if (activeTab === 'compliance') {
        const res = await fetch('/api/enterprise/compliance');
        const data = await res.json();
        setCompliance(data.status || null);
      } else if (activeTab === 'audit') {
        const res = await fetch('/api/enterprise/audit?limit=50');
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Enterprise Features</h1>
        <p className="text-slate-400">Manage teams, roles, compliance, and audit logs</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="rbac">RBAC</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Team Management</CardTitle>
              <CardDescription>Create and manage teams</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-slate-400">Loading teams...</div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => {/* Create team modal */}}>
                    + Create Team
                  </Button>
                  <div className="grid gap-4">
                    {teams.map(team => (
                      <Card key={team.id} className="bg-slate-800 border-slate-700">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white font-semibold">{team.name}</h3>
                              <p className="text-slate-400 text-sm">{team.description}</p>
                              <p className="text-slate-500 text-xs mt-1">
                                {team.memberCount} members • Your role: {team.role}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">Manage</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rbac" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Role-Based Access Control</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-slate-400">Loading roles...</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {roles.map((role, idx) => (
                      <Card key={idx} className="bg-slate-800 border-slate-700">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white font-semibold">{role.role}</h3>
                              <p className="text-slate-400 text-sm">
                                Context: {role.context ? JSON.stringify(role.context) : 'Global'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Compliance Status</CardTitle>
              <CardDescription>GDPR, SOC2, HIPAA compliance</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-slate-400">Loading compliance status...</div>
              ) : compliance ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${compliance.compliant ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
                    <div className="flex items-center gap-2">
                      <span className={compliance.compliant ? 'text-green-400' : 'text-red-400'}>
                        {compliance.compliant ? '✓' : '✗'}
                      </span>
                      <span className="text-white font-semibold">
                        {compliance.compliant ? 'Compliant' : 'Non-Compliant'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Active Policies</h4>
                      <div className="space-y-2">
                        {compliance.policies.map((policy: any, idx: number) => (
                          <div key={idx} className="text-slate-400 text-sm">
                            • {policy.name || policy.id}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">Requirements</h4>
                      <div className="space-y-2 text-sm">
                        <div className={compliance.requirements.encryption ? 'text-green-400' : 'text-red-400'}>
                          Encryption: {compliance.requirements.encryption ? '✓' : '✗'}
                        </div>
                        <div className={compliance.requirements.auditLogging ? 'text-green-400' : 'text-red-400'}>
                          Audit Logging: {compliance.requirements.auditLogging ? '✓' : '✗'}
                        </div>
                        <div className={compliance.requirements.accessControls ? 'text-green-400' : 'text-red-400'}>
                          Access Controls: {compliance.requirements.accessControls ? '✓' : '✗'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400">No compliance data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Audit Logs</CardTitle>
              <CardDescription>Complete audit trail of all actions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-slate-400">Loading audit logs...</div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="p-3 bg-slate-800 rounded border border-slate-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-semibold">{log.action}</div>
                          <div className="text-slate-400 text-sm">{log.userId}</div>
                          <div className="text-slate-500 text-xs">{new Date(log.timestamp).toLocaleString()}</div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${log.result === 'success' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                          {log.result}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
