import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Users, Brain, Zap, MessageSquare, Search, Plus, Settings, ChevronDown } from 'lucide-react';

// Knight SVG components
import SirClawthchilds from './knights/SirClawthchilds';
import Claudnelius from './knights/Claudnelius';
import ShrimpSoldier from './knights/ShrimpSoldier';
import Labrina from './knights/Labrina';
import KnaightOfAffairs from './knights/KnaightOfAffairs';
import KnowledgeKnaight from './knights/KnowledgeKnaight';
import Clawdette from './knights/Clawdette';

// Animation utils
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Crosshair
const Crosshair = ({ className = '' }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" className={`absolute text-[var(--text-faint)] transition-colors duration-500 pointer-events-none z-20 ${className}`} fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M5 0v10M0 5h10" />
  </svg>
);

// Knight themes
const knightThemes = {
  'clawdette': { name: 'Queen Clawdette', title: 'CEO of the Empire', color: 'text-orange-500', border: 'border-orange-500/30', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]', gradient: 'from-orange-500/20 to-red-500/10', accent: '#f97316' },
  'knowledge-knaight': { name: 'Knowledge Knaight', title: 'Memory Keeper', color: 'text-purple-500', border: 'border-purple-500/30', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]', gradient: 'from-purple-500/20 to-indigo-500/10', accent: '#a855f7' },
  'affairs-knaight': { name: 'Knaight of Affairs', title: 'Schedule Guardian', color: 'text-cyan-500', border: 'border-cyan-500/30', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]', gradient: 'from-cyan-500/20 to-blue-500/10', accent: '#06b6d4' },
  'clawthchilds': { name: 'Sir Clawthchilds', title: 'Bull Market Warrior', color: 'text-yellow-500', border: 'border-yellow-500/30', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.3)]', gradient: 'from-yellow-500/20 to-amber-500/10', accent: '#eab308' },
  'claudnelius': { name: 'Claudnelius', title: 'Code Wizard', color: 'text-green-500', border: 'border-green-500/30', glow: 'shadow-[0_0_30px_rgba(34,197,94,0.3)]', gradient: 'from-green-500/20 to-emerald-500/10', accent: '#22c55e' },
  'labrina': { name: 'Labrina', title: 'Social Maven', color: 'text-pink-500', border: 'border-pink-500/30', glow: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]', gradient: 'from-pink-500/20 to-rose-500/10', accent: '#ec4899' },
  'shrimp-soldier': { name: 'Shrimp Soldier', title: 'Idea Collector', color: 'text-cyan-400', border: 'border-cyan-400/30', glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]', gradient: 'from-cyan-500/20 to-blue-600/10', accent: '#22d3ee' }
};

// PNG avatar mappings - using user's actual knight PNGs
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

