import React from 'react';

// Mini avatar versions of the 7 knights - can be used inline throughout dashboard
// These are simplified versions for small decoration use

export const EldritchWizard = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="ew-glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4df2ff"/>
        <stop offset="100%" stopColor="#148e99"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#0a0a12"/>
    <circle cx="50" cy="40" r="20" fill="url(#ew-glow)" opacity="0.8"/>
    <ellipse cx="35" cy="55" rx="8" ry="12" fill="#4df2ff" opacity="0.9"/>
    <ellipse cx="65" cy="55" rx="8" ry="12" fill="#4df2ff" opacity="0.9"/>
    <path d="M30 80 Q50 95 70 80" stroke="#4df2ff" strokeWidth="2" fill="none"/>
  </svg>
);

export const BullMarketWarrior = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="bm-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a"/>
        <stop offset="100%" stopColor="#d97706"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#0f172a"/>
    <ellipse cx="50" cy="45" rx="18" ry="20" fill="#22c55e" opacity="0.8"/>
    <ellipse cx="40" cy="42" rx="4" ry="5" fill="#fef08a"/>
    <ellipse cx="60" cy="42" rx="4" ry="5" fill="#fef08a"/>
    <path d="M35 65 L65 65" stroke="#22c55e" strokeWidth="3"/>
    <circle cx="50" cy="75" r="8" fill="url(#bm-gold)"/>
  </svg>
);

export const CrabKnight = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="ck-orange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFB37C"/>
        <stop offset="100%" stopColor="#993800"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#1a1a12"/>
    <ellipse cx="50" cy="45" rx="25" ry="20" fill="url(#ck-orange)"/>
    <circle cx="42" cy="42" r="5" fill="#FFE066"/>
    <circle cx="58" cy="42" r="5" fill="#FFE066"/>
    <path d="M35 60 Q50 70 65 60" stroke="#FFE066" strokeWidth="2" fill="none"/>
    <path d="M25 45 L35 50 M75 45 L65 50" stroke="#FFE066" strokeWidth="2"/>
  </svg>
);

export const ShrimpKnight = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="sh-pink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8b6cc"/>
        <stop offset="100%" stopColor="#ba5372"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#1a1215"/>
    <ellipse cx="50" cy="40" rx="15" ry="18" fill="url(#sh-pink)"/>
    <circle cx="45" cy="38" r="4" fill="#fff"/>
    <circle cx="55" cy="38" r="4" fill="#fff"/>
    <circle cx="45" cy="38" r="2" fill="#000"/>
    <circle cx="55" cy="38" r="2" fill="#000"/>
    <path d="M40 55 Q50 65 60 55" stroke="#f8b6cc" strokeWidth="2" fill="none"/>
    <path d="M30 30 L35 40 M70 30 L65 40" stroke="#f8b6cc" strokeWidth="2"/>
  </svg>
);

export const FranticMage = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="fm-purple" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7"/>
        <stop offset="100%" stopColor="#6b21a8"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#0f0f15"/>
    <ellipse cx="50" cy="40" rx="16" ry="20" fill="url(#fm-purple)"/>
    <circle cx="44" cy="38" r="4" fill="#3bb4c2"/>
    <circle cx="56" cy="38" r="4" fill="#3bb4c2"/>
    <circle cx="44" cy="38" r="2" fill="#000"/>
    <circle cx="56" cy="38" r="2" fill="#000"/>
    <path d="M35 55 L65 55" stroke="#3bb4c2" strokeWidth="2"/>
    <circle cx="50" cy="65" r="8" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2"/>
  </svg>
);

export const IridescentCrab = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="ic-rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffc4d9"/>
        <stop offset="25%" stopColor="#bce6eb"/>
        <stop offset="50%" stopColor="#e2f0cb"/>
        <stop offset="75%" stopColor="#d9c2f0"/>
        <stop offset="100%" stopColor="#fceda1"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#0a0a10"/>
    <ellipse cx="50" cy="45" rx="22" ry="18" fill="url(#ic-rainbow)"/>
    <circle cx="42" cy="43" r="5" fill="#fff"/>
    <circle cx="58" cy="43" r="5" fill="#fff"/>
    <circle cx="42" cy="43" r="2" fill="#000"/>
    <circle cx="58" cy="43" r="2" fill="#000"/>
    <path d="M35 58 Q50 68 65 58" stroke="#ffc4d9" strokeWidth="2" fill="none"/>
    <circle cx="30" cy="35" r="3" fill="#ffc4d9"/>
    <circle cx="70" cy="35" r="3" fill="#ffc4d9"/>
  </svg>
);

export const AquaticWarrior = ({ size = 40, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="aw-teal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3d1"/>
        <stop offset="100%" stopColor="#0d9488"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="#0a1215"/>
    <ellipse cx="50" cy="40" rx="18" ry="22" fill="url(#aw-teal)"/>
    <circle cx="43" cy="38" r="5" fill="#fff"/>
    <circle cx="57" cy="38" r="5" fill="#fff"/>
    <circle cx="43" cy="38" r="2" fill="#000"/>
    <circle cx="57" cy="38" r="2" fill="#000"/>
    <path d="M35 55 Q50 65 65 55" stroke="#22d3d1" strokeWidth="2" fill="none"/>
    <circle cx="30" cy="30" r="2" fill="#22d3d1" opacity="0.6"/>
    <circle cx="70" cy="30" r="2" fill="#22d3d1" opacity="0.6"/>
    <circle cx="25" cy="45" r="1.5" fill="#22d3d1" opacity="0.4"/>
    <circle cx="75" cy="45" r="1.5" fill="#22d3d1" opacity="0.4"/>
  </svg>
);

// Map for easy lookup
export const knightAvatars = {
  'claudnelius': EldritchWizard,
  'sirclawthchilds': BullMarketWarrior,
  'knowledge-knaight': CrabKnight,
  'shrimp-soldier': ShrimpKnight,
  'affairs-knaight': FranticMage,
  'labrina': IridescentCrab,
  'clawdette': AquaticWarrior
};

export default {
  EldritchWizard,
  BullMarketWarrior,
  CrabKnight,
  ShrimpKnight,
  FranticMage,
  IridescentCrab,
  AquaticWarrior,
  knightAvatars
};
