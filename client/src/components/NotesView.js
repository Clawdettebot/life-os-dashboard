import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Tag, X, Edit2, Trash2,
  Clock, FileText, Grid, List, SortAsc,
  SortDesc, Save, ChevronDown, ChevronUp,
  StickyNote, Archive, Calendar as CalendarIcon
} from 'lucide-react';
import { LobsterScrollArea } from './ui/LobsterScrollBar';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotesView({ notes = [], api }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [sortBy, setSortBy] = useState('created_desc'); // created_desc, created_asc, title_asc, title_desc
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [expandedNote, setExpandedNote] = useState(null);

  // New note form state
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: ''
  });

  // Get all unique tags from notes
  const allTags = useMemo(() => {
    const tags = new Set();
    notes.forEach(note => {
      (note.tags || []).forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [notes]);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(note =>
        (note.title || '').toLowerCase().includes(query) ||
        (note.content || '').toLowerCase().includes(query) ||
        (note.tags || []).some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter(note =>
        selectedTags.every(tag => (note.tags || []).includes(tag))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return (b.created_at || 0) - (a.created_at || 0);
        case 'created_asc':
          return (a.created_at || 0) - (b.created_at || 0);
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title_desc':
          return (b.title || '').localeCompare(a.title || '');
        default:
          return 0;
      }
    });

    return result;
  }, [notes, searchQuery, selectedTags, sortBy]);

  const formatRelativeDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim() && !newNote.content.trim()) return;

    const tags = newNote.tags
      ? newNote.tags.split(',').map(t => t.trim()).filter(t => t)
      : [];

    await api.create('notes', {
      title: newNote.title || 'Untitled Note',
      content: newNote.content,
      tags
    });

    setNewNote({ title: '', content: '', tags: '' });
    setShowAddForm(false);
  };

  const handleUpdateNote = async (id, updates) => {
    await api.update('notes', id, updates);
    setEditingNote(null);
  };

  const handleDeleteNote = async (id) => {
    if (confirm('Delete this note?')) {
      await api.delete('notes', id);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  // Quick add from header
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim()) return;
    await handleCreateNote();
  };

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto min-h-full bg-black/95 relative overflow-hidden text-white/90">
      {/* Premium Background Effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none" />

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10 glass-panel p-6 rounded-3xl border border-white/10">

        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
          {/* Header Title */}
          <div className="flex items-center gap-3 pr-6 md:border-r md:border-white/10">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <StickyNote size={24} />
            </div>
            <div>
              <h1 className="font-outfit text-2xl font-bold tracking-widest uppercase text-white/90 m-0">Notes</h1>
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-white/40 uppercase mt-1">Total: {filteredNotes.length}</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 w-full md:w-[300px] focus-within:border-white/30 focus-within:bg-white/10 transition-all">
            <Search size={16} className="text-white/40 mr-2" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-white/80 font-mono text-sm w-full placeholder:text-white/30"
            />
            {searchQuery && (
              <button className="text-white/40 hover:text-white/80 transition-colors" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-full px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-white/70 outline-none cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all pr-10"
            >
              <option value="created_desc" className="bg-zinc-900 text-white">Newest First</option>
              <option value="created_asc" className="bg-zinc-900 text-white">Oldest First</option>
              <option value="title_asc" className="bg-zinc-900 text-white">Title A-Z</option>
              <option value="title_desc" className="bg-zinc-900 text-white">Title Z-A</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          {/* Quick Add Button */}
          <button
            className="px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-widest text-black bg-white hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center gap-2"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            {showAddForm ? 'Close' : 'New Note'}
          </button>
        </div>
      </div>

      {/* Tags Filter Bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-8 relative z-10 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 text-white/40 mr-2">
            <Tag size={14} />
            <span className="font-mono text-xs uppercase tracking-widest">Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`px-3 py-1.5 rounded-full font-mono text-[0.6rem] uppercase tracking-wider transition-all border ${selectedTags.includes(tag)
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80'
                  }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          {(selectedTags.length > 0 || searchQuery) && (
            <button
              className="text-white/40 hover:text-white/80 font-mono text-xs underline underline-offset-4 transition-colors p-2"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Quick Add Form */}
      {showAddForm && (
        <div className="mb-12 relative z-10 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="glass-panel rounded-3xl border border-white/10 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden">
            {/* Glowing orb behind form */}
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
              <StickyNote size={20} className="text-amber-500/80" />
              <span className="font-outfit text-xl font-bold text-white tracking-wide">Compose Note</span>
            </div>

            <div className="grid gap-4 w-full max-w-3xl">
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-5 py-4 font-outfit text-lg text-white placeholder:text-white/20 outline-none transition-all"
                placeholder="Note Title..."
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                autoFocus
              />
              <textarea
                className="w-full bg-black/20 border border-white/10 focus:border-white/30 rounded-xl px-5 py-4 font-inter text-white/80 placeholder:text-white/20 outline-none transition-all resize-none leading-relaxed"
                placeholder="Write your thoughts..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={6}
              />
              <div className="relative">
                <Tag size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl pl-12 pr-5 py-4 font-mono text-sm text-white/80 placeholder:text-white/20 outline-none transition-all"
                  placeholder="Tags (comma separated)..."
                  value={newNote.tags}
                  onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-white/10 max-w-3xl">
              <button
                className="px-6 py-3 rounded-xl font-outfit font-bold text-xs uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all flex items-center justify-center gap-2 w-40"
                onClick={handleCreateNote}
              >
                <Save size={16} /> Save
              </button>
              <button
                className="px-6 py-3 rounded-xl font-outfit font-bold text-xs uppercase tracking-widest text-white/40 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all w-32"
                onClick={() => setShowAddForm(false)}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Display Grid - with Lobster Scroll */}
      <div className="relative z-10 w-full mb-20">
        {filteredNotes.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/10 p-20 flex flex-col items-center justify-center text-center mt-8">
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
              <Archive size={40} className="text-white/20" />
            </div>
            <h3 className="font-outfit text-2xl text-white/80 tracking-wide mb-2">No Notes Found</h3>
            {searchQuery || selectedTags.length > 0 ? (
              <p className="font-mono text-sm text-white/40 uppercase tracking-widest">Adjust filters to find what you seek</p>
            ) : (
              <p className="font-mono text-sm text-white/40 uppercase tracking-widest">The vault is empty. Capture a thought.</p>
            )}
          </div>
        ) : (
          <LobsterScrollArea className="max-h-[calc(100vh-300px)]">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-8">
              {filteredNotes.map((note, index) => (
              <NoteWidget
                key={note.id || index}
                note={note}
                isEditing={editingNote === note.id}
                onEdit={() => setEditingNote(note.id)}
                onSave={(updates) => handleUpdateNote(note.id, updates)}
                onCancelEdit={() => setEditingNote(null)}
                onDelete={() => handleDeleteNote(note.id)}
                formatRelativeDate={formatRelativeDate}
                onTagClick={toggleTag}
              />
            ))}
            </div>
          </LobsterScrollArea>
        )}
      </div>
    </div>
  );
}

