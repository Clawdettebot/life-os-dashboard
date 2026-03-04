import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import {
  Users, Brain, CheckSquare, CalendarClock, Radio, Lightbulb,
  DollarSign, Activity, Settings, ChevronDown, ChevronRight,
  Cpu, Archive, Terminal, X, Zap, ShieldAlert, Layers, Search, AlignJustify, Sword
} from 'lucide-react';

// Knight SVG components
import SirClawthchilds from './knights/SirClawthchilds';
import Claudnelius from './knights/Claudnelius';
import ShrimpSoldier from './knights/ShrimpSoldier';
import Labrina from './knights/Labrina';
import KnaightOfAffairs from './knights/KnaightOfAffairs';
import KnowledgeKnaight from './knights/KnowledgeKnaight';
import Clawdette from './knights/Clawdette';

// PNG avatar mappings
const knightPNGs = {
  'clawdette': '269bd57c-88ba-4d02-9b70-40511a27d1bc.png',
  'knowledge-knaight': '2c45e97d-c391-4d77-9778-821e2dee82d6.png',
  'affairs-knaight': '8cd7f326-500b-4757-bca1-132886fc8c76.png',
  'clawthchilds': '99f2a89b-8c51-4078-af63-10046a333434.png',
  'claudnelius': 'c44a0f21-6530-4e4b-8eb7-a27c8674299b.png',
  'labrina': '6f9d0fbf-6011-471b-8740-397b7eeb708f.png',
  'shrimp-soldier': 'a3010206-b78c-4da9-8971-f83294efe9a6.png'
};

// SVG map
const knightSVGs = {
  'clawdette': Clawdette,
  'knowledge-knaight': KnowledgeKnaight,
  'affairs-knaight': KnaightOfAffairs,
  'clawthchilds': SirClawthchilds,
  'claudnelius': Claudnelius,
  'labrina': Labrina,
  'shrimp-soldier': ShrimpSoldier
};

// --- CUSTOM LOBSTER SCROLLBAR ---
const DOT_COUNT = 30;

const LobsterScrollArea = ({ children, className = '', contentClassName = '' }) => {
  const contentRef = useRef(null);
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFacingUp, setIsFacingUp] = useState(false);
  const [clickedIndex, setClickedIndex] = useState(null);
  const clickTimeout = useRef(null);
  const lastScroll = useRef(0);

  const { scrollYProgress } = useScroll({ container: contentRef });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < lastScroll.current) setIsFacingUp(true);
    else if (latest > lastScroll.current) setIsFacingUp(false);
    lastScroll.current = latest;
  });

  const thumbPos = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

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

    setClickedIndex(Math.round(percentage * (DOT_COUNT - 1)));
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => setClickedIndex(null), 1000);

    const maxScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight;
    contentRef.current.scrollTo({ top: percentage * maxScroll, behavior: 'smooth' });
  };

  return (
    <div className={`relative flex overflow-hidden flex-row ${className}`}>
      <div ref={contentRef} className={`flex-1 overflow-auto scrollbar-hide pr-6 ${contentClassName}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {children}
      </div>
      <div ref={trackRef} onPointerDown={handleTrackClick} className={`shrink-0 flex justify-center relative cursor-pointer touch-none group/track z-50 w-10 py-6 flex-col`}>
        <div className={`absolute bg-[var(--bg-overlay)] opacity-0 group-hover/track:opacity-100 rounded-full transition-opacity duration-300 pointer-events-none inset-y-0 w-8`} />
        <div className={`absolute w-full flex justify-between items-center z-0 pointer-events-none inset-y-6 flex-col`}>
          {Array.from({ length: DOT_COUNT }).map((_, i) => {
            const dotProgress = i / (DOT_COUNT - 1);
            const dotOpacity = useTransform(scrollYProgress, [dotProgress - 0.05, dotProgress], [1, 0.2]);
            const isTarget = clickedIndex !== null && Math.abs(i - clickedIndex) <= 2;
            const isCenterTarget = clickedIndex === i;
            return (
              <motion.div key={i} style={{ opacity: dotOpacity }} animate={{ scale: isCenterTarget ? 2 : isTarget ? 1.5 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isTarget ? 'bg-[rgb(var(--rgb-accent-main))] shadow-[0_0_10px_rgba(var(--rgb-accent-main),0.8)] z-10' : 'bg-[var(--text-faint)]'}`}
              />
            );
          })}
        </div>
        <motion.div style={{ top: thumbPos }} className={`absolute flex items-center justify-center z-10 cursor-grab active:cursor-grabbing left-0 right-0 w-full h-12 -mt-6`}
          onPointerDown={(e) => { e.stopPropagation(); setIsDragging(true); }}
          onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div animate={{ rotate: isFacingUp ? 0 : 180 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="flex items-center justify-center relative w-full h-full">
            <motion.div animate={{ scale: isDragging ? 1.2 : isHovered ? 1.1 : 1, rotate: isDragging ? [0, -5, 5, -5, 5, 0] : 0 }} transition={{ rotate: { repeat: isDragging ? Infinity : 0, duration: 0.5 }, scale: { type: 'spring', stiffness: 400, damping: 20 } }}
              className={`transition-colors duration-300 relative flex items-center justify-center ${isDragging || isHovered ? 'text-[rgb(var(--rgb-accent-main))] drop-shadow-[0_0_12px_rgba(var(--rgb-accent-main),0.8)]' : 'text-[var(--text-main)] drop-shadow-[0_0_8px_rgba(var(--text-main),0.2)]'}`}
            >
              <svg width="24" height="28" viewBox="0 0 24 36" fill="none" className="transform origin-center pointer-events-none">
                <motion.path d="M 6 12 C 0 8 0 0 6 4 C 12 6 8 12 8 14 Z" fill="currentColor" animate={{ rotate: isDragging || isHovered ? -15 : 0 }} style={{ originX: '8px', originY: '14px' }} transition={{ type: 'spring', stiffness: 300 }} />
                <motion.path d="M 18 12 C 24 8 24 0 18 4 C 12 6 16 12 16 14 Z" fill="currentColor" animate={{ rotate: isDragging || isHovered ? 15 : 0 }} style={{ originX: '16px', originY: '14px' }} transition={{ type: 'spring', stiffness: 300 }} />
                <path d="M 10 10 L 8 4 M 14 10 L 16 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                <rect x="8" y="12" width="8" height="14" rx="3" fill="currentColor" />
                <path d="M 8 16 L 16 16 M 8 20 L 16 20" stroke="var(--bg-base)" strokeWidth="1.5" />
                <path d="M 8 25 L 5 32 L 12 30 L 19 32 L 16 25 Z" fill="currentColor" strokeLinejoin="round" />
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
    </div>
  );
};

