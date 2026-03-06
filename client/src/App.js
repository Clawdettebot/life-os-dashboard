import RoyalConchView from './components/RoyalConchView';
// API_FIX_BUILD 
// NEW_BUILD_1772622558
// Life OS Dashboard - Full Design Integration
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Brain, CheckSquare, Briefcase, Calendar, Radio, Box,
  CalendarClock, Mic, Lightbulb, DollarSign, Activity, FileText, Settings, Plus,
  ChevronDown, ChevronRight, Circle, Play, MoreHorizontal, Search, Cpu, Book,
  Zap, MessageSquare, Clock, Filter, AlertCircle, Sparkles, CheckCircle2, Flame,
  Utensils, Compass, History, Navigation, Leaf, Droplet, Tent, Send, Edit2,
  Trash2, BarChart2, Globe, Video, PenTool, Eye, RefreshCw, ChevronLeft,
  Folder, Archive, Home, Wallet, TrendingUp, TrendingDown, Coffee, HomeIcon,
  Car, Heart, Briefcase as WorkIcon, Gift
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Our existing components
import DashboardView from './components/DashboardView';
import RoundTableView from './components/RoundTableView';
import KnowledgeChat from './components/KnowledgeChat';
import KanbanBoard from './components/KanbanBoard';
import CalendarView from './components/CalendarView';
import HabitsView from './components/HabitsView';
import InventoryView from './components/InventoryView';
import CortexView from './components/CortexView';
import ProjectsView from './components/ProjectsView';
import StreamsView from './components/StreamsView';
import BlogVoiceView from './components/BlogVoiceView';
import IdeaBankView from './components/IdeaBankView';
import ContactsView from './components/ContactsView';
import NotesView from './components/NotesView';
import FinanceView from './components/FinanceView';
import ContentSchedulerView from './components/ContentSchedulerView';
import LobsterScrollArea from './components/ui/LobsterScrollArea';
import { ToastContainer } from './components/ui/Toast';
import CommandCenter from './components/ui/CommandCenter';

// Core UI Components
import {
  Card, Button, Badge, ScrambleText, Crosshair, AnimatedSVGLoader,
  staggerContainer, staggerItem
} from './components/ui/NewDesignComponents';

// Supabase clients
const SUPABASE_URL = 'https://pvavybczlrhwagasriwu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YXZ5YmN6bHJod2Fnc3Jpd3UiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1NjcxMzkzMCwiZXhwIjoyMDcyMjg5OTMwfQ.u4yQgq3GXGnkfT4qBqwKq2qMyT4qBqwKq2qMyT4qBqwKq2qMyT4qB';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const WEBSITE_SUPABASE_URL = 'https://yyoxpcsspmjvolteknsn.supabase.co';
const WEBSITE_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3hwY3NzcG1qdm9sdGVrbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTM5MzAsImV4cCI6MjA3MjI4OTkzMH0.HFFOlmMjiiyQiKAODnz9RAmF3IR7n4KrvGhWp-K_dHM';
const websiteSupabase = createClient(WEBSITE_SUPABASE_URL, WEBSITE_SUPABASE_KEY);

// Navigation
const NAV_SECTIONS = [
  {
    id: 'command', title: "Command", items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'round-table', label: 'The Round Table', icon: Users },
      { id: 'knight', label: 'Knowledge Knight', icon: Brain },
    ]
  },
  {
    id: 'work', title: "Work", items: [
      { id: 'tasks', label: 'Tasks', icon: CheckSquare },
      { id: 'projects', label: 'Projects', icon: Briefcase },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
      { id: 'streams', label: 'Streams', icon: Radio },
      { id: 'inventory', label: 'Inventory', icon: Box },
    ]
  },
  {
    id: 'content', title: "Content", items: [
      { id: 'scheduler', label: 'Scheduler', icon: CalendarClock },
      { id: 'blog', label: 'Blog & Voice', icon: Mic },
      { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    ]
  },
  {
    id: 'life', title: "Life", items: [
      { id: 'finances', label: 'Finances', icon: DollarSign },
      { id: 'habits', label: 'Habits', icon: Activity },
    ]
  },
  {
    id: 'second-brain', title: "Second Brain", items: [
      { id: 'notes', label: 'Notes', icon: FileText },
      { id: 'royal-conch', label: 'Royal Conch', icon: Mic },
      { id: 'journal', label: 'Journal', icon: Book },
      { id: 'cortex', label: 'Cortex', icon: Brain },
      { id: 'contacts', label: 'Contacts', icon: Users },
    ]
  }
];

