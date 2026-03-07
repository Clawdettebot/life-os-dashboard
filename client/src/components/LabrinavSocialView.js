import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, FileText, Image as ImageIcon, Music, Archive,
  Activity, Zap, Search, Plus,
  ChevronRight, ChevronLeft, Clock, X,
  ArrowRight, Radio, Share2, PenTool, Database, CornerUpLeft, ArrowUpRight
} from 'lucide-react';

const IDEA_STAGES = [
  { id: 's1', label: 'Raw Drop', desc: 'Voice/Text dumps' },
  { id: 's2', label: 'Expanding', desc: 'Adding context' },
  { id: 's3', label: 'Drafting Phase', desc: 'Structuring content' },
  { id: 's4', label: 'Review & Polish', desc: 'Final edits' },
  { id: 's5', label: 'Scheduled', desc: 'Awaiting release' },
  { id: 's6', label: 'Published', desc: 'Live in the wild' }
];

const IDEAS_DB = {
  's1': [
    { id: 'i1', title: 'Stage Design Mockup', date: '2 hrs ago', type: 'Concept' },
    { id: 'i2', title: 'Midnight Studio Session Note', date: '5 hrs ago', type: 'Audio' }
  ],
  's2': [
    { id: 'i3', title: 'Merch: "Scamboy" Overcoat', date: 'Yesterday', type: 'Physical' },
    { id: 'i4', title: 'Pop-up Shop Menu Ideas', date: '2 days ago', type: 'Concept' }
  ],
  's3': [
    { id: 'i5', title: 'Unified Desktop OS Interface', date: 'Active', type: 'Digital' },
    { id: 'i9', title: 'Interactive Content Grid', date: 'Active', type: 'UI/UX' }
  ],
  's4': [
    { id: 'i6', title: 'Q1 Financial Review Post', date: 'Awaiting Approval', type: 'Blog' }
  ],
  's5': [
    { id: 'i7', title: 'Champagne Showers Teaser', date: 'Releasing Mar 15', type: 'Video' }
  ],
  's6': [
    { id: 'i8', title: 'Eating Handsome: Bay Area', date: 'Live', type: 'Blog' }
  ]
};

const INITIAL_DRIVE_FS = [
  { id: 'd1', name: 'Brand Assets', type: 'folder', path: '/', updatedAt: '2026-03-05', size: 'DIR' },
  { id: 'd2', name: 'Financials_Q1', type: 'folder', path: '/', updatedAt: '2026-02-28', size: 'DIR' },
  { id: 'd3', name: 'Raw_Footage', type: 'folder', path: '/', updatedAt: '2026-03-01', size: 'DIR' },
  { id: 'd4', name: 'Music_Stems', type: 'folder', path: '/', updatedAt: '2026-03-06', size: 'DIR' },
  { id: 'f1', name: 'Main_Logo_Dark.png', type: 'image', path: '/Brand Assets', size: '4.2 MB', updatedAt: '2026-01-15' },
  { id: 'f2', name: 'Main_Logo_Light.png', type: 'image', path: '/Brand Assets', size: '3.8 MB', updatedAt: '2026-01-15' },
  { id: 'f3', name: 'Vector_Pack.zip', type: 'archive', path: '/Brand Assets', size: '124 MB', updatedAt: '2026-01-20' },
  { id: 'f4', name: 'Show_Intro_Stem.wav', type: 'music', path: '/Music_Stems', size: '45 MB', updatedAt: '2026-03-05' },
  { id: 'f5', name: 'Q1_Budget_Export.csv', type: 'file', path: '/Financials_Q1', size: '1.2 MB', updatedAt: '2026-02-28' },
];

const INITIAL_BLOG_DRAFTS = [
  { id: 'b1', title: 'Eating Handsome: Bay Area', status: 'DRAFT', words: 1240, date: 'Mar 4', content: "There is a difference between eating and eating Handsome. Anybody can fill a plate. Not everybody lives with taste, swagg, and intention..." },
  { id: 'b2', title: 'The Evolution of the 16-Bar Verse', status: 'REVIEW', words: 890, date: 'Mar 2', content: "The rhythmic architect's guide to painting on a 16-bar canvas. It starts with the snare..." },
  { id: 'b3', title: 'Voice Note: Midnight Studio', status: 'RAW', duration: '04:23', date: 'Just Now', content: "[Audio Transcription] Yeah so the 808 needs to hit harder on the drop, and let's bring the vocals up..." },
  { id: 'b4', title: 'From the Bronx to the Cloud', status: 'PUBLISHED', words: 3400, date: 'Feb 28', content: "50 years of Hip-Hop and the digital revolution. How we went from tape decks to pure cloud streaming..." },
  { id: 'b5', title: 'Tour Prep: Hydration Protocols', status: 'DRAFT', words: 450, date: 'Mar 5', content: "Staying hydrated on the road is impossible if you don't plan ahead..." },
];

