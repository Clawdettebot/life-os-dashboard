import React from 'react';

// Knowledge Knaight - Crab Knight (Orange/Gold)
// Using the SVG code provided by user
export default function KnowledgeKnaight({ size = 400, className = "", animated = true }) {
  return (
    <svg 
      viewBox="0 0 500 900" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size * 1.8 }}
    >
      <defs>
        <linearGradient id="kk-armor-grad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFB37C" />
          <stop offset="25%" stopColor="#E86A17" />
          <stop offset="70%" stopColor="#993800" />
          <stop offset="100%" stopColor="#4A1A00" />
        </linearGradient>
        <linearGradient id="kk-armor-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C25200" />
          <stop offset="100%" stopColor="#331100" />
        </linearGradient>
        <radialGradient id="kk-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1"/>
          <stop offset="30%" stopColor="#FFE066" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#D86018" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="kk-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE885"/>
          <stop offset="50%" stopColor="#B8860B"/>
          <stop offset="100%" stopColor="#5C4300"/>
        </linearGradient>
        <linearGradient id="kk-tablet-screen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#88F09D" />
          <stop offset="50%" stopColor="#28A745" />
          <stop offset="100%" stopColor="#0E4D1C" />
        </linearGradient>
      </defs>

      {/* Knight Group with Idle Animation - NO BACKGROUND */}
      <g className={animated ? "kk-knight-idle" : ""}>
        {/* Undersuit & Skin */}
        <path d="M 210,420 C 190,500 170,600 170,680 L 200,680 C 210,600 220,500 240,420 Z" fill="#2A2422" />
        <path d="M 175,550 Q 185,570 195,560" stroke="#110F0E" strokeWidth="2" fill="none"/>
        <path d="M 320,480 Q 310,500 300,490" stroke="#110F0E" strokeWidth="2" fill="none"/>
        <path d="M 325,550 Q 315,570 305,560" stroke="#110F0E" strokeWidth="2" fill="none"/>
        
        {/* Arms Undersuit */}
        <path d="M 170,220 C 140,280 110,340 100,380 L 140,380 C 150,340 170,280 190,220 Z" fill="#2A2422" />
        <path d="M 330,220 C 360,280 390,340 400,380 L 360,380 C 350,340 330,280 310,220 Z" fill="#2A2422" />
        
        {/* Neck & Face */}
        <path d="M 220,110 L 280,110 L 270,180 L 230,180 Z" fill="#2A1B12" />
        <polygon points="230,110 270,110 260,165 240,165" fill="#5C3A21" />
        
        {/* Eyes */}
        <path d="M 233,121 Q 240,120 246,123" stroke="#1A0F09" strokeWidth="2" fill="none" />
        <path d="M 254,123 Q 260,120 267,121" stroke="#1A0F09" strokeWidth="2" fill="none" />
        <path d="M 235,125 Q 240,122 245,125 Q 240,127 235,125" fill="#FFFFFF" />
        <circle cx="240" cy="125" r="1.5" fill="#000" />
        <path d="M 255,125 Q 260,122 265,125 Q 260,127 255,125" fill="#FFFFFF" />
        <circle cx="260" cy="125" r="1.5" fill="#000" />
        
        {/* Helmet Back Flair */}
        <path d="M 190,140 C 180,180 170,200 160,220 C 190,190 210,160 230,150 Z" fill="url(#kk-armor-dark)" />
        <path d="M 310,140 C 320,180 330,200 340,220 C 310,190 290,160 270,150 Z" fill="url(#kk-armor-dark)" />
        
        {/* Left Shoulder */}
        <path d="M 180,160 C 120,140 70,170 60,240 C 90,200 140,230 150,230 Z" fill="url(#kk-armor-dark)" />
        <path d="M 190,175 C 130,155 60,190 50,260 C 80,220 140,250 160,250 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1"/>
        <path d="M 170,210 C 110,190 50,230 40,300 C 80,260 130,280 150,280 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1"/>
        
        {/* Left Shoulder Spikes */}
        <path d="M 120,165 Q 110,130 90,110 Q 100,150 100,175 Z" fill="url(#kk-armor-grad)" />
        <path d="M 80,185 Q 60,160 30,140 Q 50,180 65,200 Z" fill="url(#kk-armor-grad)" />
        
        {/* Right Shoulder */}
        <path d="M 320,160 C 380,140 430,170 440,240 C 410,200 360,230 350,230 Z" fill="url(#kk-armor-dark)" />
        <path d="M 310,175 C 370,155 440,190 450,260 C 420,220 360,250 340,250 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1"/>
        <path d="M 330,210 C 390,190 450,230 460,300 C 420,260 370,280 350,280 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1"/>
        
        {/* Right Shoulder Spikes */}
        <path d="M 380,165 Q 390,130 410,110 Q 400,150 400,175 Z" fill="url(#kk-armor-grad)" />
        <path d="M 420,185 Q 440,160 470,140 Q 450,180 435,200 Z" fill="url(#kk-armor-grad)" />
        
        {/* Chest Carapace */}
        <path d="M 170,170 C 180,140 320,140 330,170 C 380,250 350,340 290,360 L 210,360 C 150,340 120,250 170,170 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1.5"/>
        
        {/* Chest Details */}
        <path d="M 250,170 Q 250,280 250,320" stroke="#8A3300" strokeWidth="2" fill="none" opacity="0.6"/>
        <path d="M 230,240 Q 250,260 270,240" stroke="#8A3300" strokeWidth="2" fill="none" opacity="0.8"/>
        <path d="M 220,270 Q 250,290 280,270" stroke="#8A3300" strokeWidth="2" fill="none" opacity="0.8"/>
        <path d="M 215,300 Q 250,320 285,300" stroke="#8A3300" strokeWidth="2" fill="none" opacity="0.8"/>
        
        {/* Crab Eyes on Chest */}
        <ellipse cx="205" cy="195" rx="12" ry="18" fill="url(#kk-gold)" transform="rotate(30 205 195)" />
        <circle cx="202" cy="188" r="4" fill="#000" />
        <circle cx="204" cy="186" r="1.5" fill="#FFF" />
        <ellipse cx="295" cy="195" rx="12" ry="18" fill="url(#kk-gold)" transform="rotate(-30 295 195)" />
        <circle cx="298" cy="188" r="4" fill="#000" />
        <circle cx="296" cy="186" r="1.5" fill="#FFF" />
        
        {/* Texture Bumps */}
        {[180, 190, 185, 165, 320, 310, 315, 335, 210, 290].map((x, i) => (
          <circle key={i} cx={x} cy={[220, 240, 270, 250, 220, 240, 270, 250, 290, 290][i]} r={i % 3 === 0 ? 4 : i % 2 === 0 ? 2.5 : 2} fill="#FFE885" opacity="0.7" />
        ))}
        
        {/* Lower Chest */}
        <path d="M 160,320 C 230,350 270,350 340,320 C 330,360 310,390 290,400 L 210,400 C 190,390 170,360 160,320 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1.5"/>
        <path d="M 180,360 C 220,380 280,380 320,360 C 310,390 290,410 280,420 L 220,420 C 210,410 190,390 180,360 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1.5"/>
        
        {/* Side Protrusions */}
        <path d="M 155,290 Q 120,290 110,310 Q 125,320 145,305 Z" fill="url(#kk-armor-dark)" stroke="#4A1A00" strokeWidth="1"/>
        <path d="M 160,320 Q 120,330 110,360 Q 130,360 150,340 Z" fill="url(#kk-armor-dark)" stroke="#4A1A00" strokeWidth="1"/>
        <path d="M 345,290 Q 380,290 390,310 Q 375,320 355,305 Z" fill="url(#kk-armor-dark)" stroke="#4A1A00" strokeWidth="1"/>
        <path d="M 340,320 Q 380,330 390,360 Q 370,360 350,340 Z" fill="url(#kk-armor-dark)" stroke="#4A1A00" strokeWidth="1"/>
        
        {/* Waist & Pelvis */}
        <path d="M 180,400 Q 250,430 320,400 L 320,430 Q 250,460 180,430 Z" fill="#3A3A3A" stroke="#1A1A1A" strokeWidth="2"/>
        <rect x="230" y="410" width="40" height="30" fill="#666" rx="5" />
        <circle cx="250" cy="425" r="12" fill="#444" stroke="#222" strokeWidth="2"/>
        <circle cx="250" cy="425" r="6" fill="#888" />
        
        {/* Hanging Chain */}
        <path d="M 210,435 Q 190,460 165,420" stroke="#888" strokeWidth="4" fill="none" strokeDasharray="6,4" />
        
        {/* Tassets */}
        <path d="M 190,430 C 190,430 150,520 180,560 C 210,540 230,480 240,440 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1"/>
        <path d="M 310,430 C 310,430 350,520 320,560 C 290,540 270,480 260,440 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1"/>
        
        {/* Center Crotch Plate */}
        <path d="M 230,440 L 270,440 L 260,500 L 250,530 L 240,500 Z" fill="url(#kk-armor-dark)" stroke="#4A1A00" strokeWidth="1"/>
        <path d="M 235,440 L 265,440 L 250,480 Z" fill="url(#kk-armor-grad)" />
        
        {/* Legs - Thigh Bases */}
        <path d="M 160,500 C 140,540 180,600 210,610 L 240,500 Z" fill="url(#kk-armor-grad)" />
        <path d="M 340,500 C 360,540 320,600 290,610 L 260,500 Z" fill="url(#kk-armor-grad)" />
        
        {/* Knee Guards */}
        <path d="M 150,580 Q 200,560 220,600 Q 200,640 150,620 Z" fill="url(#kk-armor-dark)" />
        <path d="M 170,590 Q 200,580 210,610 Q 190,630 160,610 Z" fill="url(#kk-armor-grad)" />
        <path d="M 210,605 Q 260,570 270,640 Q 220,610 210,605 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1"/>
        <path d="M 350,580 Q 300,560 280,600 Q 300,640 350,620 Z" fill="url(#kk-armor-dark)" />
        <path d="M 330,590 Q 300,580 290,610 Q 310,630 340,610 Z" fill="url(#kk-armor-grad)" />
        <path d="M 290,605 Q 240,570 230,640 Q 280,610 290,605 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1"/>
        
        {/* Shin Guards */}
        <path d="M 150,620 C 130,700 120,760 150,810 L 190,780 C 190,700 210,660 200,600 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1.5" />
        <path d="M 350,620 C 370,700 380,760 350,810 L 310,780 C 310,700 290,660 300,600 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1.5" />
        
        {/* Shin Spikes */}
        <path d="M 140,680 L 110,670 L 135,700 Z" fill="url(#kk-armor-dark)" />
        <path d="M 130,740 L 100,730 L 125,760 Z" fill="url(#kk-armor-dark)" />
        <path d="M 360,680 L 390,670 L 365,700 Z" fill="url(#kk-armor-dark)" />
        <path d="M 370,740 L 400,730 L 375,760 Z" fill="url(#kk-armor-dark)" />
        
        {/* Boots */}
        <path d="M 145,800 C 100,830 70,870 70,880 C 100,880 150,860 190,860 L 190,780 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1" />
        <path d="M 90,850 L 70,830 L 100,840 Z" fill="url(#kk-armor-grad)" />
        <path d="M 110,860 L 90,880 L 120,860 Z" fill="url(#kk-armor-grad)" />
        <path d="M 355,800 C 400,830 430,870 430,880 C 400,880 350,860 310,860 L 310,780 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1" />
        <path d="M 410,850 L 430,830 L 400,840 Z" fill="url(#kk-armor-grad)" />
        <path d="M 390,860 L 410,880 L 380,860 Z" fill="url(#kk-armor-grad)" />
        
        {/* Arms - Elbow Guards */}
        <path d="M 90,340 C 60,340 50,370 70,390 L 110,360 Z" fill="url(#kk-armor-dark)" />
        <path d="M 410,340 C 440,340 450,370 430,390 L 390,360 Z" fill="url(#kk-armor-dark)" />
        
        {/* Forearms */}
        <path d="M 80,360 C 60,420 50,460 90,480 L 140,460 C 140,430 140,400 130,360 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1.5"/>
        <path d="M 70,400 L 40,390 L 65,420 Z" fill="url(#kk-armor-grad)" />
        <path d="M 60,440 L 30,430 L 55,460 Z" fill="url(#kk-armor-grad)" />
        <path d="M 420,360 C 440,420 450,460 410,480 L 360,460 C 360,430 360,400 370,360 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1.5"/>
        <path d="M 430,400 L 460,390 L 435,420 Z" fill="url(#kk-armor-grad)" />
        <path d="M 440,440 L 470,430 L 445,460 Z" fill="url(#kk-armor-grad)" />
        
        {/* Hands Base */}
        <circle cx="100" cy="470" r="18" fill="url(#kk-armor-dark)" />
        <circle cx="400" cy="470" r="18" fill="url(#kk-armor-dark)" />
        
        {/* Props - Book (Left) */}
        <g transform="translate(40, 390) rotate(-15)">
          <rect x="0" y="0" width="55" height="100" fill="#243B52" rx="4" />
          <rect x="45" y="5" width="10" height="90" fill="#E8D8A0" />
          <rect x="5" y="0" width="40" height="100" fill="#3D638A" rx="2" />
          <rect x="8" y="3" width="34" height="94" fill="#2F4C6B" />
          <path d="M 35,40 L 45,50 L 40,60 M 25,35 L 35,45" stroke="#FFF" strokeWidth="2" fill="none" opacity="0.7"/>
          <circle cx="42" cy="50" r="3" fill="#000" />
        </g>
        
        {/* Lantern (Left) */}
        <g className={animated ? "kk-lantern-swing" : ""}>
          <circle cx="165" cy="445" r="45" fill="url(#kk-glow)" className={animated ? "kk-pulse-glow" : ""} />
          <circle cx="165" cy="445" r="20" fill="#FFF8C4" />
          <circle cx="165" cy="445" r="10" fill="#FFFFFF" />
          <path d="M 165,425 A 20,20 0 0,0 165,465" fill="none" stroke="url(#kk-gold)" strokeWidth="2.5" />
          <path d="M 165,412 L 165,400 L 160,395" stroke="#888" strokeWidth="2" fill="none" />
        </g>
        
        {/* Pouch */}
        <path d="M 175,480 C 145,510 155,560 185,560 C 215,560 225,510 195,480 Z" fill="#9C2222" />
        <circle cx="185" cy="485" r="3" fill="url(#kk-gold)" />
        
        {/* Tablet (Right) */}
        <g transform="translate(365, 380) rotate(18)">
          <rect x="0" y="0" width="65" height="110" fill="#242B2B" rx="8" />
          <rect x="3" y="3" width="59" height="104" fill="#141818" rx="6" />
          <rect x="6" y="6" width="53" height="98" fill="url(#kk-tablet-screen)" rx="4" />
          <g className={animated ? "kk-screen-ui" : ""}>
            <path d="M 15,20 L 30,35 L 25,45 M 40,20 L 50,30" stroke="#FFF" strokeWidth="2" fill="none" opacity="0.7"/>
            <circle cx="32" cy="60" r="15" stroke="#FFF" strokeWidth="1.5" fill="none" opacity="0.6"/>
          </g>
        </g>
        
        {/* Helmet */}
        <path d="M 210,130 C 190,60 230,30 250,30 C 270,30 310,60 290,130 L 275,105 L 250,140 L 225,105 Z" fill="url(#kk-armor-grad)" stroke="#4A1A00" strokeWidth="1" />
        <path d="M 240,40 Q 250,-10 250,-20 Q 250,-10 260,40 Z" fill="url(#kk-armor-grad)" />
        
        {/* Helmet Horns */}
        <path d="M 215,80 Q 180,80 160,50 Q 185,90 215,100 Z" fill="url(#kk-armor-grad)" />
        <path d="M 285,80 Q 320,80 340,50 Q 315,90 285,100 Z" fill="url(#kk-armor-grad)" />
        
        {/* Chin Guard */}
        <path d="M 225,160 L 250,185 L 275,160 Z" fill="url(#kk-armor-grad)" />
      </g>

      <style>{`
        .kk-knight-idle {
          animation: kk-breathe 3.5s ease-in-out infinite;
          transform-origin: 250px 880px;
        }
        @keyframes kk-breathe {
          0%, 100% { transform: scaleY(1) scaleX(1) translateY(0); }
          50% { transform: scaleY(1.015) scaleX(1.005) translateY(-3px); }
        }
        .kk-pulse-glow {
          animation: kk-pulseGlow 2.5s ease-in-out infinite;
          transform-origin: 165px 445px;
        }
        @keyframes kk-pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .kk-lantern-swing {
          animation: kk-swing 4s ease-in-out infinite;
          transform-origin: 165px 395px;
        }
        @keyframes kk-swing {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(3deg); }
        }
        .kk-screen-ui {
          animation: kk-flicker 4s infinite alternate;
        }
        @keyframes kk-flicker {
          0%, 100% { opacity: 0.7; }
          20% { opacity: 0.9; }
          25% { opacity: 0.4; }
          30% { opacity: 0.8; }
          70% { opacity: 0.7; }
          80% { opacity: 0.3; }
          90% { opacity: 0.9; }
        }
      `}</style>
    </svg>
  );
}
