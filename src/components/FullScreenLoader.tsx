'use client';

import React from 'react';

export function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 shadow-sm" />
        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Loading AutoTrack Portal...</span>
      </div>
    </div>
  );
}