// Reusable Components
const Modal = ({ isOpen, onClose, title, children, icon: Icon }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(8px)" }} exit={{ opacity: 0, backdropFilter: "blur(0px)" }} className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/40" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)] bg-[var(--bg-panel)]">
            <h3 className="text-xs font-bold uppercase tracking-widest font-space-mono text-[var(--text-main)] flex items-center gap-3">
              {Icon && <Icon size={16} className="text-[rgb(var(--rgb-accent-main))]" />} {title}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-[var(--bg-overlay)] rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"><X size={16} /></button>
          </div>
          <div className="p-6 md:p-8 overflow-y-auto flex-1">
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const BadgeRenderer = ({ status, inverts = false }) => {
  if (!status) return null;
  let styles = inverts ? 'bg-[var(--bg-base)] text-[var(--text-main)] border-[var(--text-main)]' : 'bg-[var(--bg-overlay)] text-[var(--text-muted)] border-[var(--border-color)]';
  if (status === 'ACTIVE' || status === 'PUBLISHED') styles = inverts ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 'bg-[rgba(16,185,129,0.1)] text-[#10b981] border-[rgba(16,185,129,0.3)] shadow-[0_0_10px_rgba(16,185,129,0.1)]';
  if (status === 'DRAFT' || status === 'RAW') styles = inverts ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30' : 'bg-[rgba(234,179,8,0.1)] text-[#eab308] border-[rgba(234,179,8,0.3)] shadow-[0_0_10px_rgba(234,179,8,0.1)]';
  if (status === 'REVIEW' || status === 'SCHEDULED') styles = inverts ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30' : 'bg-[rgba(34,211,238,0.1)] text-[#06b6d4] border-[rgba(34,211,238,0.3)] shadow-[0_0_10px_rgba(34,211,238,0.1)]';
  return <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[7px] md:text-[8px] font-space-mono uppercase tracking-widest border font-bold ${styles}`}>{status}</span>;
};

// Sub-modules
const ReleaseCountdownModule = ({ release }) => {
  const targetDate = release ? new Date(release.date) : new Date('2026-03-25');
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = targetDate - now;
      if (diff > 0) {
        return {
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / (1000 * 60)) % 60),
          s: Math.floor((diff / 1000) % 60)
        };
      }
      return { d: 0, h: 0, m: 0, s: 0 };
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  const [timeLeft, setTimeLeft] = useState({ d: 14, h: 8, m: 45, s: 12 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { d, h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; d--; }
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hover-spotlight bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] p-8 shadow-sm flex flex-col justify-between h-full hover:border-[var(--border-highlight)] transition-colors relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(var(--rgb-accent-main),0.05)] rounded-full blur-3xl pointer-events-none group-hover:bg-[rgba(var(--rgb-accent-main),0.1)] transition-colors" />
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[rgb(var(--rgb-accent-main))] text-white rounded-full shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.3)]"><Zap size={16} /></div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest block text-[var(--text-main)]">Next Major Release</span>
            <span className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase">{release?.name || 'Next Release'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-[var(--text-main)] text-[var(--bg-base)] rounded-full text-[10px] font-bold flex items-center gap-1"><Radio size={10} /> LIVE</div>
        </div>
      </div>

      <div className="flex items-baseline gap-2 md:gap-4 my-6 relative z-10 flex-wrap">
        <div className="text-[50px] md:text-[70px] lg:text-[80px] font-bold tracking-tighter leading-none font-space-mono flex items-baseline text-[var(--text-main)]">
          {String(timeLeft.d).padStart(2, '0')}<span className="text-2xl md:text-4xl text-[var(--text-faint)] mx-1">:</span>
          {String(timeLeft.h).padStart(2, '0')}<span className="text-2xl md:text-4xl text-[var(--text-faint)] mx-1">:</span>
          {String(timeLeft.m).padStart(2, '0')}<span className="text-2xl md:text-4xl text-[rgb(var(--rgb-accent-main))] mx-1 animate-pulse drop-shadow-[0_0_8px_rgba(var(--rgb-accent-main),0.8)]">:</span>
          <span className="text-[rgb(var(--rgb-accent-main))] drop-shadow-[0_0_8px_rgba(var(--rgb-accent-main),0.5)]">{String(timeLeft.s).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="mb-6 relative z-10">
        <div className="text-[10px] font-space-mono uppercase text-[var(--text-muted)] mb-3 flex items-center gap-2">
          <Share2 size={12} /> Pre-Release Content Drops
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[
            { platform: 'TikTok', type: 'Snippet Tease', time: '-12 Days', active: true },
            { platform: 'Instagram', type: 'BTS Photos', time: '-7 Days', active: false },
            { platform: 'Twitter', type: 'Lyric Drop', time: '-3 Days', active: false },
            { platform: 'YouTube', type: 'Music Video Premiere', time: 'Launch', active: false }
          ].map((item, i) => (
            <div key={i} className={`shrink-0 px-5 py-4 rounded-2xl border transition-all ${item.active ? 'bg-[var(--text-main)] text-[var(--bg-base)] border-[var(--text-main)] shadow-[0_0_15px_var(--border-highlight)]' : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--border-highlight)]'}`}>
              <div className={`text-[9px] font-space-mono uppercase tracking-widest mb-1 ${item.active ? 'opacity-70' : 'text-[var(--text-muted)]'}`}>{item.time}</div>
              <div className="text-xs font-bold whitespace-nowrap">{item.type}</div>
              <div className={`text-[9px] font-space-mono uppercase mt-2 ${item.active ? 'text-[rgb(var(--rgb-accent-main))] font-bold' : 'text-[var(--text-faint)]'}`}>{item.platform}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SocialStatsModule = () => (
  <div className="hover-spotlight bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] p-6 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-[var(--border-highlight)] transition-colors h-full">
    <div className="flex justify-between items-center w-full relative z-10">
      <div className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-widest">social.metrics</div>
      <div className="text-[10px] font-space-mono text-[var(--text-muted)] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse shadow-[0_0_8px_#10b981]" /> LIVE</div>
    </div>
    <div className="flex justify-between items-start mt-6 relative z-10">
      <div className="text-5xl md:text-6xl font-bold leading-none font-space-mono tracking-tighter flex items-start text-[var(--text-main)]">
        17.5<span className="text-2xl text-[var(--text-faint)] mt-1 ml-1">M</span> <div className="w-2 h-2 bg-[rgb(var(--rgb-accent-main))] rounded-full mt-3 ml-2 shadow-[0_0_8px_rgba(var(--rgb-accent-main),0.8)]" />
      </div>
      <div className="w-10 h-10 bg-[var(--bg-panel)] border border-[var(--border-color)] text-[var(--text-main)] rounded-full flex items-center justify-center shrink-0"><Activity size={16} /></div>
    </div>
    <div className="absolute bottom-20 left-6 right-6 h-12 flex items-end gap-[2px] opacity-10">
      {[...Array(20)].map((_, i) => (
        <div key={i} className="flex-1 bg-[var(--text-main)] rounded-t-sm" style={{ height: `${Math.max(10, Math.pow(i / 4, 2))}%` }} />
      ))}
    </div>
    <div className="grid grid-cols-2 gap-3 mt-8 relative z-10">
      <div className="bg-[var(--bg-panel)] p-3 rounded-xl flex flex-col justify-between h-16 border border-[var(--border-color)]">
        <span className="text-[8px] font-space-mono uppercase text-[var(--text-muted)]">Retention</span>
        <div className="text-xl font-bold font-space-mono flex justify-between items-end text-[var(--text-main)]">
          68% <span className="text-[8px] text-[#10b981]">▲</span>
        </div>
      </div>
      <div className="bg-[var(--bg-panel)] p-3 rounded-xl flex flex-col justify-between h-16 border border-[var(--border-color)]">
        <span className="text-[8px] font-space-mono uppercase text-[var(--text-muted)]">Conversion</span>
        <div className="text-xl font-bold font-space-mono flex justify-between items-end text-[var(--text-main)]">
          15% <span className="text-[8px] text-red-500">▼</span>
        </div>
      </div>
    </div>
  </div>
);

const SocialAnalyticsChart = () => (
  <div className="hover-spotlight bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] p-6 shadow-sm flex flex-col relative group hover:border-[var(--border-highlight)] transition-colors duration-500 h-full">
    <div className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-widest mb-2 flex justify-between">
      <span>Audience Split</span>
      <span className="text-[var(--text-faint)]">{`{0011}`}</span>
    </div>
    <h2 className="text-xl font-bold leading-tight mb-4 text-[var(--text-main)]">Content Performance</h2>
    <div className="flex-1 flex items-center justify-center relative my-2">
      <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
        <motion.circle cx="50" cy="50" r="35" fill="none" stroke="var(--bg-panel)" strokeWidth="20" />
        <motion.circle cx="50" cy="50" r="35" fill="none" stroke="rgb(var(--rgb-accent-main))" strokeWidth="20" strokeDasharray="219.9" initial={{ strokeDashoffset: 219.9 }} animate={{ strokeDashoffset: 219.9 - (219.9 * 0.72) }} transition={{ duration: 1.5, ease: "easeOut" }} className="drop-shadow-[0_0_10px_rgba(var(--rgb-accent-main),0.5)]" />
        <motion.circle cx="50" cy="50" r="35" fill="none" stroke="rgba(var(--rgb-accent-main),0.3)" strokeWidth="20" strokeDasharray="219.9" initial={{ strokeDashoffset: 219.9 }} animate={{ strokeDashoffset: 219.9 - (219.9 * 0.28) }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-bold font-space-mono text-[var(--text-main)]">72%</span>
        <span className="text-[7px] uppercase tracking-widest text-[var(--text-muted)] font-space-mono">Video</span>
      </div>
    </div>
    <div className="grid grid-cols-2 mt-4 border-t border-[var(--border-color)] pt-4">
      <div className="border-r border-[var(--border-color)] pr-3">
        <span className="text-[9px] text-[var(--text-muted)] font-space-mono uppercase block mb-1">Static</span>
        <span className="text-xl font-space-mono font-bold text-[var(--text-main)]">28<span className="text-xs text-[var(--text-faint)]">%</span></span>
      </div>
      <div className="pl-3 text-right">
        <span className="text-[9px] text-[var(--text-muted)] font-space-mono uppercase block mb-1">Reels</span>
        <span className="text-2xl font-space-mono font-bold text-[rgb(var(--rgb-accent-main))] drop-shadow-[0_0_8px_rgba(var(--rgb-accent-main),0.3)]">72<span className="text-sm opacity-50">%</span></span>
      </div>
    </div>
  </div>
);

const IdeaBankModule = ({ onOpenIdea }) => {
  const [activePhase, setActivePhase] = useState(IDEA_STAGES[2]);
  // Real ideas from Supabase
  const [ideasFromAPI, setIdeasFromAPI] = useState(null);
  
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const res = await fetch('https://pvavybczlrhwagasriwu.supabase.co/rest/v1/lifeos_notes?section=eq.labrina-ideas&order=created_at.desc&limit=20', {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YXZ5YmN6bHJod2FnYXNyaXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMzUyMzIsImV4cCI6MjA3MDgxMTIzMn0.Y0vL36TCuE8QYFpEbVBKzLYazowtYneUpOkSTk3RkZg',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YXZ5YmN6bHJod2FnYXNyaXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMzUyMzIsImV4cCI6MjA3MDgxMTIzMn0.Y0vL36TCuE8QYFpEbVBKzLYazowtYneUpOkSTk3RkZg'
          }
        });
        const data = await res.json();
        const ideasByStage = { 's1': [], 's2': [], 's3': [], 's4': [], 's5': [], 's6': [] };
        data.forEach(idea => {
          ideasByStage['s1'].push({
            id: idea.id,
            title: idea.content ? idea.content.substring(0, 40) + '...' : 'Untitled',
            date: new Date(idea.created_at).toLocaleDateString(),
            type: idea.category || 'Concept'
          });
        });
        setIdeasFromAPI(ideasByStage);
      } catch (e) {
        console.error('Failed to fetch ideas:', e);
      }
    };
    fetchIdeas();
  }, []);
  
  const [ideaIndex, setIdeaIndex] = useState(0);
  const phaseIdeas = useMemo(() => ideasFromAPI ? ideasFromAPI[activePhase.id] : [] || [], [activePhase]);
  const activeIdea = phaseIdeas[ideaIndex];

  useEffect(() => { setIdeaIndex(0); }, [activePhase]);

  const nextIdea = (e) => { e.stopPropagation(); setIdeaIndex(prev => Math.min(phaseIdeas.length - 1, prev + 1)); };
  const prevIdea = (e) => { e.stopPropagation(); setIdeaIndex(prev => Math.max(0, prev - 1)); };

  return (
    <div className="hover-spotlight bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] p-8 shadow-sm relative overflow-hidden flex flex-col min-h-[500px]">
      <div className="flex justify-between items-start relative z-10">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold leading-tight mb-2 flex items-center gap-3 text-[var(--text-main)]">Let's get started.<br />Where are you on the journey?</h2>
          <div className="flex items-center gap-2 text-[rgb(var(--rgb-accent-sec))] text-[10px] font-bold font-space-mono tracking-widest bg-[rgba(var(--rgb-accent-sec),0.1)] border border-[rgba(var(--rgb-accent-sec),0.3)] px-3 py-1.5 rounded-full w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--rgb-accent-sec))] animate-ping" /> IDEATION ACTIVE
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase block font-bold">Pipeline Health</span>
          <span className="text-lg font-space-mono text-[var(--text-main)] font-bold block mt-1">24 Active Nodes</span>
        </div>
      </div>

      <div className="flex-1 relative mt-12 w-full h-full">
        <div className="absolute inset-0 left-[5%] md:left-[15%] pointer-events-none pb-12">
          <svg viewBox="0 0 500 300" className="w-full h-full overflow-visible" preserveAspectRatio="xMidYMid meet">
            <path d="M 0 0 V 200 A 30 30 0 0 0 30 230 H 150 A 30 30 0 0 0 180 200 V 100 A 30 30 0 0 1 210 70 H 350 A 30 30 0 0 1 380 100 V 150" fill="none" stroke="var(--border-color)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <motion.path d="M 0 0 V 200 A 30 30 0 0 0 30 230 H 150 A 30 30 0 0 0 180 200 V 100 A 30 30 0 0 1 210 70 H 350 A 30 30 0 0 1 380 100 V 150" fill="none" stroke="rgb(var(--rgb-accent-main))" strokeWidth="2" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="drop-shadow-[0_0_8px_rgba(var(--rgb-accent-main),0.8)]" />
          </svg>
        </div>

        <div className="absolute left-[5%] md:left-[15%] top-0 flex flex-col gap-2 -translate-x-1/2 bg-[var(--bg-card)]/80 backdrop-blur-md p-4 rounded-3xl z-10 border border-[var(--border-highlight)] shadow-[0_0_30px_rgba(0,0,0,0.2)]">
          {IDEA_STAGES.map((step) => {
            const isActive = activePhase.id === step.id;
            const nodeCount = (ideasFromAPI ? ideasFromAPI[step.id] : [] || []).length;
            return (
              <button key={step.id} onClick={() => setActivePhase(step)} className={`px-5 py-3 rounded-full text-[9px] md:text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-between min-w-[180px] md:min-w-[220px] group border ${isActive ? 'bg-[var(--text-main)] text-[var(--bg-base)] border-[var(--text-main)] shadow-[0_0_15px_var(--border-highlight)]' : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[rgb(var(--rgb-accent-main))]'}`}>
                <div className="flex items-center gap-2">
                  {step.label}
                  {nodeCount > 0 && !isActive && <span className="bg-[var(--bg-card)] px-1.5 py-0.5 rounded text-[8px] border border-[var(--border-color)]">{nodeCount}</span>}
                </div>
                {isActive ? <Activity size={14} className="text-[var(--bg-base)]" /> : <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:text-[rgb(var(--rgb-accent-main))] transition-all" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdea ? activeIdea.id : 'empty'}
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute right-[5%] md:right-[15%] top-[30%] md:top-[40%] bg-[rgb(var(--rgb-accent-main))] text-white rounded-[2.5rem] p-6 shadow-[0_0_30px_rgba(var(--rgb-accent-main),0.4)] flex flex-col items-start min-w-[240px] md:min-w-[280px] z-10 text-left border border-[rgba(var(--rgb-accent-main),0.5)] group"
          >
            <span className="text-[10px] font-space-mono uppercase tracking-widest text-white/80 mb-2 block flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {activeIdea ? `Phase: ${activePhase.label}` : 'Empty Phase'}
            </span>
            <span className="text-xl font-bold font-space-mono mb-1 leading-tight">{activeIdea ? activeIdea.title : 'No Active Constructs'}</span>
            <span className="text-sm font-bold font-space-mono bg-black text-white px-3 py-1 -ml-3 mb-6 mt-2 rounded-r-lg shadow-md border-l-2 border-white">
              {activeIdea ? activeIdea.type : 'Awaiting Input'}
            </span>
            <div className="flex justify-between items-center w-full mt-2">
              <button onClick={() => activeIdea ? onOpenIdea(activeIdea) : null} disabled={!activeIdea} className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest border border-white/30 bg-black/20 rounded-full px-4 py-2 hover:bg-white hover:text-[rgb(var(--rgb-accent-main))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Open Construct <ArrowRight size={14} />
              </button>
              {phaseIdeas.length > 1 && (
                <div className="flex items-center gap-2 bg-black/20 rounded-full p-1 border border-white/20">
                  <button onClick={prevIdea} disabled={ideaIndex === 0} className="p-1 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
                  <span className="text-[9px] font-space-mono font-bold">{ideaIndex + 1}/{phaseIdeas.length}</span>
                  <button onClick={nextIdea} disabled={ideaIndex === phaseIdeas.length - 1} className="p-1 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const ModularDraftsDisplay = ({ onOpenDraft }) => {
  // Real blog drafts from Supabase
  const [drafts, setDrafts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchBlogDrafts = async () => {
      try {
        const res = await fetch('https://yyoxpcsspmjvolteknsn.supabase.co/rest/v1/blog_post?status=eq.draft&order=created_at.desc&limit=10', {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3hwY3NzcG1qdm9sdGVrbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTM5MzAsImV4cCI6MjA3MjI4OTkzMH0.HFFOlmMjiiyQiKAODnz9RAmF3IR7n4KrvGhWp-K_dHM',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3hwY3NzcG1qdm9sdGVrbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTM5MzAsImV4cCI6MjA3MjI4OTkzMH0.HFFOlmMjiiyQiKAODnz9RAmF3IR7n4KrvGhWp-K_dHM'
          }
        });
        const data = await res.json();
        setDrafts(data.map(d => ({
          id: d.id,
          title: d.title,
          status: 'DRAFT',
          words: d.content ? d.content.replace(/<[^>]*>/g, '').length : 0,
          date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          content: d.content,
          excerpt: d.excerpt
        })));
      } catch (e) {
        console.error('Failed to fetch blog drafts:', e);
        setDrafts(INITIAL_BLOG_DRAFTS);
      }
      setDataLoading(false);
    };
    fetchBlogDrafts();
  }, []);
  const addNewDraft = () => {
    const newDraft = { id: `new_${Date.now()}`, title: 'SYS_CONSTRUCT_0X' + Math.floor(Math.random() * 1000), status: 'RAW', date: 'Just Now', words: 0, content: '' };
    setDrafts([newDraft, ...drafts]);
  };

  return (
    <div className="hover-spotlight bg-[var(--bg-panel)] border-4 border-[var(--border-color)] p-6 md:p-8 relative overflow-hidden flex flex-col shadow-[12px_12px_0_0_rgba(0,0,0,0.1)] transition-colors rounded-none">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b-4 border-[var(--border-color)] pb-4 relative z-20 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[var(--text-main)] text-[var(--bg-base)] flex items-center justify-center text-2xl font-bold font-space-mono">
            //
          </div>
          <div>
            <h2 className="text-3xl font-bold font-space-mono uppercase tracking-tighter text-[var(--text-main)]">Draft_Matrix</h2>
            <p className="text-[10px] font-space-mono text-[rgb(var(--rgb-accent-main))] uppercase tracking-[0.4em] mt-1 font-bold">Physical Cartridge Bay</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex gap-1 h-8">
            {[...Array(12)].map((_, i) => (
              <motion.div key={i} animate={{ height: [Math.random() * 30, Math.random() * 30, Math.random() * 30] }} transition={{ duration: 0.2, repeat: Infinity }} className="w-1 bg-[var(--text-faint)]" />
            ))}
          </div>
          <button onClick={addNewDraft} className="bg-[var(--text-main)] text-[var(--bg-base)] px-6 py-3 text-[12px] font-space-mono font-bold uppercase tracking-widest hover:bg-[rgb(var(--rgb-accent-main))] hover:text-white transition-colors flex items-center gap-2 border-2 border-[var(--text-main)] hover:border-[rgb(var(--rgb-accent-main))]">
            <Plus size={14} strokeWidth={3} /> Inject
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 relative z-10">
        <AnimatePresence>
          {drafts.length > 0 && (() => {
            const draft = drafts[0];
            const isVoice = draft.duration;
            return (
              <motion.div
                layout initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key={draft.id} onClick={() => onOpenDraft(draft)}
                className="group cursor-pointer border-2 transition-all duration-300 flex flex-col relative bg-[var(--text-main)] text-[var(--bg-base)] border-[var(--text-main)] h-64"
                style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
              >
                <div className="h-2 w-full bg-[rgb(var(--rgb-accent-main))] transition-colors" />
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full animate-pulse bg-[var(--bg-base)]" />
                      <span className="text-[10px] font-space-mono uppercase tracking-widest font-bold text-[var(--bg-base)] opacity-70">ID: {draft.id.toUpperCase()}</span>
                    </div>
                    <BadgeRenderer status={draft.status} inverts={true} />
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-bold font-space-grotesk line-clamp-2 leading-tight text-3xl lg:text-4xl mb-2">{draft.title}</h4>
                    <p className="text-sm font-space-mono opacity-80 line-clamp-2 leading-relaxed">{draft.content}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between text-[10px] font-space-mono pt-4 border-t-2 border-dotted border-[var(--bg-base)]/30">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Clock size={10} /> {draft.date}</span>
                      <span className="opacity-50">///</span>
                      <span className="font-bold">{isVoice ? `VOL: ${draft.duration}` : `SIZE: ${draft.words}W`}</span>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, j) => <div key={j} className="w-1 h-3 bg-[var(--bg-base)]" />)}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {drafts.length > 1 && (
          <motion.div layout className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            <AnimatePresence>
              {drafts.slice(1).map(draft => {
                const isVoice = draft.duration;
                return (
                  <motion.div
                    layout initial={{ opacity: 0, scale: 0.9, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    key={draft.id} onClick={() => onOpenDraft(draft)}
                    className="group cursor-pointer border-2 transition-all duration-300 flex flex-col relative bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[rgb(var(--rgb-accent-main))] h-48 min-w-[280px] shrink-0 snap-start"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
                  >
                    <div className="h-1.5 w-full bg-[var(--text-faint)] group-hover:bg-[rgb(var(--rgb-accent-main))] transition-colors" />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[rgb(var(--rgb-accent-main))] shadow-[0_0_10px_rgba(var(--rgb-accent-main),0.8)]" />
                          <span className="text-[8px] font-space-mono uppercase tracking-widest font-bold text-[var(--text-muted)]">ID: {draft.id.toUpperCase()}</span>
                        </div>
                        <BadgeRenderer status={draft.status} inverts={false} />
                      </div>

                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold font-space-grotesk line-clamp-2 leading-tight text-lg mb-1 group-hover:text-[rgb(var(--rgb-accent-main))] transition-colors">{draft.title}</h4>
                      </div>
                      <div className="mt-auto flex items-center justify-between text-[9px] font-space-mono pt-3 border-t-2 border-dotted border-[var(--border-color)]">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock size={8} /> {draft.date}</span>
                          <span className="font-bold text-[rgb(var(--rgb-accent-main))]">{isVoice ? `VOL: ${draft.duration}` : `SIZE: ${draft.words}W`}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const DriveExplorerModule = ({ onOpenFile }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [searchQuery, setSearchQuery] = useState('');

  const currentItems = useMemo(() => {
    let items = INITIAL_DRIVE_FS.filter(f => f.path === currentPath);
    if (searchQuery) items = INITIAL_DRIVE_FS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return items.sort((a, b) => {
      const aIsFolder = a.type.includes('folder');
      const bIsFolder = b.type.includes('folder');
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [currentPath, searchQuery]);

  const handleNavigate = (newPath) => {
    setCurrentPath(newPath);
    setSearchQuery('');
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'folder': return <Folder size={16} className="text-[var(--text-main)]" />;
      case 'image': return <ImageIcon size={16} className="text-[rgb(var(--rgb-accent-main))]" />;
      case 'music': return <Music size={16} className="text-[rgb(var(--rgb-accent-sec))]" />;
      case 'archive': return <Archive size={16} className="text-red-500" />;
      default: return <FileText size={16} className="text-[var(--text-muted)]" />;
    }
  };

  return (
    <div className="border-4 border-[var(--border-color)] bg-[var(--bg-panel)] rounded-xl overflow-hidden flex flex-col font-space-mono text-[10px] text-[var(--text-main)] shadow-[16px_16px_0_0_rgba(var(--rgb-accent-main),0.15)] transition-colors min-h-[500px] relative">
      <div className="bg-[var(--text-main)] text-[var(--bg-base)] px-6 py-4 flex flex-col md:flex-row md:justify-between items-start md:items-center uppercase font-bold tracking-widest transition-colors relative overflow-hidden gap-4">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-[rgb(var(--rgb-accent-main))] rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.8)] animate-pulse">
            <Database size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm">VOL_01 // CORE_ARCHIVE</span>
            <span className="text-[8px] opacity-70">SECURE STORAGE PROTOCOL ACTIVE</span>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none hidden md:block">
          <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
            <motion.path d="M 0 20 Q 25 0, 50 20 T 100 20 T 150 20 T 200 20" fill="none" stroke="currentColor" strokeWidth="2" animate={{ d: ["M 0 20 Q 25 0, 50 20 T 100 20 T 150 20 T 200 20", "M 0 20 Q 25 40, 50 20 T 100 20 T 150 20 T 200 20", "M 0 20 Q 25 0, 50 20 T 100 20 T 150 20 T 200 20"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
            <motion.path d="M 0 20 Q 25 40, 50 20 T 100 20 T 150 20 T 200 20" fill="none" stroke="currentColor" strokeWidth="1" animate={{ d: ["M 0 20 Q 25 40, 50 20 T 100 20 T 150 20 T 200 20", "M 0 20 Q 25 0, 50 20 T 100 20 T 150 20 T 200 20", "M 0 20 Q 25 40, 50 20 T 100 20 T 150 20 T 200 20"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
          </svg>
        </div>
        <span className="relative z-10 bg-[var(--bg-base)] text-[var(--text-main)] px-3 py-1 border-2 border-[var(--text-main)] text-[9px]">CAPACITY: {currentItems.length} SEC</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 border-r-4 border-[var(--border-color)] bg-[var(--bg-card)] hidden lg:flex flex-col p-4 relative overflow-hidden">
          <div className="text-[8px] text-[var(--text-faint)] uppercase tracking-widest border-b-2 border-dotted border-[var(--border-color)] pb-2 mb-2">Telemetry</div>
          <div className="flex-1 overflow-hidden font-space-mono text-[8px] text-[var(--text-muted)] opacity-50 leading-relaxed flex flex-col justify-end">
            <motion.div animate={{ y: [0, -100] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
              {[...Array(30)].map((_, i) => (
                <div key={i}>0x{Math.floor(Math.random() * 16777215).toString(16).toUpperCase()} ... {Math.random() > 0.5 ? 'OK' : 'WAIT'}</div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[var(--bg-card)] relative z-10">
          <div className="flex flex-col sm:flex-row border-b-4 border-[var(--border-color)] sm:divide-x-4 divide-[var(--border-color)] bg-[var(--bg-panel)] transition-colors shrink-0 z-20 relative shadow-md">
            <button onClick={() => handleNavigate('/')} className="px-6 py-4 hover:bg-[var(--bg-overlay)] flex items-center justify-center gap-3 transition-colors disabled:opacity-50 text-[11px] font-bold" disabled={currentPath === '/'}>
              <CornerUpLeft size={14} /> DIR_UP
            </button>
            <button className="px-6 py-4 hover:bg-[var(--bg-overlay)] flex items-center justify-center gap-3 transition-colors text-[rgb(var(--rgb-accent-main))] font-bold text-[11px]">
              MNT_VOL <Plus size={14} strokeWidth={3} />
            </button>
            <div className="flex-1 flex items-center px-6 py-4 sm:py-0 bg-[var(--bg-base)]">
              <span className="text-[rgb(var(--rgb-accent-main))] mr-3 font-bold text-lg">&gt;</span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent flex-1 focus:outline-none placeholder-[var(--text-faint)] uppercase text-[11px] font-bold tracking-widest text-[var(--text-main)]" placeholder="EXECUTE_QUERY..." />
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden bg-[var(--bg-base)] flex items-start justify-center p-6 md:p-12" style={{ perspective: '1200px' }}>
            <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none z-0" />
            <div className="w-full h-auto min-h-full max-w-5xl origin-top pb-32" style={{ transform: 'rotateX(20deg) translateY(10px)', transformStyle: 'preserve-3d' }}>
              <AnimatePresence>
                {currentItems.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-[rgb(var(--rgb-accent-red))] text-2xl font-bold tracking-widest uppercase">[ DIRECTORY_VOID ]</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                    {currentItems.map((item, idx) => {
                      const isFolder = item.type === 'folder';
                      return (
                        <motion.div
                          initial={{ opacity: 0, translateZ: -50 }} animate={{ opacity: 1, translateZ: 0 }} whileHover={{ scale: 1.02, translateZ: 30, backgroundColor: 'var(--bg-card)', borderColor: 'rgb(var(--rgb-accent-main))' }} transition={{ duration: 0.2, delay: idx * 0.05 }}
                          key={item.id} onClick={() => isFolder ? handleNavigate(item.path === '/' ? `/${item.name}` : `${item.path}/${item.name}`) : onOpenFile(item)}
                          className="flex flex-col p-5 border-4 border-[var(--border-color)] bg-[var(--bg-panel)] cursor-pointer group shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(var(--rgb-accent-main),0.3)] transition-all"
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          <div className="flex items-center justify-between mb-4 border-b-2 border-dotted border-[var(--border-color)] pb-3">
                            <div className="flex items-center gap-3">
                              {getFileIcon(item.type)}
                              <span className="text-[10px] font-bold text-[var(--text-faint)] group-hover:text-[var(--text-muted)] transition-colors">[{item.type.toUpperCase()}]</span>
                            </div>
                            <span className="text-[8px] bg-[var(--bg-base)] px-2 py-1 border border-[var(--border-color)] text-[var(--text-muted)]">{item.size || 'N/A'}</span>
                          </div>
                          <h4 className="font-bold text-sm md:text-base uppercase tracking-wider text-[var(--text-main)] group-hover:text-[rgb(var(--rgb-accent-main))] transition-colors truncate">{item.name}</h4>
                          <div className="mt-4 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1">
                              {[...Array(3)].map((_, j) => <div key={j} className="w-2 h-2 bg-[var(--text-faint)] group-hover:bg-[rgb(var(--rgb-accent-main))] transition-colors" />)}
                            </div>
                            <span className="text-[8px] text-[var(--text-main)] uppercase">{item.updatedAt}</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </AnimatePresence>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-base)] to-transparent pointer-events-none z-10" />
          </div>
        </div>
      </div>
    </div>
  );
};

const EditorContent = ({ draft }) => (
  <div className="flex flex-col h-[500px] text-[var(--text-main)]">
    <div className="mb-6">
      <input type="text" defaultValue={draft?.title} className="w-full bg-transparent text-2xl md:text-3xl font-bold font-space-grotesk focus:outline-none placeholder-[var(--text-faint)]" placeholder="Title..." />
      <div className="flex items-center gap-4 mt-4 text-[9px] md:text-[10px] font-space-mono text-[var(--text-muted)] border-b border-[var(--border-color)] pb-4">
        <span>Status: <BadgeRenderer status={draft?.status || 'RAW'} /></span>
        <span>Words: {draft?.words || 'N/A'}</span>
        <span>Last Edited: {draft?.date || 'Just Now'}</span>
      </div>
    </div>
    <textarea className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm font-space-mono leading-relaxed text-[var(--text-muted)] placeholder-[var(--text-faint)]" defaultValue={draft?.content || ''} placeholder="Start writing..." />
    <div className="flex justify-end gap-4 pt-4 border-t border-[var(--border-color)] mt-4">
      <button className="px-6 py-2 rounded-full bg-[var(--bg-panel)] border border-[var(--border-color)] text-[10px] font-bold font-space-mono uppercase tracking-widest hover:text-[var(--text-main)]">Save Draft</button>
      <button className="px-6 py-2 rounded-full bg-[var(--text-main)] text-[var(--bg-base)] text-[10px] font-bold font-space-mono uppercase tracking-widest shadow-[0_0_15px_var(--border-highlight)] hover:opacity-80 transition-opacity">Publish</button>
    </div>
  </div>
);

const FilePreviewContent = ({ file }) => (
  <div className="flex flex-col items-center text-[var(--text-main)]">
    <div className="w-32 h-32 bg-[var(--bg-panel)] rounded-3xl border border-[var(--border-color)] flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-tech-grid opacity-30" />
      <FileText size={48} className="text-[var(--text-faint)] relative z-10" />
    </div>
    <h2 className="text-xl font-bold font-space-grotesk mb-2 text-center break-all">{file?.name}</h2>
    <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-space-mono uppercase tracking-widest text-[var(--text-muted)] mb-8 bg-[var(--bg-panel)] px-4 py-2 rounded-full border border-[var(--border-color)]">
      <span>{file?.type}</span> • <span>{file?.size}</span> • <span>{file?.updatedAt}</span>
    </div>
    <div className="w-full flex flex-col sm:flex-row gap-4">
      <button className="flex-1 py-4 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl text-xs font-bold font-space-mono uppercase tracking-widest hover:border-[var(--border-highlight)] transition-colors flex items-center justify-center gap-2">
        <Share2 size={16} /> Share Link
      </button>
      <button className="flex-1 py-4 bg-[var(--text-main)] text-[var(--bg-base)] rounded-2xl text-xs font-bold font-space-mono uppercase tracking-widest shadow-[0_0_20px_var(--border-highlight)] hover:opacity-80 transition-opacity flex items-center justify-center gap-2">
        <ArrowUpRight size={16} /> Open Native
      </button>
    </div>
  </div>
);

export default function LabrinavSocialView({ api, postbridgeKey }) {
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const openModal = (type, data) => setModalState({ isOpen: true, type, data });
  const closeModal = () => setModalState({ isOpen: false, type: null, data: null });

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="grid grid-cols-12 gap-6 w-full">
        {/* ROW 1: Release Countdown */}
        <div className="col-span-12">
          <ReleaseCountdownModule release={{ name: 'Hermes Fleece', date: '2026-03-25' }} />
        </div>

        {/* ROW 2: Social Stats & Content Performance */}
        <div className="col-span-12 md:col-span-6 xl:col-span-6 h-full">
          <SocialStatsModule />
        </div>
        <div className="col-span-12 md:col-span-6 xl:col-span-6 h-full">
          <SocialAnalyticsChart />
        </div>

        {/* ROW 3: Idea Bank Pipeline */}
        <div className="col-span-12 mt-2">
          <IdeaBankModule onOpenIdea={(idea) => openModal('editor', idea)} />
        </div>

        {/* ROW 4: Modular Bento Drafts */}
        <div className="col-span-12 mt-2">
          <ModularDraftsDisplay onOpenDraft={(draft) => openModal('editor', draft)} />
        </div>

        {/* ROW 5: Drive Explorer */}
        <div className="col-span-12 mt-4">
          <div className="mb-4 px-2 flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold capitalize flex items-center gap-3 text-[var(--text-main)]">
                <Database className="text-[rgb(var(--rgb-accent-main))]" /> Cortex Drive
              </h2>
              <p className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">Terminal access for brand and campaign assets.</p>
            </div>
          </div>
          <DriveExplorerModule onOpenFile={(file) => openModal('file_preview', file)} />
        </div>
      </div>

      <Modal isOpen={modalState.isOpen && modalState.type === 'editor'} onClose={closeModal} title="Construct Editor" icon={PenTool}>
        <EditorContent draft={modalState.data} />
      </Modal>

      <Modal isOpen={modalState.isOpen && modalState.type === 'file_preview'} onClose={closeModal} title="Asset Inspector" icon={Search}>
        <FilePreviewContent file={modalState.data} />
      </Modal>
    </div>
  );
}
