import React, { useState, useEffect } from 'react';
import {
  FileText, Send, Plus, RefreshCw, Check, Globe, Mail, Edit2, Lightbulb, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';
import { WidgetCard } from './ui/WidgetCard';
import { GlassPill } from './ui/GlassPill';

export default function BlogVoiceView({ api }) {
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [releases, setReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [postsRes, sugRes, relRes] = await Promise.all([
        fetch('/api/blog/posts'),
        fetch('/api/blog/suggestions'),
        fetch('/api/releases/upcoming')
      ]);
      const postsData = await postsRes.json();
      const sugData = await sugRes.json();
      const relData = await relRes.json();

      setPosts(postsData.posts || []);
      setSuggestions(sugData.suggestions || []);
      setReleases(relData.releases || []);
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const scanForTopics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/blog/suggestions/scan', { method: 'POST' });
      const data = await res.json();
      if (data.suggestions) {
        setSuggestions([...suggestions, ...data.suggestions]);
      }
    } catch (e) {
      console.error('Scan failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const approveSuggestion = async (id) => {
    try {
      await fetch(`/api/blog/suggestions/${id}/approve`, { method: 'POST' });
      setSuggestions(suggestions.map(s => s.id === id ? { ...s, status: 'approved' } : s));
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const expandSuggestion = async (id) => {
    try {
      const res = await fetch(`/api/blog/suggestions/${id}/expand`, { method: 'POST' });
      const data = await res.json();
      if (data.post) {
        setPosts([...posts, data.post]);
        setSuggestions(suggestions.map(s => s.id === id ? { ...s, status: 'expanded' } : s));
      }
    } catch (e) {
      console.error('Expand failed:', e);
    }
  };

  const createFromVoiceDrop = async () => {
    if (!newPostTitle || !newPostContent) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/blog/voice-drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPostTitle, transcript: newPostContent, tags: ['voice-drop'] })
      });
      const data = await res.json();
      if (data.success) {
        setPosts([...posts, data.post]);
        setShowNewPost(false);
        setNewPostTitle('');
        setNewPostContent('');
      }
    } catch (e) {
      console.error('Failed to create post:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const draftPosts = posts.filter(p => p.status === 'draft');
  const publishedPosts = posts.filter(p => p.status === 'published');
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  return (
    <div className="flex flex-col h-full animate-in-fade gap-6 pb-[150px] overflow-y-auto glass-scroll pr-2 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-outfit font-bold title-gradient flex items-center gap-3">
            <AnimatedIcon Icon={FileText} className="w-8 h-8 text-violet-400" />
            Blog & Voice Drops
          </h1>
          <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-bold font-mono">
            Voice notes → Tasks, Memories, Blog Topics
          </p>
        </div>
        <div className="flex gap-3">
          <GlassPill
            onClick={fetchData}
            className="flex items-center gap-2"
          >
            <AnimatedIcon Icon={RefreshCw} className={`w-4 h-4 text-violet-400 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </GlassPill>
          <GlassPill
            variant="primary"
            onClick={() => setShowNewPost(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Post
          </GlassPill>
        </div>
      </div>

      {/* Release Status */}
      {releases.length > 0 && releases[0].needs_attention && (
        <WidgetCard className="bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AnimatedIcon Icon={AlertTriangle} className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-400 font-bold text-lg font-outfit uppercase tracking-wider">
                Release coming up: {releases[0].name}
              </h3>
              <div className="flex gap-4 mt-2 text-sm text-amber-200/80 font-mono">
                <span>{releases[0].days_until} days away</span>
                <span className="flex items-center gap-1">Cover art: {releases[0].assets.cover_art ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}</span>
                <span className="flex items-center gap-1">Visualizer: {releases[0].assets.visualizer ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}</span>
                <span className="flex items-center gap-1">Clips: {releases[0].assets.clips ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}</span>
              </div>
            </div>
          </div>
        </WidgetCard>
      )}

      {/* Tabs */}
      <div className="flex gap-3">
        {['posts', 'suggestions'].map(tab => (
          <GlassPill
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className="!px-6 !py-3"
          >
            {tab === 'posts' ? 'Posts' : `Suggestions (${pendingSuggestions.length})`}
          </GlassPill>
        ))}
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WidgetCard title={`Drafts (${draftPosts.length})`} icon={FileText} iconColor="text-gray-400">
            <div className="flex flex-col gap-3">
              {draftPosts.length === 0 ? (
                <div className="text-sm text-gray-500 italic p-4 text-center">No drafts currently.</div>
              ) : (
                draftPosts.map(post => (
                  <div key={post.id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="font-medium text-gray-200 truncate">{post.title}</div>
                    <GlassPill variant="primary" className="!px-3 !py-1 text-xs flex items-center gap-2">
                      <Send className="w-3 h-3" /> Publish
                    </GlassPill>
                  </div>
                ))
              )}
            </div>
          </WidgetCard>

          <WidgetCard title={`Published (${publishedPosts.length})`} icon={CheckCircle} iconColor="text-emerald-400">
            <div className="flex flex-col gap-3">
              {publishedPosts.length === 0 ? (
                <div className="text-sm text-gray-500 italic p-4 text-center">No published posts yet.</div>
              ) : (
                publishedPosts.map(post => (
                  <div key={post.id} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between hover:bg-emerald-500/10 transition-colors">
                    <div className="font-medium text-emerald-100 truncate pr-4">{post.title}</div>
                    <div className="text-xs text-emerald-400/60 font-mono flex-shrink-0">
                      {new Date(post.published_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </WidgetCard>
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <WidgetCard
          title="Blog Topic Suggestions"
          icon={Lightbulb}
          iconColor="text-violet-400"
          action={
            <GlassPill onClick={scanForTopics} className="flex items-center gap-2">
              <AnimatedIcon Icon={Lightbulb} className={`w-4 h-4 text-violet-400 ${isLoading ? 'animate-pulse' : ''}`} />
              Scan Voice Notes
            </GlassPill>
          }
        >
          {pendingSuggestions.length === 0 ? (
            <div className="text-gray-500 text-center py-12 font-mono uppercase tracking-widest text-sm">
              No suggestions yet. Click "Scan Voice Notes" to analyze recent transcripts.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingSuggestions.map(sug => (
                <div key={sug.id} className="p-6 bg-black/40 border border-violet-500/20 rounded-xl border-l-[4px] hover:bg-black/60 transition-colors">
                  <div className="font-bold text-lg text-violet-100 mb-2 font-outfit">{sug.suggested_topic}</div>
                  <div className="text-sm text-gray-400 mb-6 leading-relaxed line-clamp-3">{sug.full_context}</div>
                  <div className="flex gap-3 mt-auto">
                    <GlassPill onClick={() => approveSuggestion(sug.id)} className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-400" /> Approve
                    </GlassPill>
                    <GlassPill variant="primary" onClick={() => expandSuggestion(sug.id)} className="flex items-center gap-2 text-violet-200 border-violet-500/50 bg-violet-500/20 hover:bg-violet-500/30">
                      <AnimatedIcon Icon={Edit2} className="w-3 h-3" /> Expand with AI
                    </GlassPill>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WidgetCard>
      )}

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <WidgetCard className="w-full max-w-2xl bg-[#0a0f18] border-white/10 shadow-2xl relative">
            <button
              onClick={() => setShowNewPost(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white bg-white/5 rounded-full transition-all"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-outfit font-bold text-white mb-6">Create Blog Post</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Post Title</label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={e => setNewPostTitle(e.target.value)}
                  placeholder="Enter a captivating title..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Voice Transcript / Content</label>
                <textarea
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  placeholder="Draft your thoughts or drop a transcript..."
                  rows={12}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all resize-none glass-scroll font-mono"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5 mt-4">
                <GlassPill onClick={() => setShowNewPost(false)}>Cancel</GlassPill>
                <GlassPill
                  variant="primary"
                  onClick={createFromVoiceDrop}
                  className="bg-violet-600 hover:bg-violet-500 border-violet-500 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Save Post
                </GlassPill>
              </div>
            </div>
          </WidgetCard>
        </div>
      )}
    </div>
  );
}
