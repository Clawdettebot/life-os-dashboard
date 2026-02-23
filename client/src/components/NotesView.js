import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Tag, X, Edit2, Trash2, 
  Clock, FileText, Grid, List, SortAsc, 
  SortDesc, Save, ChevronDown, ChevronUp,
  StickyNote, Archive
} from 'lucide-react';

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

  const formatDate = (timestamp) => {
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    <div className="notes-container">
      {/* Header Controls */}
      <div className="notes-header">
        <div className="notes-controls-left">
          {/* Search */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="sort-dropdown">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="title_asc">Title A-Z</option>
              <option value="title_desc">Title Z-A</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div className="notes-controls-right">
          {/* Quick Add Button */}
          <button 
            className="btn btn-primary quick-add-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={16} />
            {showAddForm ? 'Cancel' : 'New Note'}
          </button>
        </div>
      </div>

      {/* Tags Filter Bar */}
      {allTags.length > 0 && (
        <div className="notes-tags-bar">
          <div className="tags-label">
            <Tag size={14} />
            <span>Filter by tag:</span>
          </div>
          <div className="tags-list">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          {(selectedTags.length > 0 || searchQuery) && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Quick Add Form */}
      {showAddForm && (
        <div className="quick-add-form card">
          <div className="card-header">
            <StickyNote size={18} />
            <span>New Note</span>
          </div>
          <div className="card-body">
            <input
              type="text"
              className="form-input note-title-input"
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote({...newNote, title: e.target.value})}
              autoFocus
            />
            <textarea
              className="form-input note-content-input"
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote({...newNote, content: e.target.value})}
              rows={4}
            />
            <div className="note-tags-input-row">
              <Tag size={14} className="tag-input-icon" />
              <input
                type="text"
                className="form-input note-tags-input"
                placeholder="Tags (comma separated)..."
                value={newNote.tags}
                onChange={(e) => setNewNote({...newNote, tags: e.target.value})}
              />
            </div>
          </div>
          <div className="card-footer">
            <button className="btn btn-ghost" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateNote}>
              <Save size={14} /> Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes Stats */}
      <div className="notes-stats">
        <span className="notes-count">
          {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
          {selectedTags.length > 0 && ` (filtered from ${notes.length})`}
        </span>
      </div>

      {/* Notes Display */}
      {filteredNotes.length === 0 ? (
        <div className="notes-empty-state">
          <StickyNote size={48} className="empty-icon" />
          <h3>No notes found</h3>
          {searchQuery || selectedTags.length > 0 ? (
            <p>Try adjusting your search or filters</p>
          ) : (
            <p>Create your first note to get started</p>
          )}
          {!searchQuery && selectedTags.length === 0 && (
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              <Plus size={16} /> Create Note
            </button>
          )}
        </div>
      ) : (
        <div className={`notes-${viewMode}`}>
          {filteredNotes.map((note, index) => (
            <NoteCard
              key={note.id || index}
              note={note}
              viewMode={viewMode}
              isEditing={editingNote === note.id}
              isExpanded={expandedNote === note.id}
              onEdit={() => setEditingNote(note.id)}
              onSave={(updates) => handleUpdateNote(note.id, updates)}
              onCancelEdit={() => setEditingNote(null)}
              onDelete={() => handleDeleteNote(note.id)}
              onToggleExpand={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Note Card Component
function NoteCard({ 
  note, viewMode, isEditing, isExpanded, 
  onEdit, onSave, onCancelEdit, onDelete, 
  onToggleExpand, formatDate 
}) {
  const [editTitle, setEditTitle] = useState(note.title || '');
  const [editContent, setEditContent] = useState(note.content || '');
  const [editTags, setEditTags] = useState((note.tags || []).join(', '));

  useEffect(() => {
    setEditTitle(note.title || '');
    setEditContent(note.content || '');
    setEditTags((note.tags || []).join(', '));
  }, [note]);

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

  if (viewMode === 'list') {
    return (
      <div className={`note-card-list ${isExpanded ? 'expanded' : ''}`}>
        {isEditing ? (
          <div className="note-edit-form">
            <input
              type="text"
              className="form-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title"
            />
            <textarea
              className="form-input"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Content"
              rows={3}
            />
            <input
              type="text"
              className="form-input"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="Tags (comma separated)"
            />
            <div className="note-edit-actions">
              <button className="btn btn-sm btn-ghost" onClick={onCancelEdit}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        ) : (
          <>
            <div className="note-list-header" onClick={onToggleExpand}>
              <div className="note-list-title">
                {note.title || 'Untitled Note'}
              </div>
              <div className="note-list-meta">
                <span className="note-date">
                  <Clock size={12} />
                  {formatDate(note.created_at)}
                </span>
                {(note.tags || []).length > 0 && (
                  <div className="note-tags-mini">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag-mini">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="note-list-content">
              {isExpanded ? note.content : (note.content || '').slice(0, 150) + ((note.content || '').length > 150 ? '...' : '')}
            </div>
            {isExpanded && (note.tags || []).length > 0 && (
              <div className="note-list-tags">
                {note.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
            <div className="note-list-actions">
              <button className="icon-btn" onClick={onEdit} title="Edit">
                <Edit2 size={14} />
              </button>
              <button className="icon-btn danger" onClick={onDelete} title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Grid View
  return (
    <div className={`note-card-grid ${isExpanded ? 'expanded' : ''}`}>
      {isEditing ? (
        <div className="note-edit-form">
          <input
            type="text"
            className="form-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title"
          />
          <textarea
            className="form-input"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Content"
            rows={4}
          />
          <input
            type="text"
            className="form-input"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            placeholder="Tags (comma separated)"
          />
          <div className="note-edit-actions">
            <button className="btn btn-sm btn-ghost" onClick={onCancelEdit}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      ) : (
        <>
          <div className="note-card-header">
            <h3 className="note-card-title">{note.title || 'Untitled Note'}</h3>
            <div className="note-card-actions">
              <button className="icon-btn" onClick={onEdit} title="Edit">
                <Edit2 size={14} />
              </button>
              <button className="icon-btn danger" onClick={onDelete} title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          
          <div 
            className="note-card-body"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <pre className="note-content-expanded">{note.content}</pre>
            ) : (
              <p className="note-card-preview">
                {note.content || 'No content'}
              </p>
            )}
          </div>

          <div className="note-card-footer">
            <div className="note-card-meta">
              <span className="note-timestamp">
                <Clock size={12} />
                {formatDate(note.created_at)}
              </span>
            </div>
            
            {(note.tags || []).length > 0 && (
              <div className="note-card-tags">
                {note.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="tag tag-sm">{tag}</span>
                ))}
                {(note.tags || []).length > 2 && (
                  <span className="tag-more">+{note.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
