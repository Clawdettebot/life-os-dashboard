import React from 'react';

// Knowledge Knaight - Iridescent Crab Knight (Knowledge Keeper)
export default function KnowledgeKnaight({ size = 400, className = "", animated = true }) {
  return (
    <svg 
      viewBox="0 0 800 1200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size * 1.5 }}
    >
      <defs>
        <linearGradient id="ic-iri1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffc4d9"/>
          <stop offset="20%" stopColor="#bce6eb"/>
          <stop offset="45%" stopColor="#e2f0cb"/>
          <stop offset="70%" stopColor="#d9c2f0"/>
          <stop offset="100%" stopColor="#fceda1"/>
        </linearGradient>
        <linearGradient id="ic-iri2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a1d6d9"/>
          <stop offset="35%" stopColor="#f5b8c9"/>
          <stop offset="65%" stopColor="#dcf0c0"/>
          <stop offset="100%" stopColor="#c6baf5"/>
        </linearGradient>
        <linearGradient id="ic-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff5b5"/>
          <stop offset="40%" stopColor="#dfb938"/>
          <stop offset="100%" stopColor="#a88514"/>
        </linearGradient>
        <linearGradient id="ic-pink-heart" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffb3d9"/>
          <stop offset="100%" stopColor="#e66eb4"/>
        </linearGradient>
      </defs>
      
      {/* Legs */}
      <g>
        <path d="M 270 650 C 250 700, 250 750, 290 800 L 370 760 C 370 700, 350 670, 330 650 Z" fill="url(#ic-iri1)" />
        <path d="M 530 650 C 550 700, 550 750, 510 800 L 430 760 C 430 700, 450 670, 470 650 Z" fill="url(#ic-iri2)" />
        
        {/* Lower legs */}
        <path d="M 290 810 C 250 880, 260 980, 240 1080 C 280 1100, 340 1080, 340 1030 C 360 950, 360 880, 360 810 Z" fill="url(#ic-iri2)" />
        <path d="M 510 810 C 550 880, 540 980, 560 1080 C 520 1100, 460 1080, 460 1030 C 440 950, 440 880, 440 810 Z" fill="url(#ic-iri1)" />
        
        {/* Feet */}
        <path d="M 240 1060 C 200 1100, 230 1150, 300 1130 L 330 1050 C 290 1070, 260 1070, 240 1060 Z" fill="url(#ic-gold)" />
        <path d="M 560 1060 C 600 1100, 570 1150, 500 1130 L 470 1050 C 510 1070, 540 1070, 560 1060 Z" fill="url(#ic-iri1)" />
      </g>
      
      {/* Body/Torso */}
      <g>
        <path d="M 280 320 C 250 380, 260 490, 400 480 C 540 490, 550 380, 520 320 Z" fill="url(#ic-gold)" />
        <path d="M 300 360 C 340 330, 400 330, 410 360 C 380 350, 320 350, 300 360 Z" fill="#ffffff" opacity="0.4" />
        
        {/* Heart emblem */}
        <path d="M 400 400 C 400 400, 360 360, 380 340 C 400 320, 400 360, 400 360 C 400 360, 400 320, 420 340 C 440 360, 400 400, 400 400 Z" fill="url(#ic-pink-heart)" />
      </g>
      
      {/* Arms */}
      <g>
        <path d="M 170 340 L 130 300 C 130 300, 150 240, 180 270 Z" fill="url(#ic-iri1)" />
        <path d="M 230 300 L 190 260 C 190 260, 220 210, 250 240 Z" fill="url(#ic-iri2)" />
        <path d="M 310 300 C 180 260, 110 380, 130 500 C 200 500, 270 450, 290 400 Z" fill="url(#ic-iri1)" />
        
        <path d="M 630 340 L 670 300 C 670 300, 650 240, 620 270 Z" fill="url(#ic-iri2)" />
        <path d="M 570 300 L 610 260 C 610 260, 580 210, 550 240 Z" fill="url(#ic-iri1)" />
        <path d="M 490 300 C 620 260, 690 380, 670 500 C 600 500, 530 450, 510 400 Z" fill="url(#ic-iri2)" />
      </g>
      
      {/* Head */}
      <g>
        <path d="M 310 190 C 310 290, 490 290, 490 190 Z" fill="#8a5a44" stroke="#2a2a2e" strokeWidth="3"/>
        
        {/* Eyes */}
        <ellipse cx="360" cy="225" rx="20" ry="28" fill="#2b1408" />
        <path d="M 340 210 Q 360 190 380 210" fill="none" stroke="#2a2a2e" strokeWidth="4" strokeLinecap="round" />
        <circle cx="365" cy="210" r="8" fill="white" />
        <circle cx="350" cy="235" r="4" fill="white" />
        
        <ellipse cx="440" cy="225" rx="20" ry="28" fill="#2b1408" />
        <path d="M 420 210 Q 440 190 460 210" fill="none" stroke="#2a2a2e" strokeWidth="4" strokeLinecap="round" />
        <circle cx="445" cy="210" r="8" fill="white" />
        <circle cx="430" cy="235" r="4" fill="white" />
        
        {/* Blush */}
        <ellipse cx="335" cy="245" rx="14" ry="9" fill="#ff99cc" opacity="0.6" />
        <ellipse cx="465" cy="245" rx="14" ry="9" fill="#ff99cc" opacity="0.6" />
        
        {/* Mouth */}
        <path d="M 398 255 L 402 255" stroke="#5e3827" strokeWidth="4" strokeLinecap="round" />
        <path d="M 385 270 Q 400 285 415 270" fill="none" stroke="#2b1408" strokeWidth="3" strokeLinecap="round" />
      </g>
      
      {/* Antenna */}
      <g>
        <path d="M 370 100 C 340 40, 310 20, 290 10" stroke="#2a2a2e" strokeWidth="18" strokeLinecap="round" fill="none" />
        <path d="M 370 100 C 340 40, 310 20, 290 10" stroke="url(#ic-iri2)" strokeWidth="12" strokeLinecap="round" fill="none" />
        <circle cx="290" cy="10" r="22" fill="#e094c8" stroke="#2a2a2e" strokeWidth="3" />
        <circle cx="282" cy="5" r="6" fill="white" opacity="0.6" />
        
        <path d="M 430 100 C 460 40, 490 20, 510 10" stroke="#2a2a2e" strokeWidth="18" strokeLinecap="round" fill="none" />
        <path d="M 430 100 C 460 40, 490 20, 510 10" stroke="url(#ic-iri1)" strokeWidth="12" strokeLinecap="round" fill="none" />
        <circle cx="510" cy="10" r="22" fill="#e094c8" stroke="#2a2a2e" strokeWidth="3" />
        <circle cx="502" cy="5" r="6" fill="white" opacity="0.6" />
      </g>
      
      {/* Hair/Braid */}
      <g>
        <path d="M 310 250 Q 290 320 310 400 Q 315 420 310 440" stroke="#e094c8" strokeWidth="8" strokeLinecap="round" fill="none"/>
        <path d="M 290 270 Q 270 330 290 390" stroke="#e094c8" strokeWidth="8" strokeLinecap="round" fill="none"/>
        <path d="M 490 250 Q 510 320 490 400 Q 485 420 490 440" stroke="#e094c8" strokeWidth="8" strokeLinecap="round" fill="none"/>
        <path d="M 510 270 Q 530 330 510 390" stroke="#e094c8" strokeWidth="8" strokeLinecap="round" fill="none"/>
      </g>
      
      <style>{`
        .ic-eye-l { transform-origin: 360px 225px; animation: ic-blink 5s infinite; }
        .ic-eye-r { transform-origin: 440px 225px; animation: ic-blink 5s infinite; }
        @keyframes ic-blink {
          0%, 94%, 100% { transform: scaleY(1); }
          97% { transform: scaleY(0.1); }
        }
      `}</style>
    </svg>
  );
}
