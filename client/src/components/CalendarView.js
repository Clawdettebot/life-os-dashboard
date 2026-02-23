import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, Plus, X, Check, Edit2, Trash2, RefreshCw,
  ExternalLink, Cloud, HardDrive, AlertCircle
} from 'lucide-react';

const eventTypeColors = {
  work: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  personal: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  meeting: { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
  deadline: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  reminder: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  event: { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' }
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
    <div className="calendar-view">
      {/* Header with Google Calendar Status */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px 20px',
        background: 'var(--white)',
        border: 'var(--border-thick)',
        boxShadow: 'var(--shadow-manga)',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button className="btn btn-sm" onClick={() => navigateDate(-1)}>
              <ChevronLeft size={18} />
            </button>
            <button className="btn btn-sm" onClick={goToToday}>Today</button>
            <button className="btn btn-sm" onClick={() => navigateDate(1)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Google Calendar Status */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '6px 12px',
            background: googleConnected ? '#dcfce7' : '#f3f4f6',
            border: `2px solid ${googleConnected ? '#22c55e' : '#d1d5db'}`,
            borderRadius: '6px',
            fontSize: '0.85rem'
          }}>
            <Cloud size={14} color={googleConnected ? '#22c55e' : '#9ca3af'} />
            <span style={{ color: googleConnected ? '#166534' : '#6b7280' }}>
              {googleConnected ? 'Google Sync On' : 'Google Sync Off'}
            </span>
          </div>
          
          {googleConnected && (
            <>
              {/* Calendar Selector */}
              <select 
                value={selectedCalendar}
                onChange={(e) => setSelectedCalendar(e.target.value)}
                style={{
                  padding: '6px 10px',
                  border: 'var(--border-thin)',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}
              >
                <option value="primary">Primary Calendar</option>
                {calendars.filter(c => c.id !== 'primary').map(cal => (
                  <option key={cal.id} value={cal.id}>{cal.summary}</option>
                ))}
              </select>
              
              {/* Sync Button */}
              <button 
                className="btn btn-sm"
                onClick={syncAllToGoogle}
                disabled={syncStatus === 'syncing'}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  background: syncStatus === 'success' ? '#dcfce7' : 
                            syncStatus === 'error' ? '#fee2e2' : undefined
                }}
              >
                <RefreshCw size={14} className={syncStatus === 'syncing' ? 'spin' : ''} />
                {syncStatus === 'syncing' ? 'Syncing...' : 
                 syncStatus === 'success' ? 'Synced!' :
                 syncStatus === 'error' ? 'Failed' : 'Sync All'}
              </button>
            </>
          )}
          
          <div className="view-toggle">
            {['month', 'week', 'day'].map(mode => (
              <button 
                key={mode}
                className={`view-toggle-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Event Source Legend */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '15px',
        padding: '0 10px',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HardDrive size={14} color="#3b82f6" />
          <span>Local ({localCount})</span>
        </div>
        {googleConnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cloud size={14} color="#22c55e" />
            <span>Google ({googleCount})</span>
          </div>
        )}
        {isLoading && (
          <div style={{ marginLeft: 'auto', color: '#6b7280' }}>
            Loading...
          </div>
        )}
      </div>

      {viewMode === 'month' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          background: 'var(--grey-200)',
          border: 'var(--border-thick)'
        }}>
          {weekDays.map(day => (
            <div key={day} style={{ 
              padding: '10px', 
              textAlign: 'center',
              background: 'var(--grey-100)',
              fontWeight: '600',
              fontSize: '0.8rem'
            }}>{day}</div>
          ))}
          
          {getDaysInMonth().map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDate(date);
            
            return (
              <div 
                key={index}
                style={{ 
                  minHeight: '120px',
                  padding: '8px',
                  background: isToday ? '#fff7ed' : 'var(--white)',
                  opacity: isCurrentMonth ? 1 : 0.4,
                  cursor: 'pointer'
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, date)}
                onClick={() => {
                  setSelectedDate(date);
                  setShowAddModal(true);
                }}
              >
                <div style={{ 
                  fontWeight: isToday ? '700' : '400',
                  color: isToday ? 'var(--accent)' : 'inherit',
                  marginBottom: '5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  {date.getDate()}
                </div>
                
                {dayEvents.slice(0, 3).map(event => {
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
                      style={{
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        background: colors.bg,
                        borderLeft: `3px solid ${isGoogle ? '#22c55e' : colors.border}`,
                        borderRadius: '3px',
                        cursor: isGoogle ? 'default' : 'grab',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '2px',
                        opacity: isGoogle ? 0.9 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: colors.text
                      }}
                    >
                      {isGoogle && <Cloud size={8} color="#22c55e" />}
                      {event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--grey-500)' }}>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - date.getDay() + i);
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div key={i} style={{
                background: 'var(--white)',
                border: isToday ? '2px solid var(--accent)' : 'var(--border-thin)',
                borderRadius: '8px',
                padding: '10px',
                minHeight: '300px'
              }}>
                <div style={{ 
                  textAlign: 'center', 
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--grey-200)',
                  marginBottom: '10px',
                  fontWeight: isToday ? '700' : '500'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)' }}>{weekDays[i]}</div>
                  <div style={{ fontSize: '1.2rem', color: isToday ? 'var(--accent)' : 'inherit' }}>
                    {date.getDate()}
                  </div>
                </div>
                
                {dayEvents.map(event => {
                  const colors = eventTypeColors[event.type] || eventTypeColors.event;
                  const isGoogle = event.source === 'google';
                  return (
                    <div 
                      key={event.id}
                      draggable={!isGoogle}
                      onDragStart={() => handleDragStart(event)}
                      onClick={() => setEditingEvent(event)}
                      style={{
                        padding: '8px',
                        marginBottom: '8px',
                        background: colors.bg,
                        border: `1px solid ${isGoogle ? '#22c55e' : colors.border}`,
                        borderRadius: '6px',
                        cursor: isGoogle ? 'pointer' : 'grab',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ 
                        fontWeight: '600', 
                        color: colors.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isGoogle && <Cloud size={10} color="#22c55e" />}
                        {event.title}
                      </div>
                      {event.start && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--grey-500)', marginTop: '4px' }}>
                          <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                          {formatTime(event.start)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'day' && (
        <div style={{ 
          background: 'var(--white)',
          border: 'var(--border-thick)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ marginBottom: '20px' }}>
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </h3>
          
          {getEventsForDate(currentDate).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--grey-500)' }}>
              No events for this day
            </div>
          ) : (
            getEventsForDate(currentDate).map(event => {
              const colors = eventTypeColors[event.type] || eventTypeColors.event;
              const isGoogle = event.source === 'google';
              return (
                <div 
                  key={event.id}
                  onClick={() => setEditingEvent(event)}
                  style={{
                    padding: '15px',
                    background: colors.bg,
                    border: `2px solid ${isGoogle ? '#22c55e' : colors.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ 
                    fontWeight: '700', 
                    color: colors.text, 
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {isGoogle ? <Cloud size={16} color="#22c55e" /> : <HardDrive size={16} color="#3b82f6" />}
                    {event.title}
                  </div>
                  {event.description && (
                    <div style={{ color: colors.text, opacity: 0.8, marginTop: '5px' }}>
                      {event.description}
                    </div>
                  )}
                  {event.start && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--grey-500)', marginTop: '8px' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '5px' }} />
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                  )}
                  {event.htmlLink && (
                    <a 
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '8px',
                        fontSize: '0.8rem',
                        color: '#3b82f6'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                      Open in Google Calendar
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="modal-overlay active" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Event - {selectedDate?.toLocaleDateString()}</span>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <input 
                className="form-input"
                placeholder="Event title"
                value={newEvent.title}
                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                style={{ marginBottom: '10px' }}
              />
              <select 
                className="form-select"
                value={newEvent.type}
                onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                style={{ marginBottom: '10px' }}
              >
                {Object.keys(eventTypeColors).map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input 
                  className="form-input"
                  type="time"
                  value={newEvent.startTime}
                  onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
                />
                <input 
                  className="form-input"
                  type="time"
                  value={newEvent.endTime}
                  onChange={e => setNewEvent({...newEvent, endTime: e.target.value})}
                />
              </div>
              <input 
                className="form-input"
                placeholder="Location (optional)"
                value={newEvent.location}
                onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                style={{ marginBottom: '10px' }}
              />
              <textarea 
                className="form-input"
                placeholder="Description"
                value={newEvent.description}
                onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                style={{ minHeight: '80px', marginBottom: '10px' }}
              />
              {googleConnected && (
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}>
                  <input 
                    type="checkbox" 
                    checked={newEvent.syncToGoogle}
                    onChange={e => setNewEvent({...newEvent, syncToGoogle: e.target.checked})}
                  />
                  <Cloud size={14} />
                  Sync to Google Calendar
                </label>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateEvent}>
                <Plus size={14} style={{ marginRight: '5px' }} />
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="modal-overlay active" onClick={() => setEditingEvent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {editingEvent.source === 'google' ? 
                  <><Cloud size={16} style={{ marginRight: '6px' }} /> Google Event</> : 
                  'Edit Event'
                }
              </span>
              <button className="modal-close" onClick={() => setEditingEvent(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {editingEvent.source === 'google' ? (
                <div style={{ padding: '20px 0' }}>
                  <h4>{editingEvent.title}</h4>
                  <p style={{ color: 'var(--grey-500)', marginTop: '10px' }}>
                    {editingEvent.description}
                  </p>
                  <div style={{ marginTop: '15px' }}>
                    <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
                    {formatTime(editingEvent.start)} - {formatTime(editingEvent.end)}
                  </div>
                  <div style={{ marginTop: '20px', padding: '15px', background: '#fef3c7', borderRadius: '6px' }}>
                    <AlertCircle size={16} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                    This event is managed in Google Calendar. 
                    {editingEvent.htmlLink && (
                      <a 
                        href={editingEvent.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#3b82f6', marginLeft: '5px' }}
                      >
                        Open in Google Calendar →
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <input 
                    className="form-input"
                    value={editingEvent.title}
                    onChange={e => setEditingEvent({...editingEvent, title: e.target.value})}
                    style={{ marginBottom: '10px' }}
                  />
                  <select 
                    className="form-select"
                    value={editingEvent.type}
                    onChange={e => setEditingEvent({...editingEvent, type: e.target.value})}
                    style={{ marginBottom: '10px' }}
                  >
                    {Object.keys(eventTypeColors).map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                  <textarea 
                    className="form-input"
                    value={editingEvent.description || ''}
                    onChange={e => setEditingEvent({...editingEvent, description: e.target.value})}
                    style={{ minHeight: '80px' }}
                  />
                  {editingEvent.googleEventId && (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '10px', 
                      background: '#dcfce7', 
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Check size={14} color="#22c55e" />
                      Synced to Google Calendar
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              {editingEvent.source !== 'google' && (
                <button className="btn btn-danger" onClick={() => handleDeleteEvent(editingEvent.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              )}
              <button className="btn" onClick={() => setEditingEvent(null)}>Close</button>
              {editingEvent.source !== 'google' && (
                <button className="btn btn-primary" onClick={handleUpdateEvent}>Save</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
