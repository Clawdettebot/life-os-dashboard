import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Mic, Plus, Search, Calendar, ChevronRight,
  Clock, Filter, Sparkles, Volume2, Edit3, Trash2, X
} from 'lucide-react';
import TacticalLobster from './knights/ShrimpSoldier';

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};

const itemVars = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 300, damping: 25 } }
};

const journalColors = {
  voice: { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)', accent: '#f97316' },
  text: { bg: 'rgba(57, 255, 20, 0.1)', border: 'rgba(57, 255, 20, 0.3)', accent: '#39ff14' },
  thought: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', accent: '#a855f7' }
};

function JournalEntry({ entry, onDelete, theme }) {
  const type = entry.content_type === 'voice' || entry.title?.toLowerCase().includes('voice') ? 'voice' 
    : entry.category === 'thought' || entry.title?.toLowerCase().includes('thought') ? 'thought' : 'text';
  
  const colors = journalColors[type];
  const date = new Date(entry.created_at);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <motion.div 
      variants={itemVars}
      className="group relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--border-highlight)] transition-all"
      whileHover={{ scale: 1.01, y: -2 }}
    >
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {type === 'voice' && (
          <button className="p-1.5 rounded-lg bg-[var(--bg-overlay)] hover:bg-[var(--border-color)]">
            <Volume2 size={12} className="text-[rgb(var(--rgb-accent-main))]" />
          </button>
        )}
        <button onClick={() => onDelete(entry.id)} className="p-1.5 rounded-lg bg-[var(--bg-overlay)] hover:bg-red-500/20">
          <Trash2 size={12} className="text-red-400" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: colors.accent, boxShadow: `0 0 8px ${colors.accent}` }} 
        />
        <span className="text-[10px] font-space-mono uppercase tracking-widest text-[var(--text-muted)]">
          {dateStr} • {timeStr}
        </span>
        <span 
          className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold"
          style={{ backgroundColor: colors.bg, color: colors.accent, border: `1px solid ${colors.border}` }}
        >
          {type}
        </span>
      </div>

      <h3 className="font-space-grotesk font-semibold text-sm text-[var(--text-main)] mb-1 line-clamp-2">
        {entry.title}
      </h3>
      
      {entry.content && (
        <p className="text-[11px] text-[var(--text-muted)] line-clamp-3 leading-relaxed">
          {entry.content}
        </p>
      )}

      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {entry.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[8px] px-2 py-0.5 rounded-full bg-[var(--bg-overlay)] text-[var(--text-faint)]">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AddEntryModal({ isOpen, onClose, onSubmit, theme }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSubmit({ title, content, type });
    setTitle('');
    setContent('');
    setType('text');
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-space-grotesk font-bold text-lg text-[var(--text-main)]">New Journal Entry</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-overlay)]">
            <X size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {['text', 'thought', 'voice'].map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                type === t 
                  ? 'bg-[rgb(var(--rgb-accent-main))] text-black' 
                  : 'bg-[var(--bg-overlay)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {t === 'thought' ? '💭 Thought' : t === 'voice' ? '🎙 Voice' : '📝 Text'}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Entry title..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[rgb(var(--rgb-accent-main))] mb-3"
        />

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={5}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[rgb(var(--rgb-accent-main))] resize-none"
        />

        <button
          onClick={handleSubmit}
          disabled={saving || !title.trim()}
          className="w-full mt-4 py-3 bg-[rgb(var(--rgb-accent-main))] text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function JournalView({ theme = 'dark' }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      // Fetch from cortex with journal section, and also recordings
      const [cortexRes, recordingsRes] = await Promise.all([
        fetch('/api/cortex?section=journal&limit=100'),
        fetch('/api/recordings')
      ]);
      
      const cortexData = await cortexRes.json();
      const recordingsData = await recordingsRes.json();
      
      // Combine and sort by date
      const journalEntries = (cortexData || []).map(e => ({ ...e, source: 'cortex' }));
      const voiceEntries = (recordingsData.recordings || [])
        .filter(r => r.status === 'analyzed')
        .map(r => ({ 
          id: r.id, 
          title: r.title || 'Voice Recording', 
          content: r.transcript || '',
          content_type: 'voice',
          created_at: r.created_at,
          source: 'recording'
        }));
      
      const allEntries = [...journalEntries, ...voiceEntries]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setEntries(allEntries);
    } catch (e) {
      console.error('Failed to load journal:', e);
    }
    setLoading(false);
  };

  const handleAddEntry = async ({ title, content, type }) => {
    try {
      await fetch('/api/cortex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          section: 'journal',
          category: type,
          content_type: type === 'voice' ? 'voice' : 'note'
        })
      });
      loadEntries();
    } catch (e) {
      console.error('Failed to add entry:', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/cortex/${id}`, { method: 'DELETE' });
      loadEntries();
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    if (filter !== 'all') {
      filtered = filtered.filter(e => 
        filter === 'voice' ? e.content_type === 'voice' : e.content_type !== 'voice'
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title?.toLowerCase().includes(q) || 
        e.content?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [entries, filter, searchQuery]);

  const stats = useMemo(() => ({
    total: entries.length,
    voice: entries.filter(e => e.content_type === 'voice').length,
    text: entries.filter(e => e.content_type !== 'voice').length
  }), [entries]);

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden" 
      animate="show"
      className="h-full flex flex-col bg-[var(--bg-base)] p-5 overflow-hidden"
    >
      {/* Header */}
      <motion.div variants={itemVars} className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--rgb-accent-main))] flex items-center justify-center">
            <BookOpen size={20} className="text-black" />
          </div>
          <div>
            <h1 className="font-space-grotesk font-bold text-xl text-[var(--text-main)]">Journal</h1>
            <p className="font-space-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
              {stats.total} entries • {stats.voice} voice
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--rgb-accent-main))] text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all"
        >
          <Plus size={14} />
          New Entry
        </button>
      </motion.div>

      {/* Search & Filter */}
      <motion.div variants={itemVars} className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2.5 pl-9 pr-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[rgb(var(--rgb-accent-main))]"
          />
        </div>
        <div className="flex gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1">
          {['all', 'voice', 'text'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                filter === f 
                  ? 'bg-[var(--bg-overlay)] text-[var(--text-main)]' 
                  : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Entries Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <TacticalLobster isMoving={true} className="w-8 h-10 text-[rgb(var(--rgb-accent-main))]" />
              <span className="font-space-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Loading entries...</span>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <BookOpen size={40} className="mx-auto mb-3 text-[var(--text-faint)]" />
              <p className="font-space-mono text-sm text-[var(--text-muted)]">No journal entries yet</p>
              <p className="font-space-mono text-[10px] text-[var(--text-faint)] mt-1">Record a voice note or write something</p>
            </div>
          </div>
        ) : (
          <motion.div 
            variants={containerVars}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {filteredEntries.map((entry, i) => (
              <JournalEntry 
                key={entry.id || i} 
                entry={entry} 
                onDelete={handleDelete}
                theme={theme}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddEntryModal 
            isOpen={showAddModal} 
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddEntry}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
