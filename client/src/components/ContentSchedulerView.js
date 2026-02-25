import React, { useState, useEffect } from 'react';
import { Instagram, Music, Twitter, Youtube, CalendarDays, Activity, Settings, Plus, HardDrive, Smartphone, Radio, Target, ChevronRight, X, Zap, Clock, Folder, File } from 'lucide-react';

// ==========================================
// POST BRIDGE API
// ==========================================
const POST_BRIDGE_BASE_URL = "https://api.post-bridge.com/v1";

const fetchAPI = async (endpoint, options = {}, apiKey) => {
  const response = await fetch(`${POST_BRIDGE_BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, ...options.headers },
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
};

const PostBridgeAPI = (apiKey) => ({
  getSocialAccounts: () => fetchAPI('/social-accounts', {}, apiKey),
  getPosts: () => fetchAPI('/posts?limit=50', {}, apiKey),
  createPost: (payload) => fetchAPI('/posts', { method: 'POST', body: JSON.stringify(payload) }, apiKey),
  updatePost: (id, payload) => fetchAPI(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, apiKey),
  deletePost: (id) => fetchAPI(`/posts/${id}`, { method: 'DELETE' }, apiKey),
  getAnalytics: () => fetchAPI('/analytics?timeframe=7d', {}, apiKey),
});

// ==========================================
// VISUAL COMPONENTS (From your fire code)
// ==========================================
const LobsterIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M12 2C12 2 10 6 10 10C10 14 12 18 12 18M12 2C12 2 14 6 14 10C14 14 12 18 12 18M10 10C8 10 6 12 6 15C6 18 8 20 10 20M14 10C16 10 18 12 18 15C18 18 16 20 14 20M8 4C6 4 4 6 4 8C4 10 6 12 8 12M16 4C18 4 20 6 20 8C20 10 18 12 16 12M11 21v1M13 21v1" />
  </svg>
);

const OrangeIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="13" r="9" />
    <path d="M12 4C14 4 16 2 16 2C16 2 17 4 15 6C13 8 12 4 12 4Z" fill="currentColor" opacity="0.5" />
  </svg>
);

const GlassPill = ({ children, className = '', onClick, active, variant = 'default' }) => {
  const base = "relative px-5 py-2.5 text-xs font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden cursor-pointer";
  const variants = {
    default: active ? 'bg-white/20 text-white shadow-[0_8px_16px_rgba(0,0,0,0.2)] border border-white/30 backdrop-blur-md' : 'bg-black/20 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5 backdrop-blur-sm',
    primary: 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-[0_8px_20px_rgba(239,68,68,0.3)] border border-red-400/50 hover:scale-105 active:scale-95',
    dark: 'bg-black/60 text-white border border-white/10 backdrop-blur-xl hover:bg-black/80'
  };
  return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};

const WidgetCard = ({ children, className = '' }) => (
  <div className={`bg-[#0f0f13]/60 backdrop-blur-3xl border border-white-[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-[32px] overflow-hidden ${className}`}>
    {children}
  </div>
);

const formatHour = (hour) => { const ampm = hour >= 12 ? 'pm' : 'am'; const h = hour % 12 || 12; return `${h}${ampm}`; };
const getCellStyles = (intensity) => {
  if (intensity <= 2) return 'bg-white/5 border-transparent';
  if (intensity <= 5) return 'bg-[#ea580c]/40 border-[#ea580c]/50 backdrop-blur-sm';
  if (intensity <= 7) return 'bg-[#ea580c]/80 border-[#ea580c] shadow-[0_0_15px_rgba(234,88,12,0.4)]';
  return 'bg-[#dc2626] border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.7)] z-10';
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ContentSchedulerView({ api, postbridgeKey }) {
  const API_KEY = postbridgeKey || "pb_live_6TxeA2MXDdTeVaXrp8BwG8";
  const pb = PostBridgeAPI(API_KEY);
  
  const [activePlatform, setActivePlatform] = useState('instagram');
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimelineDay, setSelectedTimelineDay] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ caption: '', scheduledDate: '', scheduledTime: '18:00', platforms: [], isDraft: false });
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [currentDriveFolder, setCurrentDriveFolder] = useState(null);
  const [showDriveBrowser, setShowDriveBrowser] = useState(false);

  // Load guap.dad folder on mount
  useEffect(() => {
    loadDriveFiles();
  }, []);

  const loadDriveFiles = async (folderId = null) => {
    setDriveLoading(true);
    try {
      const endpoint = folderId ? `/api/drive/files?folderId=${folderId}` : '/api/drive/guapdad';
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) {
        setDriveFiles(data.files || []);
        setCurrentDriveFolder(data.folder || null);
      } else {
        setDriveFiles([]);
      }
    } catch (e) {
      console.error('Drive load error:', e);
    }
    setDriveLoading(false);
  };

  const handleDriveFileClick = (file) => {
    if (file.mimeType.includes('folder')) {
      loadDriveFiles(file.id);
    }
  };

  // Heatmap mock data (until we have real engagement data)
  const [heatmapData, setHeatmapData] = useState(null);
  const generateHeatmap = () => {
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
    const peaks = activePlatform === 'instagram' ? [18, 19] : activePlatform === 'tiktok' ? [20, 22] : [9, 12, 17];
    const data = {};
    DAYS.forEach(day => {
      data[day] = HOURS.map(hour => {
        let score = Math.floor(Math.random() * 4);
        peaks.forEach(peak => {
          if (Math.abs(hour - peak) <= 2) score += Math.floor(Math.random() * 4) + 3;
          if (hour === peak) score += 3;
        });
        return Math.min(10, score);
      });
    });
    return data;
  };

  useEffect(() => { loadData(); setHeatmapData(generateHeatmap()); }, [activePlatform]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accRes, postsRes, anaRes] = await Promise.all([pb.getSocialAccounts(), pb.getPosts(), pb.getAnalytics()]);
      if (accRes?.data) setAccounts(accRes.data);
      if (postsRes?.data) setPosts(postsRes.data.map(mapPost));
      if (anaRes?.data) setAnalytics(anaRes.data[0]);
    } catch (e) { console.error("Load error:", e); }
    setIsLoading(false);
  };

  const mapPost = (post) => {
    const d = post.scheduled_at ? new Date(post.scheduled_at) : new Date();
    const platforms = [];
    if (post.social_accounts?.includes(1)) platforms.push('instagram');
    if (post.social_accounts?.includes(2)) platforms.push('twitter');
    if (post.social_accounts?.includes(3)) platforms.push('tiktok');
    return { id: post.id, caption: post.caption || "Untitled", isoDate: d.toISOString().split('T')[0], time: d.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}), platforms, status: post.status, isDraft: post.is_draft };
  };

  const handleCreatePost = async () => {
    const accountIds = formData.platforms.map(p => accounts.find(a => a.platform === p)?.id).filter(Boolean);
    if (!accountIds.length) return alert("Select a platform");
    const scheduled = formData.scheduledDate ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00Z`).toISOString() : null;
    await pb.createPost({ caption: formData.caption, social_accounts: accountIds, scheduled_at: scheduled, is_draft: formData.isDraft });
    setShowCreateModal(false); setFormData({caption:'',scheduledDate:'',scheduledTime:'18:00',platforms:[],isDraft:false}); loadData();
  };

  const baseTimelineDates = (() => {
    const days = [];
    for (let i = 0; i < 14; i++) { // Show 14 days
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({ id: d.toISOString().split('T')[0], dayLabel: d.toLocaleDateString('en-US', {weekday:'short'}), dateLabel: d.toLocaleDateString('en-US', {month:'short',day:'numeric'}) });
    }
    return days;
  })();

  useEffect(() => {
    // Auto-scroll to today on load
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = baseTimelineDates.findIndex(d => d.id === today);
    if (todayIndex > 2) {
      setTimeout(() => {
        const el = document.getElementById('timeline-container');
        if (el) el.scrollLeft = (todayIndex - 2) * 440;
      }, 100);
    }
  }, []);

  const timelineMatrix = baseTimelineDates.map(day => ({...day, posts: posts.filter(p => p.isoDate === day.id)}));
  const currentHeatmap = heatmapData?.[selectedTimelineDay] || [];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const HOURS = Array.from({length:18},(_,i)=>i+6);

  const getPlatformIcon = (p) => {
    if (p==='instagram') return <Instagram className="w-4 h-4 text-pink-500" />;
    if (p==='twitter') return <Twitter className="w-4 h-4 text-blue-400" />;
    if (p==='tiktok') return <Music className="w-4 h-4 text-white" />;
    return <Radio className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col min-h-screen text-gray-100 font-sans selection:bg-red-500/30 pb-24">
      <style>{`
        @keyframes fadeSlide { 0% { opacity: 0; transform: translateY(-20px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-in-fade-slide { animation: fadeSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .glass-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
        .glass-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Content Timeline</h2>
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center"><LobsterIcon className="w-4 h-4 text-red-500" /></div>
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center"><Smartphone className="w-4 h-4 text-cyan-400" /></div>
          </div>
        </div>
        <div className="flex gap-3">
          <GlassPill variant="dark" onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4" /> Create</GlassPill>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-6 p-6">
        <WidgetCard className="p-8">
          <div className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Scheduled</div>
          <div className="text-6xl font-light tracking-tighter text-white">{posts.filter(p => p.status === 'scheduled').length}</div>
        </WidgetCard>
        <WidgetCard className="p-8">
          <div className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Views (7d)</div>
          <div className="text-6xl font-light tracking-tighter text-white">{analytics?.view_count ? (analytics.view_count/1000).toFixed(0)+'k' : '--'}</div>
        </WidgetCard>
        <WidgetCard className="p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-50"></div>
          <div className="relative z-10 text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Pipeline</div>
          <div className="relative z-10 text-4xl font-bold text-white">Optimal</div>
        </WidgetCard>
      </div>

      {/* TIMELINE */}
      <WidgetCard className="m-6">
        <div id="timeline-container" className="flex gap-6 p-8 overflow-x-auto glass-scroll">
          {timelineMatrix.map(day => {
            const isActive = selectedTimelineDay === day.id;
            const displayPosts = [...day.posts];
            while(displayPosts.length < 4) displayPosts.push(null);
            return (
              <div key={day.id} onClick={() => { setSelectedTimelineDay(day.id); setSelectedSlot(null); }}
                className={`min-w-[420px] w-[420px] flex-shrink-0 rounded-[24px] p-1.5 cursor-pointer transition-all ${isActive ? 'bg-gradient-to-b from-white/20 to-white/5 shadow-[0_0_40px_rgba(255,255,255,0.08)] scale-[1.02] ring-1 ring-white/20' : 'bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                <div className={`rounded-[20px] bg-[#0a0a0c] border overflow-hidden ${isActive ? 'border-white/20' : 'border-white/5'}`}>
                  <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <div><span className={`text-xl font-bold ${isActive?'text-white':'text-gray-400'}`}>{day.dayLabel}</span><span className="text-[10px] font-mono text-gray-500 ml-3">{day.dateLabel}</span></div>
                    {isActive && <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse"></div>}
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {displayPosts.map((post, idx) => post ? (
                      <div key={post.id} className="bg-white/[0.04] border border-white/5 rounded-4xl p-3 h-[110px] relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">{post.platforms.map(p => getPlatformIcon(p))}<span className="text-[9px] font-mono text-gray-400 ml-auto">{post.time}</span></div>
                        <div className="text-xs font-semibold text-white line-clamp-2">{post.caption}</div>
                        {post.isDraft && <span className="absolute bottom-3 left-3 text-[8px] text-orange-400 font-bold uppercase">Draft</span>}
                      </div>
                    ) : (
                      <div key={`empty-${idx}`} className="border border-dashed border-white/10 rounded-4xl flex items-center justify-center h-[110px]"><Plus className="w-5 h-5 text-gray-600" /></div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </WidgetCard>

      {/* HEATMAP */}
      <WidgetCard className="m-6 p-8 animate-in-fade-slide">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center"><Activity className="w-5 h-5 text-orange-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Optimal Times</h3><p className="text-xs text-gray-500">Click a cell to schedule</p></div>
          </div>
          <div className="flex gap-4 text-[9px] font-mono text-gray-500 uppercase">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/5"></div>Base</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ea580c]/80"></div>High</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#dc2626]"></div>Peak</span>
          </div>
        </div>
        <div className="bg-black/20 border border-white/5 rounded-3xl p-6">
          <div className="grid grid-cols-[60px_repeat(18,_1fr)] gap-2 mb-3"><div></div>{HOURS.map(h => <div key={h} className="text-[10px] font-bold text-gray-500 text-center">{formatHour(h)}</div>)}</div>
          <div className="flex flex-col gap-2">
            {DAYS.map((day, dIdx) => {
              const isDayActive = day === timelineMatrix.find(d=>d.id===selectedTimelineDay)?.dayLabel;
              return (
                <div key={day} className={`grid grid-cols-[60px_repeat(18,_1fr)] gap-2 items-center transition-all ${isDayActive?'opacity-100':'opacity-30 grayscale'}`}>
                  <div className={`text-xs font-bold ${isDayActive?'text-white':'text-gray-500'}`}>{day}{isDayActive && <ChevronRight className="w-3 h-3 text-red-500 ml-auto" />}</div>
                  {HOURS.map((hour, hIdx) => {
                    const intensity = currentHeatmap[dIdx]?.[hIdx] || 0;
                    const isSelected = selectedSlot?.day === day && selectedSlot?.hour === hour;
                    return <div key={`${day}-${hour}`} onClick={() => isDayActive && setSelectedSlot({day, hour, intensity})} className={`h-10 rounded-[12px] cursor-pointer transition-all hover:scale-110 border ${isSelected?'ring-2 ring-white ring-offset-2 ring-offset-black scale-110 z-20':'hover:border-white/50'} ${getCellStyles(intensity)}`} />;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </WidgetCard>

      {/* DEPLOYMENT PROTOCOL */}
      {selectedSlot && (
        <WidgetCard className="m-6 p-8 border-[#ea580c]/30 shadow-[0_24px_48px_rgba(234,88,12,0.15)] animate-in-fade-slide">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pl-4">
            <div className="flex-1">
              <h3 className="text-[10px] tracking-widest text-gray-500 uppercase font-bold mb-4 flex items-center gap-2"><Target className="w-3 h-3" /> Target Acquired</h3>
              <div className="flex items-baseline gap-4">
                <div className="text-5xl font-light tracking-tighter text-white">{formatHour(selectedSlot.hour)}</div>
                <div className="flex flex-col"><span className="text-sm text-gray-400">{selectedSlot.day}</span><span className={`text-[10px] font-bold uppercase mt-1 ${selectedSlot.intensity>=8?'text-red-400':'text-orange-400'}`}>{selectedSlot.intensity>=8?'Peak':'High'} Engagement</span></div>
              </div>
            </div>
            <div className="flex gap-2">
              {['instagram','tiktok','twitter','youtube'].map(p => {
                const icons = {instagram:Instagram, tiktok:Music, twitter:Twitter, youtube:Youtube};
                const Icon = icons[p];
                return <button key={p} onClick={() => setActivePlatform(p)} className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-all ${activePlatform===p?'bg-white/10 border-2 border-white/30 scale-105':'bg-black/40 border border-white/5'}`}><Icon className={`w-5 h-5 ${activePlatform===p?'text-white':'text-gray-600'}`} /></button>;
              })}
            </div>
            <button onClick={() => { setFormData({...formData, scheduledDate: selectedTimelineDay, scheduledTime: `${selectedSlot.hour.toString().padStart(2,'0')}:00`}); setShowCreateModal(true); }} className="bg-gradient-to-r from-white to-gray-200 text-black font-bold py-5 px-8 rounded-[20px] flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
              <HardDrive className="w-5 h-5" /> Draft from Drive
            </button>
          </div>
        </WidgetCard>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <WidgetCard className="w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Create Post</h3>
              <button onClick={() => setShowCreateModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            
            {/* Drive Browser Toggle */}
            <div className="mb-4">
              <button 
                onClick={() => setShowDriveBrowser(!showDriveBrowser)}
                className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300"
              >
                <HardDrive className="w-4 h-4" />
                {showDriveBrowser ? 'Hide' : 'Show'} Google Drive Files
              </button>
              
              {showDriveBrowser && (
                <div className="mt-3 bg-black/40 border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {driveLoading ? (
                    <div className="text-gray-400 text-sm">Loading...</div>
                  ) : driveFiles.length === 0 ? (
                    <div className="text-gray-500 text-sm">No files found</div>
                  ) : (
                    <div className="space-y-1">
                      {currentDriveFolder && (
                        <button 
                          onClick={() => loadDriveFiles(currentDriveFolder.parents?.[0] || null)}
                          className="w-full text-left text-xs text-gray-400 hover:text-white flex items-center gap-1"
                        >
                          ← Back
                        </button>
                      )}
                      {driveFiles.map(file => (
                        <div 
                          key={file.id}
                          onClick={() => handleDriveFileClick(file)}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
                            file.mimeType.includes('folder') ? 'text-orange-400 hover:bg-white/5' : 'text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          {file.mimeType.includes('folder') ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
                          <span className="truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <textarea value={formData.caption} onChange={e => setFormData({...formData, caption: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white mb-4" rows={4} placeholder="Caption..." />
            <div className="flex gap-2 mb-4">
              {['instagram','twitter','tiktok'].map(p => (
                <button key={p} onClick={() => setFormData({...formData, platforms: formData.platforms.includes(p) ? formData.platforms.filter(x=>x!==p) : [...formData.platforms,p]})} className={`p-3 rounded-lg border ${formData.platforms.includes(p)?'bg-red-500/20 border-red-500 text-white':'bg-black/40 border-white/10 text-gray-400'}`}>{getPlatformIcon(p)}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input type="date" value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg p-3 text-white" />
              <input type="time" value={formData.scheduledTime} onChange={e => setFormData({...formData, scheduledTime: e.target.value})} className="bg-black/40 border border-white/10 rounded-lg p-3 text-white" />
            </div>
            <div className="flex items-center gap-2 mb-6">
              <input type="checkbox" checked={formData.isDraft} onChange={e => setFormData({...formData, isDraft: e.target.checked})} className="w-4 h-4" />
              <label className="text-gray-300">Save as draft</label>
            </div>
            <div className="flex gap-3">
              <GlassPill variant="dark" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</GlassPill>
              <GlassPill variant="primary" className="flex-1" onClick={handleCreatePost}>Create</GlassPill>
            </div>
          </WidgetCard>
        </div>
      )}
    </div>
  );
}
