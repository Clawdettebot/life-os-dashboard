import React, { useState, useEffect } from 'react';
import RoundTableBackground from './RoundTableBackground';
import { Crown, Clock, Shield, Activity, Command, Cpu, X, Bot } from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassyPill } from './ui/GlassyPill';
import AnimatedIcon from './AnimatedIcon';
import { Send, MessageSquare, Radio, Wifi, WifiOff } from 'lucide-react';

// Agent avatars from assets/avatars
const agentAvatars = {
  clawdette: '/avatars/269bd57c-88ba-4d02-9b70-40511a27d1bc.png',
  'knowledge-knaight': '/avatars/2c45e97d-c391-4d77-9778-821e2dee82d6.png',
  'affairs-knaight': '/avatars/8cd7f326-500b-4757-bca1-132886fc8c76.png',
  'clawthchilds': '/avatars/99f2a89b-8c51-4078-af63-10046a333434.png',
  'claudnelius': '/avatars/c44a0f21-6530-4e4b-8eb7-a27c8674299b.png',
  'labrina': '/avatars/6f9d0fbf-6011-471b-8740-397b7eeb708f.png',
  soldier: '/avatars/a3010206-b78c-4da9-8971-f83294efe9a6.png',
  'shrimp-soldier': '/avatars/a3010206-b78c-4da9-8971-f83294efe9a6.png'
};

const agentThemes = {
  'clawdette': { glow: 'bg-orange-500/20', border: 'border-orange-500/30', gradient: 'from-orange-500 to-red-500' },
  'knowledge-knaight': { glow: 'bg-purple-500/20', border: 'border-purple-500/30', gradient: 'from-purple-500 to-indigo-500' },
  'affairs-knaight': { glow: 'bg-cyan-500/20', border: 'border-cyan-500/30', gradient: 'from-cyan-400 to-blue-500' },
  'clawthchilds': { glow: 'bg-yellow-500/20', border: 'border-yellow-500/30', gradient: 'from-yellow-400 to-amber-500' },
  'claudnelius': { glow: 'bg-green-500/20', border: 'border-green-500/30', gradient: 'from-green-400 to-emerald-600' },
  'labrina': { glow: 'bg-pink-500/20', border: 'border-pink-500/30', gradient: 'from-pink-500 to-rose-500' },
  default: { glow: 'bg-white/10', border: 'border-white/20', gradient: 'from-gray-400 to-gray-600' },
  soldier: { glow: 'bg-cyan-500/10', border: 'border-cyan-500/20', gradient: 'from-cyan-600 to-blue-800' },
  'shrimp-soldier': { glow: 'bg-cyan-500/10', border: 'border-cyan-500/20', gradient: 'from-cyan-600 to-blue-800' }
};