// --- DATA GRAPH & HIERARCHY ---
const NETWORK_DATA = {
  id: 'admin', title: 'Guapdad 4000', role: 'System Admin / Root', icon: Cpu,
  stats: [{ label: 'SYS STATUS', val: 'NOMINAL' }, { label: 'UPTIME', val: '99.9%' }],
  children: [
    {
      id: 'ops', knightId: 'clawdette', title: 'Clawdettes', role: 'Operations & Execution', icon: Activity, color: 'purple',
      stats: [{ label: 'THROUGHPUT', val: '94%' }, { label: 'TASKS', val: '12 ACTIVE' }],
      children: [
        {
          id: 'finance', knightId: 'clawthchilds', title: 'Sir Clawthchilds', role: 'Capital & CRM', icon: DollarSign, color: 'emerald',
          stats: [{ label: 'MRR', val: '$14.4K' }, { label: 'CONTACTS', val: '129' }],
          children: [
            {
              id: 'ideas', knightId: 'shrimp-soldier', title: 'Shrimp', role: 'Idea Incubation', icon: Lightbulb, color: 'yellow',
              stats: [{ label: 'RAW IDEAS', val: '14' }, { label: 'STATE', val: 'EXPANDING' }],
              children: []
            }
          ]
        },
        {
          id: 'schedule', knightId: 'affairs-knaight', title: 'Knight of Affairs', role: 'Temporal Management', icon: CalendarClock, color: 'blue',
          stats: [{ label: 'EVENTS', val: '3 SOON' }, { label: 'SYNC', val: 'ACTIVE' }],
          children: [
            {
              id: 'tasks', knightId: 'shrimp-soldier', title: 'Shrimp', role: 'Task Processing', icon: CheckSquare, color: 'blue',
              stats: [{ label: 'QUEUE', val: '106' }, { label: 'STATUS', val: 'BUSY' }],
              children: []
            },
            {
              id: 'streams', knightId: 'shrimp-soldier', title: 'Shrimp', role: 'Broadcast Node', icon: Radio, color: 'blue',
              stats: [{ label: 'UPCOMING', val: '2' }, { label: 'STATUS', val: 'IDLE' }],
              children: []
            }
          ]
        }
      ]
    },
    {
      id: 'logistics', knightId: 'claudnelius', title: 'Clawonelius', role: 'Logistics & Infrastructure', icon: Archive, color: 'orange',
      stats: [{ label: 'EFFICIENCY', val: '88%' }, { label: 'ALERTS', val: '0' }],
      children: [
        {
          id: 'memory', knightId: 'knowledge-knaight', title: 'Knowledge Knight', role: 'Memory Retrieval', icon: Brain, color: 'yellow',
          stats: [{ label: 'ENTRIES', val: '4,021' }, { label: 'INDEXING', val: 'OK' }],
          children: []
        },
        {
          id: 'content', knightId: 'labrina', title: 'Lubrina', role: 'Content Deployment', icon: Layers, color: 'emerald',
          stats: [{ label: 'QUEUE', val: '12' }, { label: 'NEXT DROP', val: 'TUE' }],
          children: []
        }
      ]
    }
  ]
};

