import React, { useState, useEffect } from 'react';
import { Plus, Lightbulb, Zap, FileText, Trash2, Send, RefreshCw, X, Star } from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import LobsterScrollArea from './ui/LobsterScrollArea';

const statusConfig = {
  raw: { label: 'Raw', color: 'text-[var(--text-muted)]', bg: 'bg-gray-500/10', glass: 'bg-gray-500/20 text-gray-300' },
  expanding: { label: 'Expanding', color: 'text-cyan-400', bg: 'bg-[var(--bg-panel)]yan-500/10', glass: 'bg-[var(--bg-panel)]yan-500/20 text-cyan-300' },
  drafting: { label: 'Drafting', color: 'text-amber-400', bg: 'bg-[var(--bg-card)]mber-500/10', glass: 'bg-[var(--bg-card)]mber-500/20 text-amber-300' },
  published: { label: 'Published', color: 'text-emerald-400', bg: 'bg-emerald-500/10', glass: 'bg-emerald-500/20 text-emerald-300' }
};

export default function IdeaBankView({ api }) {
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', brief: '', priority: 'medium' });
  const [selectedIdea, setSelectedIdea] = useState(null);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/blog/ideas');
      const data = await res.json();
      setIdeas(data.ideas || []);
    } catch (e) {
      console.error('Failed to fetch ideas:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const createIdea = async () => {
    if (!newIdea.title.trim()) return;
    try {
      const res = await fetch('/api/blog/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIdea)
      });
      const data = await res.json();
      if (api?.refresh) api.refresh();
      if (data.success) {
        setIdeas(prev => [data.idea, ...prev]);
        setShowNewIdea(false);
        setNewIdea({ title: '', brief: '', priority: 'medium' });
      }
    } catch (e) {
      console.error('Failed to create idea:', e);
    }
  };

  const runShrimp = async (idea) => {
    if (!idea.brief) return alert('Need brief description to expand');
    try {
      const res = await fetch('/api/blog/shrimp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea_id: idea.id,
          idea_title: idea.title,
          idea_brief: idea.brief
        })
      });
      const data = await res.json();
      if (api?.refresh) api.refresh();
      if (data.success) {
        // Update idea status
        setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: 'expanding' } : i));
        alert('🦐 Shrimp is cooking! Check back for your expanded draft.');
      }
    } catch (e) {
      console.error('Shrimp failed:', e);
    }
  };

  const deleteIdea = async (id) => {
    if (!confirm('Delete this idea?')) return;
    try {
      await fetch(`/api/blog/ideas/${id}`, { method: 'DELETE' });
      if (api?.refresh) api.refresh();
      setIdeas(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const convertToPost = async (idea) => {
    try {
      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          content: idea.expanded_content || idea.brief,
          status: 'draft'
        })
      });
      const data = await res.json();
      if (api?.refresh) api.refresh();
      if (data.success) {
        setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: 'published' } : i));
        alert('✅ Idea converted to blog post!');
      }
    } catch (e) {
      console.error('Convert failed:', e);
    }
  };

  return (
    <LobsterScrollArea direction="vertical" className="h-full" contentClassName="flex flex-col gap-6 pb-[150px] pr-2 pt-2 animate-in-fade">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-outfit font-bold title-gradient flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-amber-400" />
            Idea Bank
          </h1>
          <p className="text-[var(--text-muted)] mt-1">Capture ideas → Expand with Shrimp → Draft → Publish</p>
        </div>
        <button
          onClick={() => setShowNewIdea(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-rgb(var(--rgb-accent-sec)) to-rgb(var(--rgb-accent-main)) px-5 py-2.5 rounded-full hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Idea
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = ideas.filter(i => i.status === key).length;
          return (
            <WidgetCard key={key} className={`p-4 ${config.bg}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.glass}`}>
                  {key === 'raw' && <Lightbulb className="w-4 h-4" />}
                  {key === 'expanding' && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {key === 'drafting' && <FileText className="w-4 h-4" />}
                  {key === 'published' && <Zap className="w-4 h-4" />}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${config.color}`}>{count}</p>
                  <p className="text-xs text-[var(--text-muted)]">{config.label}</p>
                </div>
              </div>
            </WidgetCard>
          );
        })}
      </div>

      {/* New Idea Modal */}
      {showNewIdea && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <WidgetCard className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-main)]">New Idea</h2>
              <button onClick={() => setShowNewIdea(false)} className="p-2 hover:bg-[var(--bg-overlay)] rounded-lg">
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[var(--text-muted)] text-sm">Title</label>
                <input
                  type="text"
                  value={newIdea.title}
                  onChange={e => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[var(--bg-overlay)] border border-[var(--border-color)] rounded-lg p-3 text-[var(--text-main)] mt-1"
                  placeholder="Idea title..."
                />
              </div>
              <div>
                <label className="text-[var(--text-muted)] text-sm">Brief</label>
                <textarea
                  value={newIdea.brief}
                  onChange={e => setNewIdea(prev => ({ ...prev, brief: e.target.value }))}
                  className="w-full bg-[var(--bg-overlay)] border border-[var(--border-color)] rounded-lg p-3 text-[var(--text-main)] mt-1 h-32"
                  placeholder="What's the idea about?"
                />
              </div>
              <button
                onClick={createIdea}
                className="w-full bg-gradient-to-r from-rgb(var(--rgb-accent-sec)) to-rgb(var(--rgb-accent-main)) py-3 rounded-lg font-bold"
              >
                Save Idea
              </button>
            </div>
          </WidgetCard>
        </div>
      )}

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
        {isLoading ? (
          <WidgetCard className="col-span-full p-12 text-center">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-[var(--text-muted)] mt-4">Loading ideas...</p>
          </WidgetCard>
        ) : ideas.length === 0 ? (
          <WidgetCard className="col-span-full p-12 text-center border-dashed border-[var(--border-color)]">
            <Lightbulb className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No ideas yet</h3>
            <p className="text-[var(--text-muted)]">Capture your first idea!</p>
          </WidgetCard>
        ) : (
          ideas.map(idea => {
            const status = statusConfig[idea.status] || statusConfig.raw;
            return (
              <WidgetCard key={idea.id} className="p-5 hover:border-rgb(var(--rgb-accent-sec))/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-[var(--text-main)] line-clamp-1">{idea.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${status.glass}`}>{status.label}</span>
                </div>
                <p className="text-[var(--text-muted)] text-sm line-clamp-3 mb-4">{idea.brief}</p>
                <div className="flex items-center gap-2">
                  {idea.status === 'raw' && (
                    <button
                      onClick={() => runShrimp(idea)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[var(--bg-panel)]yan-500/20 text-cyan-300 py-2 rounded-lg text-sm hover:bg-[var(--bg-panel)]yan-500/30"
                    >
                      <Send className="w-4 h-4" /> Shrimp
                    </button>
                  )}
                  {(idea.status === 'expanding' || idea.status === 'drafting') && (
                    <button
                      onClick={() => convertToPost(idea)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[var(--bg-card)]mber-500/20 text-amber-300 py-2 rounded-lg text-sm hover:bg-[var(--bg-card)]mber-500/30"
                    >
                      <FileText className="w-4 h-4" /> To Post
                    </button>
                  )}
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </WidgetCard>
            );
          })
        )}
      </div>
    </LobsterScrollArea>
  );
}
