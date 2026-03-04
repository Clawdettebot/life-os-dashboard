import React from 'react';

// Clawdette - Aquatic Warrior (CEO/Head Manager)
export default function Clawdette({ size = 400, className = "", animated = true }) {
  return (
    <svg 
      viewBox="0 0 500 800" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size * 1.6 }}
    >
      <defs>
        <radialGradient id="aw-bgGlow" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#e3ecea"/>
        </radialGradient>
        <radialGradient id="aw-pearlGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b6c3c9" />
        </radialGradient>
      </defs>
      
      {/* Background glow */}
      <rect width="500" height="800" fill="url(#aw-bgGlow)" />
      
      {/* Silhouette core */}
      <path d="M 200 180 L 300 180 L 340 320 L 320 450 L 250 510 L 180 450 L 160 320 Z" fill="#1c1311" />
      
      {/* Skin/Torso */}
      <rect x="238" y="145" width="24" height="45" fill="#3b2219" />
      <path d="M 225 310 Q 250 370 275 310 Z" fill="#3b2219" />
      <path d="M 210 380 Q 250 430 290 380 L 310 440 Q 250 410 190 440 Z" fill="#3b2219" />
      
      {/* Armor */}
      <path d="M 210 210 Q 250 265 290 210 L 275 310 Q 250 335 225 310 Z" fill="#26403d" stroke="#182e2b" strokeWidth="2"/>
      <path d="M 150 290 L 175 305 L 195 360 L 165 350 Z" fill="#26403d" stroke="#182e2b" strokeWidth="2"/>
      <path d="M 350 310 L 330 325 L 350 410 L 375 390 Z" fill="#26403d" stroke="#182e2b" strokeWidth="2"/>
      
      {/* Pearl accents */}
      <circle cx="210" cy="380" r="4" fill="url(#aw-pearlGrad)"/>
      <circle cx="230" cy="383" r="4" fill="url(#aw-pearlGrad)"/>
      <circle cx="250" cy="384" r="5" fill="url(#aw-pearlGrad)"/>
      <circle cx="270" cy="383" r="4" fill="url(#aw-pearlGrad)"/>
      <circle cx="290" cy="380" r="4" fill="url(#aw-pearlGrad)"/>
      
      {/* Crown/Tiara */}
      <path d="M 225 110 Q 220 80 210 50 Q 220 70 230 80 Q 235 50 240 30 Q 245 60 250 80 Q 255 40 260 30 Q 265 60 270 80 Q 280 50 290 50 Q 280 80 275 110 Q 250 120 225 110 Z" fill="#d94c4c" stroke="#8c2323" strokeWidth="1.5"/>
      <path d="M 225 110 Q 250 120 275 110" fill="none" stroke="#8c2323" strokeWidth="2"/>
      
      {/* Head */}
      <g>
        <path d="M 230 135 Q 230 165 250 170 Q 270 165 270 135 Q 270 100 250 100 Q 230 100 230 135 Z" fill="#3b2219" />
        
        {/* Eyes */}
        <path d="M 238 133 Q 242 130 246 133 Q 242 136 238 133" fill="#ffffff"/>
        <circle cx="242" cy="133" r="1.5" fill="#1a0e0a" />
        <path d="M 254 133 Q 258 130 262 133 Q 258 136 254 133" fill="#ffffff"/>
        <circle cx="258" cy="133" r="1.5" fill="#1a0e0a" />
        
        {/* Headpiece sway */}
        <path d="M 225 110 Q 220 80 210 50 Q 220 70 230 80 Q 235 50 240 30 Q 245 60 250 80 Q 255 40 260 30 Q 265 60 270 80 Q 280 50 290 50 Q 280 80 275 110 Z" 
          fill="#d94c4c" stroke="#8c2323" strokeWidth="1.5"
          style={animated ? { animation: 'aw-head-sway 7s ease-in-out infinite' } : {}}
        />
        
        {/* Hair flowing */}
        <path d="M 220 150 Q 190 200 200 250 Q 210 280 180 320" fill="none" stroke="#697a53" strokeWidth="6" strokeLinecap="round"/>
        <path d="M 280 150 Q 320 200 300 260 Q 290 300 320 340" fill="none" stroke="#697a53" strokeWidth="7" strokeLinecap="round"/>
      </g>
      
      {/* Trident/Scepter */}
      <polygon points="175,340 195,335 255,590 240,600" fill="#a4c3d9" stroke="#556b78" strokeWidth="1.5"/>
      <line x1="185" y1="337" x2="247" y2="595" stroke="#ffffff" strokeWidth="2" opacity="0.8"/>
      
      {/* Shield emblem */}
      <path d="M 170 210 Q 185 160 210 180 Q 225 185 235 210 Q 200 230 170 210 Z" fill="#e6a8a8" stroke="#a17575" strokeWidth="1.5"/>
      
      {/* Bubble accents */}
      <circle cx="250" cy="0" r="3" fill="rgba(220,240,255,0.4)" stroke="rgba(100,150,170,0.6)" strokeWidth="1" 
        style={animated ? { animation: 'aw-rise 8s ease-in infinite', animationDelay: '0s' } : {}}/>
      <circle cx="280" cy="0" r="7" fill="rgba(220,240,255,0.4)" stroke="rgba(100,150,170,0.6)" strokeWidth="1"
        style={animated ? { animation: 'aw-rise 6s ease-in infinite', animationDelay: '1.5s' } : {}}/>
      <circle cx="180" cy="0" r="5" fill="rgba(220,240,255,0.4)" stroke="rgba(100,150,170,0.6)" strokeWidth="1"
        style={animated ? { animation: 'aw-rise 7s ease-in infinite', animationDelay: '2.5s' } : {}}/>
      
      <style>{`
        @keyframes aw-rise {
          0% { transform: translateY(850px) translateX(0px) scale(0.8); opacity: 0; }
          20% { opacity: 0.8; }
          50% { transform: translateY(400px) translateX(15px) scale(1); }
          80% { opacity: 0.8; }
          100% { transform: translateY(-50px) translateX(-15px) scale(1.2); opacity: 0; }
        }
        @keyframes aw-head-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2deg); }
        }
      `}</style>
    </svg>
  );
}
