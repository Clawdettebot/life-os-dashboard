import React from 'react';

// Knaight of Affairs - Frantic Mage (Schedule Guardian)
export default function KnaightOfAffairs({ size = 400, className = "", animated = true }) {
  return (
    <svg 
      viewBox="0 0 500 800" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size * 1.6 }}
    >
      <defs>
        <linearGradient id="fm-metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5c758c"/>
          <stop offset="50%" stopColor="#394b5c"/>
          <stop offset="100%" stopColor="#1f2a36"/>
        </linearGradient>
        <linearGradient id="fm-metal-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#394b5c"/>
          <stop offset="100%" stopColor="#1a222b"/>
        </linearGradient>
        <radialGradient id="fm-cyan-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3bb4c2" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#3bb4c2" stopOpacity="0"/>
        </radialGradient>
      </defs>
      
      {/* Aura */}
      <circle cx="250" cy="350" r="220" fill="url(#fm-cyan-glow)" />
      
      {/* Hair back */}
      <path d="M 250 30 Q 210 20 180 50 Q 130 60 120 110 Q 90 150 130 190 Q 140 230 180 230 L 320 230 Q 360 230 370 190 Q 410 150 380 110 Q 370 60 320 50 Q 290 20 250 30 Z" fill="#111820" />
      
      {/* Coat tails */}
      <path d="M 190 350 L 110 520 L 160 480 L 100 600 L 160 550 L 140 680 L 200 580 L 250 450 L 300 580 L 360 680 L 340 550 L 400 600 L 340 480 L 390 520 L 310 350 Z" fill="#18212a" />
      
      {/* Legs */}
      <polygon points="210,380 245,380 230,520 180,520" fill="#20272e"/>
      <polygon points="255,380 290,380 320,520 270,520" fill="#20272e"/>
      
      {/* Metal legs */}
      <polygon points="172,530 218,530 225,690 165,690" fill="url(#fm-metal-dark)"/>
      <polygon points="282,530 328,530 335,690 275,690" fill="url(#fm-metal-dark)"/>
      <polygon points="160,680 230,680 240,730 140,730" fill="#262423"/>
      <polygon points="270,680 340,680 360,730 260,730" fill="#262423"/>
      <ellipse cx="190" cy="725" rx="45" ry="12" fill="#31302e"/>
      <ellipse cx="310" cy="725" rx="45" ry="12" fill="#31302e"/>
      
      {/* Arms */}
      <polygon points="180,220 200,250 150,380 120,350" fill="#20272e"/>
      <polygon points="320,220 300,250 350,380 380,350" fill="#20272e"/>
      
      {/* Hands with clock faces */}
      <circle cx="120" cy="380" r="20" fill="url(#fm-metal-grad)" />
      <circle cx="380" cy="380" r="20" fill="url(#fm-metal-grad)" />
      
      {/* Torso */}
      <polygon points="190,200 310,200 320,270 290,400 210,400 180,270" fill="url(#fm-metal-dark)"/>
      <polygon points="220,200 280,200 300,270 270,390 230,390 200,270" fill="url(#fm-metal-grad)"/>
      
      {/* Shoulder pads */}
      <path d="M 160 210 Q 180 180 220 200 Q 200 240 150 250 Z" fill="url(#fm-metal-grad)"/>
      <path d="M 340 210 Q 320 180 280 200 Q 300 240 350 250 Z" fill="url(#fm-metal-grad)"/>
      
      {/* Head */}
      <ellipse cx="250" cy="155" rx="30" ry="42" fill="#38211a" />
      
      {/* Eyes - frantic/energized */}
      <ellipse cx="236" cy="148" rx="8" ry="10" fill="#ffffff" />
      <circle cx="236" cy="148" r="3.5" fill="#141c24" />
      <circle cx="236" cy="148" r="2" fill="#3bb4c2" />
      <ellipse cx="264" cy="148" rx="8" ry="10" fill="#ffffff" />
      <circle cx="264" cy="148" r="3.5" fill="#141c24" />
      <circle cx="264" cy="148" r="2" fill="#3bb4c2" />
      
      {/* Mouth */}
      <rect x="238" y="175" width="24" height="8" rx="2" fill="#140a08" />
      
      {/* Floating timepieces */}
      <g>
        <circle cx="170" cy="80" r="10" fill="#e8e5d1" stroke="#755a43" strokeWidth="2"/>
        <circle cx="330" cy="100" r="8" fill="#e8e5d1" stroke="#755a43" strokeWidth="2"/>
        <circle cx="260" cy="50" r="12" fill="#e8e5d1" stroke="#755a43" strokeWidth="2"/>
        <circle cx="130" cy="140" r="6" fill="#e8e5d1" stroke="#755a43" strokeWidth="2"/>
        <circle cx="380" cy="150" r="7" fill="#e8e5d1" stroke="#755a43" strokeWidth="2"/>
      </g>
      
      {/* Hourglass */}
      <g transform="translate(190, 60)">
        <path d="M -8 -12 L 8 -12 L 5 -2 L 1 0 L 5 2 L 8 12 L -8 12 L -5 2 L -1 0 L -5 -2 Z" fill="#b0dce8" opacity="0.4" stroke="#ffffff" strokeWidth="0.5"/>
        <polygon points="-4,-10 4,-10 1,-2 -1,-2" fill="#3bb4c2" opacity="0.9"/>
      </g>
      
      <style>{`
        #fm-head { animation: fm-head-twitch 0.15s infinite; }
        @keyframes fm-head-twitch {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(-3px, 2px) rotate(-2deg); }
          40% { transform: translate(3px, -1px) rotate(3deg); }
          60% { transform: translate(-2px, 3px) rotate(-1deg); }
          80% { transform: translate(2px, -2px) rotate(2deg); }
        }
      `}</style>
    </svg>
  );
}
