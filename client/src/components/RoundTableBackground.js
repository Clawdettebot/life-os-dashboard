import React from 'react';

export default function RoundTableBackground() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        backgroundImage: 'url(/round-table-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)'
        }}
      />
      
      {/* Character overlay - centered with glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '55%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          height: '70vh',
          filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.4)) drop-shadow(0 0 60px rgba(255, 180, 0, 0.2))',
          zIndex: 1
        }}
      >
        <img
          src="/round-table-character.png"
          alt="Character"
          style={{
            height: '100%',
            width: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>
      
      {/* Additional vignette for depth */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ boxShadow: 'inset 0 0 200px rgba(0,0,0,0.7)' }} 
      />
    </div>
  );
}
