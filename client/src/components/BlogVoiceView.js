import React, { useState, useEffect } from 'react';
import {
  FileText, Send, Plus, RefreshCw, Check, Globe, Mail, Edit2, Lightbulb, AlertTriangle,
  CheckCircle, XCircle, X, Search, Filter, Mic, BookOpen, Clock, Zap, Trash2, Eye
} from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';
import { WidgetCard } from './ui/WidgetCard';
import { GlassyPill } from './ui/GlassyPill';

const statusConfig = {
  draft: { color: '#f59e0b', label: 'Draft', glass: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  published: { color: '#10b981', label: 'Published', glass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  archived: { color: '#64748b', label: 'Archived', glass: 'bg-gray-500/10 border-gray-500/20 text-gray-400' }
};

export default function BlogVoiceView({ api }) {
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [releases, setReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showNewPost, setShowNewPost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [postsRes, sugRes, relRes] = await Promise.all([
        fetch('/api/blog/posts').catch(() => ({ json: () => ({ posts: [] }) })),
        fetch('/api/blog/suggestions').catch(() => ({ json: () => ({ suggestions: [] }) })),
        fetch('/api/releases/upcoming').catch(() => ({ json: () => ({ releases: [] }) }))
      ]);
      const postsData = await postsRes.json();
      const sugData = await sugRes.json();
      const relData = await relRes.json();

      setPosts(postsData.posts || []);
      setSuggestions(sugData.suggestions || []);
      setReleases(relData.releases || []);
    } catch (e) {
      console.error('Failed to fetch data:', e);
      setError('Failed to load blog data');
    } finally {
      setIsLoading(false);
    }
  };

  const scanForTopics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/blog/suggestions/scan', { method: 'POST' }).catch(() => ({ json: () => ({}) }));
      const data = await res.json();
      if (data.suggestions) {
        setSuggestions(prev => [...prev, ...data.suggestions]);
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
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const expandSuggestion = async (id) => {
    try {
      const res = await fetch(`/api/blog/suggestions/${id}/expand`, { method: 'POST' }).catch(() => ({ json: () => ({}) }));
      const data = await res.json();
      if (data.post) {
        setPosts(prev => [...prev, data.post]);
        setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'expanded' } : s));
      }
    } catch (e) {
      console.error('Expand failed:', e);
    }
  };

  const createPost = async () => {
    if (!newPostTitle.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/blog/voice-drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPostTitle,
          transcript: newPostContent,
          tags: newPostTags.split(',').map(t => t.trim()).filter(Boolean)
        })
      }).catch(() => ({ json: () => ({ success: false }) }));
      const data = await res.json();
      if (data.success || data.post) {
        setPosts(prev => [data.post || { id: Date.now(), title: newPostTitle, content: newPostContent, status: 'draft' }, ...prev]);
        setShowNewPost(false);
        setNewPostTitle('');
        setNewPostContent('');
        setNewPostTags('');
      }
    } catch (e) {
      console.error('Failed to create post:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const publishPost = async (postId) => {
    try {
      await fetch('/api/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId })
      }).catch(() => ({ json: () => ({}) }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'published', published_at: new Date().toISOString() } : p));
    } catch (e) {
      console.error('Publish failed:', e);
    }
  };

  const deletePost = async (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setSelectedPost(null);
  };

  const draftPosts = posts.filter(p => p.status === 'draft');
  const publishedPosts = posts.filter(p => p.status === 'published');
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  const filteredPosts = posts.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Drafts', value: draftPosts.length, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Published', value: publishedPosts.length, icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Voice Drops', value: posts.filter(p => p.source === 'voice-drop').length, icon: Mic, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Suggestions', value: pendingSuggestions.length, icon: Lightbulb, color: 'text-cyan-400', bg: 'bg-cyan-500/10' }
  ];

  return (
    <div className="flex flex-col h-full animate-in-fade gap-6 pb-[150px] overflow-y-auto glass-scroll pr-2 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-outfit font-bold title-gradient flex items-center gap-3">
            <AnimatedIcon Icon={BookOpen} className="w-8 h-8 text-violet-400" />
            Blog & Voice
          </h1>
          <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-bold font-mono">
            Voice notes → Written content
          </p>
        </div>
        <div className="flex gap-3">
          <GlassyPill onClick={fetchData} className="flex items-center gap-2">
            <AnimatedIcon Icon={RefreshCw} className={`w-4 h-4 text-violet-400 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </GlassyPill>
          <GlassyPill variant="primary" onClick={() => setShowNewPost(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Post
          </GlassyPill>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`${stat.bg} border border-white/5 rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <AnimatedIcon Icon={stat.icon} className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold font-outfit ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Release Status */}
      {releases.length > 0 && releases[0]?.needs_attention && (
        <WidgetCard className="bg-amber-500/10 border-amber-500/30 p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AnimatedIcon Icon={AlertTriangle} className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-400 font-bold text-lg font-outfit uppercase tracking-wider">
                Release: {releases[0].name}
              </h3>
              <div className="flex gap-4 mt-2 text-sm text-amber-200/80 font-mono">
                <span>{releases[0].days_until} days</span>
                <span className="flex items-center gap-1">
                  Cover: {releases[0].assets?.cover_art ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                </span>
              </div>
            </div>
          </div>
        </WidgetCard>
      )}

      {/* Search & Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full bg-black/40 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/30"
          />
        </div>
        <div className="flex gap-2">
          {['posts', 'suggestions'].map(tab => (
            <GlassyPill
              key={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className="!px-5 !py-3"
            >
              {tab === 'posts' ? 'Posts' : `Ideas (${pendingSuggestions.length})`}
            </GlassyPill>
          ))}
        </div>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {isLoading ? (
              <WidgetCard className="p-12 text-center">
                <AnimatedIcon Icon={RefreshCw} className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
                <p className="text-gray-500 mt-4">Loading posts...</p>
              </WidgetCard>
            ) : filteredPosts.length === 0 ? (
              <WidgetCard className="p-12 text-center border-dashed border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-xl font-outfit font-bold text-white mb-2">No posts yet</h3>
                <p className="text-gray-500 mb-6">Create your first blog post or voice drop</p>
                <GlassyPill variant="primary" onClick={() => setShowNewPost(true)} className="inline-flex">
                  <Plus className="w-4 h-4" /> Create Post
                </GlassyPill>
              </WidgetCard>
            ) : (
              filteredPosts.map(post => {
                const status = statusConfig[post.status] || statusConfig.draft;
                return (
                  <WidgetCard
                    key={post.id}
                    className={`p-0 overflow-hidden cursor-pointer hover:border-violet-500/30 transition-all ${selectedPost?.id === post.id ? 'border-violet-500/50' : ''}`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-lg font-outfit font-bold text-white line-clamp-1">{post.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.glass}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-4">{post.content || post.transcript || 'No content'}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}
                          {post.source === 'voice-drop' && (
                            <span className="flex items-center gap-1 ml-2 text-violet-400">
                              <Mic className="w-3 h-3" /> Voice
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {post.status === 'draft' && (
                            <GlassyPill onClick={(e) => { e.stopPropagation(); publishPost(post.id); }} className="!px-3 !py-1 text-xs">
                              <Send className="w-3 h-3" /> Publish
                            </GlassyPill>
                          )}
                        </div>
                      </div>
                    </div>
                  </WidgetCard>
                );
              })
            )}
          </div>

          {/* Post Preview */}
          <div className="lg:col-span-1">
            {selectedPost ? (
              <WidgetCard className="p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-outfit font-bold text-white">Preview</h3>
                  <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-white/5 rounded-lg">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <h2 className="text-xl font-bold mb-2">{selectedPost.title}</h2>
                  <div className="flex gap-2 mb-4">
                    {selectedPost.tags?.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedPost.content || selectedPost.transcript || 'No content yet'}</p>
                </div>
                <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                  <GlassyPill onClick={() => deletePost(selectedPost.id)} className="flex-1 !py-2 text-red-400">
                    <Trash2 className="w-4 h-4" /> Delete
                  </GlassyPill>
                </div>
              </WidgetCard>
            ) : (
              <WidgetCard className="p-8 text-center border-dashed border-white/10">
                <Eye className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Select a post to preview</p>
              </WidgetCard>
            )}
          </div>
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <WidgetCard
          title="AI Blog Ideas"
          icon={Zap}
          iconColor="text-violet-400"
          className="p-6"
          action={
            <GlassyPill onClick={scanForTopics} className="flex items-center gap-2">
              <AnimatedIcon Icon={Zap} className={`w-4 h-4 text-violet-400 ${isLoading ? 'animate-pulse' : ''}`} />
              Generate Ideas
            </GlassyPill>
          }
        >
          {pendingSuggestions.length === 0 ? (
            <div className="text-gray-500 text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-lg font-outfit font-bold text-white mb-2">No ideas yet</h3>
              <p className="text-sm mb-4">Click "Generate Ideas" to scan your content for blog topics</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSuggestions.map(sug => (
                <div key={sug.id} className="p-5 bg-black/40 border border-violet-500/20 rounded-xl hover:bg-black/60 transition-colors">
                  <div className="font-bold text-violet-100 mb-2 font-outfit">{sug.suggested_topic || sug.title}</div>
                  <div className="text-sm text-gray-400 mb-4 line-clamp-2">{sug.full_context || sug.content}</div>
                  <div className="flex gap-2">
                    <GlassyPill onClick={() => approveSuggestion(sug.id)} className="flex items-center gap-1 text-xs">
                      <Check className="w-3 h-3 text-emerald-400" /> Use
                    </GlassyPill>
                    <GlassyPill variant="primary" onClick={() => expandSuggestion(sug.id)} className="flex items-center gap-1 text-xs">
                      <Zap className="w-3 h-3" /> Expand
                    </GlassyPill>
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
          <WidgetCard className="w-full max-w-2xl bg-[#0a0f18] border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowNewPost(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white bg-white/5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6">
              <h2 className="text-2xl font-outfit font-bold text-white mb-6 flex items-center gap-3">
                <Mic className="w-6 h-6 text-violet-400" />
                New Blog Post
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-gray-500 mb-2">Title</label>
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={e => setNewPostTitle(e.target.value)}
                    placeholder="Post title..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-gray-500 mb-2">Content</label>
                  <textarea
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    placeholder="Write your post or paste a voice transcript..."
                    rows={10}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 resize-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-gray-500 mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newPostTags}
                    onChange={e => setNewPostTags(e.target.value)}
                    placeholder="voice-drop, music, update..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                  <GlassyPill onClick={() => setShowNewPost(false)}>Cancel</GlassyPill>
                  <GlassyPill
                    variant="primary"
                    onClick={createPost}
                    disabled={!newPostTitle.trim() || isLoading}
                    className="bg-violet-600 hover:bg-violet-500 border-violet-500 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Create Post
                  </GlassyPill>
                </div>
              </div>
            </div>
          </WidgetCard>
        </div>
      )}
    </div>
  );
}
