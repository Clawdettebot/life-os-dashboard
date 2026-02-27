import React from 'react';

export const GlassyPill = ({ children, className = '', onClick, active, variant = 'default' }) => {
    const base = "relative px-5 py-2.5 text-xs font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden cursor-pointer";
    const variants = {
        default: active
            ? 'bg-white/20 text-white shadow-[0_8px_16px_rgba(0,0,0,0.2)] border border-white/30 backdrop-blur-md'
            : 'bg-black/20 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5 backdrop-blur-sm',
        primary: 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-[0_8px_20px_rgba(239,68,68,0.3)] border border-red-400/50 hover:scale-105 active:scale-95',
        dark: 'bg-black/60 text-white border border-white/10 backdrop-blur-xl hover:bg-black/80'
    };
    return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};
