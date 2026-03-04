import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- UNIVERSAL ANIMATION UTILS ---
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Data Scramble Component 
export const ScrambleText = ({ text, activeTab, theme }) => {
  const [displayText, setDisplayText] = useState(String(text));
  const chars = '!<>-_\\/[]{}—=+*^?#________';
  
  useEffect(() => {
    let iteration = 0;
    let interval = null;
    const strText = String(text);
    clearInterval(interval);
    interval = setInterval(() => {
      setDisplayText(prev => strText.split('').map((letter, index) => {
        if (index < iteration) return strText[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(''));
      if (iteration >= strText.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
    return () => clearInterval(interval);
  }, [text, activeTab, theme]);
  
  return <span>{displayText}</span>;
};

// Crosshair Component
export const Crosshair = ({ className = '' }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" className={`absolute text-[var(--text-faint)] transition-colors duration-500 pointer-events-none z-20 ${className}`} fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M5 0v10M0 5h10" />
  </svg>
);

// Badge Component
export const Badge = ({ children, variant = 'outline', className = '' }) => {
  const styles = {
    outline: 'border border-[var(--border-color)] text-[var(--text-muted)] bg-[var(--bg-base)]',
    HIGH: 'bg-[rgba(var(--rgb-accent-red),0.1)] text-[rgb(var(--rgb-accent-red))] border border-[rgba(var(--rgb-accent-red),0.3)] shadow-[0_0_10px_rgba(var(--rgb-accent-red),0.2)]',
    MEDIUM: 'bg-[rgba(var(--rgb-accent-main),0.1)] text-[rgb(var(--rgb-accent-main))] border border-[rgba(var(--rgb-accent-main),0.3)] shadow-[0_0_10px_rgba(var(--rgb-accent-main),0.2)]',
    LOW: 'bg-[rgba(var(--rgb-accent-sec),0.1)] text-[rgb(var(--rgb-accent-sec))] border border-[rgba(var(--rgb-accent-sec),0.3)] shadow-[0_0_10px_rgba(var(--rgb-accent-sec),0.2)]',
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    PENDING: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]',
    PLANNED: 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
    black: 'bg-[var(--logo-bg)] text-[var(--logo-text)] font-bold shadow-[0_0_15px_var(--border-highlight)]',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-[9px] font-space-mono uppercase tracking-widest transition-colors duration-500 ${styles[variant] || styles.outline} ${className}`}>
      {children}
    </span>
  );
};

// Button Component
export const Button = ({ children, icon: Icon, variant = 'primary', className = '', onClick }) => {
  const base = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all active:scale-95 duration-500 relative overflow-hidden group hover-spotlight";
  
  if (variant === 'primary') {
    return (
      <button className={`${base} bg-[var(--logo-bg)] text-[var(--logo-text)] hover:opacity-80 shadow-[0_0_15px_var(--border-highlight)] hover:shadow-[0_0_25px_var(--border-highlight)] ${className}`} onClick={onClick}>
        {Icon && <Icon size={16} />}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
  
  if (variant === 'accent') {
    return (
      <button className={`${base} bg-transparent text-[var(--text-main)] border border-[var(--border-color)] hover:border-[rgb(var(--rgb-accent-main))] ${className}`} onClick={onClick}>
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(var(--rgb-accent-red),0.2)] via-[rgba(var(--rgb-accent-main),0.2)] to-[rgba(var(--rgb-accent-sec),0.2)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {Icon && <Icon size={16} className="text-[rgb(var(--rgb-accent-main))] group-hover:text-[rgb(var(--rgb-accent-sec))] transition-colors duration-500 relative z-10" />}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
  
  return (
    <button className={`${base} bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-overlay)] ${className}`} onClick={onClick}>
      {Icon && <Icon size={16} className="relative z-10" />}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

// Card Component
export const Card = ({ children, className = '', title, action }) => (
  <motion.div variants={staggerItem} className={`hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-7 flex flex-col relative group transition-colors duration-500 ${className}`}>
    <Crosshair className="-top-[5px] -left-[5px]" />
    <Crosshair className="-top-[5px] -right-[5px]" />
    <Crosshair className="-bottom-[5px] -left-[5px]" />
    <Crosshair className="-bottom-[5px] -right-[5px]" />
    {(title || action) && (
      <div className="flex justify-between items-center mb-6 relative z-10">
        {title && <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--text-main)] font-space-grotesk flex items-center gap-3 transition-colors duration-500"> <div className="w-2 h-2 rounded-full bg-[var(--border-highlight)] group-hover:bg-[rgb(var(--rgb-accent-main))] transition-colors duration-500" /> {title} </h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="flex-1 flex flex-col relative z-10 text-[var(--text-main)] transition-colors duration-500">
      {children}
    </div>
  </motion.div>
);

// Animated Loader
export const AnimatedSVGLoader = () => (
  <div className="relative w-32 h-32 flex items-center justify-center">
    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 animate-[spin_10s_linear_infinite]">
      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" className="transition-colors duration-500" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(var(--rgb-accent-main), 0.3)" strokeWidth="1" strokeDasharray="10 20" className="animate-[spin_15s_linear_infinite_reverse] transition-colors duration-500" style={{ transformOrigin: '50px 50px' }} />
    </svg>
    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
      <circle cx="50" cy="50" r="25" fill="none" stroke="rgb(var(--rgb-accent-red))" strokeWidth="2" strokeDasharray="40 100" className="animate-[spin_3s_ease-in-out_infinite] transition-colors duration-500" style={{ transformOrigin: '50px 50px' }} strokeLinecap="round" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="rgb(var(--rgb-accent-main))" strokeWidth="1.5" strokeDasharray="20 50" className="animate-[spin_2s_linear_infinite_reverse] transition-colors duration-500" style={{ transformOrigin: '50px 50px' }} strokeLinecap="round" />
    </svg>
    <div className="w-4 h-4 bg-[rgb(var(--rgb-accent-sec))] rounded-full animate-pulse shadow-[0_0_15px_rgba(var(--rgb-accent-sec),0.5)] transition-colors duration-500" />
  </div>
);