// Modular Note Widget
function NoteWidget({ note, isEditing, onEdit, onSave, onCancelEdit, onDelete, formatRelativeDate, onTagClick }) {
  const [editTitle, setEditTitle] = useState(note.title || '');
  const [editContent, setEditContent] = useState(note.content || '');
  const [editTags, setEditTags] = useState((note.tags || []).join(', '));
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setEditTitle(note.title || '');
    setEditContent(note.content || '');
    setEditTags((note.tags || []).join(', '));
  }, [note, isEditing]);

  const handleSave = () => {
    const tags = editTags
      ? editTags.split(',').map(t => t.trim()).filter(t => t)
      : [];
    onSave({
      title: editTitle || 'Untitled Note',
      content: editContent,
      tags
    });
  };

  // Safe date parsing
  let dayNum = '--';
  let monthStr = '---';
  let yearStr = '----';

  if (note.created_at) {
    const d = new Date(note.created_at);
    if (!isNaN(d.getTime())) {
      dayNum = d.getDate().toString().padStart(2, '0');
      monthStr = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      yearStr = d.getFullYear().toString();
    }
  }

  // Handle Note Editing Mode
  if (isEditing) {
    return (
      <div className="glass-panel rounded-3xl border border-white/20 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden ring-1 ring-amber-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px]" />

        <div className="flex flex-col gap-4 relative z-10">
          <input
            type="text"
            className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 font-outfit text-xl text-white outline-none"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title"
          />
          <textarea
            className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 font-inter text-white/80 outline-none resize-y min-h-[150px] leading-relaxed"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Content"
          />
          <input
            type="text"
            className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 font-mono text-sm text-white/60 outline-none"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            placeholder="Tags (comma separated)"
          />
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
            <button className="px-5 py-2.5 rounded-xl font-outfit text-xs font-bold uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-colors" onClick={onCancelEdit}>Cancel</button>
            <button className="px-5 py-2.5 rounded-xl font-outfit text-xs font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col sm:flex-row glass-panel rounded-3xl border border-white/10 overflow-hidden hover:border-white/20 hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)] bg-gradient-to-br from-white/[0.03] to-transparent relative">
      {/* Hover Glow Core */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Date Column (Left) */}
      <div className="w-full sm:w-[120px] bg-white/[0.02] border-b sm:border-b-0 sm:border-r border-white/10 p-6 flex flex-col items-center justify-center shrink-0 relative">
        <div className="font-outfit text-5xl md:text-6xl font-light text-white/80 tracking-tighter tabular-nums drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">{dayNum}</div>
        <div className="flex flex-col items-center mt-1">
          <span className="font-mono text-[0.65rem] font-bold tracking-[0.2em] text-amber-500/80 uppercase">{monthStr}</span>
          <span className="font-mono text-[0.55rem] tracking-[0.3em] text-white/30 uppercase mt-0.5">{yearStr}</span>
        </div>
      </div>

      {/* Content Column (Right) */}
      <div className="flex-1 p-6 flex flex-col relative">
        {/* Header Actions */}
        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 transition-colors" onClick={onEdit} title="Edit Note">
            <Edit2 size={12} />
          </button>
          <button className="w-8 h-8 rounded-full bg-red-500/5 border border-red-500/20 flex items-center justify-center text-red-500/60 hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors" onClick={onDelete} title="Delete Note">
            <Trash2 size={12} />
          </button>
        </div>

        {/* Title */}
        <h3 className="font-outfit text-xl md:text-2xl font-bold text-white/95 tracking-wide pr-16 leading-tight mb-4">
          {note.title || <span className="text-white/30 italic">Untitled Thought</span>}
        </h3>

        {/* Body Preview */}
        <div
          className="flex-1 cursor-pointer mb-6"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <div className="font-inter text-sm text-white/70 leading-relaxed whitespace-pre-wrap animate-in fade-in duration-300">
              {note.content}
            </div>
          ) : (
            <div className="font-inter text-sm text-white/50 leading-relaxed line-clamp-3 overflow-hidden group-hover:text-white/70 transition-colors">
              {note.content || '...'}
            </div>
          )}

          {/* Subtle click-to-expand prompt if content is long and not expanded */}
          {!isExpanded && note.content && note.content.length > 150 && (
            <div className="mt-2 text-[0.6rem] font-mono tracking-widest text-amber-500/50 uppercase flex items-center gap-1 group-hover:text-amber-500 transition-colors">
              <ChevronDown size={10} /> Expand
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="mt-auto pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.1em] text-white/30 uppercase">
            <Clock size={10} className="text-white/20" />
            {formatRelativeDate(note.created_at)}
          </div>

          {(note.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  onClick={(e) => { e.stopPropagation(); onTagClick && onTagClick(tag); }}
                  className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[0.6rem] font-mono tracking-wider uppercase text-amber-400/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] hover:bg-white/10 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
              {(note.tags || []).length > 3 && (
                <span className="px-2 py-1 rounded-md bg-transparent border border-white/5 text-[0.55rem] font-mono tracking-widest text-white/30">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
