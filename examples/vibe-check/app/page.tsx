'use client';

import { useState, useEffect } from 'react';

export default function VibeCheck() {
  const [quality, setQuality] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize BEAST MODE and get quality score
    async function checkVibe() {
      try {
        const { BeastMode } = await import('@beast-mode/core');
        const beastMode = new BeastMode();
        await beastMode.initialize();
        const score = await beastMode.getQualityScore({ detailed: true });
        setQuality(score);
      } catch (error) {
        console.error('Failed to check vibe:', error);
      } finally {
        setLoading(false);
      }
    }

    checkVibe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Checking your vibe... 🎸</div>
      </div>
    );
  }

  const score = quality?.overall || 0;
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'F';
  const vibeColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-cyan-400';

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">
          Vibe Check <span className="text-cyan-400">🎸</span>
        </h1>
        <p className="text-slate-400 mb-8">Your code quality dashboard</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Vibe Score</div>
            <div className={`text-5xl font-bold ${vibeColor}`}>{score}</div>
            <div className="text-slate-500 text-sm mt-2">Grade: {grade}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Status</div>
            <div className="text-2xl font-bold text-cyan-400">
              {score >= 80 ? '🔥 FIRE' : score >= 60 ? '✨ SOLID' : '🚀 GROWING'}
            </div>
            <div className="text-slate-500 text-sm mt-2">Keep it up!</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Recommendations</div>
            <div className="text-2xl font-bold text-purple-400">
              {quality?.recommendations?.length || 0}
            </div>
            <div className="text-slate-500 text-sm mt-2">Improvements available</div>
          </div>
        </div>

        {quality?.recommendations && quality.recommendations.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-cyan-400">Quick Wins</h2>
            <ul className="space-y-2">
              {quality.recommendations.slice(0, 5).map((rec: string, i: number) => (
                <li key={i} className="text-slate-300 flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-cyan-400">The Vibe</h2>
          <p className="text-slate-300">
            {score >= 80 
              ? '🔥 Your code is absolutely vibing! Keep up the amazing work!'
              : score >= 60
              ? '✨ You\'re on the right track! Keep improving and your vibe will be fire!'
              : '🚀 Every expert was once a beginner. Keep learning, keep building, keep vibing!'}
          </p>
        </div>
      </div>
    </div>
  );
}

