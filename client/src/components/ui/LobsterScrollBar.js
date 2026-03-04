import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, animate } from 'framer-motion';

const DOT_COUNT = 40;

export const LobsterScrollArea = ({ children, className = '' }) => {
  const contentRef = useRef(null);
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isFacingUp, setIsFacingUp] = useState(true);
  const [clickedIndex, setClickedIndex] = useState(null);
  const clickTimeout = useRef(null);
  const lastScrollY = useRef(0);

  const { scrollYProgress } = useScroll({ container: contentRef });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      if (latest < lastScrollY.current - 0.01) {
        setIsFacingUp(true);
      } else if (latest > lastScrollY.current + 0.01) {
        setIsFacingUp(false);
      }
      lastScrollY.current = latest;
      setScrollPercent(latest);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const thumbY = useTransform(scrollYProgress, [0, 1], ['0%', 'calc(100% - 3rem)']);

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging || !trackRef.current || !contentRef.current) return;
      const trackRect = trackRef.current.getBoundingClientRect();
      const y = Math.max(0, Math.min(e.clientY - trackRect.top, trackRect.height));
      const percentage = y / trackRect.height;
      const maxScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight;
      contentRef.current.scrollTop = percentage * maxScroll;
    };
    const handlePointerUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = 'none';
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const handleTrackClick = (e) => {
    if (!trackRef.current || !contentRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(e.clientY - trackRect.top, trackRect.height));
    const percentage = y / trackRect.height;
    const targetIdx = Math.round(percentage * (DOT_COUNT - 1));
    setClickedIndex(targetIdx);
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => setClickedIndex(null), 1000);
    const maxScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight;
    contentRef.current.scrollTo({ top: percentage * maxScroll, behavior: 'smooth' });
  };

  return (
    <div className={`relative flex h-full overflow-hidden ${className}`}>
      <div ref={contentRef} className="flex-1 overflow-y-auto pr-8 lobster-content" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {children}
      </div>
      
      <div ref={trackRef} onPointerDown={handleTrackClick} className="w-10 shrink-0 flex justify-center relative py-6 cursor-pointer touch-none group/track">
        <div className="absolute inset-y-0 w-8 bg-white/0 group-hover/track:bg-white/5 rounded-full transition-colors duration-300 pointer-events-none" />
        
        {/* Dot Track */}
        <div className="absolute inset-y-6 w-full flex flex-col justify-between items-center z-0 pointer-events-none">
          {Array.from({ length: DOT_COUNT }).map((_, i) => {
            const dotThreshold = i / DOT_COUNT;
            const isEaten = scrollPercent > dotThreshold;
            const isTarget = clickedIndex !== null && Math.abs(i - clickedIndex) <= 2;
            const isCenterTarget = clickedIndex === i;
            
            let dotClass = 'bg-white/40';
            if (isEaten) dotClass = 'bg-white/20 scale-75';
            if (isTarget) dotClass = 'bg-orange-500 scale-125 shadow-[0_0_10px_rgba(249,115,22,0.8)] z-10';
            
            return (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${dotClass}`} />
            );
          })}
        </div>
        
        {/* Lobster Thumb */}
        <motion.div 
          style={{ y: thumbY }} 
          className="absolute left-0 right-0 w-full h-12 -mt-6 flex items-center justify-center z-10 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => { e.stopPropagation(); setIsDragging(true); }}
          onMouseEnter={() => setIsHovered(true)} 
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div 
            animate={{ 
              rotate: isFacingUp ? 0 : 180,
              scale: isDragging ? 1.2 : isHovered ? 1.1 : 1
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className={`transition-colors duration-300 ${isDragging || isHovered ? 'text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)]' : 'text-white/70'}`}
          >
            <svg width="28" height="32" viewBox="0 0 24 36" fill="none" className="transform origin-center">
              {/* Claws */}
              <motion.path 
                d="M 6 12 C 0 8 0 0 6 4 C 12 6 8 12 8 14 Z" 
                fill="currentColor"
                animate={{ rotate: isDragging || isHovered ? -15 : 0 }}
                style={{ originX: '8px', originY: '14px' }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
              <motion.path 
                d="M 18 12 C 24 8 24 0 18 4 C 12 6 16 12 16 14 Z" 
                fill="currentColor"
                animate={{ rotate: isDragging || isHovered ? 15 : 0 }}
                style={{ originX: '16px', originY: '14px' }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
              {/* Antennae */}
              <path d="M 10 10 L 8 4 M 14 10 L 16 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
              {/* Carapace */}
              <rect x="8" y="12" width="8" height="14" rx="3" fill="currentColor" />
              <path d="M 8 16 L 16 16 M 8 20 L 16 20" stroke="#000" strokeWidth="1.5" />
              {/* Tail */}
              <path d="M 8 25 L 5 32 L 12 30 L 19 32 L 16 25 Z" fill="currentColor" strokeLinejoin="round" />
              {/* Legs */}
              <line x1="8" y1="15" x2="4" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="16" y1="15" x2="20" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="8" y1="19" x2="3" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="16" y1="19" x2="21" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="8" y1="23" x2="4" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="16" y1="23" x2="20" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `.lobster-content::-webkit-scrollbar { display: none; }`}} />
    </div>
  );
};

export default LobsterScrollArea;
