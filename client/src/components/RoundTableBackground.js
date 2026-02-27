import React from 'react';

export default function RoundTableBackground() {
  return (
    <div 
      className="fixed inset-0 -z-10 w-full h-full"
      style={{ 
        background: 'linear-gradient(180deg, #082026 0%, #0d2e33 50%, #082026 100%)',
        minHeight: '100vh'
      }}
    >
      <svg 
        viewBox="0 0 1600 900" 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{ minHeight: '100%' }}
      >
        <defs>
          <linearGradient id="oceanGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4dbab5" />
            <stop offset="30%" stopColor="#217a80" />
            <stop offset="100%" stopColor="#082026" />
          </linearGradient>
          <linearGradient id="godRay" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#7bf0f0" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a1d21"/>
            <stop offset="100%" stopColor="#18363d"/>
          </linearGradient>
          <linearGradient id="archGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#133d45" />
            <stop offset="100%" stopColor="#091d22" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <symbol id="brainCoral" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="#a85d69"/>
            <circle cx="35" cy="40" r="25" fill="#c77b87"/>
            <circle cx="70" cy="65" r="25" fill="#8c4450"/>
          </symbol>
          <symbol id="tubeCoral" viewBox="0 0 100 100">
            <rect x="40" y="30" width="16" height="70" rx="8" fill="#694a91"/>
            <rect x="20" y="50" width="14" height="50" rx="7" fill="#8766b3"/>
            <rect x="65" y="45" width="18" height="55" rx="9" fill="#503573"/>
          </symbol>
          <symbol id="jellyfish" viewBox="-20 -20 40 60">
            <path d="M -15,0 C -15,-15 15,-15 15,0 C 15,5 10,8 0,5 C -10,8 -15,5 -15,0 Z" fill="#8affda" opacity="0.6" filter="url(#glow)"/>
          </symbol>
        </defs>

        {/* Background */}
        <rect width="1600" height="900" fill="url(#oceanGlow)" />

        {/* Layer 1 - Far */}
        <g opacity="0.3">
          <path d="M 620,280 L 620,120 C 620,20 980,20 980,120 L 980,280 L 950,280 L 950,120 C 950,40 650,40 650,120 L 650,280 Z" fill="#091f24" stroke="#1d4a52" strokeWidth="4"/>
        </g>

        {/* Layer 2 */}
        <g opacity="0.5">
          <path d="M 530,220 L 530,20 C 530,-100 1070,-100 1070,20 L 1070,220 L 1030,220 L 1030,20 C 1030,-60 570,-60 570,20 L 570,220 Z" fill="#0e2a30" stroke="#225b63" strokeWidth="5"/>
        </g>

        {/* Layer 3 - Mid */}
        <g opacity="0.7">
          <path d="M 380,100 L 380,-100 C 380,-300 1220,-300 1220,-100 L 1220,100 L 1160,100 L 1160,-100 C 1160,-220 440,-220 440,-100 L 440,100 Z" fill="#13363d" stroke="#276a75" strokeWidth="6"/>
          <g transform="translate(380, 800)">
            <use href="#brainCoral" x="-60" y="-30" width="70" height="70"/>
            <use href="#tubeCoral" x="20" y="-50" width="60" height="60"/>
          </g>
        </g>

        {/* Layer 4 - Foreground */}
        <g>
          <path d="M 150,-100 L 150,-200 C 150,-500 1450,-500 1450,-200 L 1450,-100 L 1370,-100 L 1370,-200 C 1370,-400 230,-400 230,-200 L 230,-100 Z" fill="url(#archGrad)" stroke="#30828f" strokeWidth="8"/>
          <g transform="translate(150, 850)">
            <use href="#tubeCoral" x="-80" y="-120" width="100" height="100"/>
            <use href="#brainCoral" x="-40" y="-50" width="120" height="120"/>
          </g>
        </g>

        {/* God rays */}
        <g>
          <polygon points="750,-50 850,-50 1000,900 600,900" fill="url(#godRay)" opacity="0.6"/>
          <polygon points="450,-50 1150,-50 1700,900 -100,900" fill="url(#godRay)" opacity="0.15"/>
        </g>

        {/* Floating particles */}
        <g>
          <circle cx="380" cy="750" r="4" fill="#ffd166" opacity="0.8" filter="url(#glow)">
            <animate attributeName="cy" values="750;700;750" dur="8s" repeatCount="indefinite"/>
          </circle>
          <circle cx="1200" cy="760" r="5" fill="#ffd166" opacity="0.7" filter="url(#glow)">
            <animate attributeName="cy" values="760;710;760" dur="10s" repeatCount="indefinite"/>
          </circle>
          <use href="#jellyfish" transform="translate(150, 650) scale(1.2)">
            <animateTransform attributeName="transform" type="translate" values="150,650;150,630;150,650" dur="6s" repeatCount="indefinite"/>
          </use>
          <use href="#jellyfish" transform="translate(1400, 500) scale(0.7)">
            <animateTransform attributeName="transform" type="translate" values="1400,500;1400,480;1400,500" dur="7s" repeatCount="indefinite"/>
          </use>
        </g>

        {/* Floor */}
        <polygon points="0,450 1600,450 1600,900 0,900" fill="url(#floorGrad)"/>
        
        {/* Vignette */}
        <rect width="1600" height="900" fill="none" stroke="#041217" strokeWidth="60" opacity="0.6" pointerEvents="none"/>
      </svg>
    </div>
  );
}
