import React from 'react';

export function Button({ 
  children, 
  icon: Icon, 
  variant = 'primary', 
  className = '',
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all active:scale-95 duration-500 relative overflow-hidden group hover-spotlight";
  
  const variants = {
    primary: "bg-[var(--logo-bg)] text-[var(--logo-text)] hover:opacity-80 shadow-[0_0_15px_var(--border-highlight)] hover:shadow-[0_0_25px_var(--border-highlight)]",
    accent: "bg-transparent text-[var(--text-main)] border border-[var(--border-color)] hover:border-[rgb(var(--rgb-accent-main))]",
    ghost: "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-overlay)]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} />}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function Badge({ children, variant = 'outline', className = '' }) {
  const styles = {
    outline: 'border border-[var(--border-color)] text-[var(--text-muted)] bg-[var(--bg-base)]',
    HIGH: 'bg-[rgba(var(--rgb-accent-red),0.1)] text-[rgb(var(--rgb-accent-red))] border border-[rgba(var(--rgb-accent-red),0.3)] shadow-[0_0_10px_rgba(var(--rgb-accent-red),0.2)]',
    MEDIUM: 'bg-[rgba(var(--rgb-accent-main),0.1)] text-[rgb(var(--rgb-accent-main))] border border-[rgba(var(--rgb-accent-main),0.3)] shadow-[0_0_10px_rgba(var(--rgb-accent-main),0.2)]',
    LOW: 'bg-[rgba(var(--rgb-accent-sec),0.1)] text-[rgb(var(--rgb-accent-sec))] border border-[rgba(var(--rgb-accent-sec),0.3)] shadow-[0_0_10px_rgba(var(--rgb-accent-sec),0.2)]',
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    PENDING: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]',
    PLANNED: 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
    PLANNED: 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-[9px] font-space-mono uppercase tracking-widest transition-colors duration-500 ${styles[variant] || styles.outline} ${className}`}>
      {children}
    </span>
  );
}
