import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

const DOT_COUNT = 40;

export const LobsterScrollArea = ({
  children,
  className = '',
  contentClassName = '',
  direction = 'vertical',
  size = 'default'
}) => {
  const isVertical = direction === 'vertical';
  const contentRef = useRef(null);
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [clickedIndex, setClickedIndex] = useState(null);
  const [canScroll, setCanScroll] = useState(false);
  const clickTimeout = useRef(null);
  const lastScroll = useRef(0);

  useEffect(() => {
    if (!contentRef.current) return;

    const checkOverflow = () => {
      const el = contentRef.current;
      if (!el) return;
      if (isVertical) {
        setCanScroll(el.scrollHeight > Math.ceil(el.clientHeight));
      } else {
        setCanScroll(el.scrollWidth > Math.ceil(el.clientWidth));
      }
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.observe(contentRef.current);
    // Also observe children mutations for accurate bounding changes
    if (contentRef.current.firstElementChild) {
      resizeObserver.observe(contentRef.current.firstElementChild);
    }

    return () => resizeObserver.disconnect();
  }, [isVertical, children]);

  const { scrollYProgress, scrollXProgress } = useScroll({ container: contentRef });
  const activeScrollProgress = isVertical ? scrollYProgress : scrollXProgress;

  useMotionValueEvent(activeScrollProgress, "change", (latest) => {
    if (latest < lastScroll.current - 0.001) {
      setIsReversed(true);
    } else if (latest > lastScroll.current + 0.001) {
      setIsReversed(false);
    }
    lastScroll.current = latest;
  });

  const thumbPos = useTransform(activeScrollProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging || !trackRef.current || !contentRef.current) return;
      const trackRect = trackRef.current.getBoundingClientRect();
      if (isVertical) {
        const y = Math.max(0, Math.min(e.clientY - trackRect.top, trackRect.height));
        const percentage = y / trackRect.height;
        const maxScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight;
        contentRef.current.scrollTop = percentage * maxScroll;
      } else {
        const x = Math.max(0, Math.min(e.clientX - trackRect.left, trackRect.width));
        const percentage = x / trackRect.width;
        const maxScroll = contentRef.current.scrollWidth - contentRef.current.clientWidth;
        contentRef.current.scrollLeft = percentage * maxScroll;
      }
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
  }, [isDragging, isVertical]);

  const handleTrackClick = (e) => {
    if (!trackRef.current || !contentRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    let percentage = 0;

    if (isVertical) {
      const y = Math.max(0, Math.min(e.clientY - trackRect.top, trackRect.height));
      percentage = y / trackRect.height;
    } else {
      const x = Math.max(0, Math.min(e.clientX - trackRect.left, trackRect.width));
      percentage = x / trackRect.width;
    }

    const targetIdx = Math.round(percentage * (DOT_COUNT - 1));
    setClickedIndex(targetIdx);

    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => setClickedIndex(null), 1000);

    if (isVertical) {
      const maxScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight;
      contentRef.current.scrollTo({ top: percentage * maxScroll, behavior: 'smooth' });
    } else {
      const maxScroll = contentRef.current.scrollWidth - contentRef.current.clientWidth;
      contentRef.current.scrollTo({ left: percentage * maxScroll, behavior: 'smooth' });
    }
  };

  const baseRotation = isVertical
    ? (isReversed ? 0 : 180)
    : (isReversed ? -90 : 90);

  return (
    <div className={`relative flex overflow-hidden ${isVertical ? 'flex-row' : 'flex-col'} ${className}`}>
      {/* Scrollable Content */}
      <div
        ref={contentRef}
        className={`flex-1 overflow-auto scrollbar-hide ${canScroll ? (isVertical ? 'pr-8' : 'pb-8') : ''} ${contentClassName}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Custom Lobster Scrollbar Track */}
      {canScroll && (
        <div
          ref={trackRef}
          onPointerDown={handleTrackClick}
          className={`shrink-0 flex justify-center relative cursor-pointer touch-none group/track z-50 ${size === 'small'
            ? (isVertical ? 'w-6 py-4 flex-col' : 'h-6 px-4 flex-row')
            : (isVertical ? 'w-10 py-6 flex-col' : 'h-10 px-6 flex-row')
            }`}
        >
          {/* Track Hover Highlight */}
          <div className={`absolute bg-white/0 group-hover/track:bg-[var(--bg-overlay)] rounded-full transition-colors duration-300 pointer-events-none ${size === 'small'
            ? (isVertical ? 'inset-y-0 w-4' : 'inset-x-0 h-4')
            : (isVertical ? 'inset-y-0 w-8' : 'inset-x-0 h-8')
            }`} />

          {/* The Track (Dots) */}
          <div className={`absolute w-full flex justify-between items-center z-0 pointer-events-none ${size === 'small'
            ? (isVertical ? 'inset-y-4 flex-col' : 'inset-x-4 flex-row h-full')
            : (isVertical ? 'inset-y-6 flex-col' : 'inset-x-6 flex-row h-full')
            }`}>
            {Array.from({ length: DOT_COUNT }).map((_, i) => {
              const dotProgress = i / (DOT_COUNT - 1);
              const isTarget = clickedIndex !== null && Math.abs(i - clickedIndex) <= 2;
              const isCenterTarget = clickedIndex === i;

              return (
                <motion.div
                  key={i}
                  animate={{
                    scale: isCenterTarget ? 2 : isTarget ? 1.5 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className={`${size === 'small' ? 'w-1 h-1' : 'w-1.5 h-1.5'} rounded-full transition-colors duration-300 ${isTarget
                    ? 'bg-[rgb(var(--rgb-accent-main))] shadow-[0_0_10px_rgba(var(--rgb-accent-main),0.8)] z-10'
                    : 'bg-[var(--text-faint)]'
                    }`}
                />
              );
            })}
          </div>

          {/* The Lobster Thumb */}
          <motion.div
            style={isVertical ? { top: thumbPos } : { left: thumbPos }}
            className={`absolute flex items-center justify-center z-10 cursor-grab active:cursor-grabbing ${size === 'small'
              ? (isVertical ? 'left-0 right-0 w-full h-8 -mt-4' : 'top-0 bottom-0 h-full w-8 -ml-4')
              : (isVertical ? 'left-0 right-0 w-full h-12 -mt-6' : 'top-0 bottom-0 h-full w-12 -ml-6')
              }`}
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsDragging(true);
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <motion.div
              animate={{ rotate: baseRotation }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="flex items-center justify-center relative w-full h-full"
            >
              <motion.div
                animate={{
                  scale: isDragging ? 1.2 : isHovered ? 1.1 : 1,
                  rotate: isDragging ? [0, -5, 5, -5, 5, 0] : 0,
                }}
                transition={{
                  rotate: { repeat: isDragging ? Infinity : 0, duration: 0.5 },
                  scale: { type: 'spring', stiffness: 400, damping: 20 }
                }}
                className={`transition-colors duration-300 relative flex items-center justify-center ${isDragging || isHovered
                  ? 'text-[rgb(var(--rgb-accent-main))] drop-shadow-[0_0_12px_rgba(var(--rgb-accent-main),0.8)]'
                  : 'text-[var(--text-main)] drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]'
                  }`}
                style={size === 'small' ? { scale: 0.65 } : {}}
              >
                {/* Abstract Tech Lobster SVG */}
                <svg width="28" height="32" viewBox="0 0 24 36" fill="none" className="transform origin-center pointer-events-none">
                  {/* Claws */}
                  <motion.path
                    d="M 6 12 C 0 8 0 0 6 4 C 12 6 8 12 8 14 Z"
                    fill="currentColor"
                    animate={{ rotate: isDragging || isHovered ? -15 : 0 }}
                    style={{ originX: '8px', originY: '14px' }}
                  />
                  <motion.path
                    d="M 18 12 C 24 8 24 0 18 4 C 12 6 16 12 16 14 Z"
                    fill="currentColor"
                    animate={{ rotate: isDragging || isHovered ? 15 : 0 }}
                    style={{ originX: '16px', originY: '14px' }}
                  />
                  {/* Head/Antennae */}
                  <path d="M 10 10 L 8 4 M 14 10 L 16 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                  {/* Carapace */}
                  <rect x="8" y="12" width="8" height="14" rx="3" fill="currentColor" />
                  <path d="M 8 16 L 16 16 M 8 20 L 16 20" stroke="var(--bg-base)" strokeWidth="1.5" />
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
          </motion.div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};

export default LobsterScrollArea;