// --- ANIMATED THEMED CONNECTION LINES ---
const DataFlowLine = ({ vertical = false, delay = 0, reverse = false, className = '' }) => {
  const baseStyle = vertical ? "w-[2px]" : "h-[2px]";

  return (
    <div className={`relative overflow-hidden z-0 bg-[var(--border-color)] ${baseStyle} ${className}`}>
      {/* The Animated Data Packet (Pulsing Accent Color) */}
      <motion.div
        animate={
          vertical
            ? { y: reverse ? ['100%', '-100%'] : ['-100%', '100%'] }
            : { x: reverse ? ['100%', '-100%'] : ['-100%', '100%'] }
        }
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay }}
        className="absolute inset-0"
        style={{
          background: vertical
            ? `linear-gradient(to bottom, transparent, rgb(var(--rgb-accent-main)), transparent)`
            : `linear-gradient(to right, transparent, rgb(var(--rgb-accent-main)), transparent)`,
          boxShadow: `0 0 12px rgba(var(--rgb-accent-main), 0.8)`
        }}
      />
    </div>
  );
};

// --- SQUARE HUD CORNER PLACEHOLDER ---
const NodeCorner = ({ position }) => {
  const posClass = {
    'tl': 'top-0 left-0',
    'tr': 'top-0 right-0',
    'bl': 'bottom-0 left-0',
    'br': 'bottom-0 right-0'
  }[position];

  const rotateClass = {
    'tl': '',
    'tr': 'rotate-90',
    'bl': '-rotate-90',
    'br': 'rotate-180'
  }[position];

  return (
    <div className={`absolute w-3 h-3 z-20 pointer-events-none flex items-center justify-center ${posClass}`}>
      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className={`text-[var(--border-highlight)] opacity-70 ${rotateClass}`}>
        <path d="M 0 0 L 10 0 L 10 2 L 2 2 L 2 10 L 0 10 Z" fill="currentColor" />
      </svg>
    </div>
  );
}

