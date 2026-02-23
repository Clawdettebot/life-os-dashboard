/**
 * Cortex Section Background
 * Animated backgrounds based on current section
 */

import React from 'react';

const sectionConfigs = {
  emerald_tablets: {
    name: 'Emerald Tablets',
    primary: '#10B981',
    secondary: '#059669',
    accent: '#D4AF37',
    theme: 'ancient',
    overlay: 'radial-gradient(ellipse at 30% 20%, rgba(16,185,129,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(212,175,55,0.1) 0%, transparent 40%)'
  },
  howls_kitchen: {
    name: "Howl's Kitchen", 
    primary: '#FF6B35',
    secondary: '#DC2626',
    accent: '#FEF3C7',
    theme: 'warm',
    overlay: 'radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.2) 0%, transparent 50%), radial-gradient(ellipse at 20% 100%, rgba(220,38,38,0.15) 0%, transparent 40%)'
  },
  hitchhiker_guide: {
    name: "Hitchhiker's Guide",
    primary: '#00D4FF',
    secondary: '#0891B2',
    accent: '#FFFFFF',
    theme: 'tech',
    overlay: 'radial-gradient(ellipse at 10% 50%, rgba(0,212,255,0.1) 0%, transparent 40%), radial-gradient(ellipse at 90% 30%, rgba(8,145,178,0.1) 0%, transparent 40%)'
  },
  all_spark: {
    name: 'All Spark',
    primary: '#FFD700',
    secondary: '#F59E0B',
    accent: '#FFFBEB',
    theme: 'cosmic',
    overlay: 'radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.15) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(245,158,11,0.1) 0%, transparent 40%)'
  }
};

export function getSectionConfig(section) {
  return sectionConfigs[section] || sectionConfigs.all_spark;
}

// Particle component for each section
export function SectionParticles({ section }) {
  const config = getSectionConfig(section);
  
  return (
    <>
      {/* Gradient overlay atmosphere */}
      <div 
        className="section-atmosphere"
        style={{
          position: 'absolute',
          inset: 0,
          background: config.overlay || 'transparent',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      
      {/* Noise texture overlay */}
      <div 
        className="section-noise"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {/* Section-specific particles */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        {config.theme === 'ancient' && <AncientParticles color={config.primary} />}
        {config.theme === 'warm' && <WarmParticles color={config.primary} />}
        {config.theme === 'tech' && <TechParticles color={config.primary} />}
        {config.theme === 'cosmic' && <CosmicParticles color={config.primary} />}
      </div>
    </>
  );
}

// Ancient/Emerald - floating hieroglyph-style dots
function AncientParticles({ color }) {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15
  }));

  return (
    <div className="section-particles" style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          background: color,
          borderRadius: '50%',
          opacity: 0.3,
          animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// Warm/Kitchen - heat/shimmer effect
function WarmParticles({ color }) {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: Math.random() * 100 + 50,
    delay: Math.random() * 3,
    duration: Math.random() * 4 + 3
  }));

  return (
    <div className="section-particles" style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: '60%',
          width: p.size,
          height: p.size,
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          animation: `heat ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes heat {
          0% { transform: translateY(0) scale(1); opacity: 0.5; }
          100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Tech/Blueprint - grid + floating icons
function TechParticles({ color }) {
  return (
    <div className="section-particles" style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(${color}10 1px, transparent 1px),
        linear-gradient(90deg, ${color}10 1px, transparent 1px)
      `,
      backgroundSize: '50px 50px',
      opacity: 0.3
    }}>
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: 4,
        height: 4,
        background: color,
        borderRadius: '50%',
        boxShadow: `0 0 10px ${color}`,
        animation: 'pulse 2s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '30%',
        right: '15%',
        width: 6,
        height: 6,
        background: color,
        borderRadius: '50%',
        boxShadow: `0 0 15px ${color}`,
        animation: 'pulse 2.5s ease-in-out 0.5s infinite'
      }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// Cosmic/AllSpark - twinkling stars with golden theme
function CosmicParticles({ color }) {
  const stars = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 2
  }));

  return (
    <div className="section-particles" style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      {stars.map(star => (
        <div key={star.id} style={{
          position: 'absolute',
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: star.size,
          height: star.size,
          background: '#FFD700',
          borderRadius: '50%',
          boxShadow: `0 0 ${star.size * 2}px #FFD700`,
          animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

export default SectionParticles;
