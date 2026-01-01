"use client";

import React from 'react';

export function JanitorLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-slate-800 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-800 rounded"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-slate-800 rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function JanitorFeatureLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-slate-800 rounded w-1/4"></div>
      <div className="h-4 bg-slate-800 rounded w-1/2"></div>
      <div className="h-32 bg-slate-800 rounded"></div>
    </div>
  );
}

export function JanitorEmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction 
}: { 
  title: string; 
  description: string; 
  actionLabel?: string; 
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-12 px-6">
      <div className="text-6xl mb-4">🧹</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

