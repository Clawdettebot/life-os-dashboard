import React, { useState, useEffect, useRef } from 'react';
import {
  Instagram,
  Music,
  Twitter,
  Youtube,
  Clock,
  Zap,
  Activity,
  Settings,
  Plus,
  HardDrive,
  CalendarDays,
  Smartphone,
  Radio,
  Target,
  ChevronRight,
  Folder,
  File
} from 'lucide-react';

import { WidgetCard } from './ui/WidgetCard';
import { GlassPill } from './ui/GlassPill';

// ==========================================
// POST BRIDGE API (Proxied through server to avoid CORS)
// ==========================================
const PostBridgeAPI = (apiKey) => ({
  getSocialAccounts: () => fetch('/api/postbridge/accounts').then(r => r.json()),
  getPosts: () => fetch('/api/postbridge/posts').then(r => r.json()),
  createPost: (payload) => fetch('/api/postbridge/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()),
  updatePost: (id, payload) => fetch(`/api/postbridge/posts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()),
  deletePost: (id) => fetch(`/api/postbridge/posts/${id}`, { method: 'DELETE' }).then(r => r.json()),
  getAnalytics: () => fetch('/api/postbridge/analytics').then(r => r.json()),
});

const LobsterIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2C12 2 10 6 10 10C10 14 12 18 12 18" />
    <path d="M12 2C12 2 14 6 14 10C14 14 12 18 12 18" />
    <path d="M10 10C8 10 6 12 6 15C6 18 8 20 10 20" />
    <path d="M14 10C16 10 18 12 18 15C18 18 16 20 14 20" />
    <path d="M8 4C6 4 4 6 4 8C4 10 6 12 8 12" />
    <path d="M16 4C18 4 20 6 20 8C20 10 18 12 16 12" />
    <path d="M11 21v1" />
    <path d="M13 21v1" />
  </svg>
);

const OrangeIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="13" r="9" />
    <path d="M12 4C14 4 16 2 16 2C16 2 17 4 15 6C13 8 12 4 12 4Z" fill="currentColor" opacity="0.5" />
    <circle cx="12" cy="13" r="3" fill="currentColor" opacity="0.2" />
  </svg>
);

// ------------------------------------------
// Heatmap Data Generation
// ------------------------------------------
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

const generateHeatmapData = (peakHours) => {
  return DAYS.map(() =>
    HOURS.map(hour => {
      let score = Math.floor(Math.random() * 4);
      peakHours.forEach(peak => {
        if (Math.abs(hour - peak) <= 2) score += Math.floor(Math.random() * 4) + 3;
        if (hour === peak) score += 3;
      });
      return Math.min(10, score);
    })
  );
};

const MockHeatmapAPI = {
  getHeatmapData: async () => new Promise(res => setTimeout(() => res({
    instagram: generateHeatmapData([18, 19]),
    tiktok: generateHeatmapData([20, 22]),
    twitter: generateHeatmapData([9, 12, 17]),
    youtube: generateHeatmapData([15, 18]),
  }), 800))
};

const mapPostToUI = (post) => {
  const dateObj = post.scheduled_at ? new Date(post.scheduled_at) : new Date();

  let platformLabel = 'UNKNOWN';
  let color = 'text-gray-400';
  let bg = 'bg-gray-500';
  let IconComponent = Radio;

  if (post.social_accounts?.includes(1)) { platformLabel = 'INSTAGRAM'; color = 'text-pink-500'; bg = 'from-pink-500 to-orange-400'; IconComponent = Instagram; }
  else if (post.social_accounts?.includes(2)) { platformLabel = 'TWITTER'; color = 'text-blue-400'; bg = 'from-blue-400 to-cyan-400'; IconComponent = Twitter; }
  else if (post.social_accounts?.includes(3)) { platformLabel = 'TIKTOK'; color = 'text-white'; bg = 'from-gray-700 to-black'; IconComponent = Music; }

  return {
    id: post.id,
    title: post.caption || "Untitled Post",
    date: dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    isoDate: dateObj.toISOString().split('T')[0],
    parsedHour: dateObj.getHours(),
    platform: platformLabel,
    icon: IconComponent,
    color,
    bg,
    status: post.status
  };
};

const formatHour = (hour) => {
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h = hour % 12 || 12;
  return `${h}${ampm}`;
};

// ==========================================
// MAIN SCHEDULER DASHBOARD
// ==========================================

export default function ContentSchedulerView({ api, postbridgeKey }) {
  const API_KEY = postbridgeKey || "pb_live_6TxeA2MXDdTeVaXrp8BwG8";
  const pb = PostBridgeAPI(API_KEY);

  const [activePlatform, setActivePlatform] = useState('instagram');
  const [heatmapData, setHeatmapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiPosts, setApiPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [selectedTimelineDay, setSelectedTimelineDay] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ caption: '', scheduledDate: '', scheduledTime: '18:00', platforms: [], isDraft: false });
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [currentDriveFolder, setCurrentDriveFolder] = useState(null);
  const [activeTab, setActiveTab] = useState('Timeline');
  const [activeTimelineSlot, setActiveTimelineSlot] = useState(null);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState([]);
  const [postCaption, setPostCaption] = useState('');
  const [showDeploymentConfig, setShowDeploymentConfig] = useState(false);
  const [postedDriveFiles, setPostedDriveFiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lifeos_posted_files') || '[]');
    } catch {
      return [];
    }
  });
  const scrollContainerRef = useRef(null);

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
    Promise.all([
      MockHeatmapAPI.getHeatmapData(),
      pb.getPosts().catch(() => ({ data: [] })),
      pb.getAnalytics().catch(() => ({ data: [] }))
    ]).then(([heatmap, postsRes, analyticsRes]) => {
      setHeatmapData(heatmap);
      if (postsRes?.data) setApiPosts(postsRes.data.map(mapPostToUI));
      if (analyticsRes?.data && analyticsRes.data.length > 0) setAnalytics(analyticsRes.data[0]);
      setIsLoading(false);
    }).catch(err => {
      console.error("Failed to load initial data:", err);
      setIsLoading(false);
    });
  };

  const handleDaySelect = (dayId) => {
    setSelectedTimelineDay(dayId);
    setSelectedSlot(null); // Reset sequence when picking a new day
    setActiveTimelineSlot(null);
    setSelectedDriveFiles([]);
    setPostCaption('');
    setShowDeploymentConfig(false);
  };

  const baseTimelineDates = (() => {
    const days = [];
    for (let i = 0; i < 7; i++) { // Show 7 days starting from today like the mockup
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        id: d.toISOString().split('T')[0],
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return days;
  })();

  const handleDraftFromDrive = async (isDraft = true) => {
    if (!selectedSlot) {
      alert("Please select a time slot on the timeline first!");
      return;
    }
    if (selectedDriveFiles.length === 0) {
      alert("Please select at least one media file.");
      return;
    }
    setIsProcessingAction(true);
    try {
      const accounts = await pb.getSocialAccounts();
      if (!accounts.data || !accounts.data.length) {
        alert("No social accounts connected to PostBridge!");
        setIsProcessingAction(false);
        return;
      }

      // Match accounts by selected platforms
      const accountIds = accounts.data
        .filter(a => formData.platforms.includes(a.platform))
        .map(a => a.id);

      if (!accountIds.length && formData.platforms.length > 0) {
        alert("No connected social accounts found for selected platforms!");
        setIsProcessingAction(false);
        return;
      }

      const mediaIds = [];
      for (const file of selectedDriveFiles) {
        const uploadRes = await fetch('/api/postbridge/upload-drive-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driveFileId: file.id })
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.media_id) {
          mediaIds.push(uploadData.media_id);
        } else {
          console.warn("Failed to upload file to PostBridge", uploadData.error);
        }
      }

      const timelineMatch = baseTimelineDates.find(d => d.dayLabel === selectedSlot.day);
      const isoDateStr = timelineMatch ? timelineMatch.id : new Date().toISOString().split('T')[0];
      const scheduledDate = new Date(`${isoDateStr}T${selectedSlot.hour.toString().padStart(2, '0')}:00:00Z`);

      const finalCaption = postCaption.trim() || selectedDriveFiles[0].name.split('.')[0];

      const newPost = await pb.createPost({
        caption: finalCaption,
        scheduled_at: scheduledDate.toISOString(),
        social_accounts: accountIds.length > 0 ? accountIds : [accounts.data[0]?.id],
        status: isDraft ? 'draft' : 'scheduled',
        is_draft: isDraft,
        media: mediaIds.length > 0 ? mediaIds : undefined
      });

      setApiPosts(prev => [...prev, mapPostToUI(newPost)]);

      const updatedPostedFiles = [...postedDriveFiles, ...selectedDriveFiles.map(f => f.id)];
      setPostedDriveFiles(updatedPostedFiles);
      localStorage.setItem('lifeos_posted_files', JSON.stringify(updatedPostedFiles));

      setSelectedSlot(null);
      setActiveTimelineSlot(null); // Reset timeline selection
      setSelectedDriveFiles([]); // Reset local selection
      setPostCaption('');
      setShowDeploymentConfig(false);
    } catch (error) {
      console.error("API Error during post creation", error);
      alert("Failed to create post. Check console for details.");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const currentData = heatmapData?.[activePlatform];

  const getCellStyles = (intensity) => {
    if (intensity <= 2) return 'bg-white/5 border-transparent';
    if (intensity <= 5) return 'bg-[#ea580c]/40 border-[#ea580c]/50 backdrop-blur-sm';
    if (intensity <= 7) return 'bg-[#ea580c]/80 border-[#ea580c] shadow-[0_0_15px_rgba(234,88,12,0.4)]';
    return 'bg-[#dc2626] border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.7)] z-10';
  };


  const TIMELINE_MATRIX = baseTimelineDates.map(day => ({
    ...day,
    posts: apiPosts.filter(post => post.isoDate === day.id)
  }));

  return (
    <div className="flex flex-col min-h-screen text-gray-100 font-sans selection:bg-red-500/30 overflow-x-hidden pb-24">

      {/* FLOATING COMMAND ISLAND */}
      <div className="sticky top-6 z-40 mx-auto px-4 flex justify-center w-full max-w-[1500px]">
        <div className="flex items-center justify-between w-full p-2 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_16px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold tracking-tighter shadow-lg shadow-red-500/20">
              L
            </div>
            <span className="font-bold text-sm tracking-widest uppercase ml-2 text-white/90">Life OS</span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/5">
            <GlassPill active={activeTab === 'Timeline'} onClick={() => setActiveTab('Timeline')}>Timeline</GlassPill>
            <GlassPill active={activeTab === 'Drive Sync'} onClick={() => setActiveTab('Drive Sync')}>Drive Sync</GlassPill>
            <GlassPill active={activeTab === 'Releases'} onClick={() => setActiveTab('Releases')}>Releases</GlassPill>
          </div>

          <div className="flex items-center gap-3 pr-2">
            <GlassPill variant="dark" className="!px-4" onClick={() => alert('Settings opens')}><Settings className="w-4 h-4" /></GlassPill>
            <GlassPill variant="primary" className="!px-6" onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4" /> Create</GlassPill>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT CANVAS */}
      <main className="relative z-10 w-full max-w-[1500px] mx-auto mt-12 px-6 flex flex-col gap-8">

        {/* TOP ROW: Stats Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <WidgetCard className="p-8 flex flex-col justify-between min-h-[180px] group hover:bg-white/[0.02] transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Posts Scheduled</span>
              <CalendarDays className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <div className="text-6xl font-light tracking-tighter text-white mb-2 group-hover:scale-105 transition-transform origin-left">
                {apiPosts.filter(p => p.status === 'scheduled').length}
              </div>
              <div className="text-sm font-medium text-green-400 flex items-center gap-1">+2 this week</div>
            </div>
          </WidgetCard>

          <WidgetCard className="p-8 flex flex-col justify-between min-h-[180px] group hover:bg-white/[0.02] transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Total Views (7d)</span>
              <Activity className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <div className="text-6xl font-light tracking-tighter text-white mb-2 group-hover:scale-105 transition-transform origin-left">
                {analytics ? (analytics.view_count / 1000).toFixed(0) + 'k' : '--'}
              </div>
              <div className="text-sm font-medium text-green-400 flex items-center gap-1">+14% vs last week</div>
            </div>
          </WidgetCard>

          <WidgetCard className="p-8 flex flex-col justify-between min-h-[180px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex justify-between items-start">
              <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Pipeline Health</span>
              <Zap className="w-5 h-5 text-red-400" />
            </div>
            <div className="relative z-10">
              <div className="text-4xl font-bold tracking-tight text-white mb-3">Optimal</div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-orange-400 w-[85%] h-full rounded-full shadow-[0_0_10px_#ef4444]"></div>
              </div>
            </div>
          </WidgetCard>
        </div>


        {/* ========================================================= */}
        {/* STEP 1: HORIZONTAL TIMELINE (2x2 Grid per day)            */}
        {/* ========================================================= */}
        <WidgetCard className="flex flex-col relative overflow-hidden">
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="px-8 py-6 border-b border-white/[0.05] flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">Content Timeline</h2>
              <div className="hidden sm:flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center relative z-10 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  <LobsterIcon className="w-4 h-4 text-red-500" />
                </div>
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center relative z-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
            </div>
            <GlassPill variant="dark" className="!px-4 !py-1.5 !text-[10px] tracking-widest uppercase">Select a day to target</GlassPill>
          </div>

          <div ref={scrollContainerRef} id="timeline-scroll-container" className="flex gap-6 p-8 overflow-x-auto glass-scroll snap-x">
            {TIMELINE_MATRIX.map(day => {
              const isActive = selectedTimelineDay === day.id;

              // Pad to exactly 4 slots to ensure a 2x2 grid structure
              const displayPosts = [...day.posts];
              while (displayPosts.length < 4) displayPosts.push(null);

              return (
                <div
                  key={day.id}
                  onClick={() => handleDaySelect(day.id)}
                  className={`min-w-[420px] w-[420px] flex-shrink-0 snap-start rounded-[24px] transition-all duration-300 cursor-pointer p-1.5 ${isActive
                    ? 'bg-gradient-to-b from-white/20 to-white/5 shadow-[0_0_40px_rgba(255,255,255,0.08)] scale-[1.02] ring-1 ring-white/20'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border border-transparent'
                    } flex flex-col`}
                >
                  <div className={`h-full w-full rounded-[20px] bg-[#0a0a0c] border flex flex-col overflow-hidden ${isActive ? 'border-white/20' : 'border-white/5'}`}>

                    {/* Day Header */}
                    <div className="p-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
                      <div>
                        <span className={`text-xl font-bold tracking-tight ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {day.dayLabel}
                        </span>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500 ml-3">{day.dateLabel}</span>
                      </div>
                      {isActive && <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse"></div>}
                    </div>

                    {/* 2x2 Posts Grid */}
                    <div className="p-4 grid grid-cols-2 gap-3 flex-1 bg-black/20">
                      {displayPosts.map((post, idx) => {
                        if (post) {
                          const PIcon = post.icon;
                          return (
                            <div key={post.id} className="bg-white/[0.04] border border-white-[0.05] rounded-[16px] p-3 relative overflow-hidden group hover:bg-white/[0.08] transition-colors flex flex-col h-[110px]">
                              <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-[30px] opacity-20 transition-opacity bg-gradient-to-br ${post.bg}`}></div>

                              <div className="flex items-center justify-between mb-2 relative z-10">
                                <PIcon className={`w-4 h-4 ${post.color}`} />
                                <span className="text-[9px] font-mono text-gray-400 bg-black/60 px-1.5 py-0.5 rounded border border-white/5">{post.time}</span>
                              </div>

                              <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2 mt-1 relative z-10">
                                {post.title}
                              </h4>

                              {post.status === 'draft' && (
                                <span className="absolute bottom-3 left-3 text-[8px] text-orange-400 font-bold uppercase tracking-widest">Draft</span>
                              )}
                            </div>
                          );
                        } else {
                          // Empty Drop Zone (Completes the 2x2)
                          const isSlotActive = activeTimelineSlot && activeTimelineSlot.dayId === day.id && activeTimelineSlot.idx === idx;
                          return (
                            <div
                              key={`empty-${idx}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDaySelect(day.id);
                                setActiveTimelineSlot({ dayId: day.id, idx });
                                setTimeout(() => {
                                  const heatmapObj = document.getElementById('heatmap-section');
                                  if (heatmapObj) {
                                    heatmapObj.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                }, 100);
                              }}
                              className={`rounded-[16px] border border-dashed flex flex-col items-center justify-center h-[110px] transition-all cursor-pointer ${isActive ? 'bg-white/[0.01] hover:border-white/30' : 'bg-transparent'} ${isSlotActive ? 'border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)] bg-orange-500/10' : 'border-white/10'}`}
                            >
                              <Plus className={`w-5 h-5 mb-1 ${isSlotActive ? 'text-orange-400' : 'text-gray-600 opacity-50'}`} />
                              <span className={`text-[9px] font-bold tracking-widest uppercase ${isSlotActive ? 'text-orange-400' : 'text-gray-600'}`}>Slot {idx + 1}</span>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </WidgetCard>

        {/* ========================================================= */}
        {/* STEP 2: HEATMAP (Appears when a day is selected)          */}
        {/* ========================================================= */}
        {selectedTimelineDay && (
          <WidgetCard id="heatmap-section" className="p-8 relative overflow-hidden animate-in-fade-slide">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                  <Activity className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Optimal Times for {TIMELINE_MATRIX.find(d => d.id === selectedTimelineDay)?.dayLabel}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Select a glowing cell to target a deployment window</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-4 text-[9px] font-mono tracking-widest text-gray-500 uppercase bg-black/40 px-4 py-2 rounded-full border border-white/5">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/5 border border-white/10"></div> Base</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ea580c]/80 shadow-[0_0_5px_#ea580c]"></div> High</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#dc2626] shadow-[0_0_8px_#dc2626]"></div> Peak</span>
              </div>
            </div>

            <div className="bg-black/20 border border-white/5 rounded-[24px] p-6 relative overflow-x-auto glass-scroll">
              {isLoading && (
                <div className="absolute inset-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-sm flex items-center justify-center rounded-[24px]">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              )}

              <div className="min-w-[800px]">
                {/* Hours Axis */}
                <div className="grid grid-cols-[60px_repeat(18,_1fr)] gap-2 mb-3">
                  <div></div>
                  {HOURS.map(hour => (
                    <div key={hour} className="text-[10px] font-bold tracking-wider text-gray-500 text-center">
                      {formatHour(hour)}
                    </div>
                  ))}
                </div>

                {/* The Heatmap Grid */}
                <div className="flex flex-col gap-2">
                  {DAYS.map((day, dIdx) => {
                    const selectedDayLabel = TIMELINE_MATRIX.find(d => d.id === selectedTimelineDay)?.dayLabel;
                    const isDayActive = day === selectedDayLabel;

                    return (
                      <div key={day} className={`grid grid-cols-[60px_repeat(18,_1fr)] gap-2 items-center transition-all duration-500 ${isDayActive ? 'opacity-100 scale-100' : 'opacity-30 pointer-events-none grayscale'}`}>
                        <div className={`text-xs font-bold tracking-wide flex items-center transition-colors ${isDayActive ? 'text-white' : 'text-gray-500'}`}>
                          {day}
                          {isDayActive && <ChevronRight className="w-3 h-3 text-red-500 ml-auto" />}
                        </div>
                        {HOURS.map((hour, hIdx) => {
                          const intensity = currentData?.[dIdx]?.[hIdx] || 0;
                          const isSelected = selectedSlot?.day === day && selectedSlot?.hour === hour;

                          return (
                            <div
                              key={`${day}-${hour}`}
                              onClick={() => {
                                if (isDayActive) setSelectedSlot({ day, hour, intensity });
                              }}
                              className={`
                                h-10 rounded-[12px] cursor-pointer transition-all duration-300
                                hover:border-white/50 hover:scale-110 hover:shadow-xl hover:z-20 border
                                ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0c] scale-110 z-20' : ''}
                                ${getCellStyles(intensity)}
                              `}
                            />
                          );
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </WidgetCard>
        )}

        {/* ========================================================= */}
        {/* STEP 3: DEPLOYMENT PROTOCOL (Appears when a slot is clicked) */}
        {/* ========================================================= */}
        {selectedSlot && (
          <WidgetCard className="p-8 relative overflow-hidden animate-in-fade-slide flex flex-col md:flex-row items-center justify-between gap-8 border-[#ea580c]/30 shadow-[0_24px_48px_rgba(234,88,12,0.15)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>

            <div className="flex flex-col gap-6 pl-4 flex-1">
              <div>
                <h3 className="text-[10px] tracking-widest text-gray-500 uppercase font-bold mb-4 flex items-center gap-2">
                  <Target className="w-3 h-3" /> Target Acquired
                </h3>
                <div className="flex items-baseline gap-4">
                  <div className="text-5xl font-light tracking-tighter text-white">
                    {formatHour(selectedSlot.hour)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-400 font-medium">{selectedSlot.day}</span>
                    <span className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${selectedSlot.intensity >= 8 ? 'text-red-400' : 'text-orange-400'
                      }`}>
                      {selectedSlot.intensity >= 8 ? 'Peak Engagement' : 'High Engagement'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] tracking-widest text-gray-500 uppercase font-bold mb-3 flex items-center gap-2">
                  <OrangeIcon className="w-3 h-3 text-orange-400" /> Platform Sync
                </h3>
                <div className="flex gap-2">
                  {[
                    { id: 'instagram', icon: Instagram, color: 'text-pink-500', shadow: 'shadow-pink-500/20', label: 'IG' },
                    { id: 'tiktok', icon: Music, color: 'text-white', shadow: 'shadow-white/20', label: 'TT' },
                    { id: 'twitter', icon: Twitter, color: 'text-blue-400', shadow: 'shadow-blue-400/20', label: 'X' },
                    { id: 'youtube', icon: Youtube, color: 'text-red-500', shadow: 'shadow-red-500/20', label: 'YT' },
                  ].map(platform => {
                    const isSelected = formData.platforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          platforms: prev.platforms.includes(platform.id)
                            ? prev.platforms.filter(p => p !== platform.id)
                            : [...prev.platforms, platform.id]
                        }))}
                        className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-300 relative ${isSelected
                          ? `bg-white/10 border-2 border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.5)] ${platform.shadow} scale-105`
                          : 'bg-black/40 border border-white/5 hover:bg-white/5'
                          }`}
                      >
                        <platform.icon className={`w-5 h-5 ${isSelected ? platform.color : 'text-gray-600'}`} />
                        {isSelected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black" />}
                      </button>
                    );
                  })}
                </div>
                {formData.platforms.length > 0 && (
                  <div className="mt-2 text-[9px] font-mono text-gray-500 tracking-wider">
                    {formData.platforms.length} platform{formData.platforms.length > 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </div>

            {/* Drive Sync Workflow */}
            <div className="md:w-[400px] flex-shrink-0 bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-start min-h-[300px] max-h-[350px]">

              {showDeploymentConfig ? (
                <div className="w-full flex flex-col gap-6 animate-in-fade-slide">

                  {/* Selected Files List */}
                  <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/10 shadow-inner max-h-[120px] overflow-y-auto glass-scroll">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1 border-b border-white/10 pb-1 flex justify-between">
                      <span>Selected Media ({selectedDriveFiles.length})</span>
                      <span className="text-orange-400">Ready</span>
                    </div>
                    {selectedDriveFiles.map(f => (
                      <div key={f.id} className="flex items-center gap-3">
                        <File className="w-3 h-3 text-orange-400 flex-shrink-0" />
                        <span className="text-white text-xs truncate leading-tight">{f.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Caption Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold pl-1">Caption</label>
                    <textarea
                      value={postCaption}
                      onChange={(e) => setPostCaption(e.target.value)}
                      placeholder="Write your caption here..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 resize-none h-[80px] glass-scroll transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-3 mt-auto">
                    <button
                      onClick={() => handleDraftFromDrive(false)}
                      className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_20px_rgba(234,88,12,0.3)] flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                      disabled={isProcessingAction}
                    >
                      <Zap className="w-4 h-4" /> Send As Post
                    </button>
                    <button
                      onClick={() => handleDraftFromDrive(true)}
                      className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                      disabled={isProcessingAction}
                    >
                      <Folder className="w-3 h-3" /> Save Draft
                    </button>
                    <button
                      onClick={() => setShowDeploymentConfig(false)}
                      className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-bold mt-1 py-1 transition-colors flex items-center justify-center gap-1"
                      disabled={isProcessingAction}
                    >
                      <ChevronRight className="w-3 h-3 rotate-180" /> Back to selection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col h-full overflow-hidden">
                  <h3 className="text-[10px] tracking-widest text-gray-500 uppercase font-bold mb-3 flex items-center gap-2 px-2">
                    <HardDrive className="w-3 h-3 text-cyan-400" /> Source Media
                  </h3>

                  <div className="flex-1 overflow-y-auto w-full pr-1 space-y-1 glass-scroll pb-2">
                    {driveLoading ? (
                      <div className="text-gray-400 text-sm flex items-center justify-center h-full">Loading Drive...</div>
                    ) : driveFiles.length === 0 ? (
                      <div className="text-gray-500 text-sm flex items-center justify-center h-full">No files found</div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {currentDriveFolder && (
                          <div
                            onClick={() => loadDriveFiles(currentDriveFolder.parents?.[0] || null)}
                            className="w-full py-2 px-3 rounded-lg text-left text-[11px] font-bold tracking-widest uppercase text-gray-500 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-3 h-3 rotate-180" /> Back
                          </div>
                        )}
                        {driveFiles.map(file => {
                          const isFolder = file.mimeType.includes('folder');
                          const isPosted = postedDriveFiles.includes(file.id);

                          return (
                            <div
                              key={file.id}
                              onClick={() => {
                                if (isFolder) handleDriveFileClick(file);
                                else {
                                  setSelectedDriveFiles(prev =>
                                    prev.some(f => f.id === file.id)
                                      ? prev.filter(f => f.id !== file.id)
                                      : [...prev, file]
                                  );
                                }
                              }}
                              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isFolder
                                ? 'hover:bg-orange-500/10 border-transparent hover:border-orange-500/20 text-orange-400'
                                : isPosted
                                  ? 'opacity-60 hover:opacity-100 bg-white/5 border-transparent text-gray-400'
                                  : selectedDriveFiles.some(f => f.id === file.id)
                                    ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_15px_rgba(234,88,12,0.15)]'
                                    : 'hover:bg-white/10 border-transparent hover:border-white/10 text-gray-200'
                                }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {isFolder ? <Folder className="w-5 h-5 flex-shrink-0" /> : <File className={`w-5 h-5 flex-shrink-0 ${selectedDriveFiles.some(f => f.id === file.id) ? 'text-orange-400' : ''}`} />}
                                <span className="truncate text-sm font-medium">{file.name}</span>
                              </div>

                              {selectedDriveFiles.some(f => f.id === file.id) && !isFolder && (
                                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 ml-2 shadow-[0_0_8px_#ea580c]">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                              )}

                              {isPosted && !isFolder && !selectedDriveFiles.some(f => f.id === file.id) && (
                                <span className="text-[8px] font-bold tracking-widest uppercase text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20 flex-shrink-0 ml-2 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                                  Used
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Selected count and proceed button */}
                  {selectedDriveFiles.length > 0 && (
                    <div className="w-full pt-3 mt-1 border-t border-white/10 animate-in-fade-slide">
                      <button
                        onClick={() => setShowDeploymentConfig(true)}
                        className="w-full py-3 bg-white hover:bg-gray-100 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      >
                        Configure Post ({selectedDriveFiles.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </WidgetCard>
        )}

      </main>
    </div>
  );
}
