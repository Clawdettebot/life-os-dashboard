import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Chart from 'chart.js/auto';
import './App.css';

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
  
  // Wallpaper State
  const [currentWallpaper, setCurrentWallpaper] = useState(0);
  const [showWallpaperSelector, setShowWallpaperSelector] = useState(false);
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
  
  // Mood State
  const [currentMood, setCurrentMood] = useState('working');
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const moods = [
    { id: 'working', label: 'Working', gif: '/emojis/working.gif' },
    { id: 'searching', label: 'Searching', gif: '/emojis/searching.gif' },
    { id: 'happy', label: 'Happy', gif: '/emojis/happy.gif' },
    { id: 'code', label: 'Coding', gif: '/emojis/code.gif' },
    { id: 'mistake', label: 'Oops', gif: '/emojis/mistake.gif' },
    { id: 'sleepy', label: 'Sleepy', gif: '/emojis/sleepy.gif' },
    { id: 'journal', label: 'Journaling', gif: '/emojis/journal.gif' },
    { id: 'confused', label: 'Confused', gif: '/emojis/confused.gif' },
    { id: 'finance', label: 'Finance', gif: '/emojis/finance.gif' },
    { id: 'focus', label: 'Focus', gif: '/emojis/focus.gif' }
  ];

  // Refs for Charts & Intervals
  const chartRefs = useRef({});
  const pomoInterval = useRef(null);

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
      triggerSFX('作成'); // Created
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
      triggerSFX('削除'); // Deleted
    },
    spawnSubagent: async (task, agentId) => {
      try {
        const res = await fetch('/api/subagents/spawn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, agentId })
        });
        const data = await res.json();
        triggerSFX('召喚'); // Summon
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
        triggerSFX('消滅'); // Vanish
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
    if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

    return () => {
      newSocket.close();
      if (pomoInterval.current) clearInterval(pomoInterval.current);
    };
  }, []);

  useEffect(() => {
    if (activePage === 'analytics' || activePage === 'finances') renderCharts();
  }, [activePage, finances, tasks]);

  const fetchSubagents = async () => {
    try {
      const res = await fetch('/api/subagents');
      const data = await res.json();
      // Parse the CLI output roughly or just store raw for now if simple
      // Ideally backend returns JSON, but it returns stdout string. 
      // Let's just store the string or try to parse if needed.
      // For now, let's assume raw string display is okay or basic parsing.
      setSubagents(data.subagents || "No active subagents."); 
    } catch (e) {}
  };

  const fetchAllData = async () => {
    try {
      const [
        tasksList, projectsList, financesList, habitsList,
        notesList, healthList, goalsList, scheduleList,
        calendarData, analyticsData, streamsData, inventoryData, journalData
      ] = await Promise.all([
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/projects/detailed').then(r => r.json()),
        API.get('finances'),
        API.get('habits'),
        API.get('notes'),
        API.get('health'),
        API.get('goals'),
        API.get('schedule'),
        fetch('/api/content/calendar').then(r => r.json()),
        fetch('/api/analytics').then(r => r.json()),
        fetch('/api/streams').then(r => r.json()),
        fetch('/api/inventory').then(r => r.json()),
        fetch('/api/journal').then(r => r.json())
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
      setAchievements(checkAchievements({ tasks: tasksList.all, projects: projectsList.projects, finances: financesList, notes: notesList }));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // ── ACTIONS ──
  const toggleTheme = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('lifeos-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('lifeos-theme', 'dark');
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
    </div>
  );

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Wallpaper Background */}
      <div 
        className="wallpaper-bg" 
        style={{backgroundImage: `url(${wallpapers[currentWallpaper]})`}}
      />
      <div className="wallpaper-overlay" />
      
      {/* Wallpaper Selector */}
      <div className="wallpaper-selector">
        <div 
          className="wallpaper-toggle"
          onClick={() => setShowWallpaperSelector(!showWallpaperSelector)}
          title="Change Wallpaper"
        >
          🖼️
        </div>
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
          🖼️
        </div>
      </div>
      
      <div id="sfxContainer" className="sfx-container"></div>
      
      {/* ═══ FOCUS OVERLAY ═══ */}
      <div className={`focus-overlay ${focusMode ? 'active' : ''}`}>
        <button className="focus-close" onClick={() => setFocusMode(false)}><i className="fas fa-times"></i> EXIT</button>
        
        {/* Mood Display in Focus Mode */}
        <div className="focus-mood" style={{position: 'absolute', top: '20px', left: '20px'}}>
          <div className="mood-display" onClick={() => setShowMoodSelector(!showMoodSelector)}>
            <img 
              src={moods.find(m => m.id === currentMood)?.gif || moods[0].gif} 
              alt={currentMood}
              className="mood-emoji"
            />
            <span className="mood-label">{moods.find(m => m.id === currentMood)?.label || 'Working'}</span>
          </div>
          {showMoodSelector && (
            <div className="mood-selector">
              {moods.map(mood => (
                <div 
                  key={mood.id} 
                  className="mood-option"
                  onClick={() => { setCurrentMood(mood.id); setShowMoodSelector(false); }}
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
        <div className="sidebar-header"><span className="logo-icon">墨</span><div className="logo">LIFE OS</div></div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Command</div>
            {['dashboard', 'tasks', 'projects'].map(p => (
              <div key={p} className={`nav-item ${activePage === p ? 'active' : ''}`} onClick={() => setActivePage(p)}>
                <span style={{textTransform:'capitalize'}}>{p}</span>
              </div>
            ))}
            <div className="nav-item" onClick={() => setFocusMode(true)}>Focus Mode</div>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Life</div>
            {['finances', 'calendar', 'streams', 'habits'].map(p => (
              <div key={p} className={`nav-item ${activePage === p ? 'active' : ''}`} onClick={() => setActivePage(p)}>
                <span style={{textTransform:'capitalize'}}>{p}</span>
              </div>
            ))}
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Tools</div>
            {['notes', 'subagents', 'pomodoro', 'analytics', 'inventory', 'journal'].map(p => (
              <div key={p} className={`nav-item ${activePage === p ? 'active' : ''}`} onClick={() => setActivePage(p)}>
                <span style={{textTransform:'capitalize'}}>{p}</span>
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="main-content">
        <div className="top-bar">
          <div className="top-bar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            
            {/* Mood Display replaces logo */}
            <div className="mood-display" onClick={() => setShowMoodSelector(!showMoodSelector)}>
              <img 
                src={moods.find(m => m.id === currentMood)?.gif || moods[0].gif} 
                alt={currentMood}
                className="mood-emoji"
              />
              <span className="mood-label">{moods.find(m => m.id === currentMood)?.label || 'Working'}</span>
            </div>
            {showMoodSelector && (
              <div className="mood-selector" style={{position: 'absolute', top: '60px', left: '60px'}}>
                {moods.map(mood => (
                  <div 
                    key={mood.id} 
                    className="mood-option"
                    onClick={() => { setCurrentMood(mood.id); setShowMoodSelector(false); }}
                  >
                    <img src={mood.gif} alt={mood.label} />
                    <span>{mood.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="top-bar-right">
            <button className="theme-toggle" onClick={toggleTheme}>◑</button>
            <button className="top-bar-btn" onClick={() => setActiveModal('quickAdd')}>+ ADD</button>
          </div>
        </div>

        <section className="page-section active">
          <div className="section-header">
            <h1 className="section-title" style={{textTransform:'capitalize'}}>{activePage}</h1>
          </div>

          {activePage === 'dashboard' && renderDashboard()}

          {activePage === 'tasks' && (
            <div className="task-list">
              {tasks.all.map((t, i) => (
                <div key={i} className="task-item" onClick={() => toggleTask(t)}>
                  <div className={`task-checkbox ${t.status === 'completed' ? 'checked' : ''}`}></div>
                  <div className="task-content">
                    <div className="task-title" style={{textDecoration: t.status === 'completed' ? 'line-through' : 'none'}}>{t.description || t.title}</div>
                    <span className="tag">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activePage === 'projects' && (
            <div className="grid-2">
              {projects.map((p, i) => (
                <div key={i} className="project-card">
                  <div className="project-name">{p.title}</div>
                  <div className="project-type">{p.status}</div>
                </div>
              ))}
            </div>
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
            <div>
              <div className="grid-3">
                <div className="stat-card"><div className="stat-label">Income</div><div className="stat-value">${finances.filter(f=>f.type==='income').reduce((s,f)=>s+Number(f.amount),0)}</div></div>
                <div className="stat-card"><div className="stat-label">Expenses</div><div className="stat-value">${finances.filter(f=>f.type==='expense').reduce((s,f)=>s+Number(f.amount),0)}</div></div>
              </div>
              <div className="card">
                <div className="chart-container"><canvas id="financeChart"></canvas></div>
              </div>
            </div>
          )}

          {activePage === 'habits' && (
             <div className="card">
               <div className="card-header">Habits</div>
               {habits.map((h, i) => <div key={i} className="task-item">{h.icon} {h.name}</div>)}
               <button className="btn" onClick={() => setActiveModal('newHabit')}>+ New Habit</button>
             </div>
          )}
          
           {activePage === 'calendar' && (
            <div className="calendar-container">
              {/* Unified Timeline View */}
              <div className="card" style={{marginBottom:'20px'}}>
                <div className="card-header">
                  <span className="card-title">Unified Timeline</span>
                  <span style={{fontSize:'0.75rem', color:'var(--grey-500)'}}>Content Calendar + Scheduled Streams</span>
                </div>

                {/* Streams Timeline */}
                {streams.filter(s => s.status === 'planned').length > 0 && (
                  <div className="timeline-section" style={{padding:'0 20px 20px'}}>
                    <div className="timeline-header" style={{fontSize:'0.7rem', letterSpacing:'2px', textTransform:'uppercase', color:'var(--accent)', marginBottom:'12px', fontWeight:'600'}}>
                      📡 Scheduled Streams
                    </div>
                    <div className="timeline-streams" style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                      {streams
                        .filter(s => s.status === 'planned')
                        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
                        .map((stream, i) => (
                        <div key={i} className="timeline-item stream-timeline-item" style={{
                          display:'flex',
                          alignItems:'center',
                          gap:'15px',
                          padding:'12px 16px',
                          border:'var(--border-thin)',
                          borderLeft:'3px solid var(--accent)',
                          background:'var(--white)'
                        }}>
                          <div className="timeline-date" style={{
                            fontFamily:'var(--font-mono)',
                            fontSize:'0.7rem',
                            minWidth:'90px',
                            color:'var(--grey-500)'
                          }}>
                            {new Date(stream.scheduledDate).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
                            <br/>
                            <span style={{color:'var(--accent)'}}>{stream.scheduledTime || 'TBD'}</span>
                          </div>
                          <div className="timeline-content" style={{flex:1}}>
                            <div style={{fontWeight:'600', fontSize:'0.9rem'}}>{stream.title}</div>
                            <div style={{fontSize:'0.75rem', color:'var(--grey-500)', marginTop:'2px'}}>
                              {stream.platform} {stream.guests && `• With: ${stream.guests}`}
                            </div>
                          </div>
                          <div className="timeline-badge" style={{
                            fontSize:'0.6rem',
                            padding:'4px 10px',
                            border:'var(--border-thin)',
                            textTransform:'uppercase',
                            letterSpacing:'1px'
                          }}>
                            LIVE
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Calendar */}
                {calendar ? (
                  <div style={{padding:'0 20px 20px'}}>
                    <div className="timeline-header" style={{fontSize:'0.7rem', letterSpacing:'2px', textTransform:'uppercase', color:'var(--ink)', marginBottom:'12px', fontWeight:'600', marginTop:'20px'}}>
                      📝 Content Calendar: {calendar.title}
                    </div>
                    {calendar.weeks.map((week, w) => (
                      <div key={w} style={{marginBottom:'20px'}}>
                        <div style={{fontSize:'0.75rem', color:'var(--grey-500)', marginBottom:'8px', fontFamily:'var(--font-mono)'}}>
                          Week {week.number} • {week.dateRange}
                        </div>
                        <div className="week-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'10px'}}>
                          {week.days.map((day, d) => {
                            // Check if there's a stream on this day
                            const dayDate = new Date(day.date + ', 2026'); // Adjust year as needed
                            const dayStreams = streams.filter(s => {
                              const streamDate = new Date(s.scheduledDate);
                              return streamDate.toDateString() === dayDate.toDateString() && s.status === 'planned';
                            });
                            return (
                              <div key={d} className={`calendar-day ${dayStreams.length > 0 ? 'has-stream' : ''}`} style={{
                                padding:'12px',
                                border:'var(--border-thin)',
                                background:'var(--white)',
                                minHeight:'100px'
                              }}>
                                <div className="day-header" style={{fontSize:'0.7rem', fontWeight:'600', marginBottom:'6px', color:'var(--grey-500)'}}>
                                  {day.dayOfWeek} {day.date}
                                </div>
                                <div className="day-content" style={{fontSize:'0.8rem'}}>
                                  <div style={{fontWeight:'600'}}>{day.content.Theme}</div>
                                  <div style={{fontSize:'0.75em', opacity:0.7, marginTop:'4px'}}>{day.content.Platform}</div>
                                </div>
                                {dayStreams.length > 0 && (
                                  <div className="stream-indicator" style={{
                                    marginTop:'8px',
                                    paddingTop:'6px',
                                    borderTop:'1px dashed var(--grey-200)',
                                    fontSize:'0.65rem',
                                    color:'var(--accent)'
                                  }}>
                                    📡 {dayStreams.length} Stream{dayStreams.length > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{padding:'20px', textAlign:'center', opacity:0.6}}>Loading Content Calendar...</div>
                )}
              </div>
            </div>
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
            <div className="card">
              <div className="card-header">Active Subagents</div>
              <div style={{whiteSpace:'pre-wrap', fontFamily:'monospace', background:'#111', padding:'10px', borderRadius:'4px'}}>
                {typeof subagents === 'string' ? subagents : JSON.stringify(subagents, null, 2)}
              </div>
              <div style={{marginTop:'20px'}}>
                <div className="card-title">Spawn New Agent</div>
                <div className="grid-2">
                  <input id="agentTask" className="form-input" placeholder="Task description..." />
                  <button className="btn btn-primary" onClick={() => {
                    const task = document.getElementById('agentTask').value;
                    if(task) API.spawnSubagent(task);
                  }}>Spawn Agent</button>
                </div>
              </div>
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
             <div className="grid-2">
               {notes.map((n, i) => (
                 <div key={i} className="card">
                   <div className="card-header">{n.title}</div>
                   <div className="card-body">{n.content}</div>
                 </div>
               ))}
               <button className="btn" style={{gridColumn:'1/-1'}} onClick={() => setActiveModal('newNote')}>+ New Note</button>
             </div>
          )}

          {activePage === 'inventory' && (
            <div className="inventory-container">
              <div className="card" style={{marginBottom:'20px'}}>
                <div className="card-header">
                  <span className="card-title">Merchandise Inventory</span>
                  <span className="card-icon">📦</span>
                </div>
                
                {inventory.items && inventory.items.length > 0 ? (
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
                        {inventory.items.map((item, i) => (
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