// --- TIGHT SQUARED NODE COMPONENT (50% Image Split) ---
const NodeCard = ({ node, onClick, isSelected }) => {
  const knightId = node.knightId;
  const KnightSVG = knightId ? knightSVGs[knightId] : null;
  const pngPath = knightId ? `/avatars/${knightPNGs[knightId]}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${node.id}&backgroundColor=transparent`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => onClick(node, e)}
      className={`w-64 h-40 bg-[var(--bg-card)] backdrop-blur-3xl border border-[var(--border-color)] ${isSelected ? 'border-[var(--border-highlight)] bg-[var(--bg-overlay)] shadow-[0_0_30px_rgba(var(--rgb-accent-main),0.2)]' : 'shadow-[0_20px_40px_rgba(0,0,0,0.5)]'} rounded-md flex flex-row group hover:border-[var(--border-highlight)] hover:bg-[var(--bg-overlay)] transition-all duration-300 relative overflow-hidden hover-spotlight z-10 cursor-pointer`}
    >
      <NodeCorner position="tl" /><NodeCorner position="tr" />
      <NodeCorner position="bl" /><NodeCorner position="br" />

      {/* 50% Left PNG Avatar (No Container Border) */}
      <div className="w-1/2 h-full relative overflow-hidden shrink-0 flex items-center justify-center bg-transparent">
        {knightId ? (
          <img src={pngPath} alt="avatar" className="w-[120%] h-[120%] object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 filter drop-shadow-2xl hover:scale-105" />
        ) : (
          <>
            <img src={pngPath} alt="avatar" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 scale-110 filter brightness-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] to-transparent pointer-events-none opacity-80" />
          </>
        )}
      </div>

      {/* 50% Right Information */}
      <div className="w-1/2 p-4 flex flex-col justify-center relative z-10">

        {/* Knight SVG - Starts Top Right, Drops to Bottom Right */}
        <motion.div
          initial={{ top: '8px', right: '8px', opacity: 0, scale: 0.5 }}
          animate={{ top: 'auto', bottom: '8px', right: '8px', opacity: 0.7, scale: 1 }}
          transition={{ type: "spring", delay: 0.4, bounce: 0.4 }}
          className="absolute z-20 pointer-events-none text-[var(--text-faint)] group-hover:text-[rgb(var(--rgb-accent-main))] transition-colors duration-500 w-6 h-6 flex items-center justify-center"
        >
          {KnightSVG ? <KnightSVG /> : <Cpu size={14} className="animate-[spin_4s_linear_infinite]" />}
        </motion.div>

        <div className="mb-2">
          <h4 className="text-xs font-bold font-space-grotesk leading-tight truncate text-[var(--text-main)] drop-shadow-sm group-hover:text-[rgb(var(--rgb-accent-main))] transition-colors">{node.title}</h4>
          <p className="text-[7px] font-space-mono uppercase tracking-widest mt-1 text-[var(--text-muted)] line-clamp-2 leading-tight">{node.role}</p>
        </div>

        <div className="pt-2 border-t border-[var(--border-color)] flex flex-col gap-1.5 w-full">
          {node.stats.map((stat, i) => (
            <div key={i}>
              <div className="text-[6px] text-[var(--text-faint)] uppercase tracking-widest leading-none mb-0.5">{stat.label}</div>
              <div className="text-[9px] text-[var(--text-main)] font-bold drop-shadow-sm font-space-mono leading-none">{stat.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Edge Glass Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-highlight)] to-transparent opacity-50 pointer-events-none" />
    </motion.div>
  );
};

