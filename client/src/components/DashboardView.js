import React from 'react';
import { Zap, BarChart3, Radio, FileText, CheckCircle, Activity, Plus } from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassPill } from './ui/GlassPill';
import GoogleCalendarWidget from './GoogleCalendarWidget';

export default function DashboardView({
    tasks,
    projects,
    finances,
    habits,
    streams,
    toggleTask,
    setActivePage,
    setActiveModal,
    googleCalendarConnected
}) {
    const incomeTotal = finances.filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0);

    return (
        <div className="dashboard-container animate-in-fade-slide grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1600px] mx-auto">
            {/* PRIORITY TASKS - Left Column (Span 6) */}
            <WidgetCard className="lg:col-span-6 p-8 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden group">
                {/* Vintage speed-lines effect adaptation -> cinematic gradient sweep */}
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-[2px]"></div>

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-premium tracking-tight">Priority Tasks</h3>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 flex-1 overflow-y-auto glass-scroll pr-2 max-h-[320px]">
                    {tasks.active.length === 0 ? (
                        <div className="text-center p-8 text-gray-500 font-mono text-sm border border-dashed border-white/10 flex-1 rounded-2xl flex items-center justify-center">
                            No priority operations currently active.
                        </div>
                    ) : (
                        tasks.active.slice(0, 5).map((t, i) => (
                            <div key={i}
                                onClick={() => toggleTask(t)}
                                className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/20 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 h-full w-1 ${t.status === 'completed' ? 'bg-green-500' : 'bg-orange-500 opacity-50 group-hover:opacity-100'}`}></div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${t.status === 'completed' ? 'bg-green-500 border-green-400' : 'border-white/20 group-hover:border-orange-400'}`}>
                                    {t.status === 'completed' && <CheckCircle className="w-4 h-4 text-black" />}
                                </div>
                                <div className="flex-1">
                                    <div className={`font-bold transition-all ${t.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>
                                        {t.description || t.title}
                                    </div>
                                </div>
                                <div className="px-2.5 py-1 rounded bg-black/40 border border-white/10 text-[9px] font-mono tracking-widest uppercase text-gray-400">
                                    {t.priority || 'Medium'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </WidgetCard>

            {/* STATS - Right Column (Span 6, 2x2 grid) */}
            <WidgetCard className="lg:col-span-6 p-8 flex flex-col border-white/10 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-premium tracking-tight">Stats</h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-center hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                        <div className="text-4xl font-light tracking-tighter text-white font-premium group-hover:scale-110 transition-transform">{tasks.active.length}</div>
                        <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mt-2">Tasks</div>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-center hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                        <div className="text-4xl font-light tracking-tighter text-white font-premium group-hover:scale-110 transition-transform">{projects.length}</div>
                        <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mt-2">Projects</div>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-center hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                        <div className="text-3xl font-light tracking-tighter text-green-400 font-premium group-hover:scale-110 transition-transform">${incomeTotal.toLocaleString()}</div>
                        <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mt-2">Income</div>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-center hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                        <div className="text-4xl font-light tracking-tighter text-white font-premium group-hover:scale-110 transition-transform">{habits.length}</div>
                        <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mt-2">Habits</div>
                    </div>
                </div>
            </WidgetCard>

            {/* UPCOMING STREAMS PREVIEW - Span 12 */}
            <WidgetCard className="lg:col-span-12 p-8 border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.1)] overflow-hidden relative group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <Radio className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-bold text-white font-premium tracking-tight">Upcoming Streams</h3>
                    </div>
                    <GlassPill onClick={() => setActivePage('streams')} className="!py-1.5 !px-4 hover:!bg-cyan-500/20 hover:!text-cyan-400">View All</GlassPill>
                </div>

                <div className="flex gap-4 overflow-x-auto glass-scroll pb-2 relative z-10 snap-x">
                    {streams.filter(s => s.status === 'planned').length === 0 ? (
                        <div className="flex-1 p-6 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">No broadcasts planned.</span>
                            <button onClick={() => setActiveModal('newStream')} className="ml-3 text-cyan-400 hover:text-cyan-300 transition-colors uppercase text-[10px] tracking-widest font-bold underline underline-offset-4">Schedule</button>
                        </div>
                    ) : (
                        streams.filter(s => s.status === 'planned').slice(0, 3).map((stream, i) => (
                            <div key={i} className="min-w-[280px] w-[280px] bg-[#0c0c10] border border-white/[0.08] rounded-2xl p-5 hover:border-cyan-500/30 transition-all snap-start flex flex-col justify-between h-[120px]">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-sm font-bold text-white truncate max-w-[180px]">{stream.title}</h4>
                                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
                                    </div>
                                    <div className="text-[10px] font-mono text-gray-400 flex items-center gap-2">
                                        <span className="bg-white/5 px-2 py-0.5 rounded">{stream.platform}</span>
                                        <span>{new Date(stream.scheduledDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {stream.guests && (
                                    <div className="text-[10px] text-gray-500 font-medium truncate mt-2">
                                        <strong className="text-gray-400">Co-hosts:</strong> {stream.guests}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </WidgetCard>

            {/* GOOGLE CALENDAR - Span 12 */}
            <div className="lg:col-span-12 h-[500px] mb-8">
                <GoogleCalendarWidget
                    connected={googleCalendarConnected}
                    onViewCalendar={() => setActivePage('calendar')}
                />
            </div>

        </div>
    );
}
