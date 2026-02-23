import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Upload, Image, Video, FileText, 
  Check, X, Plus, RefreshCw, Send, Instagram, 
  Twitter, Youtube, MessageCircle, Zap, Folder,
  ChevronRight, Filter, Edit2, Trash2, Eye, Cloud
} from 'lucide-react';

const PLATFORM_ICONS = {
  instagram: '📸',
  tiktok: '🎵',
  twitter: '🐦',
  threads: '🧵',
  youtube: '📺'
};

const CONTENT_TYPE_CONFIG = {
  stream_flyer: { icon: '📱', color: '#6366f1', label: 'Stream Flyer' },
  carousel: { icon: '🎠', color: '#f59e0b', label: 'Carousel' },
  meme: { icon: '😂', color: '#ec4899', label: 'Meme' },
  video_rant: { icon: '🎤', color: '#8b5cf6', label: 'Video Rant' },
  reel: { icon: '🎬', color: '#06b6d4', label: 'Reel' },
  release_post: { icon: '🚀', color: '#10b981', label: 'Release' },
  clip: { icon: '✂️', color: '#f97316', label: 'Clip' },
  bts: { icon: '🎥', color: '#64748b', label: 'BTS' },
  lifestyle: { icon: '🌴', color: '#14b8a6', label: 'Lifestyle' }
};

