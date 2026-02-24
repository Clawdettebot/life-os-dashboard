import React, { useState, useEffect } from 'react';
import { 
  FileText, Send, Plus, RefreshCw, Check, Globe, Mail, Edit2, Lightbulb, AlertTriangle
} from 'lucide-react';

export default function BlogVoiceView({ api }) {
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [releases, setReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Detect dark mode
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setDarkMode(isDark);
    
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);
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

  const styles = {
    container: { padding: '20px', maxWidth: '1400px', margin: '0 auto' },
    card: { background: darkMode ? '#1e293b' : 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    cardBg: darkMode ? '#1e293b' : 'white',
    altBg: darkMode ? '#0f172a' : '#f8fafc',
    greenBg: darkMode ? '#14532d' : '#f0fdf4',
    yellowBg: darkMode ? '#78350f' : '#fef3c7',
    text: darkMode ? '#e2e8f0' : '#1e293b',
    muted: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    inputBg: darkMode ? '#0f172a' : 'white',
  };

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
            <FileText size={28} color="#8b5cf6" style={{ marginRight: '12px' }} />
            Blog and Voice Drops
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Voice notes → Tasks, Memories, Blog Topics</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn" onClick={fetchData}><RefreshCw size={16} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowNewPost(true)}><Plus size={16} /> New Post</button>
        </div>
      </div>

      {/* Release Status */}
      {releases.length > 0 && releases[0].needs_attention && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AlertTriangle size={24} color="#f59e0b" />
          <div style={{ flex: 1 }}>
            <strong>Release coming up: {releases[0].name}</strong>
            <div style={{ fontSize: '14px', color: '#92400e' }}>
              {releases[0].days_until} days away • 
              Cover art: {releases[0].assets.cover_art ? '✅' : '❌'} • 
              Visualizer: {releases[0].assets.visualizer ? '✅' : '❌'} • 
              Clips: {releases[0].assets.clips ? '✅' : '❌'}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['posts', 'suggestions'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab ? '#8b5cf6' : '#f1f5f9',
              color: activeTab === tab ? 'white' : '#64748b',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {tab === 'posts' ? 'Posts' : `Suggestions (${pendingSuggestions.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'posts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>Drafts ({draftPosts.length})</h3>
            {draftPosts.map(post => (
              <div key={post.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '12px' }}>
                <div style={{ fontWeight: 600 }}>{post.title}</div>
                <button className="btn btn-sm" onClick={() => {}} style={{ marginTop: '8px' }}>
                  <Send size={12} style={{ marginRight: '4px' }} /> Publish
                </button>
              </div>
            ))}
          </div>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>Published ({publishedPosts.length})</h3>
            {publishedPosts.map(post => (
              <div key={post.id} style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', marginBottom: '12px' }}>
                <div style={{ fontWeight: 600 }}>{post.title}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(post.published_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Blog Topic Suggestions</h3>
            <button className="btn" onClick={scanForTopics}><Lightbulb size={16} style={{ marginRight: '8px' }} /> Scan Voice Notes</button>
          </div>
          {pendingSuggestions.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>No suggestions yet. Click "Scan Voice Notes" to find topics.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingSuggestions.map(sug => (
                <div key={sug.id} style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #8b5cf6' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>{sug.suggested_topic}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{sug.full_context}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-sm" onClick={() => approveSuggestion(sug.id)}><Check size={12} style={{ marginRight: '4px' }} /> Approve</button>
                    <button className="btn btn-sm btn-primary" onClick={() => expandSuggestion(sug.id)}><Edit2 size={12} style={{ marginRight: '4px' }} /> Expand with AI</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showNewPost && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '600px' }}>
            <h2>New Blog Post</h2>
            <input type="text" value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} placeholder="Post title" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }} />
            <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="Content" rows={10} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontFamily: 'monospace' }} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowNewPost(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createFromVoiceDrop}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
