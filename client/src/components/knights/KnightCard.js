import React, { useState } from 'react';
import { KNIGHTS } from './knights';

// Simplified Knight Avatar SVG - shows on hover/click
const KnightAvatar = ({ knightId, size = 80 }) => {
  const icons = {
    eldritch: (
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx="50" cy="50" r="45" fill="#1a1a2e"/>
        <circle cx="50" cy="50" r="35" fill="#16213e"/>
        <path d="M50 20 L55 35 L70 35 L58 45 L63 60 L50 50 L37 60 L42 45 L30 35 L45 35 Z" fill="#4df2ff" filter="url(#glow)"/>
        <circle cx="40" cy="45" r="3" fill="#4df2ff"/>
        <circle cx="60" cy="45" r="3" fill="#4df2ff"/>
      </svg>
    ),
    bullmarket: (
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="45" fill="#1a2e1a"/>
        <circle cx="50" cy="50" r="35" fill="#1e3a1e"/>
        <path d="M30 70 L40 50 L50 55 L60 35 L70 45 L70 70 Z" fill="#4ade80"/>
        <circle cx="42" cy="42" r="4" fill="#4ade80"/>
        <circle cx="58" cy="42" r="4" fill="#4ade80"/>
      </svg>
    ),
    crab: (
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="55" r="40" fill="#2e1a0a"/>
        <ellipse cx="50" cy="50" rx="35" ry="25" fill="#e86a17"/>
        <circle cx="38" cy="45" r="5" fill="#fff"/>
        <circle cx="62" cy="45" r="5" fill="#fff"/>
        <circle cx="38" cy="45" r="2" fill="#000"/>
        <circle cx="62" cy="45" r="2" fill="#000"/>
        <path d="M20 50 L30 55 M80 50 L70 55" stroke="#ff9800" strokeWidth="3"/>
      </svg>
    ),
    shrimp: (
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="45" fill="#2a1a2e"/>
        <ellipse cx="50" cy="55" rx="25" ry="15" fill="#f8b6cc"/>
        <circle cx="50" cy="35" r="12" fill="#f8b6cc"/>
        <path d="M50 23 L50 10 M45 25 L40 15 M55 25 L60 15" stroke="#f8b6cc" strokeWidth="2"/>
        <circle cx="46" cy="35" r="2" fill="#000"/>
        <circle cx="54" cy="35" r="2" fill="#000"/>
      </svg>
    ),
    frantic: (
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="45" fill="#1a1a2e"/>
        <circle cx="50" cy="45" r="25" fill="#2d2d44"/>
        <circle cx="42" cy="42" r="6" fill="#fff"/>
        <circle cx="58" cy="42" r="6" fill="#fff"/>
        <circle cx="42" cy="42" r="3" fill="#a78bfa"/>
        <circle cx="58" cy="42" r="3" fill="#a78bfa"/>
        <path d="M30 30 L40 35 M70 30 L60 35" stroke="#a78bfa" strokeWidth="2"/>
        <path d="M35 65 Q50 75 65 65" stroke="#a78bfa" strokeWidth="2" fill="none"/>
      </svg>
    ),
    iridescent: (
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="45" fill="#1a1a2e"/>
        <circle cx="50" cy="50" r="30" fill="url(#iridGrad)"/>
        <defs><linearGradient id="iridGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ffc4d9"/><stop offset="50%" stopColor="#bce6eb"/><stop offset="100%" stopColor="#d9c2f0"/></linearGradient></defs>
        <circle cx="40" cy="45" r="4" fill="#fff"/>
        <circle cx="60" cy="45" r="4" fill="#fff"/>
        <circle cx="40" cy="45" r="2" fill="#000"/>
        <circle cx="60" cy="45" r="2" fill="#000"/>
      </svg>
    ),
    aquatic: (
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="45" fill="#0a1a1e"/>
        <circle cx="50" cy="45" r="28" fill="#26403d"/>
        <circle cx="40" cy="40" r="5" fill="#38bdf8"/>
        <circle cx="60" cy="40" r="5" fill="#38bdf8"/>
        <circle cx="40" cy="40" r="2" fill="#000"/>
        <circle cx="60" cy="40" r="2" fill="#000"/>
        <path d="M30 55 Q50 70 70 55" stroke="#38bdf8" strokeWidth="2" fill="none"/>
        <circle cx="35" cy="30" r="3" fill="#38bdf8" opacity="0.6"/>
        <circle cx="65" cy="30" r="3" fill="#38bdf8" opacity="0.6"/>
      </svg>
    )
  };
  return icons[knightId] || null;
};

// Knight Card Component
const KnightCard = ({ knight, onClick, isActive }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative cursor-pointer transition-all duration-300 ease-out
        hover:scale-110 hover:z-20
        ${isActive ? 'scale-110 z-20' : 'z-10'}
      `}
      style={{ 
        width: 100, 
        height: 100,
        filter: isActive ? `drop-shadow(0 0 20px ${knight.color})` : 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
      }}
    >
      {/* PNG Avatar Background (larger, behind) */}
      <div className="absolute inset-0 rounded-full overflow-hidden" style={{ transform: 'scale(1.5)', top: '-25%', left: '-25%' }}>
        <img 
          src={knight.avatar} 
          alt={knight.name}
          className="w-full h-full object-cover opacity-40"
        />
      </div>
      
      {/* SVG Knight (smaller, in front) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <KnightAvatar knightId={knight.id} size={60} />
      </div>
      
      {/* Knight Name Label */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs font-medium" style={{ color: knight.color, fontFamily: 'Orbitron, sans-serif' }}>
          {knight.name}
        </span>
      </div>
    </div>
  );
};

// Round Table Component
const RoundTableKnights = ({ activeKnight, onKnightClick, avatars = {} }) => {
  const knightsWithAvatars = KNIGHTS.map(k => ({
    ...k,
    avatar: avatars[k.id] || null
  }));

  return (
    <div className="relative flex items-center justify-center gap-4 py-8">
      {/* Table Visual */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-80 h-80 rounded-full border-2 border-white/10 bg-gradient-to-br from-white/5 to-transparent" />
      </div>
      
      {/* Knight Cards */}
      {knightsWithAvatars.map((knight) => (
        <KnightCard
          key={knight.id}
          knight={knight}
          isActive={activeKnight === knight.id}
          onClick={() => onKnightClick(knight.id)}
        />
      ))}
    </div>
  );
};

export { KnightCard, KnightAvatar, RoundTableKnights };
export default RoundTableKnights;