export default function ContentSchedulerView({ api }) {
  const [activeTab, setActiveTab] = useState('schedule');
  const [calendar, setCalendar] = useState([]);
  const [folders, setFolders] = useState({});
  const [automation, setAutomation] = useState({});
  const [driveFiles, setDriveFiles] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [calRes, autoRes] = await Promise.all([
        fetch('/api/content/calendar/all'),
        fetch('/api/content/automation')
      ]);
      const calData = await calRes.json();
      const autoData = await autoRes.json();
      setCalendar(calData.calendar || []);
      setAutomation(autoData);
    } catch (e) {
      console.error('Failed to fetch content data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const syncFromDrive = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/content/drive/sync');
      const data = await res.json();
      if (data.success) {
        setDriveFiles(data.folders);
        setLastSync(data.synced);
      }
    } catch (e) {
      console.error('Drive sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const upcomingPosts = calendar.filter(p => p.status === 'pending');
  const postedPosts = calendar.filter(p => p.status === 'posted');
  const releasePosts = calendar.filter(p => p.type === 'release');

  const getStatusColor = (status) => {
    switch(status) {
      case 'posted': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'draft': return '#6366f1';
      default: return '#64748b';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Zap size={28} color="#f59e0b" />
            Content Scheduler
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            Auto-posting • Release management • Content folders
            {lastSync && <span style={{ marginLeft: '12px', fontSize: '12px' }}>• Last synced: {new Date(lastSync).toLocaleTimeString()}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn" onClick={syncFromDrive} disabled={isSyncing} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} className={isSyncing ? 'spinning' : ''} /> 
            {isSyncing ? 'Syncing...' : 'Sync from Drive'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowPostModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> New Post
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        {[
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'releases', label: 'Releases', icon: Video },
          { id: 'folders', label: 'Folders', icon: Folder },
          { id: 'drive', label: 'Google Drive', icon: Cloud },
          { id: 'automation', icon: Zap }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? '#f59e0b' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {tab.icon && <tab.icon size={16} />}
            {tab.label || tab.id}
          </button>
        ))}
      </div>

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
          {/* Calendar Grid */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Content Calendar</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['month', 'week', 'list'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: viewMode === mode ? '#f1f5f9' : 'transparent',
                      color: viewMode === mode ? '#0f172a' : '#64748b',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Simple List View */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {calendar.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>No content scheduled yet</p>
                </div>
              ) : (
                calendar.slice(0, 20).map((post, idx) => (
                  <div key={post.id || idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${getStatusColor(post.status)}`
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{post.title}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.platform}</span>
                        <span>•</span>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          background: getStatusColor(post.status) + '20',
                          color: getStatusColor(post.status)
                        }}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {post.platform?.includes('instagram') && <span>📸</span>}
                      {post.platform?.includes('tiktok') && <span>🎵</span>}
                      {post.platform?.includes('twitter') && <span>🐦</span>}
                      {post.platform?.includes('threads') && <span>🧵</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Upcoming */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#f59e0b" />
                Upcoming ({upcomingPosts.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcomingPosts.slice(0, 5).map((post, idx) => (
                  <div key={idx} style={{ 
                    padding: '12px', 
                    background: '#fffbeb', 
                    borderRadius: '8px',
                    borderLeft: '3px solid #f59e0b'
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{post.title}</div>
                    <div style={{ fontSize: '12px', color: '#92400e' }}>{post.date}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Stats */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Platforms</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.entries(PLATFORM_ICONS).map(([platform, icon]) => (
                  <div key={platform} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '10px',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                    <span style={{ textTransform: 'capitalize', fontSize: '14px' }}>{platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Releases Tab */}
      {activeTab === 'releases' && (
        <div>
          <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>🎵 A Few Things ft Jai'Len</h2>
                <p style={{ margin: 0, opacity: 0.9 }}>Releasing February 25, 2026 (12am PT)</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '36px', fontWeight: 700 }}>12-13</div>
                <div style={{ opacity: 0.8 }}>Clips Ready</div>
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: '16px' }}>Release Timeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {releasePosts.map((post, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  width: '80px', 
                  fontWeight: 600, 
                  color: post.status === 'posted' ? '#10b981' : '#0f172a' 
                }}>
                  {post.date}
                </div>
                <div style={{ flex: 1, fontWeight: 500 }}>{post.title}</div>
                <div style={{ 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  background: getStatusColor(post.status) + '20',
                  color: getStatusColor(post.status),
                  fontSize: '13px',
                  textTransform: 'capitalize'
                }}>
                  {post.status}
                </div>
                <div style={{ marginLeft: '12px', display: 'flex', gap: '4px' }}>
                  {post.platform?.split(',').map(p => (
                    <span key={p} style={{ fontSize: '18px' }}>{PLATFORM_ICONS[p]}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Folders Tab */}
      {activeTab === 'folders' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {Object.entries(CONTENT_TYPE_CONFIG).map(([type, config]) => (
            <div key={type} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              borderTop: `4px solid ${config.color}`
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{config.icon}</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{config.label}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                {type === 'stream_flyer' && 'Auto-post when going live'}
                {type === 'meme' && 'VT323 font memes'}
                {type === 'video_rant' && 'Post as draft'}
                {type === 'release_post' && 'Music video/carousel'}
                {!['stream_flyer', 'meme', 'video_rant', 'release_post'].includes(type) && 'Drop content here'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Automation Tab */}
      {activeTab === 'automation' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="#10b981" />
              Auto-Post (No Approval)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Stream Flyers → Twitter/Threads/IG'].map(item => (
                <div key={item} style={{ padding: '12px', background: '#ecfdf5', borderRadius: '8px', color: '#065f46' }}>
                  ✅ {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={20} color="#6366f1" />
              Post as Draft (Sound Tagging)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Video Rants → IG/TikTok', 'Reels → IG/TikTok'].map(item => (
                <div key={item} style={{ padding: '12px', background: '#eef2ff', borderRadius: '8px', color: '#3730a3' }}>
                  📝 {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={20} color="#f59e0b" />
              Requires Approval
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Carousels', 'Memes', 'Clips', 'Release Posts'].map(item => (
                <div key={item} style={{ padding: '12px', background: '#fffbeb', borderRadius: '8px', color: '#92400e' }}>
                  👀 {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Tab */}
      {activeTab === 'drive' && (
        <div>
          <div style={{ background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)', borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Cloud size={40} />
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>Google Drive</h2>
                  <p style={{ margin: 0, opacity: 0.9 }}>Click "Sync from Drive" to pull latest files</p>
                </div>
              </div>
              <button 
                onClick={syncFromDrive}
                disabled={isSyncing}
                style={{ 
                  padding: '12px 24px', 
                  background: 'white', 
                  color: '#4285f4', 
                  border: 'none', 
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={18} className={isSyncing ? 'spinning' : ''} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>

          {lastSync && (
            <p style={{ color: '#64748b', marginBottom: '16px' }}>
              Last synced: {new Date(lastSync).toLocaleString()}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {Object.entries(driveFiles).map(([folderName, files]) => (
              <div key={folderName} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Folder size={18} color="#4285f4" />
                  {folderName.replace(/_/g, ' ')}
                  <span style={{ marginLeft: 'auto', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                    {files.length}
                  </span>
                </h3>
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {files.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No files</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {files.slice(0, 10).map((file, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                          <Image size={14} color="#64748b" />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </span>
                        </div>
                      ))}
                      {files.length > 10 && (
                        <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>+{files.length - 10} more files</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(driveFiles).length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <Cloud size={64} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>Click "Sync from Drive" to pull your content files</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
