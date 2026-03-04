import React from 'react';

// Sir Clawthchilds - Bull Market Warrior (Finances)
export default function SirClawthchilds({ size = 400, className = "", animated = true }) {
  return (
    <svg 
      viewBox="0 0 800 1200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size * 1.5 }}
    >
      <defs>
        <linearGradient id="bm-tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#328e8b"/>
          <stop offset="50%" stopColor="#1d5c5a"/>
          <stop offset="100%" stopColor="#0f3d3c"/>
        </linearGradient>
        <linearGradient id="bm-goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a"/>
          <stop offset="30%" stopColor="#d97706"/>
          <stop offset="70%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#713f12"/>
        </linearGradient>
        <linearGradient id="bm-hornGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14532d"/>
          <stop offset="40%" stopColor="#22c55e"/>
          <stop offset="80%" stopColor="#4ade80"/>
          <stop offset="100%" stopColor="#166534"/>
        </linearGradient>
        <linearGradient id="bm-skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5c3a21"/>
          <stop offset="100%" stopColor="#2d1a11"/>
        </linearGradient>
        <radialGradient id="bm-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0"/>
        </radialGradient>
      </defs>
      
      <g id="bm-shadow">
        <ellipse cx="400" cy="1130" rx="350" ry="30" fill="#cbd5e1" />
        <ellipse cx="400" cy="1130" rx="200" ry="15" fill="#94a3b8" />
      </g>
      
      <g id="bm-under-armor">
        <path d="M 280 750 L 520 750 L 560 950 L 400 900 L 240 950 Z" fill="#0f172a" />
        <path d="M 180 400 L 100 550 L 180 600 L 250 450 Z" fill="#0f172a" />
        <path d="M 620 400 L 700 550 L 620 600 L 550 450 Z" fill="#0f172a" />
      </g>
      
      <g id="bm-boots">
        <path d="M 220 880 C 280 850 320 850 360 880 L 380 1120 C 300 1150 200 1150 180 1120 Z" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="4"/>
        <ellipse cx="290" cy="870" rx="50" ry="40" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="6"/>
        <path d="M 440 880 C 480 850 520 850 580 880 L 620 1120 C 600 1150 500 1150 420 1120 Z" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="4"/>
        <ellipse cx="510" cy="870" rx="50" ry="40" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="6"/>
      </g>
      
      <g id="bm-waist">
        <path d="M 200 650 L 600 650 L 630 830 L 170 830 Z" fill="url(#bm-tealGrad)" />
        <rect x="180" y="680" width="130" height="120" rx="8" fill="url(#bm-goldGrad)" stroke="#451a03" strokeWidth="3"/>
        <rect x="335" y="690" width="130" height="130" rx="8" fill="url(#bm-goldGrad)" stroke="#451a03" strokeWidth="3"/>
        <rect x="490" y="680" width="130" height="120" rx="8" fill="url(#bm-goldGrad)" stroke="#451a03" strokeWidth="3"/>
        <circle cx="400" cy="670" r="45" fill="url(#bm-goldGrad)" stroke="#451a03" strokeWidth="2"/>
        <circle cx="400" cy="670" r="30" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="4"/>
        <circle cx="400" cy="670" r="10" fill="url(#bm-goldGrad)" />
      </g>
      
      <g id="bm-torso">
        <path d="M 230 460 C 400 550 570 460 570 460 L 590 660 C 400 730 210 660 210 660 Z" fill="url(#bm-tealGrad)" />
        <path d="M 250 320 C 400 400 550 320 550 320 L 570 480 C 400 560 230 480 230 480 Z" fill="url(#bm-tealGrad)" />
      </g>
      
      <g id="bm-pearls" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1">
        <circle cx="340" cy="530" r="7"/><circle cx="330" cy="545" r="7"/><circle cx="323" cy="560" r="7"/>
        <circle cx="318" cy="576" r="7"/><circle cx="316" cy="593" r="7"/><circle cx="317" cy="610" r="7"/>
      </g>
      
      <g id="bm-shoulders">
        <path d="M 100 450 C 70 250 280 230 320 380 C 220 440 120 470 100 450 Z" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="8"/>
        <path d="M 700 450 C 730 250 520 230 480 380 C 580 440 680 470 700 450 Z" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="8"/>
        <circle cx="280" cy="350" r="4" fill="#fff" opacity="0.6"/>
        <circle cx="520" cy="350" r="4" fill="#fff" opacity="0.6"/>
      </g>
      
      <g id="bm-gauntlets">
        <path d="M 70 520 L 200 580 L 230 680 L 100 680 Z" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="3"/>
        <path d="M 730 520 L 600 580 L 570 680 L 700 680 Z" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="3"/>
      </g>
      
      <g id="bm-head">
        <path d="M 310 250 C 30 200, 120 -80, 380 20 C 280 10, 230 100, 380 160 Z" fill="url(#bm-hornGrad)" stroke="#064e3b" strokeWidth="4"/>
        <path d="M 490 250 C 770 200, 680 -80, 420 20 C 520 10, 570 100, 420 160 Z" fill="url(#bm-hornGrad)" stroke="#064e3b" strokeWidth="4"/>
        <rect x="350" y="250" width="100" height="90" rx="20" fill="url(#bm-skinGrad)" />
        <path d="M 360 275 Q 380 285 400 290 Q 420 285 440 275" fill="none" stroke="#1c100b" strokeWidth="6" strokeLinecap="round"/>
        <circle cx="375" cy="295" r="2" fill="#000"/>
        <circle cx="425" cy="295" r="2" fill="#000"/>
        <path d="M 395 305 L 400 320 L 405 305" fill="#1c100b"/>
        <path d="M 380 335 Q 400 325 420 335" fill="none" stroke="#1c100b" strokeWidth="4" strokeLinecap="round"/>
        <path d="M 310 270 C 310 110 490 110 490 270 Q 400 220 310 270 Z" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="3"/>
        <path d="M 310 250 L 360 360 L 310 380 Z" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="4"/>
        <path d="M 490 250 L 440 360 L 490 380 Z" fill="url(#bm-tealGrad)" stroke="url(#bm-goldGrad)" strokeWidth="4"/>
      </g>
      
      <g id="bm-money-bag">
        <path d="M 180 520 C 230 500 250 500 280 530 L 290 580 L 170 580 Z" fill="#d1caa9" />
        <path d="M 170 570 C 30 630 70 820 220 840 C 370 820 400 630 290 570 Z" fill="#e2e0d3" stroke="#a8a28e" strokeWidth="2"/>
        <rect x="470" y="510" width="240" height="50" rx="15" fill="#e2e0d3" stroke="#879e89" strokeWidth="2"/>
        <circle cx="470" cy="535" r="25" fill="url(#bm-goldGrad)" stroke="#713f12" strokeWidth="2"/>
        <circle cx="710" cy="535" r="25" fill="url(#bm-goldGrad)" stroke="#713f12" strokeWidth="2"/>
        <circle cx="580" cy="540" r="35" fill="url(#bm-skinGrad)" />
      </g>
      
      <g id="bm-scroll">
        <path d="M 500 550 L 680 550 C 690 700 640 850 720 980 L 520 950 C 500 800 540 650 500 550 Z" fill="#b0c4b1" stroke="#879e89" strokeWidth="3"/>
        <polyline points="530,650 550,600 580,680 620,620 650,700 600,750 630,680" fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      </g>
      
      <g fill="#4ade80" fontFamily="monospace" fontSize="10" fontWeight="bold" opacity="0.9">
        <text x="545" y="605" transform="rotate(5 545 605)">+24.5%</text>
        <text x="590" y="660" transform="rotate(5 590 660)">VOL: 9M</text>
        <text x="555" y="725" transform="rotate(5 555 725)">-1.2%</text>
      </g>
    </svg>
  );
}
