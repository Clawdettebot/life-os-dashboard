import React from 'react';

export default function RoundTableBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #082026 0%, #0d2e33 50%, #082026 100%)',
      }}
    >
      {/* Ocean gradient overlay */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(77,186,181,0.3) 0%, transparent 60%)'
        }}
      />

      {/* God rays from top */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[40%] h-full bg-gradient-to-b from-yellow-100/15 to-transparent transform -rotate-12 translate-x-[-10%]" />
        <div className="absolute top-0 left-[30%] w-[50%] h-full bg-gradient-to-b from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-b from-cyan-100/10 to-transparent transform rotate-6 translate-x-[10%]" />
      </div>

      {/* Floating particles (plankton/bubbles) */}
      <div className="absolute inset-0">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse blur-[1px]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1.5}px`,
              height: `${Math.random() * 3 + 1.5}px`,
              background: i % 3 === 0 ? '#ffd166' : i % 3 === 1 ? '#8affda' : '#4dbab5',
              opacity: Math.random() * 0.4 + 0.2,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 6 + 4}s`
            }}
          />
        ))}
      </div>

      {/* Underwater landscape (Full scene end-to-end) */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
        {/* Deep background corals */}
        <svg viewBox="0 0 100 50" className="absolute bottom-0 left-0 w-[25%] h-32 opacity-20 transform translate-x-[-5%]" preserveAspectRatio="none">
          <path d="M0,50 Q15,20 30,35 Q45,10 60,30 Q75,15 90,40 Q100,25 100,50 Z" fill="#13363d" />
        </svg>
        <svg viewBox="0 0 100 50" className="absolute bottom-0 right-0 w-[30%] h-36 opacity-15 transform translate-x-[10%]" preserveAspectRatio="none">
          <path d="M0,50 Q20,15 40,35 Q60,5 80,30 Q100,10 100,50 Z" fill="#0e2a30" />
        </svg>

        {/* Midground corals */}
        <svg viewBox="0 0 100 50" className="absolute bottom-0 left-[15%] w-[35%] h-40 opacity-30" preserveAspectRatio="none">
          <path d="M0,50 Q25,10 50,35 Q75,5 100,30 Q100,50 100,50 L0,50 Z" fill="#143e4a" />
        </svg>
        <svg viewBox="0 0 100 50" className="absolute bottom-0 right-[10%] w-[40%] h-32 opacity-25" preserveAspectRatio="none">
          <path d="M0,50 Q20,25 40,40 Q60,15 85,35 Q100,20 100,50 Z" fill="#1b4d5c" />
        </svg>

        {/* Foreground prominent corals */}
        <svg viewBox="0 0 100 50" className="absolute bottom-[-10px] left-[-3%] w-[45%] h-44 opacity-40 filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]" preserveAspectRatio="none">
          <path d="M0,50 Q15,5 35,35 Q55,-10 75,30 Q90,5 100,50 Z" fill="#0a1d21" />
        </svg>
        <svg viewBox="0 0 100 50" className="absolute bottom-[-15px] right-[-5%] w-[50%] h-48 opacity-45 transform scale-x-[-1]" preserveAspectRatio="none">
          <path d="M0,50 Q20,10 40,40 Q60,-5 85,30 Q100,15 100,50 Z" fill="#08181b" />
        </svg>
      </div>

      {/* Surface caustic shimmer effect */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64 opacity-20 pointer-events-none"
        style={{
          background: 'linear-gradient(0deg, #0a1d21 0%, rgba(77,186,181,0.2) 50%, transparent 100%)',
          mixBlendMode: 'screen'
        }}
      />

      {/* Vignette for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 250px rgba(0,0,0,0.6)' }} />
    </div>
  );
}

<style>{`
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  .animate-float { animation: float 8s ease-in-out infinite; }
`}</style>
