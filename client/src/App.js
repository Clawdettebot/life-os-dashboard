// Life OS Dashboard - Fixed API error handling
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Chart from 'chart.js/auto';
import { Timer, BarChart3, CalendarDays, PenTool, Coins, BrainCircuit, Users, Package, Zap, BookOpen, Footprints, Waves, Music, Book, Plus } from 'lucide-react';
import AnimatedIcon from './components/AnimatedIcon';
import './App.css';

// Import new components
import FinanceView from './components/FinanceView';
import KanbanBoard from './components/KanbanBoard';
import CalendarView from './components/CalendarView';
import HabitsView from './components/HabitsView';
import IconPicker from './components/IconPicker';
import InventoryView from './components/InventoryView';
import GoogleCalendarWidget from './components/GoogleCalendarWidget';
import CortexView from './components/CortexView';
import ExpensesView from './components/ExpensesView';
import NotesView from './components/NotesView';
import ContentSchedulerView from './components/ContentSchedulerView';
import BlogVoiceView from './components/BlogVoiceView';
import ProjectsView from './components/ProjectsView';
import ContactsView from './components/ContactsView';
import RoundTableView from './components/RoundTableView';
import StreamsView from './components/StreamsView';
import DashboardView from './components/DashboardView';

// ── CONSTANTS & CONFIG ──
const QUOTES = [
  "The ink dries, but the story never ends.", "Every panel is a choice. Make yours count.",
  "Discipline is the brush. Consistency is the ink.", "You are the protagonist of your own manga.",
  "Draw your path with permanent strokes.", "The handsome lifestyle requires handsome habits.",
  "Oakland raised, universe bound.", "Each chapter harder than the last. That's growth.",
  "The pen is mightier. The drip is eternal.", "Focus isn't the absence of noise—it's choosing the signal."
];

// Achievement Checks
const checkAchievements = (data) => {
  const unlocked = [];
  if (data.tasks?.filter(t => t.status === 'completed').length >= 1) unlocked.push({ icon: <AnimatedIcon Icon={Footprints} animation="bounce" size={20} />, name: 'First Step' });
  if (data.tasks?.filter(t => t.status === 'completed').length >= 10) unlocked.push({ icon: <AnimatedIcon Icon={Waves} animation="float" size={20} />, name: 'Momentum' });
  if (data.projects?.length >= 1) unlocked.push({ icon: <AnimatedIcon Icon={Music} animation="spin" size={20} />, name: 'Creator' });
  if (data.finances?.filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0) >= 10000) unlocked.push({ icon: <AnimatedIcon Icon={Coins} animation="pulse" size={20} />, name: 'Bag Alert' });
  if (data.notes?.length >= 10) unlocked.push({ icon: <AnimatedIcon Icon={Book} animation="glow" size={20} />, name: 'Chronicler' });
  return unlocked;
};