const AgentAvatar = ({ agentId, size = 64, className = "" }) => {
  const avatarSrc = agentAvatars[agentId];
  const theme = agentThemes[agentId] || agentThemes.default;

  if (!avatarSrc) {
    // Fallback logic
    const colors = { clawdette: '#f97316', 'knowledge-knaight': '#8b5cf6', 'affairs-knaight': '#06b6d4', clawthchilds: '#eab308', 'kitchen-knaight': '#ef4444', soldier: '#1e293b' };
    const color = colors[agentId] || colors.soldier;
    return (
      <div className={`relative flex items-center justify-center rounded-full p-1 bg-gradient-to-br ${theme.gradient} flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
        <div className="absolute inset-1 bg-[#0a0a0c] rounded-full z-0 flex items-center justify-center overflow-hidden border border-white/10">
          <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 100 100" className="relative z-10">
            <ellipse cx="50" cy="55" rx="30" ry="18" fill={color} />
            <circle cx="80" cy="50" r="15" fill={color} />
            <circle cx="85" cy="45" r="3" fill="white" />
            <circle cx="85" cy="45" r="1.5" fill="black" />
            <path d="M90 40 Q95 25 85 20" stroke={color} strokeWidth="2" fill="none" />
            <path d="M88 42 Q92 30 82 25" stroke={color} strokeWidth="2" fill="none" />
            <path d="M20 55 Q10 50 15 60 Q5 55 10 65" fill={color} />
            <path d="M35 65 L30 75 M45 65 L42 75 M55 65 L55 75 M65 65 L68 75" stroke={color} strokeWidth="2" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-full p-[2px] bg-gradient-to-br ${theme.gradient} flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img
        src={avatarSrc}
        alt="Agent avatar"
        className="w-full h-full rounded-full object-cover border-2 border-[#0a0a0c]"
      />
      <div className={`absolute inset-0 rounded-full ${theme.glow} blur-md -z-10`}></div>
    </div>
  );
};

export default function RoundTableView() {
  const [agents] = useState([
    {
      id: 'clawdette',
      name: 'Clawdette',
      role: 'Head Manager / CEO',
      isCEO: true,
      status: 'active',
      lastActivity: new Date().toISOString(),
      specialty: 'Oversees all operations, commands swarm entities, global task delegation'
    },
    {
      id: 'knowledge-knaight',
      name: 'Knowledge Knaight',
      role: 'Knowledge Keeper',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      specialty: 'Information extraction, context ingestion, vectorizing Second Brain entries'
    },
    {
      id: 'affairs-knaight',
      name: 'Knaight of Affairs',
      role: 'Schedule Guardian',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      specialty: 'Calendar synchronization, resolving timezone conflicts, priority shifting'
    },
    {
      id: 'clawthchilds',
      name: 'Sir Clawthchilds',
      role: 'Financial Knaight',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      specialty: 'Transaction processing, recurring payment monitoring, budget thresholds'
    },
    {
      id: 'claudnelius',
      name: 'Claudnelius',
      role: 'Code Magician',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      specialty: 'Automated IDE scripting, Git branch management, local component generation'
    },
    {
      id: 'labrina',
      name: 'Labrina',
      role: 'Social Maven',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      specialty: 'Social media post planning, deployment scheduling, analytics ingestion'
    },
    {
      id: 'shrimp-soldier',
      name: 'Shrimp Soldier',
      role: 'Soldier',
      status: 'active',
      lastActivity: new Date().toISOString(),
      specialty: 'Tactical operations, swarm coordination, front-line task execution'
    }
  ]);

  const [shrimpSoldiers] = useState([
    { id: 1, name: 'Recon Shrimp', task: 'Deep-dive background research & link scraping' },
    { id: 2, name: 'Scribe Shrimp', task: 'Drafting initial blueprints and markdown docs' },
    { id: 3, name: 'Metrics Shrimp', task: 'Pulling daily analytics logs to central dashboard' },
    { id: 4, name: 'Sync Shrimp', task: 'Validating cloud backup and sync parity' },
  ]);

  const [selectedAgent, setSelectedAgent] = useState(null);

  // Chat bubble state for agent messages
  const [agentMessages, setAgentMessages] = useState({
    claudnelius: '',
    clawdette: '',
    'knowledge-knaight': ''
  });

  // Fetch messages from API on mount
  useEffect(() => {
    const fetchAgentMessages = async () => {
      const agents = ['claudnelius', 'clawdette', 'knowledge-knaight'];
      const messages = {};
      
      for (const agent of agents) {
        try {
          const res = await fetch(`/api/messages?agent=${agent}`);
          if (res.ok) {
            const data = await res.json();
            messages[agent] = data.message || data.content || data.text || data.messages?.[0] || '';
          }
        } catch (e) {
          console.log(`Failed to fetch message for ${agent}`);
        }
      }
      
      setAgentMessages(prev => ({ ...prev, ...messages }));
    };
    
    fetchAgentMessages();
    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchAgentMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatLastActivity = (isoString) => {
    if (!isoString) return 'Not started';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center py-12">
      <div className="fixed inset-0 z-0">
        <RoundTableBackground />
      </div>

      <div className="animate-in-fade-slide w-full max-w-[1100px] mx-auto relative z-10 px-6">

        {/* EPIC HEADER */}
        <div className="flex flex-col items-center justify-center mb-10 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-yellow-500/10 rounded-[100%] blur-[100px] pointer-events-none"></div>

          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-orange-600 p-[2px] mb-4 shadow-[0_0_40px_rgba(250,204,21,0.2)] relative z-10 transition-transform hover:scale-105 duration-700">
            <div className="w-full h-full bg-[#050508] rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="n"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23n)"/%3E%3C/svg%3E')` }}></div>
              <Crown className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
            </div>
          </div>

          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 font-premium tracking-tighter mb-2 text-center relative z-10 drop-shadow-2xl">
            THE ROUND TABLE
          </h1>
          <p className="text-[9px] font-bold tracking-[0.4em] text-yellow-500/80 uppercase relative z-10 bg-black/40 px-4 py-1 rounded-full border border-yellow-500/20 backdrop-blur-md">
            Council of Knights
          </p>
        </div>

        {/* THE KNIGHTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {agents.map(agent => {
            const theme = agentThemes[agent.id] || agentThemes.default;
            const isActive = agent.status === 'active';
            const isComingSoon = agent.status === 'coming_soon';

            return (
              <WidgetCard
                key={agent.id}
                onClick={() => !isComingSoon && setSelectedAgent(agent)}
                className={`min-h-[220px] relative overflow-hidden group ${isComingSoon ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:border-white/30 transition-all duration-700'}`}
              >
                {/* Glow Behind the Card inside for aesthetic */}
                <div className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[80px] bg-gradient-to-bl ${theme.gradient} opacity-5 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none`}></div>

                <div className="p-8 relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <div className="relative">
                        <AgentAvatar agentId={agent.id} size={64} />
                        {agentMessages[agent.id] && (
                          <div className={`absolute top-full mt-2 left-0 right-0 animate-in-fade-slide`}>
                            <div className={`relative px-3 py-2 rounded-2xl text-xs text-white font-medium backdrop-blur-md border shadow-lg
                              ${agent.id === 'claudnelius' ? 'bg-green-500/20 border-green-500/30' : 
                                agent.id === 'clawdette' ? 'bg-pink-500/20 border-pink-500/30' : 
                                agent.id === 'knowledge-knaight' ? 'bg-purple-500/20 border-purple-500/30' : 
                                'bg-white/10 border-white/20'}
                              `}>
                              {/* Tail pointer */}
                              <div className={`absolute -top-1.5 left-4 w-3 h-3 rotate-45 rounded-sm backdrop-blur-md
                                ${agent.id === 'claudnelius' ? 'bg-green-500/30' : 
                                  agent.id === 'clawdette' ? 'bg-pink-500/30' : 
                                  agent.id === 'knowledge-knaight' ? 'bg-purple-500/30' : 
                                  'bg-white/20'}
                              `}></div>
                              <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                                {agent.id === 'claudnelius' ? '👑 Claudnelius' : 
                                 agent.id === 'clawdette' ? '💜 Clawdette' : 
                                 agent.id === 'knowledge-knaight' ? '📚 Knowledge Knaight' : 
                                 agent.name}
                              </div>
                              <div className="line-clamp-2 leading-snug">
                                {agentMessages[agent.id].length > 80 
                                  ? agentMessages[agent.id].substring(0, 80) + '...' 
                                  : agentMessages[agent.id]}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end pt-1">
                        <span className={`px-2 py-1 rounded-full text-[8px] font-black tracking-[0.2em] uppercase border ${isActive ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]' :
                          isComingSoon ? 'bg-slate-500/10 text-slate-400 border-slate-500/30' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                          }`}>
                          {isComingSoon ? 'Imminent' : agent.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white font-premium tracking-tight mb-0.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-colors">
                      {agent.name}
                    </h3>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r ${theme.gradient} mb-4 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`}>
                      {agent.role}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.05] mt-auto">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-medium text-gray-300 leading-snug">
                      <Shield className="w-3.5 h-3.5 text-white/40 flex-shrink-0" /> {agent.specialty}
                    </div>
                    {agent.lastActivity && (
                      <div className="flex items-center gap-2 text-[8px] font-mono tracking-widest text-gray-500 uppercase mt-3 bg-black/40 inline-flex px-2 py-1 rounded-full border border-white/5">
                        <Activity className="w-2.5 h-2.5 text-cyan-500" /> Ping: {formatLastActivity(agent.lastActivity)}
                      </div>
                    )}
                  </div>
                </div>
              </WidgetCard>
            )
          })}
        </div>

        {/* SHRIMP SOLDIERS DIVISION */}
        <div className="mt-16 mb-8 flex flex-col items-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
          <div className="bg-[#020203] px-4 relative z-10 flex flex-col items-center">
            <h2 className="text-xl font-bold text-white font-premium tracking-tight mb-1 flex items-center gap-3">
              <AnimatedIcon Icon={Bot} animation="wiggle" size={24} className="text-cyan-400 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" /> Shrimp Soldiers
            </h2>
            <p className="text-[8px] font-bold tracking-[0.3em] text-cyan-500/80 uppercase">Tactical Swarm Units</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {shrimpSoldiers.map(soldier => (
            <WidgetCard key={soldier.id} className="p-4 flex flex-col items-center text-center group hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(6,182,212,0.1)] transition-all duration-500 border-white/5 hover:border-cyan-500/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

              <AgentAvatar agentId="soldier" size={48} className="mb-4 group-hover:scale-110 transition-transform duration-500 shadow-xl" />

              <h4 className="text-xs font-bold text-white mb-1 font-premium tracking-tight">{soldier.name}</h4>
              <p className="text-[10px] text-gray-400 mb-4 flex-1 px-1">{soldier.task}</p>

              <GlassyPill className="w-full !py-2 !text-[10px] bg-white/[0.03] border-white/10 group-hover:!bg-cyan-500/20 group-hover:!text-cyan-400 group-hover:!border-cyan-500/50 transition-colors duration-300">
                Deploy Unit
              </GlassyPill>
            </WidgetCard>
          ))}
        </div>

        {/* CUSTOM INCUBATOR */}
        <WidgetCard className="p-1 pl-6 max-w-xl mx-auto flex flex-col md:flex-row items-center gap-4 border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none group-focus-within:opacity-100 opacity-50 transition-opacity"></div>

          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 flex-shrink-0 relative z-10 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Command className="w-4 h-4 text-cyan-400" />
          </div>

          <input
            type="text"
            placeholder="Designate custom directives for a new Shrimp Soldier..."
            className="flex-1 bg-transparent border-none py-4 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors relative z-10 min-w-0 font-medium"
          />

          <div className="pr-1 relative z-10 w-full md:w-auto">
            <button className="w-full md:w-auto relative overflow-hidden group/btn bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-[10px] uppercase tracking-widest px-6 py-4 rounded-xl flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(6,182,212,0.2)]">
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
              Spawn Custom
            </button>
          </div>
        </WidgetCard>

        {/* ==================== AGENT CHANNEL PANEL ==================== */}
        <div className="mt-16 mb-8">
          <div className="flex flex-col items-center relative mb-8">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
            <div className="bg-[#020203] px-4 relative z-10 flex flex-col items-center">
              <h2 className="text-xl font-bold text-white font-premium tracking-tight mb-1 flex items-center gap-3">
                <span className="text-yellow-500">📡</span> Agent Relay Channel
              </h2>
              <p className="text-[8px] font-bold tracking-[0.3em] text-yellow-500/80 uppercase">Inter-Agent Communication</p>
            </div>
          </div>

          <AgentChannelPanel />
        </div>

        {/* MODAL */}
        {
          selectedAgent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in-fade">
              <div className="absolute inset-0 bg-[#020203]/90 backdrop-blur-md" onClick={() => setSelectedAgent(null)}></div>

              <WidgetCard className="relative z-10 w-full max-w-[480px] p-0 overflow-hidden border-white/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] outline outline-1 outline-white/5 animate-in-zoom">
                <div className={`h-40 bg-gradient-to-br ${agentThemes[selectedAgent.id]?.gradient || agentThemes.default.gradient} opacity-20 relative`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] to-transparent"></div>
                </div>

                <button
                  onClick={() => setSelectedAgent(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-white/20 hover:border-white/30 transition-all z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="px-10 pb-10 -mt-20 relative z-10 flex flex-col items-center">
                  <AgentAvatar agentId={selectedAgent.id} size={110} className="mb-6 shadow-[0_20px_40px_rgba(0,0,0,0.6)] ring-4 ring-[#0a0a0c]" />

                  <h2 className="text-3xl font-bold text-white font-premium tracking-tight mb-2 text-center">{selectedAgent.name}</h2>
                  <h3 className={`text-xs font-bold uppercase tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r ${agentThemes[selectedAgent.id]?.gradient || agentThemes.default.gradient} mb-8 text-center`}>{selectedAgent.role}</h3>

                  <div className="w-full space-y-6">
                    <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6">
                      <div className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400" /> Primary Directives
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed font-medium">
                        {selectedAgent.specialty}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[24px] p-5 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3">Status Matrix</span>
                        <span className={`text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]`}>
                          Operational
                        </span>
                      </div>
                      <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[24px] p-5 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Network Uptime</span>
                        <span className="text-xs font-mono text-gray-300 flex items-center gap-2 mt-1 px-3 py-1.5 bg-black/40 rounded-full border border-white/5">
                          <Clock className="w-3.5 h-3.5 text-orange-400" /> {formatLastActivity(selectedAgent.lastActivity)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-8 bg-white text-black font-bold text-sm tracking-wide uppercase py-4 rounded-full hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                    <Command className="w-4 h-4" /> Open Command Link
                  </button>
                </div>
              </WidgetCard>
            </div>
          )
        }

      </div>
    </div>
  );
}

