import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Flame, ChefHat, History, Search, Plus,
  Clock, Tag, Sparkles, Utensils, X, Upload, Send
} from 'lucide-react';
import LobsterScrollArea from './ui/LobsterScrollArea';

import { SectionParticles } from './cortex/SectionBackground';
import ViewModeToggle from './cortex/ViewModeToggle';
import {
  Card, Button, Badge, Crosshair, ScrambleText, staggerContainer, staggerItem
} from './ui/NewDesignComponents';

import {
  CortexAllSpark, CortexHitchhikersGuide, CortexHowlsKitchen, CortexEmeraldTablets
} from './cortex/CortexSubViews';

import './cortex/CortexLayouts.css';

const SECTIONS = {
  emerald_tablets: {
    label: 'Emerald Tablets',
    icon: History,
    color: '#10b981',
    description: 'Historical knowledge: African American, Filipino, Oakland/Bay Area, Hip-Hop, and Family history with timeline views.'
  },
  hitchhiker_guide: {
    label: "Hitchhiker's Guide",
    icon: BookOpen,
    color: '#00D4FF',
    description: 'Survival knowledge extracted from videos: DIY builds, foraging, wildlife, off-grid living.'
  },
  all_spark: {
    label: 'The All Spark',
    icon: Flame,
    color: '#FFD700',
    description: 'Your inspiration hub: ideas, rants, comedy, art, movies, manga, games, apps, merch concepts.'
  },
  howls_kitchen: {
    label: "Howl's Kitchen",
    icon: ChefHat,
    color: '#FF6B35',
    description: 'Restaurant reviews and recipe tracker. Mark as cooked or wishlist for later.'
  }
};