function App() {
  // ── STATE ──
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('Offline');
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('lifeos-theme') || 'light');

  // Feature State
  const [focusMode, setFocusMode] = useState(false);
  const [pomodoro, setPomodoro] = useState({ active: false, time: 25 * 60, mode: 'focus', sessions: 0 });

  // Data State
  const [tasks, setTasks] = useState({ active: [], completed: [], all: [] });
  const [projects, setProjects] = useState([]);
  const [finances, setFinances] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [notes, setNotes] = useState([]);
  const [habits, setHabits] = useState([]);
  const [health, setHealth] = useState([]);
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const [calendar, setCalendar] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [subagents, setSubagents] = useState([]);
  const [streams, setStreams] = useState([]);
  const [inventory, setInventory] = useState({ items: [], raw: '' });
  const [journal, setJournal] = useState([]);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);

  // Wallpaper State
  const [currentWallpaper, setCurrentWallpaper] = useState(0);
  const [showWallpaperSelector, setShowWallpaperSelector] = useState(false);

  // Logo Animation State - swaps PNG to GIF every minute
  const [logoAnimated, setLogoAnimated] = useState(false);
  const wallpapers = [
    '/wallpapers/wp1.png',
    '/wallpapers/wp2.png',
    '/wallpapers/wp3.png',
    '/wallpapers/wp4.png',
    '/wallpapers/wp5.png',
    '/wallpapers/wp6.png',
    '/wallpapers/wp7.png',
    '/wallpapers/wp8.png',
    '/wallpapers/wp9.png',
    '/wallpapers/wp10.png',
    '/wallpapers/wp11.png',
    '/wallpapers/wp12.png',
    '/wallpapers/wp13.png',
    '/wallpapers/wp14.png',
    '/wallpapers/wp15.png'
  ];

  // Mood State - from API
  const [moodsData, setMoodsData] = useState({ moods: {}, agents: {} });
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('clawdette');

  const fetchMoods = async () => {
    try {
      const res = await fetch('/api/moods');
      if (!res.ok) {
        console.error('Moods fetch failed:', res.status, await res.text());
        return;
      }
      const data = await res.json();
      setMoodsData(data);
    } catch (e) { console.error('Failed to fetch moods:', e); }
  };

  useEffect(() => { fetchMoods(); }, []);

  // Refs for Charts & Intervals
  const chartRefs = useRef({});
  const pomoInterval = useRef(null);

  // ── DATA FETCHING ──
  const fetchSubagents = async () => {
    try {
      const res = await fetch('/api/subagents');
      const data = await res.json();
      setSubagents(data.subagents || "No active subagents.");
    } catch (e) { }
  };

  const fetchAllData = async () => {
    try {
      const [
        tasksList, projectsList, financesList, habitsList,
        notesList, healthList, goalsList, scheduleList,
        calendarData, analyticsData, streamsData, inventoryData, journalData,
        googleCalendarStatus
      ] = await Promise.all([
        fetch('/api/tasks').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch('/api/projects').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch('/api/tables/finances').then(r => { if (!r.ok) throw new Error(r.status); return r.json().then(j => j.data || []); }),
        fetch('/api/tables/habits').then(r => { if (!r.ok) throw new Error(r.status); return r.json().then(j => j.data || []); }),
        fetch('/api/tables/notes').then(r => { if (!r.ok) throw new Error(r.status); return r.json().then(j => j.data || []); }),
        fetch('/api/tables/health').then(r => { if (!r.ok) throw new Error(r.status); return r.json().then(j => j.data || []); }),
        fetch('/api/tables/goals').then(r => { if (!r.ok) throw new Error(r.status); return r.json().then(j => j.data || []); }),
        fetch('/api/tables/schedule').then(r => { if (!r.ok) throw new Error(r.status); return r.json().then(j => j.data || []); }),
        fetch('/api/content/calendar').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch('/api/analytics').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch('/api/streams').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch('/api/inventory').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch('/api/journal').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
        fetch('/api/google-calendar/status').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(() => ({ connected: false }))
      ]);

      setTasks({
        active: tasksList.active || [],
        completed: tasksList.completed || [],
        all: tasksList.all || []
      });
      setProjects(projectsList.projects || []);
      setFinances(financesList);
      setHabits(habitsList);
      setNotes(notesList);
      setHealth(healthList);
      setGoals(goalsList);
      setSchedule(scheduleList.data || []);
      setCalendar(calendarData);
      setAnalytics(analyticsData);
      setStreams(streamsData.streams || []);
      setInventory(inventoryData || { items: [], raw: '' });
      setJournal(journalData?.entries || []);
      setGoogleCalendarConnected(!!googleCalendarStatus?.connected);
      setAchievements(checkAchievements({ tasks: tasksList.all, projects: projectsList.projects, finances: financesList, notes: notesList }));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // ── API HELPER ──
  const API = {
    get: async (table) => {
      try {
        const res = await fetch(`/api/tables/${table}`);
        const json = await res.json();
        return json.data || [];
      } catch (e) { return []; }
    },
    create: async (table, data) => {
      await fetch(`/api/tables/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      fetchAllData();
      triggerSFX('作成');
    },
    update: async (table, id, data) => {
      await fetch(`/api/tables/${table}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      fetchAllData();
    },
    delete: async (table, id) => {
      await fetch(`/api/tables/${table}/${id}`, { method: 'DELETE' });
      fetchAllData();
      triggerSFX('削除');
    },
    fetchAllData,
    spawnSubagent: async (task, agentId) => {
      try {
        const res = await fetch('/api/subagents/spawn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, agentId })
        });
        const data = await res.json();
        triggerSFX('召喚');
        fetchSubagents();
        return data;
      } catch (e) { console.error(e); }
    },
    killSubagent: async (target) => {
      try {
        await fetch('/api/subagents/kill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target })
        });
        triggerSFX('消滅');
        fetchSubagents();
      } catch (e) { console.error(e); }
    }
  };

  // ── EFFECTS ──
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    newSocket.on('status_update', (data) => setStatus(data.status));
    newSocket.on('sync_data', (data) => {
      if (data.tasks) {
        setTasks({
          active: data.tasks.filter(t => t.status !== 'completed'),
          completed: data.tasks.filter(t => t.status === 'completed'),
          all: data.tasks
        });
      }
      if (data.finances) setFinances(data.finances);
    });

    fetchAllData();
    fetchSubagents();

    const savedTheme = localStorage.getItem('lifeos-theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setTheme('dark');
    }

    // Logo animation: swap PNG to GIF every 60 seconds
    const logoInterval = setInterval(() => {
      setLogoAnimated(prev => !prev);
    }, 60000);

    // Wallpaper auto-rotation: change every 5 minutes
    const wallpaperInterval = setInterval(() => {
      setCurrentWallpaper(prev => (prev + 1) % wallpapers.length);
    }, 300000); // 5 minutes

    return () => {
      newSocket.close();
      if (pomoInterval.current) clearInterval(pomoInterval.current);
      clearInterval(logoInterval);
      clearInterval(wallpaperInterval);
    };
  }, []);

  useEffect(() => {
    if (activePage === 'analytics' || activePage === 'finances') renderCharts();
  }, [activePage, finances, tasks]);

  // ── ACTIONS ──
  const navigateTo = (page) => {
    setActivePage(page);
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('lifeos-theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('lifeos-theme', 'dark');
      setTheme('dark');
      triggerSFX('闇');
    }
  };

  const triggerSFX = (text) => {
    const container = document.getElementById('sfxContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'sfx-text animate';
    el.textContent = text;
    el.style.left = (20 + Math.random() * 60) + '%';
    el.style.top = (20 + Math.random() * 40) + '%';
    container.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  };

  const toggleTask = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    API.update('tasks', task.id, { status: newStatus });
    triggerSFX(newStatus === 'completed' ? '完了' : '未完了');
  };

  // ── POMODORO ──
  const togglePomodoro = () => {
    if (pomodoro.active) {
      clearInterval(pomoInterval.current);
      setPomodoro(p => ({ ...p, active: false }));
    } else {
      setPomodoro(p => ({ ...p, active: true }));
      pomoInterval.current = setInterval(() => {
        setPomodoro(prev => {
          if (prev.time <= 1) {
            clearInterval(pomoInterval.current);
            triggerSFX('完了！');
            return { ...prev, active: false, time: prev.mode === 'focus' ? 5 * 60 : 25 * 60, mode: prev.mode === 'focus' ? 'break' : 'focus', sessions: prev.sessions + (prev.mode === 'focus' ? 1 : 0) };
          }
          return { ...prev, time: prev.time - 1 };
        });
      }, 1000);
    }
  };
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── CHARTS ──
  const renderCharts = () => {
    const ctxF = document.getElementById('financeChart');
    if (ctxF) {
      if (chartRefs.current.finance) chartRefs.current.finance.destroy();
      const data = {};
      finances.filter(f => f.type === 'expense').forEach(f => data[f.category] = (data[f.category] || 0) + Number(f.amount));
      chartRefs.current.finance = new Chart(ctxF, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data),
          datasets: [{ data: Object.values(data), backgroundColor: ['#0a0a0a', '#444', '#888', '#ccc'] }]
        }
      });
    }
  };

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''} ${focusMode ? 'focus-active' : ''}`}>
      {/* BASE WALLPAPER LAYER */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-[2000ms] ease-in-out"
        style={{ backgroundImage: `url(${wallpapers[currentWallpaper]})` }}
      ></div>

      {/* DEEP CINEMATIC BACKGROUND OVERLAY */}
      <div className="noise-overlay" style={{ opacity: 0.05 }}></div>
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#020203]/80">
        <div className="absolute inset-0 bg-gradient-to-b from-[#111116]/90 via-[#050508]/80 to-[#020203]/90"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-red-600/20 rounded-full blur-[140px] mix-blend-screen"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[40vw] h-[40vw] bg-cyan-600/20 rounded-full blur-[160px] mix-blend-screen"></div>
      </div>

      <div id="sfxContainer" className="sfx-container"></div>

      {/* ═══ ZEN MODE (FOCUS OVERLAY) ═══ */}
      <div
        className={`fixed inset-0 z-[200] flex flex-col items-center justify-center transition-all duration-1000 ${focusMode ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Deep Atmosphere Base */}
        <div className="absolute inset-0 bg-[#020203]/95 backdrop-blur-2xl transition-opacity duration-1000"></div>
        {/* Pulsing Cinematic Orbs */}
        <div className="absolute top-[20%] left-[10%] w-[60vw] h-[60vw] bg-yellow-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-[8000ms]"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[50vw] h-[50vw] bg-orange-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-[10000ms] delay-1000"></div>
        <div className="noise-overlay opacity-30"></div>

        {/* Floating Giant Kanji Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-jp font-black text-[30vw] text-white/[0.02] drop-shadow-[0_0_100px_rgba(255,255,255,0.05)] select-none pointer-events-none tracking-widest leading-none z-0">
          集中
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center">

          {/* Header & Session Info */}
          <div className="flex flex-col items-center mb-16 opacity-80 animate-fade-in-up">
            <span className="text-xs font-bold tracking-[0.5em] text-yellow-500/80 uppercase mb-4 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">Deep Work Protocol</span>
            <div className="flex items-center gap-6 mb-8">
              {/* Mood Display - Clawdette & Knowledge Knaight (in Zen styling) */}
              {['clawdette', 'knowledge-knaight'].map(agentId => {
                const agent = moodsData.agents[agentId];
                const mood = agent ? moodsData.moods[agent.currentMood] : null;
                return (
                  <div
                    key={agentId}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                    onClick={() => { setSelectedAgent(agentId); setShowMoodSelector(!showMoodSelector); }}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/[0.08] p-1 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:border-white/20 transition-all flex items-center justify-center overflow-hidden">
                      <img src={mood?.gif || '/moods/ready.gif'} alt={agent?.currentMood || 'ready'} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[9px] font-bold tracking-[0.2em] text-gray-500 uppercase group-hover:text-white transition-colors">{agent?.name || agentId}</span>
                  </div>
                );
              })}
            </div>
            {/* Mood Selector Modal (Re-styled for Zen) */}
            {showMoodSelector && (
              <div className="absolute top-[80px] bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/[0.08] p-4 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-wrap gap-4 z-50 w-[300px] justify-center">
                {Object.entries(moodsData.moods).map(([id, mood]) => (
                  <div
                    key={id}
                    className="flex flex-col items-center gap-2 cursor-pointer group p-2 hover:bg-white/5 rounded-2xl transition-all"
                    onClick={async () => {
                      await fetch('/api/moods/' + selectedAgent, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mood: id })
                      });
                      fetchMoods();
                      setShowMoodSelector(false);
                    }}
                  >
                    <img src={mood.gif} alt={mood.label} className="w-12 h-12 rounded-xl" />
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase tracking-wider">{mood.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Zen Quote */}
            <div className="text-sm font-mono text-gray-400 italic font-light tracking-wide text-center max-w-lg">
              "{QUOTES[Math.floor(Math.random() * QUOTES.length)]}"
            </div>
          </div>

          {/* Core Priorities */}
          <div className="w-full max-w-2xl flex flex-col gap-4 mb-20 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {tasks.active.slice(0, 3).map((t, i) => (
              <div key={i} className="group relative flex items-center gap-6 p-6 bg-white/5 backdrop-blur-3xl border border-white/[0.08] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 hover:bg-white/[0.08] hover:border-white/[0.15] hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:-translate-y-1 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-yellow-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black/40 border border-white/[0.05] shadow-inner text-2xl font-black font-jp text-white/30 group-hover:text-yellow-500/80 group-hover:border-yellow-500/30 transition-all">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white/90 tracking-wide leading-relaxed group-hover:text-white transition-colors">{t.description || t.title}</h3>
                </div>
              </div>
            ))}
            {tasks.active.length === 0 && (
              <div className="text-center p-12 bg-white/5 border border-white/[0.08] rounded-3xl">
                <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">No Active Directives</p>
                <p className="text-gray-600 font-mono text-xs mt-2">The calm before the storm. Take a breath.</p>
              </div>
            )}
          </div>

        </div>

        {/* Minimalist Exist Controls */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <button
            className="group flex flex-col items-center justify-center gap-3 transition-transform hover:scale-105"
            onClick={() => setFocusMode(false)}
          >
            <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-md border border-white/[0.1] flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.3)] group-hover:bg-red-500/20 group-hover:border-red-500/50 group-hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-all duration-500 overflow-hidden relative">
              <div className="absolute inset-0 bg-red-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <span className="relative z-10 w-2 h-2 rounded-full bg-white/50 group-hover:bg-red-400 group-hover:scale-150 transition-all duration-300"></span>
            </div>
            <span className="text-[9px] font-bold tracking-[0.3em] text-gray-500 uppercase group-hover:text-red-400 transition-colors">Return to Surface</span>
          </button>
        </div>
      </div>

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`fixed top-0 left-0 h-full w-[260px] bg-[#0a0a0c]/70 backdrop-blur-3xl border-r border-white/[0.08] flex flex-col z-[100] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Header / Logo Group */}
        <div className="p-6 border-b border-white/[0.08] flex flex-col items-center justify-center relative group cursor-pointer" onClick={toggleTheme}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="relative w-20 h-20 mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:scale-110">
            <img
              src={logoAnimated
                ? (theme === 'dark' ? '/logo/logo-animated-2.gif' : '/logo/logo-animated-1.gif')
                : (theme === 'dark' ? '/logo/logo-light.png' : '/logo/logo-dark.png')
              }
              alt="LIFE OS"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-sm font-black tracking-[0.3em] font-premium text-white uppercase group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">Life OS</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto glass-scroll py-6 px-4 flex flex-col gap-6">

          {/* Command Section */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase px-3 mb-3">Command</div>
            <div className="flex flex-col gap-1">
              {['dashboard'].map(p => (
                <div key={p} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${activePage === p ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/[0.15]' : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'}`} onClick={() => navigateTo(p)}>
                  <span className="text-xs font-bold tracking-wide capitalize">{p}</span>
                </div>
              ))}
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${activePage === 'subagents' ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/[0.15]' : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'}`} onClick={() => navigateTo('subagents')}>
                <span className="text-xs font-bold tracking-wide">The Round Table</span>
              </div>
            </div>
          </div>

          {/* Work Section */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase px-3 mb-3">Work</div>
            <div className="flex flex-col gap-1">
              {['tasks', 'projects', 'calendar', 'streams', 'inventory'].map(p => (
                <div key={p} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${activePage === p ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/[0.15]' : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'}`} onClick={() => navigateTo(p)}>
                  <span className="text-xs font-bold tracking-wide capitalize">{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content Section */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase px-3 mb-3">Content</div>
            <div className="flex flex-col gap-1">
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${activePage === 'content' ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/[0.15]' : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'}`} onClick={() => navigateTo('content')}>
                <span className="text-xs font-bold tracking-wide">📅 Scheduler</span>
              </div>
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${activePage === 'blog' ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/[0.15]' : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'}`} onClick={() => navigateTo('blog')}>
                <span className="text-xs font-bold tracking-wide">📝 Blog & Voice</span>
              </div>
            </div>
          </div>

          {/* Life Section */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase px-3 mb-3">Life</div>
            <div className="flex flex-col gap-1">
              {['finances', 'habits'].map(p => (
                <div key={p} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${activePage === p ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/[0.15]' : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'}`} onClick={() => navigateTo(p)}>
                  <span className="text-xs font-bold tracking-wide capitalize flex items-center gap-2">
                    {p === 'finances' ? <><AnimatedIcon Icon={Coins} size={14} /> Finances</> : p}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Second Brain Section */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase px-3 mb-3">Second Brain</div>
            <div className="flex flex-col gap-1">
              {['notes', 'journal'].map(p => (
                <div key={p} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${activePage === p ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/[0.15]' : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'}`} onClick={() => navigateTo(p)}>
                  <span className="text-xs font-bold tracking-wide capitalize">{p}</span>
                </div>
              ))}
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${activePage === 'cortex' ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/[0.15]' : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'}`} onClick={() => navigateTo('cortex')}>
                <span className="text-xs font-bold tracking-wide">🧠 Cortex</span>
              </div>
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${activePage === 'contacts' ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/[0.15]' : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent'}`} onClick={() => navigateTo('contacts')}>
                <span className="text-xs font-bold tracking-wide">👥 Contacts</span>
              </div>
            </div>
          </div>

          {/* Tools Grid Section */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase px-3 mb-3">Tools</div>
            <div className="grid grid-cols-4 gap-2 px-1">
              <button
                className={`w-12 h-12 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-300 group ${activePage === 'pomodoro' ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/[0.15]' : 'bg-black/40 border border-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.05]'}`}
                onClick={() => navigateTo('pomodoro')}
                title="Pomodoro"
              >
                <Timer size={18} className="group-hover:scale-110 transition-transform" />
              </button>
              <button
                className={`w-12 h-12 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-300 group ${activePage === 'analytics' ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/[0.15]' : 'bg-black/40 border border-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.05]'}`}
                onClick={() => navigateTo('analytics')}
                title="Analytics"
              >
                <BarChart3 size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </nav>

        {/* Premium Bottom Control Hub */}
        <div className="p-4 border-t border-white/[0.08] bg-black/20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold tracking-[0.2em] text-gray-500 uppercase">System</span>
              <span className="text-xs font-mono font-bold text-gray-300">Guapdad 4000</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/[0.08] rounded-xl text-white font-bold text-xs tracking-wider transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:border-white/20 flex items-center justify-center gap-2"
              onClick={() => setActiveModal('quickAdd')}
              title="Quick Add"
            >
              <Plus size={14} /> Add
            </button>
            <button
              className={`w-10 flex items-center justify-center rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2)] border flex-shrink-0 ${focusMode ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-white/5 hover:bg-white/10 border-white/[0.08] text-gray-300'}`}
              onClick={() => setFocusMode(!focusMode)}
              title="Focus Mode"
            >
              <span className="font-jp font-bold text-sm">集</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay - closes sidebar when clicked on mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ═══ MAIN ═══ */}
      <main className="main-content">
        {/* Mobile Menu Toggle (Only visible on small screens) */}
        <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span className="hamburger"></span>
        </button>

        <section key={activePage} className="page-section active z-10 p-6 min-h-screen relative mt-16 lg:mt-0 animate-fade-in-up">

          {activePage === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              projects={projects}
              finances={finances}
              habits={habits}
              streams={streams}
              toggleTask={toggleTask}
              setActivePage={setActivePage}
              setActiveModal={setActiveModal}
              googleCalendarConnected={googleCalendarConnected}
            />
          )}

          {activePage === 'tasks' && (
            <KanbanBoard tasks={tasks.all} api={API} />
          )}

          {activePage === 'projects' && (
            <ProjectsView api={API} />
          )}

          {activePage === 'contacts' && (
            <ContactsView />
          )}

          {activePage === 'pomodoro' && (
            <div className="pomodoro-container">
              <div className="pomodoro-ring">
                <div className="pomodoro-time">{formatTime(pomodoro.time)}</div>
                <div className="pomodoro-label">{pomodoro.mode.toUpperCase()}</div>
              </div>
              <div className="pomodoro-controls">
                <button className="btn btn-primary" onClick={togglePomodoro}>{pomodoro.active ? 'PAUSE' : 'START'}</button>
              </div>
            </div>
          )}

          {activePage === 'finances' && (
            <FinanceView finances={finances} api={API} />
          )}

          {activePage === 'habits' && (
            <HabitsView habits={habits} api={API} />
          )}

          {activePage === 'calendar' && (
            <CalendarView events={calendar?.events || []} api={API} googleConnected={googleCalendarConnected} />
          )}

          {activePage === 'inventory' && (
            <InventoryView inventory={(inventory.items || []).filter(i => i.name && i.name !== ':---' && i.name !== '---')} api={API} />
          )}

          {activePage === 'streams' && (
            <StreamsView streams={streams} setActiveModal={setActiveModal} api={API} triggerSFX={triggerSFX} />
          )}

          {activePage === 'subagents' && (
            <div className="w-full">
              <RoundTableView />
            </div>
          )}

          {activePage === 'analytics' && (
            <div className="grid-2">
              <div className="stat-card"><div className="stat-value">{analytics?.totalFiles || 0}</div><div className="stat-label">Total Files</div></div>
              <div className="stat-card"><div className="stat-value">{analytics?.projectCount || 0}</div><div className="stat-label">Active Projects</div></div>
              <div className="stat-card"><div className="stat-value">{analytics?.memoryEntries || 0}</div><div className="stat-label">Memory Entries</div></div>
              <div className="stat-card"><div className="stat-value">{analytics?.taskCount || 0}</div><div className="stat-label">Total Tasks</div></div>
            </div>
          )}

          {activePage === 'notes' && (
            <NotesView notes={notes} api={API} />
          )}

          {activePage === 'content' && (
            <ContentSchedulerView api={API} postbridgeKey="pb_live_6TxeA2MXDdTeVaXrp8BwG8" />
          )}

          {activePage === 'blog' && (
            <BlogVoiceView api={API} />
          )}

          {activePage === 'inventory' && (
            <div className="inventory-container">
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                  <span className="card-title">Merchandise Inventory</span>
                  <span className="card-icon"><AnimatedIcon Icon={Package} animation="float" size={24} /></span>
                </div>

                {inventory.items && inventory.items.filter(i => i.name && i.name !== ':---').length > 0 ? (
                  <div className="inventory-table" style={{ padding: '0 20px 20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--ink)', textAlign: 'left' }}>
                          <th style={{ padding: '10px' }}>Item</th>
                          <th style={{ padding: '10px' }}>Variant</th>
                          <th style={{ padding: '10px' }}>Stock</th>
                          <th style={{ padding: '10px' }}>Price</th>
                          <th style={{ padding: '10px' }}>Status</th>
                          <th style={{ padding: '10px' }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.items.filter(i => i.name && i.name !== ':---').map((item, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--grey-300)' }}>
                            <td style={{ padding: '10px', fontWeight: '600' }}>{item.name}</td>
                            <td style={{ padding: '10px' }}>{item.variant}</td>
                            <td style={{ padding: '10px' }}>{item.stock}</td>
                            <td style={{ padding: '10px' }}>{item.price}</td>
                            <td style={{ padding: '10px' }}>
                              <span className="tag" style={{
                                background: item.status.includes('🟢') ? '#22c55e' :
                                  item.status.includes('🟡') ? '#eab308' :
                                    item.status.includes('🔴') ? '#ef4444' :
                                      item.status.includes('⚪') ? '#9ca3af' : 'var(--grey-300)'
                              }}>{item.status}</span>
                            </td>
                            <td style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--grey-500)' }}>{item.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
                    <div style={{ marginBottom: '10px' }}><AnimatedIcon Icon={Package} size={32} /></div>
                    <div>No inventory items found.</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>Add items to INVENTORY.md to see them here.</div>
                  </div>
                )}
              </div>

              {/* Pending Count Tasks */}
              {inventory.raw && inventory.raw.includes('Pending Count') && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Pending Actions</span>
                    <span className="card-icon"><AnimatedIcon Icon={Zap} animation="pulse" size={24} /></span>
                  </div>
                  <div style={{ padding: '0 20px 20px' }}>
                    {inventory.raw.split('\n').filter(line => line.includes('- [ ]')).map((task, i) => (
                      <div key={i} className="task-item" style={{ padding: '8px 0' }}>
                        <div className="task-checkbox"></div>
                        <div className="task-content">
                          <div className="task-title">{task.replace('- [ ]', '').trim()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activePage === 'journal' && (
            <div className="p-6 md:p-10 max-w-[1400px] mx-auto min-h-full bg-black/95 relative overflow-hidden text-white/90">
              {/* Premium Background Effects */}
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0%,transparent_70%)] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none" />

              {/* Header Title */}
              <div className="flex items-center gap-4 pr-6 mb-12 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.1)]">
                  <AnimatedIcon Icon={BookOpen} size={28} />
                </div>
                <div>
                  <h1 className="font-outfit text-3xl font-bold tracking-widest uppercase text-white m-0 drop-shadow-md">Journal</h1>
                  <p className="font-mono text-xs tracking-[0.2em] text-white/40 uppercase mt-1">Daily Reflections & Summaries</p>
                </div>
              </div>

              {journal.length > 0 ? (
                <div className="flex flex-col gap-8 relative z-10 w-full mb-20 max-w-5xl mx-auto">
                  {journal.map((entry, i) => {
                    // Safe date parsing
                    let dayNum = '--';
                    let monthStr = '---';
                    let yearStr = '----';

                    if (entry.date) {
                      const d = new Date(entry.date);
                      if (!isNaN(d.getTime())) {
                        dayNum = d.getDate().toString().padStart(2, '0');
                        monthStr = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                        yearStr = d.getFullYear().toString();
                      }
                    }

                    return (
                      <div key={i} className="group flex flex-col md:flex-row glass-panel rounded-[2rem] border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-700 bg-gradient-to-br from-white/[0.03] to-transparent relative shadow-none hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                        {/* Hover Glow Core */}
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        {/* Date Column (Left) */}
                        <div className="w-full md:w-[140px] bg-white/[0.01] border-b md:border-b-0 md:border-r border-white/5 p-8 flex flex-col items-center justify-center shrink-0 relative transition-colors duration-500 group-hover:bg-sky-500/[0.02]">
                          <div className="font-outfit text-6xl md:text-7xl font-light text-white/80 tracking-tighter tabular-nums drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] group-hover:text-white transition-colors duration-500">{dayNum}</div>
                          <div className="flex flex-col items-center mt-2">
                            <span className="font-mono text-xs font-bold tracking-[0.2em] text-sky-400 uppercase drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">{monthStr}</span>
                            <span className="font-mono text-[0.6rem] tracking-[0.3em] text-white/30 uppercase mt-1 group-hover:text-white/40 transition-colors duration-500">{yearStr}</span>
                          </div>
                        </div>

                        {/* Content Column (Right) */}
                        <div className="flex-1 p-8 md:p-10 flex flex-col relative z-10">
                          {/* Top accent line */}
                          <div className="w-12 h-0.5 bg-gradient-to-r from-sky-500/50 to-transparent mb-6 rounded-full opacity-50 group-hover:opacity-100 group-hover:w-24 transition-all duration-700" />

                          <div className="font-inter text-base md:text-lg text-white/75 leading-[1.8] whitespace-pre-wrap font-light group-hover:text-white/90 transition-colors duration-500">
                            {entry.content}
                          </div>

                          {/* Aesthetic watermark */}
                          <div className="absolute bottom-8 right-8 mix-blend-overlay opacity-0 group-hover:opacity-5 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700 pointer-events-none">
                            <AnimatedIcon Icon={BookOpen} size={120} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-panel rounded-3xl border border-white/10 p-20 flex flex-col items-center justify-center text-center mt-8 relative z-10 max-w-3xl mx-auto">
                  <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                    <BookOpen size={40} className="text-white/20" />
                  </div>
                  <h3 className="font-outfit text-2xl text-white/80 tracking-wide mb-2">No Journal Entries Found</h3>
                  <p className="font-mono text-sm text-white/40 uppercase tracking-widest">Entries are auto-generated daily to capture your reflections.</p>
                </div>
              )}
            </div>
          )}

          {activePage === 'cortex' && <CortexView />}

        </section>
      </main>

      {/* ═══ MODALS ═══ */}
      {activeModal === 'quickAdd' && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">Quick Add</span><button className="modal-close" onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="grid-3" style={{ padding: '20px' }}>
              {['Task', 'Finance', 'Stream', 'Habit', 'Note'].map(type => (
                <div key={type} className="card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveModal(`new${type}`)}>
                  {type.toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Finance Modal */}
      {activeModal === 'newFinance' && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">New Transaction</span><button className="modal-close" onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="modal-body">
              <input className="form-input" id="finTitle" placeholder="Description" />
              <input className="form-input" id="finAmount" type="number" placeholder="Amount" />
              <select className="form-select" id="finType"><option value="expense">Expense</option><option value="income">Income</option></select>
              <select className="form-select" id="finCat"><option value="food">Food</option><option value="gear">Gear</option><option value="music">Music</option></select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => {
                API.create('finances', {
                  title: document.getElementById('finTitle').value,
                  amount: document.getElementById('finAmount').value,
                  type: document.getElementById('finType').value,
                  category: document.getElementById('finCat').value
                });
                setActiveModal(null);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {activeModal === 'newTask' && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">New Task</span><button className="modal-close" onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="modal-body">
              <input className="form-input" id="taskTitle" placeholder="Task Description" />
              <select className="form-select" id="taskPriority"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => {
                API.create('tasks', {
                  description: document.getElementById('taskTitle').value,
                  priority: document.getElementById('taskPriority').value
                });
                setActiveModal(null);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Habit Modal */}
      {activeModal === 'newHabit' && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">New Habit</span><button className="modal-close" onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="modal-body">
              <input className="form-input" id="habitName" placeholder="Habit Name" />
              <input className="form-input" id="habitIcon" placeholder="Icon (emoji)" />
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => {
                API.create('habits', {
                  name: document.getElementById('habitName').value,
                  icon: document.getElementById('habitIcon').value || '✨'
                });
                setActiveModal(null);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {activeModal === 'newNote' && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">New Note</span><button className="modal-close" onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="modal-body">
              <input className="form-input" id="noteTitle" placeholder="Title" />
              <textarea className="form-input" id="noteContent" placeholder="Content..." style={{ height: '100px' }}></textarea>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => {
                API.create('notes', {
                  title: document.getElementById('noteTitle').value,
                  content: document.getElementById('noteContent').value
                });
                setActiveModal(null);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Stream Modal */}
      {activeModal === 'newStream' && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">Schedule New Stream</span><button className="modal-close" onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="modal-body">
              <input className="form-input" id="streamTitle" placeholder="Stream Title" />
              <input className="form-input" id="streamDate" type="date" />
              <input className="form-input" id="streamTime" type="time" />
              <select className="form-select" id="streamPlatform">
                <option value="Twitch">Twitch</option>
                <option value="YouTube">YouTube</option>
                <option value="Instagram">Instagram Live</option>
                <option value="TikTok">TikTok Live</option>
                <option value="Discord">Discord Stage</option>
                <option value="Other">Other</option>
              </select>
              <textarea className="form-input" id="streamDesc" placeholder="Stream Description / Agenda..." style={{ height: '60px' }}></textarea>
              <input className="form-input" id="streamGuests" placeholder="Special Guests (comma separated)" />
              <input className="form-input" id="streamChat" placeholder="Chat Activations / Engagement Plans" />
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => {
                API.create('streams', {
                  title: document.getElementById('streamTitle').value,
                  scheduledDate: document.getElementById('streamDate').value,
                  scheduledTime: document.getElementById('streamTime').value,
                  platform: document.getElementById('streamPlatform').value,
                  description: document.getElementById('streamDesc').value,
                  guests: document.getElementById('streamGuests').value,
                  chatActivations: document.getElementById('streamChat').value
                });
                setActiveModal(null);
              }}>Schedule Stream</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stream Modal */}
      {activeModal === 'editStream' && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">Edit Stream</span><button className="modal-close" onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="modal-body">
              <input type="hidden" id="editStreamId" />
              <input className="form-input" id="editStreamTitle" placeholder="Stream Title" />
              <input className="form-input" id="editStreamDate" type="date" />
              <input className="form-input" id="editStreamTime" type="time" />
              <select className="form-select" id="editStreamPlatform">
                <option value="Twitch">Twitch</option>
                <option value="YouTube">YouTube</option>
                <option value="Instagram">Instagram Live</option>
                <option value="TikTok">TikTok Live</option>
                <option value="Discord">Discord Stage</option>
                <option value="Other">Other</option>
              </select>
              <textarea className="form-input" id="editStreamDesc" placeholder="Stream Description / Agenda..." style={{ height: '60px' }}></textarea>
              <input className="form-input" id="editStreamGuests" placeholder="Special Guests (comma separated)" />
              <input className="form-input" id="editStreamChat" placeholder="Chat Activations / Engagement Plans" />
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => {
                const id = document.getElementById('editStreamId').value;
                API.update('streams', id, {
                  title: document.getElementById('editStreamTitle').value,
                  scheduledDate: document.getElementById('editStreamDate').value,
                  scheduledTime: document.getElementById('editStreamTime').value,
                  platform: document.getElementById('editStreamPlatform').value,
                  description: document.getElementById('editStreamDesc').value,
                  guests: document.getElementById('editStreamGuests').value,
                  chatActivations: document.getElementById('editStreamChat').value
                });
                setActiveModal(null);
              }}>Update Stream</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;