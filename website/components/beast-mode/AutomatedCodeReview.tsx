"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface CodeIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  line?: number;
  suggestion?: string;
}

interface CodeReview {
  file: string;
  issues: CodeIssue[];
  suggestions: any[];
  positives: any[];
  score: number;
  approved: boolean;
}

interface ReviewSummary {
  totalFiles: number;
  approvedFiles: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  averageScore: number;
  overallApproval: boolean;
  recommendation: string;
}

interface AutomatedCodeReviewProps {
  changes?: Array<{
    file: string;
    additions: string[];
    deletions: string[];
    diff: string;
  }>;
}

export default function AutomatedCodeReview({ changes }: AutomatedCodeReviewProps) {
  const [review, setReview] = useState<{ reviews: CodeReview[]; summary: ReviewSummary } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const runReview = async () => {
    if (!changes || changes.length === 0) {
      alert('No changes to review. Please provide code changes.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/beast-mode/intelligence/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes,
          options: {
            checkSecurity: true,
            checkPerformance: true,
            checkBestPractices: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReview(data);
      }
    } catch (error) {
      console.error('Failed to run code review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!review) {
    return (
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">🤖 Automated Code Review</CardTitle>
          <CardDescription className="text-slate-400">
            AI-powered code review with security, performance, and best practice checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-lg font-semibold text-slate-300 mb-2">Ready to Review</div>
            <div className="text-sm text-slate-400 mb-6">
              {changes && changes.length > 0
                ? `Found ${changes.length} file(s) to review`
                : 'No changes provided. Upload code changes to get started.'}
            </div>
            {changes && changes.length > 0 && (
              <Button
                onClick={runReview}
                disabled={isLoading}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {isLoading ? 'Reviewing...' : 'Start Code Review'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { reviews, summary } = review;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">📊 Review Summary</CardTitle>
              <CardDescription className="text-slate-400">
                {summary.totalFiles} file(s) reviewed
              </CardDescription>
            </div>
            <div className={`px-4 py-2 rounded-lg ${
              summary.overallApproval
                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}>
              {summary.overallApproval ? '✅ Approved' : '❌ Needs Changes'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-slate-400 text-sm mb-1">Average Score</div>
              <div className="text-2xl font-bold text-white">{summary.averageScore}/100</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">Total Issues</div>
              <div className="text-2xl font-bold text-white">{summary.totalIssues}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">Critical</div>
              <div className="text-2xl font-bold text-red-400">{summary.criticalIssues}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">High</div>
              <div className="text-2xl font-bold text-orange-400">{summary.highIssues}</div>
            </div>
          </div>
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-white font-semibold mb-2">Recommendation</div>
            <div className="text-slate-300">{summary.recommendation}</div>
          </div>
        </CardContent>
      </Card>

      {/* File Reviews */}
      <div className="space-y-4">
        {reviews.map((fileReview, idx) => (
          <Card
            key={idx}
            className={`bg-slate-900/90 border-slate-800 ${
              fileReview.approved ? 'border-green-500/50' : 'border-red-500/50'
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-lg">{fileReview.file}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {fileReview.issues.length} issue(s) • Score: {fileReview.score}/100
                  </CardDescription>
                </div>
                <div className={`px-3 py-1 rounded text-sm ${
                  fileReview.approved
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {fileReview.approved ? '✅ Approved' : '❌ Needs Changes'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {fileReview.issues.length > 0 ? (
                <div className="space-y-2">
                  {fileReview.issues.map((issue, issueIdx) => (
                    <div
                      key={issueIdx}
                      className={`p-3 rounded-lg border ${
                        issue.severity === 'critical' ? 'bg-red-950/50 border-red-800' :
                        issue.severity === 'high' ? 'bg-orange-950/50 border-orange-800' :
                        issue.severity === 'medium' ? 'bg-yellow-950/50 border-yellow-800' :
                        'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-white font-semibold">{issue.type.replace(/_/g, ' ')}</div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          issue.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {issue.severity}
                        </div>
                      </div>
                      <div className="text-slate-300 text-sm mb-1">{issue.message}</div>
                      {issue.line && (
                        <div className="text-slate-500 text-xs mb-1">Line {issue.line}</div>
                      )}
                      {issue.suggestion && (
                        <div className="text-cyan-400 text-sm mt-2">
                          💡 {issue.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  ✅ No issues found - code looks good!
                </div>
              )}

              {fileReview.positives && fileReview.positives.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="text-green-400 font-semibold mb-2">✨ Positive Feedback</div>
                  <div className="space-y-1">
                    {fileReview.positives.map((positive, posIdx) => (
                      <div key={posIdx} className="text-slate-300 text-sm">
                        • {positive.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