// Knight Card
const KnightCard = ({ knightId, isSelected, onClick }) => {
  const theme = knightThemes[knightId];
  const KnightSVG = knightSVGs[knightId];
  
  return (
    <motion.div variants={staggerItem} onClick={onClick} className={`relative cursor-pointer group transition-all duration-500 ${isSelected ? 'scale-105' : 'hover:scale-102'}`}>
      <div className={`absolute inset-0 rounded-[2.5rem] bg-gradient-to-br ${theme.gradient} opacity-0 ${isSelected ? 'opacity-100' : 'group-hover:opacity-50'} transition-all duration-500 blur-xl`} />
      <div className={`relative bg-[var(--bg-card)] border rounded-[2.5rem] p-6 transition-all duration-500 ${isSelected ? `${theme.border} ${theme.glow}` : 'border-[var(--border-color)] hover:border-[var(--border-highlight)]'}`}>
        <Crosshair className="-top-[5px] -left-[5px]" />
        <Crosshair className="-top-[5px] -right-[5px]" />
        <Crosshair className="-bottom-[5px] -left-[5px]" />
        <Crosshair className="-bottom-[5px] -right-[5px]" />
        
        <div className="relative mb-6 flex justify-center">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 transition-all duration-500" style={{ borderColor: theme.accent }}>
            <img src={`/avatars/${knightPNGs[knightId]}`} alt={theme.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              {KnightSVG && <div className="w-16 h-16"><KnightSVG /></div>}
            </div>
          </div>
          <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[var(--bg-card)] ${isSelected ? 'animate-pulse' : ''}`} />
        </div>
        
        <div className="text-center">
          <h3 className={`text-base font-bold font-space-grotesk mb-1 ${theme.color}`}>{theme.name}</h3>
          <p className="text-[10px] font-space-mono uppercase tracking-widest text-[var(--text-muted)]">{theme.title}</p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex justify-between">
          <div className="text-center">
            <div className="text-lg font-bold font-space-grotesk text-[var(--text-main)]">12</div>
            <div className="text-[8px] font-space-mono uppercase tracking-widest text-[var(--text-faint)]">Entries</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold font-space-grotesk text-[var(--text-main)]">5</div>
            <div className="text-[8px] font-space-mono uppercase tracking-widest text-[var(--text-faint)]">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold font-space-grotesk text-green-500">98%</div>
            <div className="text-[8px] font-space-mono uppercase tracking-widest text-[var(--text-faint)]">Uptime</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main View
export default function RoundTableView() {
  const [selectedKnight, setSelectedKnight] = useState('knowledge-knaight');
  const knights = ['clawdette', 'knowledge-knaight', 'affairs-knaight', 'clawthchilds', 'claudnelius', 'labrina', 'shrimp-soldier'];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="h-full flex flex-col space-y-6 relative overflow-hidden">
      {/* User PNG Background - full cover, low opacity */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-25">
        <img src="/avatars/269bd57c-88ba-4d02-9b70-40511a27d1bc.png" alt="" className="w-full h-full object-contain object-center" />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--logo-bg)] text-[var(--logo-text)] flex items-center justify-center font-bold font-space-mono shadow-[0_0_20px_var(--border-highlight)]">
            <Crown size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-space-grotesk text-[var(--text-main)] uppercase tracking-widest flex items-center gap-3">
              The Round Table
              <span className="text-[rgb(var(--rgb-accent-main))]">2026</span>
            </h2>
            <p className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-[0.2em]">Your Council of Digital Knights</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all bg-transparent text-[var(--text-main)] border border-[var(--border-color)] hover:border-[rgb(var(--rgb-accent-main))]">
            <Plus size={16} /> Summon Knight
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Total Knights', value: '7', color: 'text-[var(--text-main)]' },
          { label: 'Active Agents', value: '6', color: 'text-green-500' },
          { label: 'Memory Entries', value: '47', color: 'text-[var(--text-main)]' },
          { label: 'System Uptime', value: '99.2%', color: 'text-[rgb(var(--rgb-accent-main))]' }
        ].map((stat, i) => (
          <motion.div key={i} variants={staggerItem} className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-5 text-center !py-6">
            <div className={`text-2xl font-bold font-space-grotesk ${stat.color}`}>{stat.value}</div>
            <div className="text-[9px] font-space-mono uppercase tracking-widest text-[var(--text-muted)]">{stat.label}</div>
          </motion.div>
        ))}
      </div>
      
      {/* Knights Hierarchy with Wires */}
      <div className="flex-1 overflow-hidden relative">
        {/* Wire Connections SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.3 }}>
          {/* Queen to Claudneius */}
          <path d="M 120 80 Q 200 60 280 80" stroke="url(#wireGradient)" strokeWidth="2" fill="none" />
          {/* Queen to Knowledge Knight */}
          <path d="M 120 80 Q 200 120 360 100" stroke="url(#wireGradient)" strokeWidth="2" fill="none" />
          {/* Queen to Affairs */}
          <path d="M 120 80 Q 200 140 520 100" stroke="url(#wireGradient)" strokeWidth="2" fill="none" />
          {/* Knowledge Knight to Sir Clawthchilds */}
          <path d="M 360 100 Q 360 180 360 220" stroke="url(#wireGradient)" strokeWidth="2" fill="none" />
          {/* Affairs to Sir Clawthchilds */}
          <path d="M 520 100 Q 520 180 440 220" stroke="url(#wireGradient)" strokeWidth="2" fill="none" />
          {/* Sir Clawthchilds to Labrina */}
          <path d="M 360 220 Q 360 300 280 340" stroke="url(#wireGradient)" strokeWidth="2" fill="none" />
          {/* Sir Clawthchilds to Shrimp */}
          <path d="M 440 220 Q 520 280 520 340" stroke="url(#wireGradient)" strokeWidth="2" fill="none" />
          <defs>
            <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--rgb-accent-main))" />
              <stop offset="100%" stopColor="rgb(var(--rgb-accent-sec))" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Hierarchy Grid - Positioned Knights */}
        <div className="relative z-10 w-full h-full">
          {/* Row 1: Queen + Claudneius */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-32">
            {/* Queen Clawdette */}
            <div className="flex flex-col items-center">
              <img src="/avatars/269bd57c-88ba-4d02-9b70-40511a27d1bc.png" alt="Queen Clawdette" className="w-24 h-24 object-contain" />
              <div className="mt-2 w-12 h-12"><Clawdette /></div>
            </div>
            {/* Claudneius */}
            <div className="flex flex-col items-center">
              <img src="/avatars/c44a0f21-6530-4e4b-8eb7-a27c8674299b.png" alt="Claudneius" className="w-24 h-24 object-contain" />
              <div className="mt-2 w-12 h-12"><Claudnelius /></div>
            </div>
          </div>
          
          {/* Row 2: Knowledge Knight + Affairs */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-64">
            <div className="flex flex-col items-center">
              <img src="/avatars/2c45e97d-c391-4d77-9778-821e2dee82d6.png" alt="Knowledge Knaight" className="w-20 h-20 object-contain" />
              <div className="mt-2 w-10 h-10"><KnowledgeKnaight /></div>
            </div>
            <div className="flex flex-col items-center">
              <img src="/avatars/8cd7f326-500b-4757-bca1-132886fc8c76.png" alt="Knaight of Affairs" className="w-20 h-20 object-contain" />
              <div className="mt-2 w-10 h-10"><KnaightOfAffairs /></div>
            </div>
          </div>
          
          {/* Row 3: Sir Clawthchilds */}
          <div className="absolute top-48 left-1/2 -translate-x-1/2 flex justify-center">
            <div className="flex flex-col items-center">
              <img src="/avatars/99f2a89b-8c51-4078-af63-10046a333434.png" alt="Sir Clawthchilds" className="w-20 h-20 object-contain" />
              <div className="mt-2 w-10 h-10"><SirClawthchilds /></div>
            </div>
          </div>
          
          {/* Row 4: Labrina + Shrimp Soldier */}
          <div className="absolute top-72 left-1/2 -translate-x-1/2 flex gap-32">
            <div className="flex flex-col items-center">
              <img src="/avatars/6f9d0fbf-6011-471b-8740-397b7eeb708f.png" alt="Labrina" className="w-16 h-16 object-contain" />
              <div className="mt-2 w-8 h-8"><Labrina /></div>
            </div>
            <div className="flex flex-col items-center">
              <img src="/avatars/a3010206-b78c-4da9-8971-f83294efe9a6.png" alt="Shrimp Soldier" className="w-16 h-16 object-contain" />
              <div className="mt-2 w-8 h-8"><ShrimpSoldier /></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Selected Knight Panel */}
      {selectedKnight && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="shrink-0 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] p-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              <span className="text-[10px] font-space-mono uppercase tracking-widest text-green-500">Online</span>
            </div>
            <div className="h-8 w-[1px] bg-[var(--border-color)]" />
            <div>
              <div className="text-sm font-bold font-space-grotesk text-[var(--text-main)]">{knightThemes[selectedKnight].name}</div>
              <div className="text-[9px] font-space-mono text-[var(--text-muted)]">Last active: 2 minutes ago</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-overlay)]">
              <MessageSquare size={16} /> Message
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all bg-[var(--logo-bg)] text-[var(--logo-text)] shadow-[0_0_15px_var(--border-highlight)]">
              <Settings size={16} /> Configure
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
