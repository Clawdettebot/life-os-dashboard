import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Calendar, Star, MessageCircle, X, Check, Trash2, Bell, Target, PartyPopper } from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';

export default function ContactsView() {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({});
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('contacts');
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, nudgesRes] = await Promise.all([
        fetch('/api/contacts?limit=50'),
        fetch('/api/contacts/nudges')
      ]);
      const contactsData = await contactsRes.json();
      const nudgesData = await nudgesRes.json();
      setContacts(contactsData.contacts || []);
      setStats(contactsData.stats || {});
      setNudges(nudgesData.nudges || []);
    } catch (e) {
      console.error('Failed to fetch contacts:', e);
    }
    setLoading(false);
  };

  const handleDecision = async (id, decision) => {
    try {
      await fetch(`/api/contacts/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason: '' })
      });
      fetchData();
    } catch (e) {
      console.error('Decision failed:', e);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return <div className="p-8 text-center bg-black/90 min-h-full flex items-center justify-center font-outfit tracking-widest text-white/40 uppercase text-sm animate-pulse">Loading Contacts Matrix...</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto min-h-full bg-black/95 relative overflow-hidden text-white/90">
      {/* Premium Background Effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(255,51,51,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="mb-8 relative z-10">
        <h1 className="font-outfit text-3xl md:text-4xl font-bold tracking-wider uppercase flex items-center gap-3">
          <User size={32} className="text-white/80" />
          CRM Matrix
        </h1>
        <p className="font-mono text-white/40 text-xs tracking-widest uppercase mt-3">
          Your relationship network
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="font-outfit text-4xl lg:text-5xl font-extralight tracking-tighter text-white/90">{stats.total || 0}</div>
          <div className="font-mono text-[0.55rem] tracking-[0.2em] text-white/40 uppercase mt-2">Total Contacts</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
          <div className="font-outfit text-4xl lg:text-5xl font-extralight tracking-tighter text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">{stats.active || 0}</div>
          <div className="font-mono text-[0.55rem] tracking-[0.2em] text-emerald-400/50 uppercase mt-2">Active</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
          <div className="font-outfit text-4xl lg:text-5xl font-extralight tracking-tighter text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]">{stats.new || 0}</div>
          <div className="font-mono text-[0.55rem] tracking-[0.2em] text-blue-400/50 uppercase mt-2">New</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
          <div className="font-outfit text-4xl lg:text-5xl font-extralight tracking-tighter text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]">{stats.ignored || 0}</div>
          <div className="font-mono text-[0.55rem] tracking-[0.2em] text-red-400/50 uppercase mt-2">Ignored</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 relative z-10 p-1.5 glass-panel border border-white/10 rounded-full w-fit max-w-full overflow-x-auto shimmer-mask">
        <button
          onClick={() => setView('contacts')}
          className={`whitespace-nowrap px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-widest transition-all duration-300 border ${view === 'contacts'
            ? 'glass-pill-gradient text-white border-white/20 shadow-[0_0_20px_rgba(255,51,51,0.2)]'
            : 'bg-transparent text-white/40 border-transparent hover:bg-white/5 hover:text-white/70'
            }`}
        >
          All Contacts
        </button>
        <button
          onClick={() => setView('nudges')}
          className={`whitespace-nowrap px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-widest transition-all duration-300 border flex items-center gap-2 ${view === 'nudges'
            ? 'glass-pill-gradient text-white border-white/20 shadow-[0_0_20px_rgba(255,51,51,0.2)]'
            : 'bg-transparent text-white/40 border-transparent hover:bg-white/5 hover:text-white/70'
            }`}
        >
          <Bell size={14} className={view === 'nudges' ? 'text-white' : 'text-white/40'} />
          Nudges
          <span className="bg-white/10 px-2 py-0.5 rounded-full text-[0.55rem] border border-white/10 ml-1">{nudges.length}</span>
        </button>
      </div>

      {/* Nudges View */}
      {view === 'nudges' && (
        <div className="grid gap-4 relative z-10">
          {nudges.length === 0 ? (
            <div className="glass-panel p-16 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
              <Star size={48} className="text-white/10 mb-4" />
              <p className="font-outfit text-xl text-white/40 tracking-wider flex items-center justify-center gap-2">No contacts need attention! <AnimatedIcon Icon={PartyPopper} animation="bounce" size={24} /></p>
            </div>
          ) : (
            nudges.map(contact => (
              <div
                key={contact.id}
                className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center gap-6 group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/20"
              >
                <div className="flex-1 w-full md:w-auto text-center md:text-left">
                  <div className="font-outfit text-xl font-bold text-white/95 tracking-wide mb-1">{contact.name}</div>
                  <div className="font-mono text-xs text-white/40">{contact.email}</div>
                  <div className="font-inter text-sm text-amber-400 mt-3 flex items-center justify-center md:justify-start gap-2 bg-amber-500/10 w-fit px-3 py-1.5 rounded-lg border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)] animate-pulse"></span>
                    {contact.reason}
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto md:border-l md:border-white/10 pl-0 md:pl-6 justify-between md:justify-end">
                  <div className="text-center">
                    <div className="font-outfit text-4xl font-light tracking-tighter" style={{ color: getScoreColor(contact.relationship_score) }}>
                      {contact.relationship_score}
                    </div>
                    <div className="font-mono text-[0.55rem] tracking-widest text-white/40 uppercase mt-1">Score</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision(contact.id, 'active')}
                      className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 transition-all"
                      title="Approve"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => handleDecision(contact.id, 'ignored')}
                      className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:-translate-y-0.5 transition-all"
                      title="Ignore"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Contacts View */}
      {view === 'contacts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 relative z-10">
          {contacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="glass-panel p-5 rounded-2xl border border-white/10 cursor-pointer group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:border-white/20 flex flex-col justify-between"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-full glass-pill-gradient border border-white/20 flex items-center justify-center text-white font-outfit font-bold text-lg shadow-[0_0_15px_rgba(255,51,51,0.3)] shrink-0">
                  {contact.name ? contact.name[0].toUpperCase() : (contact.email ? contact.email[0].toUpperCase() : '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-outfit text-white/90 font-bold text-lg truncate tracking-wide">
                    {contact.name || 'Unknown'}
                  </div>
                  <div className="font-mono text-white/40 text-[0.65rem] truncate mt-0.5">
                    {contact.email}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-auto">
                <span className={`px-2.5 py-1 rounded-md font-mono text-[0.55rem] uppercase tracking-widest border border-white/5 ${contact.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                  contact.status === 'ignored' ? 'bg-red-500/10 text-red-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                  {contact.status}
                </span>
                <div className="flex items-center gap-1.5 text-white/50 font-mono text-xs bg-white/5 px-2.5 py-1 rounded-md">
                  <MessageCircle size={12} className="text-white/40" />
                  <span>{contact.interaction_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Modal */}
      {selectedContact && (
        <div
          onClick={() => setSelectedContact(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass-panel border border-white/10 rounded-2xl p-6 md:p-8 max-w-[480px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-10 fade-in duration-300"
          >
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full glass-pill-gradient border border-white/20 flex items-center justify-center text-white font-outfit font-bold text-2xl shadow-[0_0_20px_rgba(255,51,51,0.3)] shrink-0">
                  {selectedContact.name ? selectedContact.name[0].toUpperCase() : (selectedContact.email ? selectedContact.email[0].toUpperCase() : '?')}
                </div>
                <div>
                  <h2 className="font-outfit text-2xl font-bold text-white tracking-wide m-0">{selectedContact.name || 'Unknown'}</h2>
                  <p className="font-mono text-xs text-white/40 mt-1">{selectedContact.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/15 hover:text-white transition-all transform hover:scale-105"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3">
              <div className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all group">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40 flex items-center gap-2"><Star size={12} /> Relationship Score</span>
                <span className="font-outfit font-bold text-xl drop-shadow-[0_0_10px_currentColor] transition-colors" style={{ color: getScoreColor(selectedContact.relationship_score) }}>
                  {selectedContact.relationship_score}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all group">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40 flex items-center gap-2"><MessageCircle size={12} /> Interactions</span>
                <span className="font-outfit font-medium text-white/90 text-lg group-hover:text-white transition-colors">{selectedContact.interaction_count}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all group">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40 flex items-center gap-2"><Calendar size={12} /> Last Contacted</span>
                <span className="font-inter text-sm text-white/80 group-hover:text-white transition-colors">{formatDate(selectedContact.last_contacted)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all group">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40 flex items-center gap-2"><Target size={12} /> Priority</span>
                <span className="font-inter text-sm text-white/80 capitalize group-hover:text-white transition-colors">
                  {selectedContact.priority}
                  {selectedContact.priority === 'high' && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => { handleDecision(selectedContact.id, 'active'); setSelectedContact(null); }}
                className="flex-1 py-3.5 px-4 rounded-xl font-outfit font-bold text-xs uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} /> Approve
              </button>
              <button
                onClick={() => { handleDecision(selectedContact.id, 'ignored'); setSelectedContact(null); }}
                className="flex-1 py-3.5 px-4 rounded-xl font-outfit font-bold text-xs uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Ignore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
