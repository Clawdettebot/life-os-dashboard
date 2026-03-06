import React, { useState, useEffect } from 'react';
import { Cloud, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import LobsterScrollArea from './ui/LobsterScrollArea';

const eventTypeColors = {
    work: { bg: '#3b82f6', border: '#1d4ed8', text: '#dbeafe' },
    personal: { bg: '#10b981', border: '#047857', text: '#d1fae5' },
    meeting: { bg: '#8b5cf6', border: '#6d28d9', text: '#ede9fe' },
    deadline: { bg: '#ef4444', border: '#b91c1c', text: '#fee2e2' },
    reminder: { bg: '#f59e0b', border: '#b45309', text: '#fef3c7' },
    event: { bg: '#6366f1', border: '#4338ca', text: '#e0e7ff' }
};

export default function DashboardCalendarWidget({ connected, onViewCalendar, api }) {
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUpcomingEvents();
    }, [connected]);

    const fetchUpcomingEvents = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(23, 59, 59, 999);

            // Fetch merged local + google events directly from the API endpoint utilized by the main Calendar view
            const res = await fetch(`/api/calendar/merged?start=${today.getTime()}&end=${nextWeek.getTime()}&calendarId=primary`);
            const data = await res.json();

            if (data && Array.isArray(data.events)) {
                // Sort chronologically and limit to 10
                const sorted = data.events.sort((a, b) => a.start - b.start).slice(0, 10);
                setUpcomingEvents(sorted);
            } else {
                setUpcomingEvents([]);
            }
        } catch (e) {
            console.error('Failed to fetch merged dashboard events:', e);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="h-full w-full rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-panel)] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                        <CalendarIcon size={18} className="opacity-80" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[var(--text-main)] font-space-grotesk tracking-tight">7-Day Horizon</h3>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-0.5">Local & Cloud Matrix</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${connected ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-[var(--bg-overlay)] border-[var(--border-color)] text-[var(--text-muted)]'}`}>
                        <Cloud size={12} className={connected ? 'animate-pulse' : ''} />
                        <span className="hidden sm:inline">{connected ? 'Cloud Active' : 'Offline'}</span>
                    </div>
                    <button
                        onClick={onViewCalendar}
                        className="px-4 py-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-overlay)] text-[var(--text-main)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--border-highlight)] transition-all active:scale-95"
                    >
                        Open Master
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-main)] opacity-50"></div>
                </div>
            ) : upcomingEvents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-40">
                    <div className="w-16 h-16 rounded-full border border-dashed border-[var(--border-color)] flex items-center justify-center mb-4">
                        <CalendarIcon size={24} />
                    </div>
                    <span className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-widest text-center">No temporal markers identified<br />in the next 7 days</span>
                </div>
            ) : (
                <LobsterScrollArea className="flex-1" contentClassName="p-4" size="small">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {upcomingEvents.map((event, i) => {
                            const colors = eventTypeColors[event.type] || eventTypeColors.event;
                            const isGoogle = event.source === 'google';
                            const eventDate = new Date(event.start);
                            const isToday = eventDate.toDateString() === new Date().toDateString();

                            return (
                                <div
                                    key={event.id || i}
                                    onClick={onViewCalendar}
                                    className={`
                    p-4 rounded-[1.5rem] border bg-[var(--bg-panel)] hover:bg-[var(--bg-overlay)]
                    cursor-pointer transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden
                    ${isToday ? 'border-[rgba(var(--rgb-accent-sec),0.3)] shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-[var(--border-color)]'}
                  `}
                                >
                                    <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: isGoogle ? '#22c55e' : colors.bg }}></div>

                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border" style={{ borderColor: `${isGoogle ? '#22c55e' : colors.bg}30`, color: isGoogle ? '#4ade80' : colors.bg, backgroundColor: `${isGoogle ? '#22c55e' : colors.bg}10` }}>
                                                {isToday ? 'TODAY' : eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </div>
                                            {isGoogle && <Cloud size={10} className="text-green-500" />}
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-bold text-[var(--text-main)] font-space-grotesk truncate mb-2 group-hover:text-[rgb(var(--rgb-accent-sec))] transition-colors">
                                        {event.title}
                                    </h4>

                                    <div className="flex flex-col gap-1.5 mt-auto">
                                        {event.start && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-tighter">
                                                <Clock size={10} className="text-[rgba(var(--rgb-accent-sec),0.6)]" />
                                                {formatTime(event.start)} {event.end ? `— ${formatTime(event.end)}` : ''}
                                            </div>
                                        )}
                                        {event.location && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-tighter truncate">
                                                <MapPin size={10} className="text-blue-500/60 shrink-0" />
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </LobsterScrollArea>
            )}
        </div>
    );
}
