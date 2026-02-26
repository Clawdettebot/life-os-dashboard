import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, Plus, X, Check, Edit2, Trash2, RefreshCw,
  ExternalLink, Cloud, HardDrive, AlertCircle, Info, MapPin
} from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassPill } from './ui/GlassPill';
import AnimatedIcon from './AnimatedIcon';

const eventTypeColors = {
  work: { bg: '#3b82f6', border: '#1d4ed8', text: '#dbeafe', glow: 'rgba(59, 130, 246, 0.4)' },
  personal: { bg: '#10b981', border: '#047857', text: '#d1fae5', glow: 'rgba(16, 185, 129, 0.4)' },
  meeting: { bg: '#8b5cf6', border: '#6d28d9', text: '#ede9fe', glow: 'rgba(139, 92, 246, 0.4)' },
  deadline: { bg: '#ef4444', border: '#b91c1c', text: '#fee2e2', glow: 'rgba(239, 68, 68, 0.4)' },
  reminder: { bg: '#f59e0b', border: '#b45309', text: '#fef3c7', glow: 'rgba(245, 158, 11, 0.4)' },
  event: { bg: '#6366f1', border: '#4338ca', text: '#e0e7ff', glow: 'rgba(99, 102, 241, 0.4)' }
};

export default function CalendarView({ events = [], api, googleConnected = false }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [editingEvent, setEditingEvent] = useState(null);
  const [draggingEvent, setDraggingEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [mergedEvents, setMergedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState('primary');

  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'event',
    startTime: '',
    endTime: '',
    description: '',
    location: '',
    syncToGoogle: true
  });

  // Fetch merged events when date changes or Google connection status changes
  useEffect(() => {
    fetchMergedEvents();
  }, [currentDate, viewMode, googleConnected, selectedCalendar]);

  const fetchMergedEvents = async () => {
    setIsLoading(true);
    try {
      // Calculate date range based on current view
      const { start, end } = getDateRange();

      // Fetch merged events from API
      const res = await fetch(`/api/calendar/merged?start=${start}&end=${end}&calendarId=${selectedCalendar}`);
      const data = await res.json();

      if (data.events) {
        setMergedEvents(data.events);
      }
    } catch (e) {
      console.error('Failed to fetch merged events:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendars = async () => {
    if (!googleConnected) return;
    try {
      const res = await fetch('/api/google-calendar/calendars');
      const data = await res.json();
      if (data.calendars) {
        setCalendars(data.calendars);
      }
    } catch (e) {
      console.error('Failed to fetch calendars:', e);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, [googleConnected]);

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - end.getDay() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    return { start: start.getTime(), end: end.getTime() };
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getEventsForDate = (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return mergedEvents.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end || event.start);
      return eventStart <= endOfDay && eventEnd >= startOfDay;
    });
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !selectedDate) return;

    const startDateTime = new Date(selectedDate);
    const endDateTime = new Date(selectedDate);

    if (newEvent.startTime) {
      const [hours, minutes] = newEvent.startTime.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes));
    }
    if (newEvent.endTime) {
      const [hours, minutes] = newEvent.endTime.split(':');
      endDateTime.setHours(parseInt(hours), parseInt(minutes));
    } else {
      endDateTime.setHours(startDateTime.getHours() + 1);
    }

    const eventData = {
      title: newEvent.title,
      description: newEvent.description,
      start: startDateTime.getTime(),
      end: endDateTime.getTime(),
      type: newEvent.type,
      location: newEvent.location,
      calendarId: selectedCalendar,
      syncToGoogle: newEvent.syncToGoogle
    };

    await api.create('calendar', eventData);
    setShowAddModal(false);
    setNewEvent({
      title: '', type: 'event', startTime: '', endTime: '',
      description: '', location: '', syncToGoogle: true
    });
    fetchMergedEvents();
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !editingEvent.title.trim()) return;
    await api.update('calendar', editingEvent.id, editingEvent);
    setEditingEvent(null);
    fetchMergedEvents();
  };

  const handleDeleteEvent = async (id) => {
    await api.delete('calendar', id);
    setEditingEvent(null);
    fetchMergedEvents();
  };

  const syncAllToGoogle = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/calendar/sync-all-to-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId: selectedCalendar })
      });
      const data = await res.json();
      setSyncStatus('success');
      fetchMergedEvents();
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleDragStart = (event) => {
    if (event.source === 'google') return; // Can't drag Google events
    setDraggingEvent(event);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, date) => {
    e.preventDefault();
    if (!draggingEvent) return;

    const updatedEvent = {
      ...draggingEvent,
      start: date.getTime(),
      end: date.getTime() + (draggingEvent.end - draggingEvent.start)
    };

    await api.update('calendar', draggingEvent.id, updatedEvent);
    setDraggingEvent(null);
    fetchMergedEvents();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate event source counts
  const localCount = mergedEvents.filter(e => e.source === 'local').length;
  const googleCount = mergedEvents.filter(e => e.source === 'google').length;

  return (
    <div className="space-y-8 animate-in-fade-slide relative z-10">
      {/* Header with Google Calendar Status */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-white font-premium tracking-tight">
              {monthNames[currentDate.getMonth()]} <span className="text-amber-500/80">{currentDate.getFullYear()}</span>
            </h1>
            <div className="flex gap-2">
              <button
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                onClick={() => navigateDate(-1)}
              >
                <ChevronLeft size={16} />
              </button>
              <GlassPill
                className="!text-[10px] !px-3 font-black uppercase tracking-widest h-8 flex items-center"
                onClick={goToToday}
              >
                Temporal Present
              </GlassPill>
              <button
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                onClick={() => navigateDate(1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Master Schedule & Temporal Alignment</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 self-stretch lg:self-auto">
          {/* Google Calendar Status */}
          <div className={`
            flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all duration-500
            ${googleConnected ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-gray-500'}
          `}>
            <Cloud size={14} className={googleConnected ? 'animate-pulse' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {googleConnected ? 'Sync Matrix Active' : 'Offline Mode'}
            </span>
          </div>

          {googleConnected && (
            <>
              <div className="relative">
                <select
                  value={selectedCalendar}
                  onChange={(e) => setSelectedCalendar(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest outline-none appearance-none hover:bg-white/10 transition-all cursor-pointer pr-10"
                >
                  <option value="primary">Main Matrix</option>
                  {calendars.filter(c => c.id !== 'primary').map(cal => (
                    <option key={cal.id} value={cal.id}>{cal.summary}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronRight size={12} className="rotate-90" />
                </div>
              </div>

              <GlassPill
                variant={syncStatus === 'syncing' ? 'primary' : 'default'}
                onClick={syncAllToGoogle}
                disabled={syncStatus === 'syncing'}
                className="!px-4 !py-2"
              >
                <RefreshCw size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                <span className="uppercase tracking-widest text-[9px] font-black">
                  {syncStatus === 'syncing' ? 'Syncing...' :
                    syncStatus === 'success' ? 'Synchronized' :
                      syncStatus === 'error' ? 'Sync Failed' : 'Pulse Sync'}
                </span>
              </GlassPill>
            </>
          )}

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 ml-auto lg:ml-0">
            {['month', 'week', 'day'].map(mode => (
              <button
                key={mode}
                className={`
                  px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all
                  ${viewMode === mode ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-gray-500 hover:text-white'}
                `}
                onClick={() => setViewMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event Source Legend & Info */}
      <WidgetCard className="p-4 flex flex-wrap items-center justify-between gap-6 overflow-hidden">
        <div className="flex gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local Matrix</span>
            <span className="text-[10px] font-mono text-white bg-white/5 px-2 py-0.5 rounded-full">{localCount}</span>
          </div>
          {googleConnected && (
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Google Cloud</span>
              <span className="text-[10px] font-mono text-white bg-white/5 px-2 py-0.5 rounded-full">{googleCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {isLoading && (
            <div className="flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin text-amber-500" />
              <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest animate-pulse">Scanning Frequencies...</span>
            </div>
          )}
          <GlassPill variant="primary" className="!px-4 !py-1.5" onClick={() => { setSelectedDate(new Date()); setShowAddModal(true); }}>
            <Plus size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Add Event</span>
          </GlassPill>
        </div>
      </WidgetCard>

      {/* Main Calendar Viewport */}
      <div className="relative">
        {viewMode === 'month' && (
          <WidgetCard className="overflow-hidden border-white/5 shadow-2xl">
            <div className="grid grid-cols-7 border-b border-white/5">
              {weekDays.map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] bg-white/[0.02]">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-[1px] bg-white/5">
              {getDaysInMonth().map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const dayEvents = getEventsForDate(date);

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[140px] p-2 bg-[#0a0a0b] transition-all duration-300 relative group/cell
                      ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                      ${isToday ? 'bg-amber-500/5' : ''}
                      hover:bg-white/[0.02] cursor-pointer
                    `}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date)}
                    onClick={() => {
                      setSelectedDate(date);
                      setShowAddModal(true);
                    }}
                  >
                    {isToday && (
                      <div className="absolute inset-0 border-t-2 border-amber-500/30 glow-amber-sm pointer-events-none"></div>
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <span className={`
                        text-xs font-bold font-mono tracking-tighter w-7 h-7 flex items-center justify-center rounded-full transition-all
                        ${isToday ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-gray-500 group-hover/cell:text-gray-300'}
                      `}>
                        {date.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 4).map(event => {
                        const colors = eventTypeColors[event.type] || eventTypeColors.event;
                        const isGoogle = event.source === 'google';
                        return (
                          <div
                            key={event.id}
                            draggable={!isGoogle}
                            onDragStart={() => handleDragStart(event)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent(event);
                            }}
                            className={`
                              px-2 py-1 text-[9px] font-bold tracking-tight rounded-md flex items-center gap-1.5 truncate border transition-all
                              ${isGoogle ? 'border-green-500/20 bg-green-500/5 text-green-300' : 'border-white/5 bg-white/5 text-gray-300'}
                              hover:translate-x-1 active:scale-95 cursor-pointer
                            `}
                            style={{
                              borderLeftColor: isGoogle ? '#22c55e' : colors.bg,
                              borderLeftWidth: '3px'
                            }}
                          >
                            {isGoogle ? <Cloud size={8} /> : <div className="w-1 h-1 rounded-full bg-current"></div>}
                            <span className="truncate">{event.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 4 && (
                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest px-2 py-1">
                          + {dayEvents.length - 4} more signals
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </WidgetCard>
        )}

        {viewMode === 'week' && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date(currentDate);
              date.setDate(date.getDate() - date.getDay() + i);
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <WidgetCard key={i} className={`flex flex-col min-h-[500px] border-white/5 ${isToday ? 'border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.05)]' : ''}`}>
                  <div className={`
                    p-4 flex flex-col items-center gap-1 border-b border-white/5
                    ${isToday ? 'bg-amber-500/5' : 'bg-white/[0.02]'}
                  `}>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">{weekDays[i]}</span>
                    <span className={`
                      text-2xl font-black font-premium tracking-tighter
                      ${isToday ? 'text-amber-500' : 'text-white/80'}
                    `}>{date.getDate()}</span>
                  </div>

                  <div className="p-3 space-y-3 flex-1 overflow-y-auto glass-scroll">
                    {dayEvents.map(event => {
                      const colors = eventTypeColors[event.type] || eventTypeColors.event;
                      const isGoogle = event.source === 'google';
                      return (
                        <div
                          key={event.id}
                          draggable={!isGoogle}
                          onDragStart={() => handleDragStart(event)}
                          onClick={() => setEditingEvent(event)}
                          className={`
                            p-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer group/ev
                          `}
                          style={{ borderLeft: `3px solid ${isGoogle ? '#22c55e' : colors.bg}` }}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            {isGoogle && <Cloud size={10} className="text-green-500" />}
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: isGoogle ? '#4ade80' : colors.bg }}>
                              {event.type}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white mb-2 leading-snug group-hover/ev:text-amber-500 transition-colors">
                            {event.title}
                          </div>
                          {event.start && (
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-500 uppercase tracking-tighter">
                              <Clock size={10} className="opacity-60" />
                              {formatTime(event.start)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </WidgetCard>
              );
            })}
          </div>
        )}

        {viewMode === 'day' && (
          <WidgetCard className="max-w-4xl mx-auto overflow-hidden">
            <div className="p-8 bg-white/[0.02] border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-white font-premium tracking-tight mb-1">
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">
                  {currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <GlassPill variant="primary" className="!px-6 !py-3" onClick={() => { setSelectedDate(currentDate); setShowAddModal(true); }}>
                <Plus size={16} /> <span className="uppercase tracking-widest text-[10px] font-black">Initialize Entry</span>
              </GlassPill>
            </div>

            <div className="p-8 space-y-4">
              {getEventsForDate(currentDate).length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center opacity-30">
                  <div className="w-16 h-16 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-6">
                    <CalendarIcon size={32} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em]">No temporal markers identified</p>
                </div>
              ) : (
                getEventsForDate(currentDate).map(event => {
                  const colors = eventTypeColors[event.type] || eventTypeColors.event;
                  const isGoogle = event.source === 'google';
                  return (
                    <div
                      key={event.id}
                      onClick={() => setEditingEvent(event)}
                      className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: isGoogle ? '#22c55e' : colors.bg }}></div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors`}
                            style={{ borderColor: `${isGoogle ? '#22c55e' : colors.bg}30`, color: isGoogle ? '#4ade80' : colors.bg, backgroundColor: `${isGoogle ? '#22c55e' : colors.bg}10` }}>
                            {event.type}
                          </div>
                          {isGoogle && <div className="flex items-center gap-1.5 text-[9px] font-bold text-green-500 uppercase tracking-widest"><Cloud size={10} /> Cloud Link</div>}
                        </div>

                        <h4 className="text-xl font-bold text-white font-premium tracking-tight mb-3 group-hover:text-amber-500 transition-colors">
                          {event.title}
                        </h4>

                        {event.description && (
                          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl italic mb-4">
                            "{event.description}"
                          </p>
                        )}

                        <div className="flex flex-wrap gap-6 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-amber-500/60" />
                            {formatTime(event.start)} — {formatTime(event.end)}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin size={12} className="text-blue-500/60" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0">
                        {event.htmlLink && (
                          <GlassPill
                            className="!px-3 !py-1.5"
                            onClick={(e) => { e.stopPropagation(); window.open(event.htmlLink, '_blank'); }}
                          >
                            <ExternalLink size={14} />
                          </GlassPill>
                        )}
                        {!isGoogle && (
                          <GlassPill className="!px-3 !py-1.5" onClick={(e) => { e.stopPropagation(); setEditingEvent(event); }}>
                            <Edit2 size={14} />
                          </GlassPill>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </WidgetCard>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in-fade">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <WidgetCard className="relative w-full max-w-lg overflow-visible animate-in-slide-up">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white font-premium tracking-tight uppercase tracking-widest">Temporal Entry</h3>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{selectedDate?.toLocaleDateString()}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Operation Designation</label>
                <input
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-gray-600"
                  placeholder="Designate event title..."
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Frequency Group</label>
                  <select
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold appearance-none cursor-pointer"
                    value={newEvent.type}
                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                  >
                    {Object.keys(eventTypeColors).map(type => (
                      <option key={type} value={type} className="bg-[#0a0a0b]">{type.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Primary Calendar</label>
                  <select
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold appearance-none cursor-pointer"
                    value={selectedCalendar}
                    onChange={(e) => setSelectedCalendar(e.target.value)}
                  >
                    <option value="primary" className="bg-[#0a0a0b]">PRIMARY MATRIX</option>
                    {calendars.filter(c => c.id !== 'primary').map(cal => (
                      <option key={cal.id} value={cal.id} className="bg-[#0a0a0b]">{cal.summary.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Temporal Start</label>
                  <input
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-mono"
                    type="time"
                    value={newEvent.startTime}
                    onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Temporal End</label>
                  <input
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-mono"
                    type="time"
                    value={newEvent.endTime}
                    onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Operational Area</label>
                <input
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-gray-600"
                  placeholder="Location (optional)"
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mission Details</label>
                <textarea
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-medium placeholder:text-gray-600 min-h-[100px] resize-none"
                  placeholder="Detailed description..."
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>

              {googleConnected && (
                <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/10 rounded-xl group cursor-pointer" onClick={() => setNewEvent({ ...newEvent, syncToGoogle: !newEvent.syncToGoogle })}>
                  <div className={`w-10 h-6 rounded-full transition-all relative ${newEvent.syncToGoogle ? 'bg-green-500' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${newEvent.syncToGoogle ? 'left-5' : 'left-1'}`}></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Cloud Matrix Synchronization</span>
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Propagate entry to Google Calendar</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-white/[0.01] border-t border-white/5 flex gap-3">
              <GlassPill className="flex-1 !py-4" onClick={() => setShowAddModal(false)}>
                <span className="text-[10px] font-black uppercase tracking-widest">Abort Process</span>
              </GlassPill>
              <GlassPill variant="primary" className="flex-2 !py-4 !px-10" onClick={handleCreateEvent}>
                <Plus size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Commit to Matrix</span>
              </GlassPill>
            </div>
          </WidgetCard>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in-fade">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingEvent(null)}></div>
          <WidgetCard className="relative w-full max-w-lg overflow-visible animate-in-slide-up">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {editingEvent.source === 'google' ? <Cloud size={20} className="text-green-500" /> : <Edit2 size={20} className="text-amber-500" />}
                <div>
                  <h3 className="text-xl font-black text-white font-premium tracking-tight uppercase tracking-widest">
                    {editingEvent.source === 'google' ? 'Protocol Locked' : 'Update Vector'}
                  </h3>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Signal Modification Mode</p>
                </div>
              </div>
              <button onClick={() => setEditingEvent(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {editingEvent.source === 'google' ? (
                <div className="space-y-6">
                  <WidgetCard className="p-6 bg-white/[0.02]">
                    <h4 className="text-lg font-bold text-white mb-2">{editingEvent.title}</h4>
                    <p className="text-sm text-gray-400 italic mb-4">"{editingEvent.description || 'No description provided'}"</p>
                    <div className="flex flex-wrap gap-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                      <div className="flex items-center gap-2"><Clock size={12} className="text-amber-500/60" /> {formatTime(editingEvent.start)} - {formatTime(editingEvent.end)}</div>
                    </div>
                  </WidgetCard>

                  <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-4">
                    <AlertCircle size={24} className="text-amber-500 shrink-0" />
                    <div>
                      <h5 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">External Control Active</h5>
                      <p className="text-[10px] text-amber-500/70 font-bold leading-relaxed uppercase tracking-widest">
                        This entry is managed by an external cloud node. Local modifications are restricted.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Operation Designation</label>
                    <input
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold"
                      value={editingEvent.title}
                      onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Frequency Group</label>
                    <select
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold appearance-none cursor-pointer"
                      value={editingEvent.type}
                      onChange={e => setEditingEvent({ ...editingEvent, type: e.target.value })}
                    >
                      {Object.keys(eventTypeColors).map(type => (
                        <option key={type} value={type} className="bg-[#0a0a0b]">{type.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mission Details</label>
                    <textarea
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-medium min-h-[120px] resize-none"
                      value={editingEvent.description || ''}
                      onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-8 bg-white/[0.01] border-t border-white/5 flex flex-wrap gap-3">
              {editingEvent.source !== 'google' && (
                <button
                  className="flex-1 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-500 hover:text-white rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                >
                  <Trash2 size={16} /> Signal Terminate
                </button>
              )}

              <div className="flex gap-3 flex-[2]">
                <GlassPill className="flex-1 !py-4" onClick={() => setEditingEvent(null)}>
                  <span className="text-[10px] font-black uppercase tracking-widest">Close</span>
                </GlassPill>
                {editingEvent.source !== 'google' && (
                  <GlassPill variant="primary" className="flex-1 !py-4" onClick={handleUpdateEvent}>
                    <Check size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Update State</span>
                  </GlassPill>
                )}
              </div>
            </div>
          </WidgetCard>
        </div>
      )}
    </div>
  );
}
