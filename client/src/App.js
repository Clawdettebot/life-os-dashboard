// Life OS Dashboard - Fixed API error handling
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Chart from 'chart.js/auto';
import { Timer, BarChart3 } from 'lucide-react';
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
  if (data.tasks?.filter(t => t.status === 'completed').length >= 1) unlocked.push({ icon: '👣', name: 'First Step' });
  if (data.tasks?.filter(t => t.status === 'completed').length >= 10) unlocked.push({ icon: '🌊', name: 'Momentum' });
  if (data.projects?.length >= 1) unlocked.push({ icon: '🎵', name: 'Creator' });
  if (data.finances?.filter(f => f.type === 'income').reduce((s,f) => s+Number(f.amount), 0) >= 10000) unlocked.push({ icon: '💰', name: 'Bag Alert' });
  if (data.notes?.length >= 10) unlocked.push({ icon: '📖', name: 'Chronicler' });
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
    } catch (e) {}
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
      if(data.tasks) {
        setTasks({
          active: data.tasks.filter(t => t.status !== 'completed'),
          completed: data.tasks.filter(t => t.status === 'completed'),
          all: data.tasks
        });
      }
      if(data.finances) setFinances(data.finances);
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
            return { ...prev, active: false, time: prev.mode === 'focus' ? 5*60 : 25*60, mode: prev.mode === 'focus' ? 'break' : 'focus', sessions: prev.sessions + (prev.mode === 'focus' ? 1 : 0) };
          }
          return { ...prev, time: prev.time - 1 };
        });
      }, 1000);
    }
  };
  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

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

  // ── RENDERERS ──
  const renderDashboard = () => (
    <div className="grid-2">
      <div className="card speed-lines">
        <div className="card-header"><span className="card-title">Priority Tasks</span><span className="card-icon">⚡</span></div>
        <div className="task-list">
          {tasks.active.slice(0, 5).map((t, i) => (
            <div key={i} className="task-item" onClick={() => toggleTask(t)}>
              <div className={`task-checkbox ${t.status === 'completed' ? 'checked' : ''}`}></div>
              <div className="task-content">
                <div className="task-title" style={{textDecoration: t.status === 'completed' ? 'line-through' : 'none'}}>{t.description || t.title}</div>
                <div className="task-meta"><span className="tag">{t.priority || 'medium'}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Stats</span><span className="card-icon">📊</span></div>
        <div className="grid-2" style={{gap:'10px'}}>
          <div className="stat-card"><div className="stat-value">{tasks.active.length}</div><div className="stat-label">Tasks</div></div>
          <div className="stat-card"><div className="stat-value">{projects.length}</div><div className="stat-label">Projects</div></div>
          <div className="stat-card"><div className="stat-value">${finances.filter(f=>f.type==='income').reduce((s,f)=>s+Number(f.amount),0)}</div><div className="stat-label">Income</div></div>
          <div className="stat-card"><div className="stat-value">{habits.length}</div><div className="stat-label">Habits</div></div>
        </div>
      </div>
      {/* Upcoming Streams Preview */}
      <div className="card" style={{gridColumn: '1 / -1'}}>
        <div className="card-header">
          <span className="card-title">Upcoming Streams</span>
          <span className="card-icon">📡</span>
          <button className="btn btn-sm" style={{marginLeft: 'auto'}} onClick={() => setActivePage('streams')}>View All</button>
        </div>
        <div className="stream-list" style={{padding: '10px 0'}}>
          {streams.filter(s => s.status === 'planned').length === 0 ? (
            <div style={{padding:'15px', textAlign:'center', opacity:0.6, fontSize: '0.85rem'}}>
              No upcoming streams. <span style={{cursor:'pointer', textDecoration:'underline'}} onClick={() => setActiveModal('newStream')}>Schedule one now.</span>
            </div>
          ) : (
            <div style={{display: 'flex', gap: '15px', overflowX: 'auto', padding: '5px'}}>
              {streams.filter(s => s.status === 'planned').slice(0, 3).map((stream, i) => (
                <div key={i} className="stream-card" style={{minWidth: '280px', marginBottom: 0}}>
                  <div className="stream-header">
                    <div className="stream-title" style={{fontSize: '0.95rem'}}>{stream.title}</div>
                  </div>
                  <div className="stream-meta">
                    <span className="stream-date">{new Date(stream.scheduledDate).toLocaleDateString()}</span>
                    <span className="stream-platform">{stream.platform}</span>
                  </div>
                  {stream.guests && (
                    <div className="stream-guests" style={{fontSize: '0.7rem', marginTop: '8px'}}>
                      <strong>Guests:</strong> {stream.guests}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Google Calendar Upcoming Events */}
      <GoogleCalendarWidget 
        connected={googleCalendarConnected} 
        onViewCalendar={() => setActivePage('calendar')}
      />
    </div>
  );

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''} ${focusMode ? 'focus-active' : ''}`}>
      {/* Wallpaper Background */}
      <div 
        className="wallpaper-bg" 
        style={{backgroundImage: `url(${wallpapers[currentWallpaper]})`}}
      />
      <div className="wallpaper-overlay" />
      
      {/* Wallpaper Selector */}
      <div className="wallpaper-selector">
        {showWallpaperSelector && (
          <div className="wallpaper-thumbs-container">
            {wallpapers.map((wp, i) => (
              <div
                key={i}
                className={`wallpaper-thumb-mini ${currentWallpaper === i ? 'active' : ''}`}
                style={{backgroundImage: `url(${wp})`}}
                onClick={() => setCurrentWallpaper(i)}
                title={`Wallpaper ${i + 1}`}
              />
            ))}
          </div>
        )}
        <div 
          className="wallpaper-toggle-mini"
          onClick={() => setShowWallpaperSelector(!showWallpaperSelector)}
          title="Change Wallpaper"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      </div>
      
      <div id="sfxContainer" className="sfx-container"></div>
      
      {/* ═══ FOCUS OVERLAY ═══ */}
      <div className={`focus-overlay ${focusMode ? 'active' : ''}`}>
        <button className="focus-close" onClick={() => setFocusMode(false)}><i className="fas fa-times"></i> EXIT</button>
        
        {/* Mood Display - Clawdette & Knowledge Knaight */}
        <div className="focus-mood" style={{position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '10px'}}>
          {['clawdette', 'knowledge-knaight'].map(agentId => {
            const agent = moodsData.agents[agentId];
            const mood = agent ? moodsData.moods[agent.currentMood] : null;
            return (
              <div key={agentId} className="mood-display" onClick={() => { setSelectedAgent(agentId); setShowMoodSelector(!showMoodSelector); }}>
                <img 
                  src={mood?.gif || '/moods/ready.gif'} 
                  alt={agent?.currentMood || 'ready'}
                  className="mood-emoji"
                />
                <span className="mood-label">{agent?.name || agentId}</span>
              </div>
            );
          })}
          {showMoodSelector && (
            <div className="mood-selector">
              {Object.entries(moodsData.moods).map(([id, mood]) => (
                <div 
                  key={id} 
                  className="mood-option"
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
                  <img src={mood.gif} alt={mood.label} />
                  <span>{mood.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="focus-kanji">集中</div>
        <div className="focus-greeting">FOCUS MODE</div>
        <div className="focus-priorities">
          {tasks.active.slice(0,3).map((t,i) => (
            <div key={i} className="focus-priority-item">
              <span className="focus-priority-num">{i+1}</span>
              <span>{t.description || t.title}</span>
            </div>
          ))}
        </div>
        <div className="focus-quote">{QUOTES[Math.floor(Math.random() * QUOTES.length)]}</div>
      </div>

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container" onClick={toggleTheme}>
            <img 
              src={logoAnimated 
                ? (theme === 'dark' ? '/logo/logo-animated-2.gif' : '/logo/logo-animated-1.gif')
                : (theme === 'dark' ? '/logo/logo-light.png' : '/logo/logo-dark.png')
              } 
              alt="LIFE OS" 
              className="logo-image"
            />
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Command</div>
            {['dashboard'].map(p => (
              <div key={p} className={`nav-item ${activePage === p ? 'active' : ''}`} onClick={() => navigateTo(p)}>
                <span style={{textTransform:'capitalize'}}>{p}</span>
              </div>
            ))}
            <div className={`nav-item ${activePage === 'subagents' ? 'active' : ''}`} onClick={() => navigateTo('subagents')}>The Round Table</div>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Work</div>
            {['tasks', 'projects', 'calendar', 'streams', 'inventory'].map(p => (
              <div key={p} className={`nav-item ${activePage === p ? 'active' : ''}`} onClick={() => navigateTo(p)}>
                <span style={{textTransform:'capitalize'}}>{p}</span>
              </div>
            ))}
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Content</div>
            <div className={`nav-item ${activePage === 'content' ? 'active' : ''}`} onClick={() => navigateTo('content')}>
              <span>📅 Scheduler</span>
            </div>
            <div className={`nav-item ${activePage === 'blog' ? 'active' : ''}`} onClick={() => navigateTo('blog')}>
              <span>📝 Blog & Voice</span>
            </div>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Life</div>
            {['finances', 'habits'].map(p => (
              <div key={p} className={`nav-item ${activePage === p ? 'active' : ''}`} onClick={() => navigateTo(p)}>
                <span style={{textTransform:'capitalize'}}>{p === 'finances' ? '💰 Finances' : p}</span>
              </div>
            ))}
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Second Brain</div>
            {['notes', 'journal'].map(p => (
              <div key={p} className={`nav-item ${activePage === p ? 'active' : ''}`} onClick={() => navigateTo(p)}>
                <span style={{textTransform:'capitalize'}}>{p}</span>
              </div>
            ))}
            <div className={`nav-item ${activePage === 'cortex' ? 'active' : ''}`} onClick={() => navigateTo('cortex')}>
              <span>🧠 Cortex</span>
            </div>
            <div className={`nav-item ${activePage === 'contacts' ? 'active' : ''}`} onClick={() => navigateTo('contacts')}>
              <span>👥 Contacts</span>
            </div>
          </div>
          <div className="nav-section tools-grid-section">
            <div className="nav-section-label">Tools</div>
            <div className="tools-icon-grid">
              <button 
                className={`tool-icon-btn ${activePage === 'pomodoro' ? 'active' : ''}`}
                onClick={() => navigateTo('pomodoro')}
                title="Pomodoro"
              >
                <Timer size={22} />
              </button>
              <button 
                className={`tool-icon-btn ${activePage === 'analytics' ? 'active' : ''}`}
                onClick={() => navigateTo('analytics')}
                title="Analytics"
              >
                <BarChart3 size={22} />
              </button>
            </div>
          </div>
        </nav>
        
        {/* Mood Display - Both Agents */}
        <div className="sidebar-mood-section">
          {['clawdette', 'knowledge-knaight'].map(agentId => {
            const agent = moodsData.agents[agentId];
            const mood = agent ? moodsData.moods[agent.currentMood] : null;
            return (
              <div key={agentId} className="mood-display-large" onClick={() => { setSelectedAgent(agentId); setShowMoodSelector(!showMoodSelector); }}>
                <img 
                  src={mood?.gif || '/moods/ready.gif'} 
                  alt={agent?.currentMood || 'ready'}
                  className="mood-emoji-large"
                />
                <span className="mood-label-large">{agent?.name || agentId}</span>
              </div>
            );
          })}
          {showMoodSelector && (
            <div className="mood-selector-dropdown">
              {Object.entries(moodsData.moods).map(([id, mood]) => (
                <div 
                  key={id} 
                  className="mood-option"
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
                  <img src={mood.gif} alt={mood.label} />
                  <span>{mood.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar Overlay - closes sidebar when clicked on mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* ═══ MAIN ═══ */}
      <main className="main-content">
        <div className="top-bar">
          <div className="top-bar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <span className="top-bar-greeting">Life OS — <strong>GUAPDAD 4000</strong></span>
            <span className="top-bar-page" style={{marginLeft: '20px', textTransform: 'capitalize', fontWeight: 600, color: 'var(--grey-700)'}}>{activePage}</span>
          </div>
          <div className="top-bar-right">
            <button 
              className="quick-add-btn"
              onClick={() => setActiveModal('quickAdd')}
              title="Add new"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.3rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                marginRight: '8px'
              }}
            >
              +
            </button>
            <button 
              className={`focus-mode-btn ${focusMode ? 'active' : ''}`}
              onClick={() => setFocusMode(!focusMode)}
              title="Focus Mode"
            >
              <span className="focus-kanji">集</span>
            </button>
            <span className="top-bar-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        <section className="page-section active">

          {activePage === 'dashboard' && renderDashboard()}

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
            <div className="streams-container">
              <div className="grid-2" style={{marginBottom:'20px'}}>
                <div className="stat-card">
                  <div className="stat-value">{streams.filter(s => s.status === 'planned').length}</div>
                  <div className="stat-label">Planned</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{streams.filter(s => s.status === 'completed').length}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>
              <div className="card" style={{marginBottom:'20px'}}>
                <div className="card-header">
                  <span className="card-title">Upcoming Streams</span>
                  <button className="btn btn-primary" onClick={() => setActiveModal('newStream')}>+ Schedule Stream</button>
                </div>
                <div className="stream-list">
                  {streams.filter(s => s.status !== 'cancelled').length === 0 ? (
                    <div style={{padding:'20px', textAlign:'center', opacity:0.6}}>No streams scheduled. Create your first stream.</div>
                  ) : (
                    streams.filter(s => s.status !== 'cancelled').map((stream, i) => (
                      <div key={i} className={`stream-card ${stream.status}`}>
                        <div className="stream-header">
                          <div className="stream-title">{stream.title}</div>
                          <div className={`stream-status-badge ${stream.status}`}>{stream.status}</div>
                        </div>
                        <div className="stream-meta">
                          <span className="stream-date">{new Date(stream.scheduledDate).toLocaleDateString()} {stream.scheduledTime && `at ${stream.scheduledTime}`}</span>
                          <span className="stream-platform">{stream.platform}</span>
                        </div>
                        {(stream.description || stream.guests || stream.chatActivations) && (
                          <div className="stream-details">
                            {stream.description && <div className="stream-desc">{stream.description}</div>}
                            {stream.guests && (
                              <div className="stream-guests">
                                <strong>Guests:</strong> {stream.guests}
                              </div>
                            )}
                            {stream.chatActivations && (
                              <div className="stream-activations">
                                <strong>Chat:</strong> {stream.chatActivations}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="stream-actions">
                          <button className="btn btn-sm" onClick={() => { document.getElementById('editStreamId').value = stream.id; setActiveModal('editStream'); }}>Edit</button>
                          {stream.status === 'planned' && (
                            <button className="btn btn-sm btn-success" onClick={() => { API.update('streams', stream.id, { status: 'completed' }); triggerSFX('完了'); }}>Complete</button>
                          )}
                          <button className="btn btn-sm btn-danger" onClick={() => { API.delete('streams', stream.id); triggerSFX('削除'); }}>Cancel</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activePage === 'subagents' && (
            <div>
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
            <ContentSchedulerView api={API} />
          )}

          {activePage === 'blog' && (
            <BlogVoiceView api={API} />
          )}

          {activePage === 'inventory' && (
            <div className="inventory-container">
              <div className="card" style={{marginBottom:'20px'}}>
                <div className="card-header">
                  <span className="card-title">Merchandise Inventory</span>
                  <span className="card-icon">📦</span>
                </div>
                
                {inventory.items && inventory.items.filter(i => i.name && i.name !== ':---').length > 0 ? (
                  <div className="inventory-table" style={{padding:'0 20px 20px'}}>
                    <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.85rem'}}>
                      <thead>
                        <tr style={{borderBottom:'2px solid var(--ink)', textAlign:'left'}}>
                          <th style={{padding:'10px'}}>Item</th>
                          <th style={{padding:'10px'}}>Variant</th>
                          <th style={{padding:'10px'}}>Stock</th>
                          <th style={{padding:'10px'}}>Price</th>
                          <th style={{padding:'10px'}}>Status</th>
                          <th style={{padding:'10px'}}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.items.filter(i => i.name && i.name !== ':---').map((item, i) => (
                          <tr key={i} style={{borderBottom:'1px solid var(--grey-300)'}}>
                            <td style={{padding:'10px', fontWeight:'600'}}>{item.name}</td>
                            <td style={{padding:'10px'}}>{item.variant}</td>
                            <td style={{padding:'10px'}}>{item.stock}</td>
                            <td style={{padding:'10px'}}>{item.price}</td>
                            <td style={{padding:'10px'}}>
                              <span className="tag" style={{
                                background: item.status.includes('🟢') ? '#22c55e' : 
                                          item.status.includes('🟡') ? '#eab308' :
                                          item.status.includes('🔴') ? '#ef4444' :
                                          item.status.includes('⚪') ? '#9ca3af' : 'var(--grey-300)'
                              }}>{item.status}</span>
                            </td>
                            <td style={{padding:'10px', fontSize:'0.75rem', color:'var(--grey-500)'}}>{item.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{padding:'40px', textAlign:'center', opacity:0.6}}>
                    <div style={{fontSize:'2rem', marginBottom:'10px'}}>📦</div>
                    <div>No inventory items found.</div>
                    <div style={{fontSize:'0.8rem', marginTop:'10px'}}>Add items to INVENTORY.md to see them here.</div>
                  </div>
                )}
              </div>

              {/* Pending Count Tasks */}
              {inventory.raw && inventory.raw.includes('Pending Count') && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Pending Actions</span>
                    <span className="card-icon">⚡</span>
                  </div>
                  <div style={{padding:'0 20px 20px'}}>
                    {inventory.raw.split('\n').filter(line => line.includes('- [ ]')).map((task, i) => (
                      <div key={i} className="task-item" style={{padding:'8px 0'}}>
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
            <div className="journal-container">
              {journal.length > 0 ? (
                journal.map((entry, i) => (
                  <div key={i} className="card" style={{marginBottom:'20px'}}>
                    <div className="card-header">
                      <span className="card-title">{entry.date}</span>
                      <span className="card-icon">📓</span>
                    </div>
                    <div className="card-body" style={{whiteSpace:'pre-wrap', fontSize:'0.9rem', lineHeight:'1.6'}}>
                      {entry.content}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{padding:'40px', textAlign:'center', opacity:0.6}}>
                  <div style={{fontSize:'2rem', marginBottom:'10px'}}>📓</div>
                  <div>No journal entries yet.</div>
                  <div style={{fontSize:'0.8rem', marginTop:'10px'}}>Entries will be auto-generated daily at 3:00 AM.</div>
                </div>
              )}
            </div>
          )}

          {activePage === 'cortex' && <CortexView />}
          {activePage === 'subagents' && <RoundTableView />}

        </section>
      </main>

      {/* ═══ MODALS ═══ */}
      {activeModal === 'quickAdd' && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header"><span className="modal-title">Quick Add</span><button className="modal-close" onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="grid-3" style={{padding:'20px'}}>
              {['Task', 'Finance', 'Stream', 'Habit', 'Note'].map(type => (
                <div key={type} className="card" style={{textAlign:'center',cursor:'pointer'}} onClick={() => setActiveModal(`new${type}`)}>
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
              <textarea className="form-input" id="noteContent" placeholder="Content..." style={{height:'100px'}}></textarea>
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
              <textarea className="form-input" id="streamDesc" placeholder="Stream Description / Agenda..." style={{height:'60px'}}></textarea>
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
              <textarea className="form-input" id="editStreamDesc" placeholder="Stream Description / Agenda..." style={{height:'60px'}}></textarea>
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