// Recursive Tree Renderer (Mathematically Perfect CSS Grid/Flex Lines)
const TreeRender = ({ node, onSelect, selectedId }) => {
  if (!node) return null;
  const isLeaf = !node.children || node.children.length === 0;

  return (
    <div className="flex flex-col items-center relative z-10">
      <NodeCard node={node} onClick={onSelect} isSelected={selectedId === node.id} />

      {!isLeaf && (
        <>
          {/* Vertical Stem Drop from Parent */}
          <DataFlowLine vertical className="h-10 w-[2px]" />

          <div className="flex items-start justify-center relative w-full">
            {node.children.map((child, i) => {
              const isFirst = i === 0;
              const isLast = i === node.children.length - 1;
              const isOnly = node.children.length === 1;

              return (
                <div key={child.id} className="relative flex flex-col items-center px-6">

                  {/* Horizontal Spline connecting children */}
                  {!isOnly && (
                    <div className={`absolute top-0 h-[2px] ${isFirst ? 'left-1/2 right-0' :
                        isLast ? 'left-0 right-1/2' :
                          'left-0 right-0'
                      }`}>
                      <DataFlowLine className="h-full w-full" reverse={isFirst} />
                    </div>
                  )}

                  {/* Vertical Stem down to Child */}
                  <DataFlowLine vertical className="h-10 w-[2px]" delay={i * 0.3} />

                  <TreeRender node={child} onSelect={onSelect} selectedId={selectedId} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// --- INSPECTION PANEL ---
const InspectorPanel = ({ selectedNode, onClose }) => {
  if (!selectedNode) return null;
  const Icon = selectedNode.icon;
  const knightId = selectedNode.knightId;
  const KnightSVG = knightId ? knightSVGs[knightId] : null;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute top-0 right-0 bottom-0 w-[400px] bg-[var(--bg-panel)] backdrop-blur-3xl border-l border-[var(--border-color)] shadow-[-30px_0_60px_rgba(0,0,0,0.8)] z-50 flex flex-col pointer-events-auto"
    >
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />

      {/* Header */}
      <div className={`p-8 border-b border-[var(--border-color)] relative overflow-hidden shrink-0 bg-gradient-to-b from-[var(--bg-overlay)] to-transparent`}>
        <div className="flex justify-between items-start relative z-10 mb-6">
          <div className={`w-16 h-16 rounded-md bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-center shadow-inner overflow-hidden relative`}>
            {knightId ? (
              <img src={`/avatars/${knightPNGs[knightId]}`} className="absolute inset-0 w-full h-full object-contain p-2" />
            ) : (
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedNode.id}&backgroundColor=transparent`} className="absolute inset-0 w-full h-full opacity-30 mix-blend-screen filter brightness-110" />
            )}
            {!knightId && <Icon size={28} className="text-[rgb(var(--rgb-accent-main))] relative z-10 drop-shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.8)]" />}

            {KnightSVG && (
              <div className="absolute bottom-1 right-1 w-5 h-5 opacity-50 z-20 text-[rgb(var(--rgb-accent-main))] drop-shadow-sm">
                <KnightSVG />
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-md bg-[var(--bg-overlay)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-highlight)] transition-colors backdrop-blur-md">
            <X size={16} />
          </button>
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold font-space-grotesk text-[var(--text-main)] leading-tight mb-1 drop-shadow-md">{selectedNode.title}</h2>
          <p className={`text-[10px] font-space-mono uppercase tracking-[0.3em] font-bold text-[rgb(var(--rgb-accent-main))] drop-shadow-sm`}>{selectedNode.role}</p>
        </div>
      </div>

      <LobsterScrollArea className="flex-1 relative" contentClassName="p-8">
        <div className="space-y-8">
          <section>
            <h3 className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 drop-shadow-sm">
              <Activity size={12} className="text-[rgb(var(--rgb-accent-main))]" /> Core Diagnostics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {selectedNode.stats.map((s, i) => (
                <div key={i} className="bg-[var(--bg-overlay)] border border-[var(--border-color)] backdrop-blur-md rounded-md p-4 flex flex-col justify-center shadow-lg">
                  <span className="text-[9px] font-space-mono uppercase tracking-widest text-[var(--text-faint)] mb-1">{s.label}</span>
                  <span className={`text-lg font-bold font-space-mono text-[var(--text-main)] drop-shadow-sm`}>{s.val}</span>
                </div>
              ))}
              <div className="col-span-2 bg-[var(--bg-overlay)] border border-[var(--border-color)] backdrop-blur-md rounded-md p-4 flex items-center justify-between shadow-lg">
                <span className="text-[9px] font-space-mono uppercase tracking-widest text-[var(--text-faint)]">System Memory</span>
                <div className="w-1/2 h-1.5 bg-[var(--bg-base)] rounded-sm overflow-hidden shadow-inner">
                  <div className={`h-full bg-[rgb(var(--rgb-accent-main))] w-[68%] shadow-[0_0_8px_rgba(var(--rgb-accent-main),0.8)]`} />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 drop-shadow-sm">
              <Settings size={12} className="text-[rgb(var(--rgb-accent-main))]" /> Interface Commands
            </h3>
            <div className="flex flex-col gap-3">
              <button className={`w-full py-3 rounded-md border border-[rgba(var(--rgb-accent-main),0.5)] bg-[rgba(var(--rgb-accent-main),0.1)] text-[rgb(var(--rgb-accent-main))] text-[10px] font-space-mono uppercase tracking-widest font-bold hover:bg-[rgba(var(--rgb-accent-main),0.2)] transition-all shadow-[0_0_20px_rgba(var(--rgb-accent-main),0.2)] backdrop-blur-md`}>
                Override Directives
              </button>
              <button className="w-full py-3 rounded-md border border-[var(--border-color)] bg-[var(--bg-overlay)] backdrop-blur-md text-[var(--text-muted)] text-[10px] font-space-mono uppercase tracking-widest hover:text-[var(--text-main)] hover:bg-[var(--border-highlight)] transition-all shadow-lg">
                Ping Node
              </button>
            </div>
          </section>
        </div>
      </LobsterScrollArea>
    </motion.div>
  );
};

// --- GLOBAL RIPPLE COMPONENT ---
const Ripple = ({ x, y }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0.8, borderWidth: '2px' }}
    animate={{ scale: 15, opacity: 0, borderWidth: '0px' }}
    transition={{ duration: 1.2, ease: "easeOut" }}
    style={{
      position: 'fixed',
      left: x,
      top: y,
      width: '100px',
      height: '100px',
      marginLeft: '-50px',
      marginTop: '-50px',
      borderRadius: '50%',
      borderColor: 'rgba(var(--rgb-accent-main), 0.8)',
      borderStyle: 'solid',
      pointerEvents: 'none',
      zIndex: 5,
      boxShadow: '0 0 20px rgba(var(--rgb-accent-main), 0.5) inset'
    }}
  />
);

// --- HOLOGRAPHIC DIGITAL LOBSTER SWIRL ---
const DigitalLobsterSwirl = () => {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center group">
      {/* Concentric Swirl Rings */}
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border border-dashed border-[var(--text-muted)] rounded-full opacity-40 pointer-events-none" />
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute inset-[4px] border border-dotted border-[rgb(var(--rgb-accent-main))] rounded-full opacity-70 pointer-events-none" />

      {/* Central Abstract Lobster */}
      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="relative text-[rgb(var(--rgb-accent-main))] drop-shadow-[0_0_8px_rgba(var(--rgb-accent-main),0.8)] pointer-events-none z-10">
        <svg width="18" height="22" viewBox="0 0 24 36" fill="none">
          <path d="M 6 12 C 0 8 0 0 6 4 C 12 6 8 12 8 14 Z" fill="currentColor" />
          <path d="M 18 12 C 24 8 24 0 18 4 C 12 6 16 12 16 14 Z" fill="currentColor" />
          <path d="M 10 10 L 8 4 M 14 10 L 16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="8" y="12" width="8" height="14" rx="2" fill="currentColor" />
          <path d="M 8 25 L 5 32 L 12 30 L 19 32 L 16 25 Z" fill="currentColor" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </div>
  );
};

// --- FLOATING COMMAND CENTER WIDGET ---
const CommandCenterWidget = () => {
  return (
    <div className="flex flex-row items-stretch justify-center mb-10 relative z-20 mt-4 gap-3">

      {/* Box 1: The Round Table Title */}
      <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] p-5 rounded-sm shadow-lg flex flex-col items-start justify-center relative overflow-hidden group min-w-[260px]">
        <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
        <NodeCorner position="tl" /><NodeCorner position="tr" /><NodeCorner position="bl" /><NodeCorner position="br" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[var(--border-highlight)] to-transparent opacity-80" />

        <h1 className="text-xl font-bold font-space-grotesk text-[var(--text-main)] uppercase tracking-[0.2em] relative z-10 flex items-center gap-3">
          <Terminal size={16} className="text-[rgb(var(--rgb-accent-main))]" /> The Round Table
        </h1>
        <p className="text-[8px] font-space-mono text-[var(--text-faint)] uppercase tracking-[0.4em] mt-1 relative z-10">
          SYS.DEPLOY // DIGITAL_KNIGHTS
        </p>
      </div>

      {/* Box 2: Access Interface (Digital Swirl) */}
      <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] p-4 rounded-sm shadow-lg flex flex-col items-center justify-center relative cursor-pointer group hover:bg-[var(--bg-overlay)] hover:border-[var(--border-highlight)] transition-all min-w-[140px]">
        <NodeCorner position="tl" /><NodeCorner position="br" />
        <DigitalLobsterSwirl />
        <span className="text-[7px] font-space-mono text-[var(--text-faint)] uppercase tracking-widest mt-3 group-hover:text-[rgb(var(--rgb-accent-main))] transition-colors">
          Command Center
        </span>
      </div>

      {/* Box 3: Deploy Night Action */}
      <button className="bg-[rgba(var(--rgb-accent-main),0.05)] backdrop-blur-xl border border-[rgb(var(--rgb-accent-main))] p-4 rounded-sm shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.1)] hover:bg-[rgba(var(--rgb-accent-main),0.15)] hover:shadow-[0_0_20px_rgba(var(--rgb-accent-main),0.3)] transition-all flex flex-col items-center justify-center relative group min-w-[140px] cursor-pointer">
        <NodeCorner position="tr" /><NodeCorner position="bl" />
        <div className="text-[rgb(var(--rgb-accent-main))] group-hover:scale-110 group-hover:-translate-y-1 transition-transform mb-3 drop-shadow-[0_0_8px_rgba(var(--rgb-accent-main),0.8)]">
          <Sword size={26} strokeWidth={1.5} />
        </div>
        <span className="text-[9px] font-space-mono text-[rgb(var(--rgb-accent-main))] uppercase tracking-widest font-bold">
          Deploy Night
        </span>
      </button>

    </div>
  );
};

// --- MAIN APP COMPONENT ---
// (We change 'export default function App' to 'export default function RoundTableView')
export default function RoundTableView() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [ripples, setRipples] = useState([]);
  const canvasRef = useRef(null);

  const handleNodeSelect = (node, event) => {
    setSelectedNode(node);
    if (event) {
      const newRipple = { id: Date.now(), x: event.clientX, y: event.clientY };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 1500);
    }
  };

  return (
    <div className="w-full h-full relative" style={{ minHeight: '100%', display: 'flex' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-tech-grid {
          background-image: linear-gradient(var(--tech-grid) 1px, transparent 1px), linear-gradient(90deg, var(--tech-grid) 1px, transparent 1px);
          background-size: 40px 40px; 
          transition: background-image 0.5s ease;
        }
        .globular-blob { filter: url('#goo'); }
        .hover-spotlight { position: relative; }
        .hover-spotlight::before {
          content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
          background: radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255, 0.2), transparent 40%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: 0; transition: opacity 0.5s; pointer-events: none; z-index: 20;
        }
        .hover-spotlight:hover::before { opacity: 1; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}} />

      {/* Hidden SVG Filter definition for gooey/globular effect */}
      <svg className="hidden">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div
        className="relative flex flex-col h-full w-full overflow-hidden transition-colors duration-700 ease-in-out flex-1"
        onMouseMove={(e) => {
          if (!canvasRef.current) return;
          canvasRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
          canvasRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
        }}
      >

        {/* HOLOGRAPHIC AMBIENT BACKGROUND BLOBS */}
        <div className="absolute inset-0 opacity-100 globular-blob flex items-center justify-center pointer-events-none z-0">
          <motion.div animate={{ scale: [1, 1.2, 0.9, 1], rotate: [0, 90, 180, 360], borderRadius: ["40%", "60%", "30%", "40%"] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-[60vw] h-[60vw] bg-[var(--blob-1)] absolute transition-colors duration-700 blur-3xl mix-blend-screen" />
          <motion.div animate={{ scale: [0.9, 1.5, 1, 0.9], rotate: [360, 180, 90, 0], borderRadius: ["50%", "30%", "50%", "50%"] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="w-[50vw] h-[50vw] bg-[var(--blob-2)] absolute translate-x-1/4 transition-colors duration-700 blur-3xl mix-blend-screen" />
          <motion.div animate={{ y: [0, -100, 0], x: [0, 50, 0], scale: [1, 0.8, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="w-[30vw] h-[30vw] bg-[var(--blob-3)] absolute translate-y-1/3 transition-colors duration-700 blur-2xl rounded-full mix-blend-screen" />
        </div>

        <div className="absolute inset-0 bg-tech-grid pointer-events-none z-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-base)] via-transparent to-[var(--bg-base)] opacity-80 pointer-events-none z-0" />

        {/* Global Ripples */}
        <AnimatePresence>
          {ripples.map(r => <Ripple key={r.id} x={r.x} y={r.y} />)}
        </AnimatePresence>

        {/* Infinite Panning Canvas Area */}
        <div className="flex-1 relative overflow-hidden cursor-move active:cursor-grabbing z-10 w-full h-full min-h-[600px]" ref={canvasRef}>

          {/* Instructions Tag */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[var(--bg-panel)] backdrop-blur-xl border border-[var(--border-color)] px-6 py-2.5 rounded-full text-[10px] font-space-mono uppercase tracking-widest text-[var(--text-muted)] shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-20 pointer-events-none flex items-center gap-3">
            <Search size={14} className="text-[rgb(var(--rgb-accent-main))]" /> Drag to Pan • Click Node to Inspect
          </div>

          <motion.div
            drag
            dragConstraints={canvasRef}
            dragElastic={0.2}
            initial={{ x: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[2500px] h-[1500px] flex flex-col items-center justify-start pt-8 pb-32" style={{ marginLeft: '-700px' }}
          >
            {/* Floating Title Box mapped to original sketch */}
            <CommandCenterWidget />

            {/* The Entire Generated Tree Rendered Here */}
            <TreeRender node={NETWORK_DATA} onSelect={handleNodeSelect} selectedId={selectedNode?.id} />
          </motion.div>
        </div>

        {/* Side Inspector Panel */}
        <AnimatePresence>
          {selectedNode && (
            <InspectorPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