// Navigation

const THEMES = ['dark', 'light', 'eva'];

const getIcon = (iconName) => {
  const icons = { LayoutDashboard, Users, Brain, CheckSquare, Briefcase, Calendar, Radio, Box, CalendarClock, Mic, Lightbulb, DollarSign, Activity, FileText, Settings, Plus, ChevronDown, Circle, Play, MoreHorizontal, Search, Cpu, Book, Zap, MessageSquare, Clock, Filter, AlertCircle, Sparkles, CheckCircle2, Flame, Utensils, Compass, History, Navigation, Leaf, Droplet, Tent, Edit2, Trash2, BarChart2, Globe, Video, PenTool, Eye, RefreshCw, Folder, Archive, Home, Wallet, TrendingUp, TrendingDown, Coffee, HomeIcon, Car, Heart, WorkIcon, Gift };
  return icons[iconName] || Circle;
};

// Helper to determine which section a tab belongs to
const getSectionForTab = (tabId) => {
  for (const section of NAV_SECTIONS) {
    if (section.items.find(item => item.id === tabId)) return section.id;
  }
  return null;
};

// --- TECHNICAL LOBSTER SVG COMPONENT ---
const TacticalLobster = ({ isMoving, isHopping, isTyping }) => {
  // Animation states based on activity priority (Typing > Hopping > Crawling)
  const leftClawRot = isTyping ? [-35, 0, -35] : (isMoving && !isHopping ? [-15, 0, -15] : isHopping ? -45 : 0);
  const rightClawRot = isTyping ? [35, 0, 35] : (isMoving && !isHopping ? [15, 0, 15] : isHopping ? 45 : 0);
  const animDuration = isTyping ? 0.1 : 0.3;
  const shouldRepeat = isTyping || (isMoving && !isHopping);

  return (
    <svg width="24" height="28" viewBox="0 0 24 36" fill="none" className="transform origin-center">
      {/* Left Claw */}
      <motion.path d="M 6 12 C 0 8 0 0 6 4 C 12 6 8 12 8 14 Z" fill="currentColor"
        animate={{ rotate: leftClawRot }}
        transition={{ repeat: shouldRepeat ? Infinity : 0, duration: animDuration }}
        style={{ originX: '8px', originY: '14px' }}
      />
      {/* Right Claw */}
      <motion.path d="M 18 12 C 24 8 24 0 18 4 C 12 6 16 12 16 14 Z" fill="currentColor"
        animate={{ rotate: rightClawRot }}
        transition={{ repeat: shouldRepeat ? Infinity : 0, duration: animDuration }}
        style={{ originX: '16px', originY: '14px' }}
      />

      {/* Head/Antennae (Twitches while typing) */}
      <motion.path d="M 10 10 L 8 4 M 14 10 L 16 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"
        animate={{ rotate: isTyping ? [-5, 5, -5] : 0 }}
        transition={{ repeat: isTyping ? Infinity : 0, duration: 0.1 }}
        style={{ originY: '10px' }}
      />

      {/* Carapace */}
      <rect x="8" y="12" width="8" height="14" rx="3" fill="currentColor" />
      <path d="M 8 16 L 16 16 M 8 20 L 16 20" stroke="var(--bg-panel)" strokeWidth="1.5" />

      {/* Tail (Stretches EXTREMELY when hopping) */}
      <motion.path d="M 8 25 L 5 32 L 12 30 L 19 32 L 16 25 Z" fill="currentColor" strokeLinejoin="round"
        animate={{ scaleY: isHopping ? 1.6 : 1 }}
        style={{ originY: '25px' }}
      />

      {/* Legs */}
      <motion.g animate={{ y: isMoving && !isHopping ? [-1, 1, -1] : isHopping ? -2 : 0 }} transition={{ repeat: isMoving && !isHopping ? Infinity : 0, duration: 0.2 }}>
        <line x1="8" y1="15" x2="4" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1="15" x2="20" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="23" x2="4" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1="23" x2="20" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </motion.g>
      <motion.g animate={{ y: isMoving && !isHopping ? [1, -1, 1] : isHopping ? 2 : 0 }} transition={{ repeat: isMoving && !isHopping ? Infinity : 0, duration: 0.2 }}>
        <line x1="8" y1="19" x2="3" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1="19" x2="21" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');
  const [themeIndex, setThemeIndex] = useState(() => {
    const saved = localStorage.getItem('themeIndex');
    return saved !== null ? parseInt(saved, 10) : 0;
  });
  const containerRef = useRef(null);
  const currentTheme = THEMES[themeIndex];
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('expandedSections');
    return saved ? JSON.parse(saved) : { 'command': true, 'work': true, 'content': true, 'life': false, 'second-brain': false };
  });

  // Physics & Tracking State
  const itemRefs = useRef({});
  const sidebarRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Toast System
  const [toasts, setToasts] = useState([]);
  const addToast = (title, message = '', type = 'info', duration = 4000) => {
    setToasts(prev => [...prev, { id: Date.now().toString(), title, message, type, duration }]);
  };

  const [lobsterState, setLobsterState] = useState({
    y: 0,
    dir: 1,
    isMoving: false,
    isHopping: false,
    duration: 0
  });

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const moveTimeout = useRef(null);

  const prevTabRef = useRef(activeTab);
  const targetTabRef = useRef(activeTab);

  // Synchronous lock to prevent layout shifts from killing the hop animation
  const isMovingLock = useRef(false);

  // Global Keyboard Event Listener
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
        return;
      }

      // Ignore modifier keys alone
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;

      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 200);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Core function to recalculate the lobster's absolute Y position on the sidebar
  const updateLobsterPosition = (reason = 'tab_change') => {
    // CRITICAL FIX: If the lobster is mid-hop/crawl, ignore background layout scrolls
    if (reason === 'scroll' && isMovingLock.current) return;

    const targetEl = itemRefs.current[targetTabRef.current];
    if (!targetEl || !sidebarRef.current) return;

    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    const elRect = targetEl.getBoundingClientRect();

    // Y center relative to the sidebar absolute space
    const targetY = elRect.top - sidebarRect.top + (elRect.height / 2) - 14;

    setLobsterState(prev => {
      // Scroll event -> Instant pin, no animation
      if (reason === 'scroll') {
        return { ...prev, y: targetY, duration: 0, isHopping: false, isMoving: false };
      }

      const prevSection = getSectionForTab(prevTabRef.current);
      const targetSection = getSectionForTab(targetTabRef.current);

      // HOP vs CRAWL Logic: Hop if moving to a completely different section
      const shouldHop = prevSection !== targetSection;
      const dist = Math.abs(targetY - prev.y);

      let calcDuration = 0;
      if (shouldHop) {
        calcDuration = 0.8; // Hops are a snappy fixed duration
      } else {
        // Slow crawl: speed depends on distance, clamped between 0.4s and 2.5s
        calcDuration = Math.min(Math.max(dist * 0.005, 0.4), 2.5);
      }

      // Lock the physics engine synchronously so scrolls can't interrupt it
      isMovingLock.current = true;

      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      moveTimeout.current = setTimeout(() => {
        isMovingLock.current = false;
        setLobsterState(s => ({ ...s, isMoving: false, isHopping: false }));
      }, calcDuration * 1000);

      return {
        y: targetY,
        dir: targetY > prev.y ? 1 : -1,
        isMoving: true,
        isHopping: shouldHop,
        duration: calcDuration
      };
    });

    if (reason === 'tab_change') {
      prevTabRef.current = targetTabRef.current;
    }
  };

  // 1. Listen for Tab Clicks
  useEffect(() => {
    if (targetTabRef.current !== activeTab) {
      targetTabRef.current = activeTab;
      updateLobsterPosition('tab_change');
    }
  }, [activeTab]);

  // 2. Listen for Scrolling (to keep lobster pinned smoothly)
  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      updateLobsterPosition('scroll');
    };

    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Listen for Accordion Expands (Track DOM shift)
  useEffect(() => {
    if (isMovingLock.current) return;
    // Rapidly track the expanding accordion for 350ms so the lobster stays glued to the tab
    const interval = setInterval(() => {
      updateLobsterPosition('scroll');
    }, 16);
    setTimeout(() => clearInterval(interval), 350);
    return () => clearInterval(interval);
  }, [expandedSections]);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('themeIndex', themeIndex.toString());
  }, [themeIndex]);

  useEffect(() => {
    localStorage.setItem('expandedSections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  const [data, setData] = useState({ tasks: [], projects: [], finances: [], habits: [], cortex: [], ideas: [], blog: [], notes: [], contacts: [], streams: [] });
  const [loading, setLoading] = useState(true);

  // Extracted fetch so we can call it on mount AND after mutations
  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes, financesRes, habitsRes, cortexRes, notesRes, streamsRes, ideasRes, blogRes] = await Promise.all([
        fetch('/api/tasks').then(r => r.json()).then(d => (d.active?.length ? d.active : d.all) || []),
        fetch('/api/projects').then(r => r.json()).then(d => d.projects ?? d ?? []),
        fetch('/api/tables/finances').then(r => r.json()).then(d => d.data ?? d ?? []),
        fetch('/api/habits').then(r => r.json()).then(d => d || []),
        fetch('/api/cortex').then(r => r.json()).then(d => d || []),
        fetch('/api/tables/notes').then(r => r.json()).then(d => d.data ?? d ?? []),
        fetch('/api/streams').then(r => r.json()).then(d => d.streams ?? d ?? []),
        fetch('/api/blog/posts?section=blog-ideas').then(r => r.json()).then(d => d || []),
        fetch('/api/blog/posts').then(r => r.json()).then(d => d || [])
      ]);
      setData({
        tasks: tasksRes,
        projects: projectsRes,
        finances: financesRes,
        habits: habitsRes,
        cortex: cortexRes,
        ideas: ideasRes,
        blog: blogRes,
        notes: notesRes,
        contacts: [],
        streams: streamsRes
      });
    } catch (err) { console.error('Error fetching data:', err); }
    finally { setLoading(false); }
  };

  // Types with dedicated API routes vs generic /api/tables/:table routes
  const DEDICATED_ROUTES = new Set(['tasks', 'streams', 'habits', 'projects', 'blog']);

  const getApiUrl = (type, id) => {
    if (DEDICATED_ROUTES.has(type)) return id ? `/api/${type}/${id}` : `/api/${type}`;
    return id ? `/api/tables/${type}/${id}` : `/api/tables/${type}`;
  };

  // Robust Network Resilience helper with exponential backoff
  const fetchWithRetry = async (url, options = {}, retries = 2, backoff = 1000) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500 && retries > 0) throw new Error('Retry on 5xx');
      return res;
    } catch (err) {
      if (retries > 0) {
        console.warn(`[LifeOS] Network retry triggered. Attempts left: ${retries}`);
        await new Promise(r => setTimeout(r, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw err;
    }
  };

  // API utility for components — fixed routing + auto-refresh + auto-toasts + optimistic ui
  const api = {
    create: async (type, payload) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticItem = { ...payload, id: tempId, _optimistic: true, created_at: new Date().toISOString() };

      setData(prev => {
        if (prev[type] && Array.isArray(prev[type])) {
          return { ...prev, [type]: [optimisticItem, ...prev[type]] };
        }
        return prev;
      });

      try {
        const res = await fetchWithRetry(getApiUrl(type), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(res.statusText);
        const result = await res.json();
        addToast(`Created ${type}`, 'Matrix successfully deployed.', 'success');
        fetchData();
        return result;
      } catch (e) {
        setData(prev => {
          if (prev[type] && Array.isArray(prev[type])) {
            return { ...prev, [type]: prev[type].filter(item => item.id !== tempId) };
          }
          return prev;
        });
        addToast(`Failed to create ${type}`, e.message || 'Connection severed.', 'error');
        throw e;
      }
    },
    update: async (type, id, payload) => {
      let originalItem = null;
      setData(prev => {
        if (prev[type] && Array.isArray(prev[type])) {
          originalItem = prev[type].find(item => item.id === id);
          return { ...prev, [type]: prev[type].map(item => item.id === id ? { ...item, ...payload, _optimistic: true } : item) };
        }
        return prev;
      });

      try {
        const res = await fetchWithRetry(getApiUrl(type, id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(res.statusText);
        const result = await res.json();
        addToast(`Updated ${type}`, 'Modification successfully synced.', 'success');
        fetchData();
        return result;
      } catch (e) {
        setData(prev => {
          if (originalItem && prev[type] && Array.isArray(prev[type])) {
            return { ...prev, [type]: prev[type].map(item => item.id === id ? originalItem : item) };
          }
          return prev;
        });
        addToast(`Failed to update ${type}`, e.message || 'Connection severed.', 'error');
        throw e;
      }
    },
    delete: async (type, id) => {
      let originalItem = null;
      setData(prev => {
        if (prev[type] && Array.isArray(prev[type])) {
          originalItem = prev[type].find(item => item.id === id);
          return { ...prev, [type]: prev[type].filter(item => item.id !== id) };
        }
        return prev;
      });

      try {
        const res = await fetchWithRetry(getApiUrl(type, id), { method: 'DELETE' });
        if (!res.ok) throw new Error(res.statusText);
        const result = await res.json();
        addToast(`Deleted ${type}`, 'Node successfully removed from matrix.', 'success');
        fetchData();
        return result;
      } catch (e) {
        setData(prev => {
          if (originalItem && prev[type] && Array.isArray(prev[type])) {
            return { ...prev, [type]: [originalItem, ...prev[type]] };
          }
          return prev;
        });
        addToast(`Failed to delete ${type}`, e.message || 'Connection severed.', 'error');
        throw e;
      }
    },
    refresh: () => fetchData(),
    toast: addToast
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const updateMousePosition = (e) => {
      if (!containerRef.current) return;
      containerRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
      containerRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  const toggleTheme = () => setThemeIndex(prev => (prev + 1) % THEMES.length);
  const toggleSection = (sectionId) => setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));

  const renderContent = () => {
    const viewProps = { data, loading, supabase, websiteSupabase, api };
    switch (activeTab) {
      case 'dashboard': return <DashboardView {...data} {...viewProps} />;
      case 'round-table': return <RoundTableView {...data} {...viewProps} />;
      case 'knight': return <KnowledgeChat {...data} {...viewProps} />;
      case 'tasks': return <KanbanBoard {...data} {...viewProps} />;
      case 'projects': return <ProjectsView {...data} {...viewProps} />;
      case 'calendar': return <CalendarView {...data} {...viewProps} />;
      case 'streams': return <StreamsView {...data} {...viewProps} />;
      case 'inventory': return <InventoryView {...data} {...viewProps} />;
      case 'scheduler': return <ContentSchedulerView {...data} {...viewProps} />;
      case 'blog': return <BlogVoiceView {...data} {...viewProps} />;
      case 'ideas': return <IdeaBankView {...data} {...viewProps} />;
      case 'finances': return <FinanceView {...data} {...viewProps} />;
      case 'habits': return <HabitsView {...data} {...viewProps} />;
      case 'notes': return <NotesView {...data} {...viewProps} />;
      case 'royal-conch': return <RoyalConchView {...viewProps} />;
      case 'journal': return <div className="h-full flex items-center justify-center"><Card title="Journal"><p>Journal view coming soon</p></Card></div>;
      case 'cortex': return <CortexView {...viewProps} />;
      case 'contacts': return <ContactsView {...viewProps} />;
      default:
        return (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex items-center justify-center flex-col text-[var(--text-muted)]">
            <AnimatedSVGLoader />
            <div className="mt-8 flex flex-col items-center gap-2">
              <p className="font-space-mono text-xs uppercase tracking-[0.3em]"><ScrambleText text="Module Offline" activeTab={activeTab} theme={currentTheme} /></p>
              <p className="font-space-mono text-[10px] uppercase tracking-widest text-[rgb(var(--rgb-accent-red))]">Error: Component not mounted</p>
            </div>
            <Button variant="accent" className="mt-8" onClick={() => setActiveTab('dashboard')}>Initialize Dashboard</Button>
          </motion.div>
        );
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        .font-space-grotesk { font-family: 'Space Grotesk', sans-serif; }
        .font-space-mono { font-family: 'Space Mono', monospace; }
        :root, [data-theme="dark"] {
          --bg-base: #000000; --bg-panel: #050505; --bg-card: #0a0a0c; --bg-sidebar: rgba(0, 0, 0, 0.85);
          --text-main: #ffffff; --text-muted: rgba(255, 255, 255, 0.4); --text-faint: rgba(255, 255, 255, 0.2);
          --border-color: rgba(255, 255, 255, 0.1); --border-highlight: rgba(255, 255, 255, 0.2);
          --bg-overlay: rgba(255, 255, 255, 0.05); --rgb-accent-main: 249, 115, 22; --rgb-accent-sec: 234, 179, 8; --rgb-accent-red: 239, 68, 68;
          --tech-grid: rgba(255, 255, 255, 0.03); --logo-bg: #ffffff; --logo-text: #000000;
          --blob-1: rgba(255, 255, 255, 0.02); --blob-2: rgba(255, 255, 255, 0.04);
        }
        [data-theme="light"] {
          --bg-base: #e4e4e7; --bg-panel: #f4f4f5; --bg-card: #ffffff; --bg-sidebar: rgba(244, 244, 245, 0.85);
          --text-main: #09090b; --text-muted: rgba(0, 0, 0, 0.5); --text-faint: rgba(0, 0, 0, 0.2);
          --border-color: rgba(0, 0, 0, 0.1); --border-highlight: rgba(0, 0, 0, 0.2);
          --bg-overlay: rgba(0, 0, 0, 0.05); --rgb-accent-main: 234, 88, 12; --rgb-accent-sec: 202, 138, 4; --rgb-accent-red: 220, 38, 38;
          --tech-grid: rgba(0, 0, 0, 0.05); --logo-bg: #09090b; --logo-text: #ffffff;
          --blob-1: rgba(0, 0, 0, 0.03); --blob-2: rgba(0, 0, 0, 0.05);
        }
        [data-theme="eva"] {
          --bg-base: #110926; --bg-panel: #1b0e3d; --bg-card: #271455; --bg-sidebar: rgba(27, 14, 61, 0.85);
          --text-main: #39ff14; --text-muted: rgba(57, 255, 20, 0.6); --text-faint: rgba(57, 255, 20, 0.2);
          --border-color: rgba(57, 255, 20, 0.2); --border-highlight: rgba(255, 102, 0, 0.5);
          --bg-overlay: rgba(57, 255, 20, 0.05); --rgb-accent-main: 255, 102, 0; --rgb-accent-sec: 57, 255, 20; --rgb-accent-red: 255, 0, 60;
          --tech-grid: rgba(57, 255, 20, 0.08); --logo-bg: #39ff14; --logo-text: #110926;
          --blob-1: rgba(57, 255, 20, 0.05); --blob-2: rgba(255, 102, 0, 0.05);
        }
        .bg-tech-grid { background-image: linear-gradient(var(--tech-grid) 1px, transparent 1px), linear-gradient(90deg, var(--tech-grid) 1px, transparent 1px); background-size: 30px 30px; transition: background-image 0.5s ease; }
        .globular-blob { filter: url('#goo'); }
        .scanlines { position: fixed; inset: 0; background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1)); background-size: 100% 4px; pointer-events: none; z-index: 50; opacity: 0.4; }
        [data-theme="light"] .scanlines { opacity: 0.1; }
        .scanline-bar { position: fixed; top: -10vh; left: 0; right: 0; height: 10vh; background: linear-gradient(to bottom, transparent, rgba(var(--rgb-accent-main), 0.05), transparent); pointer-events: none; z-index: 51; animation: scan 8s linear infinite; }
        @keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(120vh); } }
        .hover-spotlight { position: relative; }
        .hover-spotlight::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(var(--rgb-accent-main), 0.4), transparent 40%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0; transition: opacity 0.5s; pointer-events: none; z-index: 20; }
        .hover-spotlight:hover::before { opacity: 1; }
        .hover-spotlight::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(var(--rgb-accent-main), 0.03), transparent 40%); opacity: 0; transition: opacity 0.5s; pointer-events: none; z-index: 0; }
        .hover-spotlight:hover::after { opacity: 1; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes blob1-anim {
          0% { transform: scale(1) rotate(0deg); border-radius: 40%; }
          33% { transform: scale(1.2) rotate(90deg); border-radius: 60%; }
          66% { transform: scale(0.9) rotate(180deg); border-radius: 30%; }
          100% { transform: scale(1) rotate(360deg); border-radius: 40%; }
        }
        @keyframes blob2-anim {
          0% { transform: scale(0.9) rotate(360deg); border-radius: 50%; }
          33% { transform: scale(1.5) rotate(180deg); border-radius: 30%; }
          66% { transform: scale(1) rotate(90deg); border-radius: 50%; }
          100% { transform: scale(0.9) rotate(0deg); border-radius: 50%; }
        }
      `}</style>

      <svg className="hidden">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div ref={containerRef} data-theme={currentTheme} className="relative flex h-screen w-full bg-[var(--bg-base)] text-[var(--text-main)] font-space-grotesk overflow-hidden selection:bg-[rgba(var(--rgb-accent-main),0.3)] transition-colors duration-700 ease-in-out">
        <div className="scanlines" />
        <div className="scanline-bar" />

        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-tech-grid">
          <div className="absolute left-[280px] top-0 bottom-0 w-[1px] bg-[var(--border-color)] transition-colors duration-500" />
          <div className="absolute left-0 right-0 top-[88px] h-[1px] bg-[var(--border-color)] transition-colors duration-500" />

          <div className="absolute inset-0 opacity-100 globular-blob flex items-center justify-center">
            <div className="w-[60vw] h-[60vw] bg-[var(--blob-1)] absolute transition-colors duration-700 animate-[blob1-anim_20s_linear_infinite]" />
            <div className="w-[50vw] h-[50vw] bg-[var(--blob-2)] absolute translate-x-1/4 transition-colors duration-700 animate-[blob2-anim_25s_linear_infinite]" />
          </div>
        </div>

        {/* Sidebar */}
        <motion.aside ref={sidebarRef} initial={{ x: -300 }} animate={{ x: 0 }} className="w-[280px] bg-[var(--bg-sidebar)] backdrop-blur-xl border-r border-[var(--border-color)] flex flex-col z-20 relative">
          {/* THE FIXED VERTICAL RAIL (Perfectly aligned at 15px) */}
          <div className="absolute left-[15px] top-[44px] bottom-0 w-[2px] bg-[var(--border-color)] shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] z-0 pointer-events-none transition-colors duration-700" />

          {/* THE PHYSICS-DRIVEN LOBSTER */}
          <motion.div
            animate={
              lobsterState.isHopping
                ? {
                  y: lobsterState.y,
                  x: [0, 80, 0],
                  scale: [1, 2, 1],
                  rotate: lobsterState.dir === 1 ? 180 : 0
                }
                : {
                  y: lobsterState.y,
                  x: 0,
                  scale: 1,
                  rotate: lobsterState.dir === 1 ? 180 : 0
                }
            }
            transition={{
              y: { duration: lobsterState.duration, ease: "easeInOut" },
              x: { duration: lobsterState.duration, ease: "linear", times: [0, 0.5, 1] },
              scale: { duration: lobsterState.duration, ease: "easeInOut", times: [0, 0.5, 1] },
              rotate: { duration: 0.3 }
            }}
            className="absolute left-[4px] z-30 text-[rgb(var(--rgb-accent-main))] drop-shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.8)] pointer-events-none"
          >
            <TacticalLobster isMoving={lobsterState.isMoving} isHopping={lobsterState.isHopping} isTyping={isTyping} />
          </motion.div>

          <div className="h-[88px] flex items-center px-8 relative cursor-pointer group hover:bg-[var(--bg-overlay)]" onClick={toggleTheme}>
            <div className="flex items-center gap-4 w-full">
              <div className="w-10 h-10 bg-[var(--logo-bg)] text-[var(--logo-text)] rounded-full flex items-center justify-center font-bold font-space-mono text-sm shadow-[0_0_20px_var(--border-highlight)]">OS</div>
              <h1 className="font-bold text-xl tracking-widest uppercase">Life<span className="text-[var(--text-muted)]">OS</span></h1>
              <div className="ml-auto"><Activity size={16} className="text-[rgb(var(--rgb-accent-main))] animate-pulse" /></div>
            </div>
          </div>

          <LobsterScrollArea className="flex-1" contentClassName="px-4 py-8 space-y-8" ref={scrollContainerRef}>
            {NAV_SECTIONS.map((section) => {
              const isExpanded = expandedSections[section.id];
              return (
                <div key={section.id} className="space-y-2">
                  <button onClick={() => toggleSection(section.id)} className="w-full flex items-center justify-between px-4 py-2 text-[9px] font-space-mono uppercase tracking-[0.3em] text-[var(--text-muted)] hover:text-[var(--text-main)] hover-spotlight transition-all rounded-full">
                    <span>{section.title}</span>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                      <ChevronDown size={12} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="overflow-hidden space-y-1 pt-1">
                        {section.items.map((item) => {
                          const isActive = activeTab === item.id;
                          const ItemIcon = getIcon(item.icon);
                          return (
                            <button key={item.id} ref={el => itemRefs.current[item.id] = el} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover-spotlight ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
                              {isActive && <motion.div layoutId="nav-active" className="absolute inset-0 bg-[var(--bg-overlay)] border border-[var(--border-color)] rounded-full" />}
                              <ItemIcon size={16} className={`relative z-10 ${isActive ? 'text-[rgb(var(--rgb-accent-main))]' : 'opacity-70'}`} />
                              <span className="relative z-10 font-space-grotesk">{item.label}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </LobsterScrollArea>

          <div className="p-6">
            <div className="flex items-center justify-between p-4 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer hover:border-[var(--border-highlight)] transition-all group hover-spotlight">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--bg-base)] border-2 border-[var(--border-highlight)] flex items-center justify-center overflow-hidden shrink-0">
                  <img src="/avatars/guapdad-avatar.png" alt="Guapdad 4K" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-1">Guapdad 4K</div>
                  <div className="text-[9px] font-space-mono text-[rgb(var(--rgb-accent-main))] uppercase tracking-[0.2em] flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--rgb-accent-main))] animate-pulse" /> Online
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 z-10 relative bg-transparent">
          <header className="h-[88px] px-10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4 text-xs font-space-mono text-[var(--text-muted)]">
              <div className="flex items-center gap-3">
                <span className="uppercase tracking-[0.3em] text-[10px]">sys://root</span>
                <span className="text-[var(--text-faint)]">/</span>
                <span className="uppercase tracking-[0.3em] text-[10px] font-bold text-[var(--text-main)] opacity-90">
                  <ScrambleText text={activeTab.replace('-', '_')} activeTab={activeTab} theme={currentTheme} />
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" icon={Play}>Run Sync</Button>
              <Button variant="accent" icon={Plus}>Execute</Button>
            </div>
          </header>

          <LobsterScrollArea className="flex-1" contentClassName="p-10 glass-scroll">
            <div className="max-w-7xl mx-auto h-full">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.02, y: -10 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="h-full">
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </LobsterScrollArea>
        </main>

        <CommandCenter
          isOpen={cmdOpen}
          onClose={() => setCmdOpen(false)}
          navSections={NAV_SECTIONS}
          navigateTo={(id) => {
            setActiveTab(id);
            setExpandedSections(prev => ({ ...prev, [getSectionForTab(id)]: true }));
          }}
        />

        {/* Global Toast Container */}
        <ToastContainer toasts={toasts} removeToast={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      </div>
    </>
  );
}