// ==================== AGENT CHANNEL PANEL COMPONENT ====================
function AgentChannelPanel() {
  const [agents, setAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('round-table');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const channels = [
    { id: 'round-table', name: '#round-table', color: 'text-yellow-400' },
    { id: 'tasks', name: '#tasks', color: 'text-cyan-400' },
    { id: 'alerts', name: '#alerts', color: 'text-red-400' }
  ];

  const agentColors = {
    'claudnelius': '#22c55e',  // green
    'clawdette': '#a855f7',     // purple
    'knowledge-knaight': '#3b82f6', // blue
    'affairs-knaight': '#06b6d4', // cyan
    'clawthchilds': '#eab308',  // yellow
    'labrina': '#ec4899'        // pink
  };

  // Fetch agent status
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents/status');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.agents) {
          // Convert object to array
          const agentsArray = Object.entries(data.agents).map(([id, agent]) => ({
            id,
            ...agent
          }));
          setAgents(agentsArray);
        }
      } catch (e) {
        console.error('Failed to fetch agents:', e);
      }
    };
    fetchAgents();
  }, []);

  // Fetch messages for selected channel
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/agents/messages?channel=${selectedChannel}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      } catch (e) {
        console.error('Failed to fetch messages:', e);
      }
    };
    fetchMessages();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedChannel]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const res = await fetch('/api/agents/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'claudnelius',
          agentName: 'Claudnelius',
          channel: selectedChannel,
          content: newMessage,
          color: agentColors['claudnelius']
        })
      });
      if (!res.ok) throw new Error(`HTTP ` + res.status);
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    }
    setSending(false);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastActivity = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Agent Status Panel */}
      <div className="lg:col-span-1">
        <WidgetCard className="h-full p-4 border-yellow-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-yellow-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Agent Network</h3>
          </div>
          
          <div className="space-y-3">
            {agents.length === 0 ? (
              <p className="text-[10px] text-gray-500">Loading agents...</p>
            ) : (
              agents.map(agent => (
                <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="relative">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `${agent.color}20`, border: `2px solid ${agent.color}` }}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    {agent.status === 'online' ? (
                      <Wifi className="absolute -bottom-1 -right-1 w-3 h-3 text-green-400 bg-black rounded-full" />
                    ) : (
                      <WifiOff className="absolute -bottom-1 -right-1 w-3 h-3 text-red-400 bg-black rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{agent.name}</p>
                    <p className="text-[9px] text-gray-500">{formatLastActivity(agent.lastActivity)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </WidgetCard>
      </div>

      {/* Channel Feed */}
      <div className="lg:col-span-3">
        <WidgetCard className="h-full p-0 border-yellow-500/20 overflow-hidden flex flex-col">
          {/* Channel Tabs */}
          <div className="flex border-b border-white/10 bg-black/20">
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`flex-1 py-3 px-4 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  selectedChannel === channel.id 
                    ? `bg-white/[0.05] ${channel.color} border-b-2 border-current` 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                }`}
              >
                {channel.name}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px] bg-gradient-to-b from-black/40 to-black/20">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-[10px]">No messages yet</p>
                <p className="text-[9px] opacity-60">Start the conversation!</p>
              </div>
            ) : (
              messages.map(msg => (
                <div 
                  key={msg.id} 
                  className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: `${msg.color || '#fff'}20`, border: `2px solid ${msg.color || '#fff'}` }}
                  >
                    {msg.agentName?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="text-xs font-bold"
                        style={{ color: msg.color || '#fff' }}
                      >
                        {msg.agentName}
                      </span>
                      <span className="text-[9px] text-gray-500">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-xs text-gray-300 break-words">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Send */}
          <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex gap-3">
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-yellow-500/50"
              >
                {channels.map(ch => (
                  <option key={ch.id} value={ch.id} className="bg-black">{ch.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-lg px-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/50"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </WidgetCard>
      </div>
    </div>
  );
}
