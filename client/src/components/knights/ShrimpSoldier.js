import React from 'react';

// Shrimp Soldier - Tactical Swarm Unit
export default function ShrimpSoldier({ size = 400, className = "", animated = true }) {
  return (
    <svg 
      viewBox="0 0 800 1200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size * 1.5 }}
    >
      <defs>
        <linearGradient id="sh-armorMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8b6cc" />
          <stop offset="40%" stopColor="#e889a6" />
          <stop offset="100%" stopColor="#ba5372" />
        </linearGradient>
        <linearGradient id="sh-armorDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e37b9a" />
          <stop offset="100%" stopColor="#9a3e58" />
        </linearGradient>
        <linearGradient id="sh-armorHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffdeeb" />
          <stop offset="100%" stopColor="#e889a6" />
        </linearGradient>
        <linearGradient id="sh-leather" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8a5c3e" />
          <stop offset="50%" stopColor="#5c3822" />
          <stop offset="100%" stopColor="#3d2212" />
        </linearGradient>
        <linearGradient id="sh-skinBase" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d6b9bc" />
          <stop offset="50%" stopColor="#ebd5d7" />
          <stop offset="100%" stopColor="#b89a9e" />
        </linearGradient>
        <linearGradient id="sh-skinDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4a5a8" />
          <stop offset="100%" stopColor="#99787c" />
        </linearGradient>
        <linearGradient id="sh-bedroll" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d1c4b2" />
          <stop offset="50%" stopColor="#a89b88" />
          <stop offset="100%" stopColor="#7a6e5b" />
        </linearGradient>
        <filter id="sh-dropShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.25"/>
        </filter>
      </defs>
      
      {/* Backpack */}
      <g filter="url(#sh-dropShadow)">
        <path d="M 460 410 L 610 430 L 630 630 C 630 660 600 680 570 680 L 460 670 Z" fill="url(#sh-leather)" />
        <path d="M 580 560 L 640 570 L 640 660 C 640 670 610 680 580 670 Z" fill="#6e462c" />
        <rect x="520" y="430" width="15" height="240" fill="#3d2212" />
      </g>
      
      {/* Legs */}
      <g>
        <path d="M 460 700 L 490 870" stroke="url(#sh-skinDark)" strokeWidth="16" strokeLinecap="round" fill="none" />
        <circle cx="490" cy="870" r="12" fill="url(#sh-skinDark)" />
        <path d="M 400 700 L 400 890" stroke="url(#sh-skinBase)" strokeWidth="18" strokeLinecap="round" fill="none" />
        <circle cx="400" cy="890" r="14" fill="url(#sh-skinBase)" />
        <path d="M 400 890 L 410 1020" stroke="url(#sh-skinBase)" strokeWidth="16" strokeLinecap="round" fill="none" />
      </g>
      
      {/* Body/Armor */}
      <g filter="url(#sh-dropShadow)">
        <path d="M 400 450 C 440 430 480 430 500 450 C 510 500 500 580 470 600 L 450 640 L 430 600 C 410 580 390 500 400 450 Z" fill="url(#sh-armorMain)" />
        <path d="M 450 440 L 450 640" stroke="#ba5372" strokeWidth="4" fill="none" />
        <circle cx="410" cy="460" r="2" fill="#ffdeeb" />
        <circle cx="490" cy="460" r="2" fill="#ffdeeb" />
      </g>
      
      {/* Head */}
      <g filter="url(#sh-dropShadow)">
        <path d="M 470 380 C 490 310 450 240 400 220 C 350 200 300 190 280 190 C 310 215 340 240 360 270 C 380 300 400 340 410 380 Z" fill="url(#sh-armorMain)" />
        
        {/* Antenna */}
        <path d="M 320 210 C 270 120 180 110 130 160" stroke="url(#sh-skinDark)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 350 210 C 360 90 480 80 540 140" stroke="url(#sh-skinBase)" strokeWidth="5" strokeLinecap="round" fill="none" />
        
        {/* Eyes */}
        <circle cx="370" cy="300" r="42" fill="#594115" />
        <circle cx="370" cy="300" r="38" fill="#d4b46a" />
        <circle cx="445" cy="295" r="33" fill="#d4b46a" />
        <ellipse cx="360" cy="285" rx="12" ry="8" fill="#ffffff" opacity="0.6" transform="rotate(-30, 360, 285)" />
        <ellipse cx="438" cy="282" rx="10" ry="6" fill="#ffffff" opacity="0.6" transform="rotate(-30, 438, 282)" />
      </g>
      
      {/* Arm */}
      <g>
        <path d="M 380 500 L 350 600" stroke="url(#sh-skinBase)" strokeWidth="16" strokeLinecap="round" fill="none" />
        <circle cx="350" cy="600" r="12" fill="url(#sh-skinBase)" />
      </g>
      
      {/* Rifle/Weapon */}
      <rect x="270" y="280" width="16" height="820" fill="url(#sh-leather)" />
      <path d="M 265 280 L 291 280 L 288 230 L 268 230 Z" fill="#838e99" />
      <path d="M 278 230 L 278 100 L 268 120 L 278 40 L 288 120 L 278 100" fill="#838e99" stroke="#4e5863" strokeWidth="2" />
      
      {/* Shadow */}
      <ellipse cx="430" cy="1100" rx="160" ry="20" fill="#000000" opacity="0.15" filter="blur(5px)" />
      
      <style>{`
        .sh-character { transform-origin: 340px 1050px; }
        .sh-head-group { transform-origin: 410px 380px; }
      `}</style>
    </svg>
  );
}
