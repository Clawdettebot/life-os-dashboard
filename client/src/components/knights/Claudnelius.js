import React from 'react';

// Claudnelius - Eldritch Wizard (Code Magician)
export default function Claudnelius({ size = 400, className = "", animated = true }) {
  return (
    <svg 
      viewBox="0 0 800 1200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size * 1.5 }}
    >
      <defs>
        <filter id="ew-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur1" />
          <feGaussianBlur stdDeviation="15" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="ew-bronze" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4a3b2c" />
          <stop offset="50%" stopColor="#8a7354" />
          <stop offset="100%" stopColor="#3d3023" />
        </linearGradient>
        <linearGradient id="ew-book-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#4df2ff" />
          <stop offset="100%" stopColor="#148e99" />
        </linearGradient>
      </defs>
      
      <circle cx="400" cy="500" r="400" fill="#ffffff" opacity="0.1" filter="url(#ew-glow)" />
      
      {/* Cloak */}
      <path d="M 320 350 C 150 600 80 900 40 1130 C 60 1110 90 1115 100 1080 C 110 1120 140 1140 160 1100 C 170 1130 200 1130 230 1090 C 240 1110 260 1110 280 1080 C 300 1100 320 1090 330 1060 L 320 350 Z" fill="#111317" />
      <path d="M 480 350 C 650 600 720 900 760 1130 C 740 1110 710 1115 700 1080 C 690 1120 660 1140 640 1100 C 630 1130 600 1130 570 1090 C 560 1110 540 1110 520 1080 C 500 1100 480 1090 470 1060 L 480 350 Z" fill="#111317" />
      
      {/* Staff */}
      <rect x="238" y="280" width="14" height="800" fill="#1b1d22" />
      <polygon points="238,1080 252,1080 252,1120 245,1160 238,1120" fill="url(#ew-bronze)" />
      
      {/* Book */}
      <polygon points="410,540 540,610 510,690 380,620" fill="#2d2218" />
      <polygon points="415,550 545,615 515,680 385,615" fill="url(#ew-book-glow)" filter="url(#ew-glow)" />
      
      {/* Robe body */}
      <path d="M 330 500 L 470 500 L 530 820 C 510 800 500 840 480 810 C 470 830 450 850 430 820 C 410 860 380 890 360 840 C 340 860 320 840 300 800 L 270 810 Z" fill="#13161c" />
      
      {/* Head/Hood */}
      <path d="M 360 280 L 440 280 L 420 550 L 380 550 Z" fill="#0d0f12" />
      <path d="M 380 500 C 390 600 360 700 350 800 L 330 780 C 350 650 360 550 360 500 Z" fill="#090b0e" opacity="0.7"/>
      <path d="M 420 500 C 410 600 440 700 450 800 L 470 780 C 450 650 440 550 440 500 Z" fill="#090b0e" opacity="0.7"/>
      
      {/* Eyes */}
      <g filter="url(#ew-glow)">
        <ellipse cx="388" cy="215" rx="5" ry="3" fill="#ffffff" />
        <ellipse cx="412" cy="215" rx="5" ry="3" fill="#ffffff" />
        <ellipse cx="388" cy="215" rx="7" ry="5" fill="#4df2ff" opacity="0.6" />
        <ellipse cx="412" cy="215" rx="7" ry="5" fill="#4df2ff" opacity="0.6" />
        <path d="M 400 190 L 400 205 M 395 195 L 405 195" stroke="#4df2ff" strokeWidth="2" fill="none" />
      </g>
      
      {/* Crown/Hat */}
      <path d="M 375 200 L 425 200 L 420 240 Q 400 265 380 240 Z" fill="#4a2c1a" />
      <rect x="385" y="240" width="30" height="40" fill="#3a2214" />
      
      {/* Floating runes */}
      <g className={animated ? "ew-rune-glow" : ""} fill="none" stroke="#4df2ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 345 980 L 355 990 L 350 1010 L 360 1020 M 350 1010 L 340 1020" />
        <path d="M 465 990 L 455 1000 L 460 1020 L 450 1030 M 460 1020 L 470 1030" />
        <circle cx="355" cy="965" r="3" fill="#4df2ff" />
        <circle cx="345" cy="1115" r="2" fill="#4df2ff" />
      </g>
      
      {/* Floating particles */}
      <g filter="url(#ew-glow)" fill="#4df2ff">
        <circle cx="430" cy="520" r="2.5" />
        <circle cx="460" cy="500" r="1.5" />
        <circle cx="490" cy="530" r="3" />
      </g>
      
      {/* Book glow runes */}
      <g fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.8">
        <path d="M 430 560 L 480 585 M 425 570 L 460 588 M 420 580 L 490 615" />
        <circle cx="475" cy="595" r="5" stroke="#4df2ff" />
      </g>
      
      {/* Familiar (cat/creature) */}
      <g>
        <path d="M 520 230 C 500 180 560 170 570 220 C 580 240 550 250 520 230 Z" fill="#36294a" />
        <circle cx="535" cy="215" r="4" fill="#111" />
        <circle cx="555" cy="215" r="4" fill="#111" />
        <circle cx="534" cy="214" r="1.5" fill="#4df2ff" />
        <circle cx="554" cy="214" r="1.5" fill="#4df2ff" />
        <g fill="none" stroke="#36294a" strokeWidth="7" strokeLinecap="round">
          <path d="M 525 235 Q 490 260 500 290" />
          <path d="M 540 235 Q 530 280 560 290" />
          <path d="M 555 230 Q 580 260 590 230" />
        </g>
      </g>
      
      <style>{`
        .ew-rune-glow {
          animation: ew-pulse-glow 3s infinite alternate ease-in-out;
        }
        @keyframes ew-pulse-glow {
          0% { opacity: 0.5; filter: brightness(0.8); }
          100% { opacity: 1; filter: brightness(1.3); }
        }
      `}</style>
    </svg>
  );
}