export default function CortexView() {
  const [activeSection, setActiveSection] = useState('all_spark');
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [sectionTags, setSectionTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => {
    fetchEntries();
    fetchStats();
    fetchTags();
  }, [activeSection]);

  const fetchEntries = async () => {
    try {
      const res = await fetch(`/api/cortex?section=${activeSection}&limit=50`);
      const data = await res.json();
      setEntries(data);
    } catch (e) {
      console.error('Failed to fetch cortex entries:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/cortex/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch(`/api/cortex/tags?section=${activeSection}`);
      const data = await res.json();
      const tagsArray = data[activeSection] || [];
      setSectionTags(tagsArray);
      setSelectedTags([]);
    } catch (e) {
      console.error('Failed to fetch tags:', e);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      content: form.content.value,
      section: activeSection,
      category: selectedTags.length > 0 ? selectedTags.join(',') : form.category?.value || '',
      media_url: mediaUrl
    };

    try {
      await fetch('/api/cortex/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setShowAddModal(false);
      setMediaUrl('');
      fetchEntries();
      form.reset();
    } catch (e) {
      console.error('Failed to add entry:', e);
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/cortex/media', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setMediaUrl(data.url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const renderActiveSection = () => {
    const props = { entries, color: SECTIONS[activeSection].color, onSelectEntry: setSelectedEntry };
    switch (activeSection) {
      case 'all_spark': return <CortexAllSpark {...props} />;
      case 'hitchhiker_guide': return <CortexHitchhikersGuide {...props} />;
      case 'howls_kitchen': return <CortexHowlsKitchen {...props} />;
      case 'emerald_tablets': return <CortexEmeraldTablets {...props} />;
      default: return null;
    }
  };

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <SectionParticles section={activeSection} />

      <motion.header variants={staggerContainer} initial="hidden" animate="visible" className="flex items-center justify-between mb-8 relative z-20 shrink-0">
        <div className="flex bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full p-1 gap-1">
          {Object.entries(SECTIONS).map(([key, section]) => {
            const Icon = section.icon;
            const isActive = activeSection === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveSection(key); setSelectedEntry(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all relative ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >
                {isActive && (
                  <motion.div layoutId="cortex-tab-active" className="absolute inset-0 bg-[var(--bg-overlay)] border border-[var(--border-color)] rounded-full shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.1)]" />
                )}
                <Icon size={14} style={{ color: isActive ? section.color : 'inherit' }} className="relative z-10" />
                <span className="relative z-10">{section.label}</span>
                {stats[key] > 0 && (
                  <span className="relative z-10 ml-1 px-1.5 py-0.5 rounded-full bg-[var(--bg-base)] border border-[var(--border-color)] text-[8px]">
                    {stats[key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-[var(--text-muted)] focus-within:border-[var(--border-highlight)] transition-colors">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search cortex..."
              className="bg-transparent border-none outline-none text-[10px] font-space-mono w-40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ViewModeToggle activeView={viewMode} onChange={setViewMode} />
          <Button variant="accent" icon={Plus} onClick={() => setShowAddModal(true)}>Add Entry</Button>
        </div>
      </motion.header>

      <div className="flex-1 relative z-10 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, scale: 0.98, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.02, x: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {renderActiveSection()}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-10 relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-tech-grid opacity-10 pointer-events-none" />
              <Crosshair className="-top-[5px] -left-[5px]" />
              <Crosshair className="-top-[5px] -right-[5px]" />
              <Crosshair className="-bottom-[5px] -left-[5px]" />
              <Crosshair className="-bottom-[5px] -right-[5px]" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-center text-[rgb(var(--rgb-accent-main))] shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.2)]">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-widest font-space-grotesk">New Entry</h3>
                    <p className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">
                      Injecting into {SECTIONS[activeSection].label}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleQuickAdd} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[9px] font-space-mono uppercase tracking-[0.3em] text-[var(--text-muted)] ml-4">Identifier</label>
                  <input name="title" type="text" placeholder="Entry Title..." required className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-full px-6 py-3 text-xs focus:border-[rgb(var(--rgb-accent-main))] outline-none transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-space-mono uppercase tracking-[0.3em] text-[var(--text-muted)] ml-4">Classification</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-[1.5rem] min-h-[50px]">
                    {sectionTags.map(({ tag, color }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        style={{
                          '--btn-color': color,
                          borderColor: selectedTags.includes(tag) ? color : 'var(--border-color)',
                          color: selectedTags.includes(tag) ? color : 'var(--text-muted)',
                          background: selectedTags.includes(tag) ? `${color}10` : 'transparent'
                        }}
                        className="px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all"
                      >
                        {tag.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-space-mono uppercase tracking-[0.3em] text-[var(--text-muted)] ml-4">Neural Data</label>
                  <textarea name="content" rows={4} placeholder="Begin uplink..." required className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-[1.5rem] px-6 py-4 text-xs focus:border-[rgb(var(--rgb-accent-main))] outline-none transition-all resize-none" />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] rounded-full text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-highlight)] transition-all cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleMediaUpload} className="hidden" />
                      <Upload size={14} />
                      {mediaUrl ? 'Redact Image' : 'Attach Matrix'}
                    </label>
                    {mediaUrl && <Badge variant="ACTIVE">Uplink Confirmed</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button variant="primary" icon={Send} type="submit">Execute Injection</Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legacy Entry Modal for detail viewing - can be upgraded later */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEntry(null)}>
          <LobsterScrollArea className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] shadow-[0_0_60px_rgba(0,0,0,0.8)] max-h-[90vh]" contentClassName="p-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold uppercase tracking-widest">{selectedEntry.title}</h2>
              <button onClick={() => setSelectedEntry(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><X size={24} /></button>
            </div>
            {selectedEntry.media_url && <img src={selectedEntry.media_url} className="w-full rounded-2xl mb-6 border border-[var(--border-color)]" alt="" />}
            <div className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap font-space-grotesk bg-[var(--bg-base)] p-6 rounded-2xl border border-[var(--border-color)]">
              {selectedEntry.content}
            </div>
          </LobsterScrollArea>
        </div>
      )}
    </div>
  );
}
