/**
 * Glass UI Components for Labrina Social View
 */

import React from 'react';

export function GlassCard({ children, className = '', ...props }) {
  return (
    <div 
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassPill({ children, className = '', active = false, ...props }) {
  return (
    <span 
      className={`
        px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
        ${active 
          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
          : 'bg-white/5 text-gray-400 border border-white/10'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
