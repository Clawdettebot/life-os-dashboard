import React from 'react';
import { Radio, CalendarDays, Activity, Plus, Edit2, CheckCircle, XCircle, Users, MessageSquare } from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassyPill } from './ui/GlassPill';

export default function StreamsView({ streams = [], setActiveModal, api, triggerSFX }) {
    const plannedStreams = streams.filter(s => s.status === 'planned');
    const completedStreams = streams.filter(s => s.status === 'completed');
    const activeStreams = streams.filter(s => s.status !== 'cancelled');

    return (
        <div className="streams-view-container animate-in-fade-slide">
            {/* HEADER SECTION */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                        <Radio className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight font-premium">Broadband Ops</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Live Transmission Management</p>
                    </div>
                </div>
                <GlassyPill variant="primary" onClick={() => setActiveModal('newStream')}>
                    <Plus className="w-4 h-4" /> Schedule Stream
                </GlassyPill>
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <WidgetCard className="p-8 group hover:bg-white/[0.02] transition-colors border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Upcoming Signals</span>
                        <CalendarDays className="w-5 h-5 text-cyan-400/50" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-7xl font-extralight tracking-tighter text-white font-premium transition-transform origin-left group-hover:scale-105">
                            {plannedStreams.length}
                        </div>
                        <div className="text-xs font-bold text-cyan-400/80 uppercase tracking-widest">Planned</div>
                    </div>
                </WidgetCard>

                <WidgetCard className="p-8 group hover:bg-white/[0.02] transition-colors border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Successful Transmissions</span>
                        <CheckCircle className="w-5 h-5 text-green-500/50" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-7xl font-extralight tracking-tighter text-white font-premium transition-transform origin-left group-hover:scale-105">
                            {completedStreams.length}
                        </div>
                        <div className="text-xs font-bold text-green-500/80 uppercase tracking-widest">Completed</div>
                    </div>
                </WidgetCard>
            </div>

            {/* STREAMS LIST */}
            <WidgetCard className="p-8">
                <div className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" /> Active Schedule
                </div>

                {activeStreams.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl mx-2 bg-white/[0.01]">
                        <Radio className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No transmissions currently scheduled.</p>
                        <p className="text-gray-600 font-mono text-xs mt-2">Initialize a new signal via the command island.</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto glass-scroll pr-2">
                        {activeStreams.map((stream, i) => (
                            <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-6 relative overflow-hidden group hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10 w-full">

                                    {/* Info Section */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-white font-premium">{stream.title}</h3>
                                            <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${stream.status === 'completed'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                                }`}>
                                                {stream.status}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs font-mono text-gray-400 mb-3">
                                            <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {new Date(stream.scheduledDate).toLocaleDateString()}</span>
                                            {stream.scheduledTime && <span className="flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 text-red-400" /> {stream.scheduledTime}</span>}
                                            <span className="px-2 py-0.5 bg-white/10 rounded text-white font-bold">{stream.platform}</span>
                                        </div>

                                        {(stream.description || stream.guests || stream.chatActivations) && (
                                            <div className="bg-black/40 border border-white/[0.05] rounded-2xl p-4 space-y-2 mt-4">
                                                {stream.description && <p className="text-xs text-gray-300 leading-relaxed font-medium">{stream.description}</p>}
                                                {stream.guests && <p className="text-[10px] text-gray-400 flex items-center gap-2"><Users className="w-3 h-3 text-cyan-500" /> <strong className="text-white">Guests:</strong> {stream.guests}</p>}
                                                {stream.chatActivations && <p className="text-[10px] text-gray-400 flex items-center gap-2"><MessageSquare className="w-3 h-3 text-orange-500" /> <strong className="text-white">Chat Ops:</strong> {stream.chatActivations}</p>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Section */}
                                    <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
                                        <GlassyPill
                                            className="!py-2 !px-4"
                                            onClick={() => { document.getElementById('editStreamId').value = stream.id; setActiveModal('editStream'); }}
                                        >
                                            <Edit2 className="w-3 h-3" /> Edit
                                        </GlassyPill>

                                        {stream.status === 'planned' && (
                                            <GlassyPill
                                                className="!py-2 !px-4 hover:!bg-green-500/20 hover:!border-green-500/50 hover:!text-green-400"
                                                onClick={() => { api.update('streams', stream.id, { status: 'completed' }); if (triggerSFX) triggerSFX('完了'); }}
                                            >
                                                <CheckCircle className="w-3 h-3" /> Complete
                                            </GlassyPill>
                                        )}

                                        <GlassyPill
                                            className="!py-2 !px-4 hover:!bg-red-500/20 hover:!border-red-500/50 hover:!text-red-400"
                                            onClick={() => { api.delete('streams', stream.id); if (triggerSFX) triggerSFX('削除'); }}
                                        >
                                            <XCircle className="w-3 h-3" /> Cancel
                                        </GlassyPill>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </WidgetCard>
        </div>
    );
}
