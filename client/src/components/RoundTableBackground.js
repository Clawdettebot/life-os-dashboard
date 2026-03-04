import React from 'react';

// ==================== SVG COMPONENTS ====================

// Knight SVG Avatar Component
export function KnightAvatar({ knight, size = 120, className = "" }) {
  const colors = {
    clawdette: { primary: '#f97316', secondary: '#ea580c', glow: '#fb923c' },
    knowledge: { primary: '#8b5cf6', secondary: '#7c3aed', glow: '#a78bfa' },
    affairs: { primary: '#06b6d4', secondary: '#0891b2', glow: '#22d3ee' },
    clawthchilds: { primary: '#eab308', secondary: '#ca8a04', glow: '#facc15' },
    claudnelius: { primary: '#22c55e', secondary: '#16a34a', glow: '#4ade80' },
    labrina: { primary: '#ec4899', secondary: '#db2777', glow: '#f472b6' },
    shrimp: { primary: '#6366f1', secondary: '#4f46e5', glow: '#818cf8' }
  };
  
  const c = colors[knight?.id] || colors.shrimp;
  
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className}>
      <defs>
        <linearGradient id={`grad-${knight?.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>
      </defs>
      
      {/* Background circle */}
      <circle cx="60" cy="60" r="50" fill={`url(#grad-${knight?.id})`} opacity="0.3" />
      
      {/* Helmet/Head */}
      <ellipse cx="60" cy="50" rx="28" ry="32" fill={`url(#grad-${knight?.id})`} />
      
      {/* Face plate */}
      <ellipse cx="60" cy="55" rx="20" ry="22" fill="#1a1a1e" />
      
      {/* Eyes */}
      <ellipse cx="52" cy="50" rx="4" ry="5" fill={c.glow} />
      <ellipse cx="68" cy="50" rx="4" ry="5" fill={c.glow} />
      
      {/* Shoulder pads */}
      <ellipse cx="30" cy="75" rx="12" ry="8" fill={`url(#grad-${knight?.id})`} />
      <ellipse cx="90" cy="75" rx="12" ry="8" fill={`url(#grad-${knight?.id})`} />
    </svg>
  );
}

// Animated Shield Component
export function KnightShield({ knight, size = 80, className = "" }) {
  const colors = {
    clawdette: '#f97316',
    knowledge: '#8b5cf6',
    affairs: '#06b6d4',
    clawthchilds: '#eab308',
    claudnelius: '#22c55e',
    labrina: '#ec4899',
    shrimp: '#6366f1'
  };
  
  const c = colors[knight?.id] || '#6366f1';
  
  return (
    <svg width={size} height={size} viewBox="0 0 80 100" className={className}>
      <path 
        d="M10 10 L70 10 L70 40 Q70 80 40 95 Q10 80 10 40 Z" 
        fill="#1a1a20"
        stroke={c}
        strokeWidth="2"
      />
      <text x="40" y="55" textAnchor="middle" fill={c} fontSize="28" fontWeight="bold">
        {knight?.name?.charAt(0) || '?'}
      </text>
    </svg>
  );
}

// Crown Icon
export function CrownIcon({ size = 40, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <path 
        d="M5 30 L10 15 L20 10 L30 15 L35 30 Z" 
        fill="#fbbf24"
        stroke="#d97706"
        strokeWidth="1"
      />
      <circle cx="20" cy="22" r="4" fill="#ef4444" />
    </svg>
  );
}

// Round Table Ring Animation
export function TableRing({ size = 600, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 600 600" className={className}>
      <circle cx="300" cy="300" r="250" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.6">
        <animate attributeName="r" values="250;255;250" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="300" cy="300" r="200" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.3" />
      
      {/* Position markers */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30) * Math.PI / 180;
        const x = 300 + 250 * Math.cos(angle);
        const y = 300 + 250 * Math.sin(angle);
        return <circle key={i} cx={x} cy={y} r="4" fill="#fbbf24" opacity="0.8" />;
      })}
      
      {/* Center glow */}
      <circle cx="300" cy="300" r="100" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.1" />
    </svg>
  );
}

// Floating Particles (CSS-based to avoid React re-renders)
export function FloatingParticles({ count = 20, className = "" }) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
      size: Math.random() * 4 + 2
    });
  }
  
  return (
    <div className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            background: i % 2 === 0 ? '#fbbf24' : '#f97316',
            borderRadius: '50%',
            left: `${p.left}%`,
            animation: `floatParticle${i} ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
      <style>{particles.map((p, i) => `
        @keyframes floatParticle${i} {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
      `).join('\n')}</style>
    </div>
  );
}

// ==================== BACKGROUND COMPONENT ====================

export default function RoundTableBackground() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        backgroundImage: 'url(/round-table-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)'
        }}
      />
      
      {/* Animated SVG Ring (behind character) */}
      <div 
        className="absolute pointer-events-none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '55%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          opacity: 0.4
        }}
      >
        <TableRing />
      </div>
      
      {/* Character overlay - centered with glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '55%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          height: '70vh',
          filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.4)) drop-shadow(0 0 60px rgba(255, 180, 0, 0.2))',
          zIndex: 1
        }}
      >
        <img
          src="/round-table-character.png"
          alt="Character"
          style={{
            height: '100%',
            width: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>
      
      {/* Floating particles */}
      <FloatingParticles count={15} />
      
      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ boxShadow: 'inset 0 0 200px rgba(0,0,0,0.7)' }} 
      />
    </div>
  );
}
