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
        <div className="absolute top-0 left-1/4 w-96 h-full bg-gradient-to-b from-yellow-100/10 to-transparent transform -rotate-12" />
        <div className="absolute top-0 right-1/3 w-64 h-full bg-gradient-to-b from-cyan-100/8 to-transparent transform rotate-6" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-full bg-gradient-to-b from-white/5 to-transparent" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: i % 3 === 0 ? '#ffd166' : i % 3 === 1 ? '#8affda' : '#4dbab5',
              opacity: Math.random() * 0.5 + 0.3,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 4 + 6}s`
            }}
          />
        ))}
      </div>

      {/* Coral silhouettes at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-30">
        <svg viewBox="0 0 100 50" className="absolute bottom-0 left-[10%] w-32 h-24" preserveAspectRatio="none">
          <path d="M10,50 Q20,20 30,35 Q40,10 50,30 Q60,15 70,40 Q80,25 90,50 Z" fill="#13363d" />
        </svg>
        <svg viewBox="0 0 100 50" className="absolute bottom-0 left-[30%] w-48 h-32" preserveAspectRatio="none">
          <path d="M10,50 Q25,15 40,35 Q55,5 70,30 Q85,10 100,50 Z" fill="#0e2a30" />
        </svg>
        <svg viewBox="0 0 100 50" className="absolute bottom-0 right-[15%] w-40 h-28" preserveAspectRatio="none">
          <path d="M10,50 Q20,20 35,40 Q50,10 65,35 Q80,20 95,50 Z" fill="#143e4a" />
        </svg>
      </div>

      {/* Floor gradient */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-48"
        style={{
          background: 'linear-gradient(to top, #0a1d21 0%, transparent 100%)'
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 200px rgba(0,0,0,0.5)' }} />
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
