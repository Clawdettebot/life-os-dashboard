import React from 'react';

export const GlassyPill = ({ children, className = '', onClick, active, variant = 'default' }) => {
    const base = "relative px-5 py-2.5 text-xs font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden cursor-pointer";
    const variants = {
        default: active
            ? 'bg-[var(--border-highlight)] text-[var(--text-main)] shadow-[0_8px_16px_rgba(0,0,0,0.2)] border border-[var(--border-highlight)] backdrop-blur-md'
            : 'bg-[var(--bg-overlay)] text-[var(--text-muted)] hover:bg-[var(--border-highlight)] hover:text-[var(--text-main)] border border-[var(--border-color)] backdrop-blur-sm',
        primary: 'bg-gradient-to-r from-[rgb(var(--rgb-accent-red))] to-[rgb(var(--rgb-accent-main))] text-[#ffffff] shadow-[0_8px_20px_rgba(var(--rgb-accent-red),0.3)] border border-[rgba(var(--rgb-accent-red),0.5)] hover:scale-105 active:scale-95',
        dark: 'bg-[var(--bg-panel)] text-[var(--text-main)] border border-[var(--border-color)] backdrop-blur-xl hover:bg-[var(--bg-overlay)]'
    };
    return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};
