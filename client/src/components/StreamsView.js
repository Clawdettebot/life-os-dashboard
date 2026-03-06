import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, CalendarDays, Activity, Plus, Edit2, CheckCircle, XCircle, Users, MessageSquare, Link2, Link2Off, RefreshCw, X, Save } from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassyPill } from './ui/GlassyPill';
import LobsterScrollArea from './ui/LobsterScrollArea';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

const hoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2 }
  }
};

export default function StreamsView({ streams = [], twitchSchedule = [], setActiveModal, api, triggerSFX }) {
  const [twitchStatus, setTwitchStatus] = useState({ connected: false, user: null });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Local Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStream, setEditingStream] = useState(null);
  const [newStreamData, setNewStreamData] = useState({
    title: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '20:00',
    platform: 'Twitch',
    description: '',
    guests: '',
    chatActivations: ''
  });

  // Fetch Twitch connection status
  useEffect(() => {
    checkTwitchStatus();
  }, []);

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'twitch-connected') {
        checkTwitchStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkTwitchStatus = async () => {
    try {
      const res = await fetch('/api/twitch/status');
      const data = await res.json();
      setTwitchStatus(data);
    } catch (e) {
      console.error('Twitch status error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTwitchConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/twitch/auth-url');
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=700');
      }
    } catch (e) {
      console.error('Twitch connect error:', e);
      setConnecting(false);
    }
  };

  const handleTwitchDisconnect = async () => {
    try {
      await fetch('/api/twitch/disconnect', { method: 'POST' });
      setTwitchStatus({ connected: false, user: null });
    } catch (e) {
      console.error('Twitch disconnect error:', e);
    }
  };

  const handleCreateStream = async () => {
    if (!newStreamData.title.trim()) return;
    try {
      await api.create('streams', newStreamData);
      setShowNewModal(false);
      setNewStreamData({
        title: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '20:00',
        platform: 'Twitch',
        description: '',
        guests: '',
        chatActivations: ''
      });
      if (triggerSFX) triggerSFX('完了');
    } catch (e) {
      console.error('Create stream error:', e);
    }
  };

  const handleUpdateStream = async () => {
    if (!editingStream.title.trim()) return;
    try {
      await api.update('streams', editingStream.id, editingStream);
      setShowEditModal(false);
      setEditingStream(null);
      if (triggerSFX) triggerSFX('更新');
    } catch (e) {
      console.error('Update stream error:', e);
    }
  };

  // Merge local streams with Twitch schedule
  const safeStreams = Array.isArray(streams) ? streams : [];
  const safeTwitch = Array.isArray(twitchSchedule) ? twitchSchedule : [];

  const mergedStreams = [
    ...safeStreams,
    ...safeTwitch.map(ts => ({
      title: ts.title || ts.category || 'Twitch Stream',
      scheduledDate: ts.date || ts.start || '',
      scheduledTime: ts.time || '',
      platform: 'Twitch',
      status: 'planned',
      isFromTwitch: true,
      description: ts.description || ''
    }))
  ].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  const plannedStreams = mergedStreams.filter(s => Array.isArray(mergedStreams) && s.status === 'planned');
  const completedStreams = mergedStreams.filter(s => Array.isArray(mergedStreams) && s.status === 'completed');
  const activeStreams = mergedStreams.filter(s => Array.isArray(mergedStreams) && s.status !== 'cancelled');

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="streams-view-container"
    >
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <Radio className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight font-premium">Live Stream Hub</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Broadcast Schedule & Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Twitch Connection Status in Header */}
          {!loading && (
            <div className="flex items-center gap-2 pr-4 border-r border-white/10">
              {twitchStatus.connected ? (
                <>
                  {twitchStatus.user?.profile_image_url && (
                    <img
                      src={twitchStatus.user.profile_image_url}
                      alt={twitchStatus.user.display_name}
                      className="w-8 h-8 rounded-full ring-2 ring-purple-500/50"
                    />
                  )}
                  <span className="text-sm text-gray-300 font-medium">{twitchStatus.user?.display_name}</span>
                  <button
                    onClick={handleTwitchDisconnect}
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                    title="Disconnect Twitch"
                  >
                    <Link2Off className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleTwitchConnect}
                  disabled={connecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold text-sm hover:bg-purple-500/20 transition-all disabled:opacity-50"
                >
                  {connecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  Connect Twitch
                </button>
              )}
            </div>
          )}

          <GlassyPill variant="primary" onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4" /> Schedule Stream
          </GlassyPill>
        </div>
      </div>

      {/* HERO: UPCOMING STREAMS */}
      <motion.div variants={cardVariants} custom={0}>
        <WidgetCard className="p-8 mb-8 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-6 h-6 text-cyan-400" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Next Broadcast</span>
            </div>
            {plannedStreams.length > 0 && (
              <div className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/40">
                {plannedStreams.length} Scheduled
              </div>
            )}
          </div>

          {plannedStreams.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Next Stream - Featured */}
              <motion.div
                variants={hoverVariants}
                initial="rest"
                whileHover="hover"
                className="relative p-6 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest">
                      NEXT UP
                    </span>
                    {plannedStreams[0].isFromTwitch && (
                      <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-bold border border-purple-500/40">Twitch</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plannedStreams[0].title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-cyan-400" />
                      {new Date(plannedStreams[0].scheduledDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                    {plannedStreams[0].scheduledTime && (
                      <span className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-red-400" />
                        {plannedStreams[0].scheduledTime}
                      </span>
                    )}
                  </div>
                  {plannedStreams[0].description && (
                    <p className="mt-4 text-sm text-gray-300 leading-relaxed">{plannedStreams[0].description}</p>
                  )}
                </div>
              </motion.div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/30 transition-colors">
                  <div className="text-4xl font-light text-white mb-1">{plannedStreams.length}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Upcoming</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-green-500/30 transition-colors">
                  <div className="text-4xl font-light text-white mb-1">{completedStreams.length}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Completed</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.02] border border-white/[0.1] flex items-center justify-center">
                <Radio className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 font-medium">No broadcasts scheduled</p>
              <p className="text-gray-600 text-sm mt-1">Connect Twitch or add a stream manually</p>
            </div>
          )}
        </WidgetCard>
      </motion.div>

      {/* ALL SCHEDULED STREAMS */}
      <motion.div variants={cardVariants} custom={1}>
        <WidgetCard className="p-8">
          <div className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Full Schedule
          </div>

          {activeStreams.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl mx-2 bg-white/[0.01]">
              <Radio className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No transmissions currently scheduled.</p>
              <p className="text-gray-600 font-mono text-xs mt-2">Initialize a new signal via the command island.</p>
            </div>
          ) : (
            <LobsterScrollArea className="max-h-[500px]" contentClassName="space-y-4 glass-scroll pr-2">
              <AnimatePresence>
                {activeStreams.map((stream, i) => (
                  <motion.div
                    key={i}
                    variants={cardVariants}
                    custom={i + 2}
                    initial="initial"
                    animate="animate"
                    whileHover={hoverVariants.hover}
                    className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-6 relative overflow-hidden group hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">

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
                          {stream.isFromTwitch && <span className="px-2 py-0.5 bg-purple-500/20 rounded text-purple-300 font-bold border border-purple-500/30">Twitch</span>}
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
                          onClick={() => { setEditingStream(stream); setShowEditModal(true); }}
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
                          onClick={() => { if (stream.id && stream.id.startsWith('twitch-')) { fetch('/api/twitch/schedule/' + stream.id.replace('twitch-', ''), { method: 'DELETE' }).then(() => alert('Deleted from Twitch!')).catch(e => alert('Error: ' + e)); } else { api.delete('streams', stream.id); } if (triggerSFX) triggerSFX('削除'); }}
                        >
                          <XCircle className="w-3 h-3" /> Cancel
                        </GlassyPill>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </LobsterScrollArea>
          )}
        </WidgetCard>
      </motion.div>

      {/* MODALS */}
      <AnimatePresence>
        {/* NEW STREAM MODAL */}
        {showNewModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in-fade">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowNewModal(false)}></div>
            <WidgetCard className="relative w-full max-w-lg overflow-visible animate-in-slide-up bg-black/40 backdrop-blur-2xl border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white font-premium tracking-tight uppercase tracking-widest">Initialize Broadcast</h3>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Stream Scheduling Module</p>
                  </div>
                </div>
                <button onClick={() => setShowNewModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Stream Title</label>
                  <input
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyan-500/50 transition-all font-bold placeholder:text-gray-600"
                    placeholder="Broadcast title..."
                    value={newStreamData.title}
                    onChange={e => setNewStreamData({ ...newStreamData, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Scheduled Date</label>
                    <input
                      type="date"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyan-500/50 transition-all font-bold appearance-none cursor-pointer"
                      value={newStreamData.scheduledDate}
                      onChange={e => setNewStreamData({ ...newStreamData, scheduledDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Scheduled Time</label>
                    <input
                      type="time"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyan-500/50 transition-all font-bold appearance-none cursor-pointer"
                      value={newStreamData.scheduledTime}
                      onChange={e => setNewStreamData({ ...newStreamData, scheduledTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Platform</label>
                  <select
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyan-500/50 transition-all font-bold appearance-none cursor-pointer"
                    value={newStreamData.platform}
                    onChange={e => setNewStreamData({ ...newStreamData, platform: e.target.value })}
                  >
                    <option value="Twitch" className="bg-[#0a0a0b]">TWITCH</option>
                    <option value="YouTube" className="bg-[#0a0a0b]">YOUTUBE</option>
                    <option value="Kick" className="bg-[#0a0a0b]">KICK</option>
                    <option value="Instagram" className="bg-[#0a0a0b]">INSTAGRAM</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Broadcast Brief</label>
                  <textarea
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-cyan-500/50 transition-all font-medium placeholder:text-gray-600 min-h-[80px] resize-none"
                    placeholder="Define stream goals..."
                    value={newStreamData.description}
                    onChange={e => setNewStreamData({ ...newStreamData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Guests</label>
                    <input
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-cyan-500/50 transition-all font-medium placeholder:text-gray-600"
                      placeholder="Buddy, Kyle..."
                      value={newStreamData.guests}
                      onChange={e => setNewStreamData({ ...newStreamData, guests: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Chat Ops</label>
                    <input
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-cyan-500/50 transition-all font-medium placeholder:text-gray-600"
                      placeholder="Giveaways, polls..."
                      value={newStreamData.chatActivations}
                      onChange={e => setNewStreamData({ ...newStreamData, chatActivations: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white/[0.01] border-t border-white/5 flex gap-3">
                <GlassyPill className="flex-1 !py-4" onClick={() => setShowNewModal(false)}>
                  <span className="text-[10px] font-black uppercase tracking-widest">Abort Initialization</span>
                </GlassyPill>
                <GlassyPill variant="primary" className="flex-2 !py-4" onClick={handleCreateStream}>
                  <Save size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Deploy Matrix</span>
                </GlassyPill>
              </div>
            </WidgetCard>
          </div>
        )}

        {/* EDIT STREAM MODAL */}
        {showEditModal && editingStream && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in-fade">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
            <WidgetCard className="relative w-full max-w-lg overflow-visible animate-in-slide-up bg-black/40 backdrop-blur-2xl border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                    <Edit2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white font-premium tracking-tight uppercase tracking-widest">Modify Signal</h3>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Stream Adjustment Module</p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Stream Title</label>
                  <input
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500/50 transition-all font-bold placeholder:text-gray-600"
                    placeholder="Broadcast title..."
                    value={editingStream.title}
                    onChange={e => setEditingStream({ ...editingStream, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Scheduled Date</label>
                    <input
                      type="date"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500/50 transition-all font-bold appearance-none cursor-pointer"
                      value={editingStream.scheduledDate}
                      onChange={e => setEditingStream({ ...editingStream, scheduledDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Scheduled Time</label>
                    <input
                      type="time"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500/50 transition-all font-bold appearance-none cursor-pointer"
                      value={editingStream.scheduledTime}
                      onChange={e => setEditingStream({ ...editingStream, scheduledTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Platform</label>
                  <select
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500/50 transition-all font-bold appearance-none cursor-pointer"
                    value={editingStream.platform}
                    onChange={e => setEditingStream({ ...editingStream, platform: e.target.value })}
                  >
                    <option value="Twitch" className="bg-[#0a0a0b]">TWITCH</option>
                    <option value="YouTube" className="bg-[#0a0a0b]">YOUTUBE</option>
                    <option value="Kick" className="bg-[#0a0a0b]">KICK</option>
                    <option value="Instagram" className="bg-[#0a0a0b]">INSTAGRAM</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Broadcast Brief</label>
                  <textarea
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500/50 transition-all font-medium placeholder:text-gray-600 min-h-[80px] resize-none"
                    placeholder="Define stream goals..."
                    value={editingStream.description}
                    onChange={e => setEditingStream({ ...editingStream, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Guests</label>
                    <input
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-purple-500/50 transition-all font-medium placeholder:text-gray-600"
                      placeholder="Buddy, Kyle..."
                      value={editingStream.guests}
                      onChange={e => setEditingStream({ ...editingStream, guests: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Chat Ops</label>
                    <input
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-purple-500/50 transition-all font-medium placeholder:text-gray-600"
                      placeholder="Giveaways, polls..."
                      value={editingStream.chatActivations}
                      onChange={e => setEditingStream({ ...editingStream, chatActivations: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white/[0.01] border-t border-white/5 flex gap-3">
                <GlassyPill className="flex-1 !py-4" onClick={() => setShowEditModal(false)}>
                  <span className="text-[10px] font-black uppercase tracking-widest">Cancel Changes</span>
                </GlassyPill>
                <GlassyPill variant="primary" className="flex-2 !py-4" onClick={handleUpdateStream}>
                  <Save size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Update Signal</span>
                </GlassyPill>
              </div>
            </WidgetCard>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
