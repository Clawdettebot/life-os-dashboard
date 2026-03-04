import React from 'react';
import { KnightAvatar, KnightShield, CrownIcon } from './RoundTableBackground';

// Knight card with full SVG integration
export function KnightCard({ knight, onClick, className = "" }) {
  const colorSchemes = {
    clawdette: { 
      primary: '#f97316', 
      secondary: '#ea580c', 
      glow: '#fb923c',
      gradient: 'from-orange-500 to-red-600',
      bgGrad: 'from-orange-500/20 to-red-500/10'
    },
    knowledge: { 
      primary: '#8b5cf6', 
      secondary: '#7c3aed', 
      glow: '#a78bfa',
      gradient: 'from-purple-500 to-indigo-600',
      bgGrad: 'from-purple-500/20 to-indigo-500/10'
    },
    affairs: { 
      primary: '#06b6d4', 
      secondary: '#0891b2', 
      glow: '#22d3ee',
      gradient: 'from-cyan-500 to-blue-600',
      bgGrad: 'from-cyan-500/20 to-blue-500/10'
    },
    clawthchilds: { 
      primary: '#eab308', 
      secondary: '#ca8a04', 
      glow: '#facc15',
      gradient: 'from-yellow-500 to-amber-600',
      bgGrad: 'from-yellow-500/20 to-amber-500/10'
    },
    claudnelius: { 
      primary: '#22c55e', 
      secondary: '#16a34a', 
      glow: '#4ade80',
      gradient: 'from-green-500 to-emerald-600',
      bgGrad: 'from-green-500/20 to-emerald-500/10'
    },
    labrina: { 
      primary: '#ec4899', 
      secondary: '#db2777', 
      glow: '#f472b6',
      gradient: 'from-pink-500 to-rose-600',
      bgGrad: 'from-pink-500/20 to-rose-500/10'
    },
    shrimp: { 
      primary: '#6366f1', 
      secondary: '#4f46e5', 
      glow: '#818cf8',
      gradient: 'from-indigo-500 to-violet-600',
      bgGrad: 'from-indigo-500/20 to-violet-500/10'
    }
  };

  const scheme = colorSchemes[knight.id] || colorSchemes.shrimp;
  const isOnline = knight.status === 'active';

  return (
    <div 
      onClick={onClick}
      className={`relative group cursor-pointer transition-all duration-500 ${className}`}
    >
      {/* Card glow effect */}
      <div 
        className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${scheme.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-xl`}
      />
      
      {/* Main card */}
      <div 
        className="relative bg-gradient-to-br from-[#1a1a20] to-[#0a0a0e] rounded-3xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-500"
        style={{
          boxShadow: `0 0 40px ${scheme.primary}10, inset 0 1px 0 ${scheme.primary}20`
        }}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${scheme.bgGrad} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        
        {/* Content */}
        <div className="relative p-6 flex flex-col items-center">
          {/* Status indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'} animate-pulse`} />
            <span className="text-[8px] uppercase tracking-wider text-gray-500">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {/* Avatar */}
          <div className="relative mb-4">
            <KnightAvatar knight={knight} size={100} />
            {/* Shield overlay */}
            <div className="absolute -bottom-2 -right-2">
              <KnightShield knight={knight} size={40} />
            </div>
          </div>
          
          {/* Name */}
          <h3 className="text-lg font-bold text-white mb-1 tracking-tight">
            {knight.name}
          </h3>
          
          {/* Role */}
          <p 
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: scheme.primary }}
          >
            {knight.role}
          </p>
          
          {/* Specialty */}
          <p className="text-[11px text-gray-400 text-center leading-relaxed mb-4">
            {knight.specialty}
          </p>
          
          {/* Stats bar */}
          <div className="w-full flex items-center justify-between text-[9px] text-gray-500 pt-3 border-t border-white/5">
            <span className="flex items-center gap-1">
              <span style={{ color: scheme.primary }}>●</span> Active
            </span>
            <span>{knight.lastActivity || 'Just now'}</span>
          </div>
        </div>
        
        {/* Hover glow line */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, ${scheme.primary}, transparent)`
          }}
        />
      </div>
    </div>
  );
}

// Compact knight badge
export function KnightBadge({ knight, size = 'md', className = "" }) {
  const sizes = { sm: 32, md: 48, lg: 64 };
  const s = sizes[size] || 48;
  
  return (
    <div className={`relative inline-flex ${className}`}>
      <KnightAvatar knight={knight} size={s} />
      {knight.status === 'active' && (
        <span 
          className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0e]"
        />
      )}
    </div>
  );
}

// Full knight profile modal content
export function KnightProfile({ knight }) {
  const colorSchemes = {
    clawdette: { primary: '#f97316', gradient: 'from-orange-500 to-red-600' },
    knowledge: { primary: '#8b5cf6', gradient: 'from-purple-500 to-indigo-600' },
    affairs: { primary: '#06b6d4', gradient: 'from-cyan-500 to-blue-600' },
    clawthchilds: { primary: '#eab308', gradient: 'from-yellow-500 to-amber-600' },
    claudnelius: { primary: '#22c55e', gradient: 'from-green-500 to-emerald-600' },
    labrina: { primary: '#ec4899', gradient: 'from-pink-500 to-rose-600' },
    shrimp: { primary: '#6366f1', gradient: 'from-indigo-500 to-violet-600' }
  };

  const scheme = colorSchemes[knight.id] || colorSchemes.shrimp;
  
  return (
    <div className="relative">
      {/* Header gradient */}
      <div className={`h-32 bg-gradient-to-br ${scheme.gradient} opacity-30`} />
      
      {/* Avatar */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2">
        <KnightAvatar knight={knight} size={120} className="ring-4 ring-[#0a0a0e]" />
      </div>
      
      {/* Content */}
      <div className="pt-20 px-8 pb-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{knight.name}</h2>
        <p className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: scheme.primary }}>
          {knight.role}
        </p>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-lg font-bold text-white">100%</div>
            <div className="text-[8px] uppercase tracking-wider text-gray-500">Uptime</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-lg font-bold text-white">24/7</div>
            <div className="text-[8px] uppercase tracking-wider text-gray-500">Status</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-lg font-bold text-white">0</div>
            <div className="text-[8px] uppercase tracking-wider text-gray-500">Errors</div>
          </div>
        </div>
        
        {/* Directives */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-left">
          <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Primary Directives</h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            {knight.specialty}
          </p>
        </div>
      </div>
    </div>
  );
}
