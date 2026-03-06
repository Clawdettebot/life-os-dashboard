import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Calendar, Star, MessageCircle, X, Check, Trash2, Bell, Target, PartyPopper, Plus } from 'lucide-react';
import { LobsterScrollArea, staggerContainer, staggerItem, Crosshair } from './ui/NewDesignComponents';

export default function ContactsView({ api }) {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({});
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('contacts');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', priority: 'medium' });

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
      const res = await fetch(`/api/contacts/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason: '' })
      });
      if (!res.ok) throw new Error('Decision submission failed');
      const data = await res.json();
      if (api?.toast) api.toast('Decision Registered', `Contact matrix relation ${decision}d`, 'success');
      fetchData();
    } catch (e) {
      console.error('Decision failed:', e);
      if (api?.toast) api.toast('Decision Failed', e.message, 'error');
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name && !newContact.email) return;
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
      const data = await res.json();
      if (data.success) {
        setNewContact({ name: '', email: '', phone: '', priority: 'medium' });
        setShowAddModal(false);
        if (api?.toast) api.toast('Contact Established', `${newContact.name} added to matrix.`, 'success');
        fetchData();
      } else {
        throw new Error(data.error || 'Failed to add contact');
      }
    } catch (e) {
      console.error('Failed to add contact:', e);
      if (api?.toast) api.toast('Failed to link', e.message, 'error');
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setSelectedContact(null);
      if (api?.toast) api.toast('Contact Severed', 'Connection to element closed.', 'success');
      fetchData();
    } catch (e) {
      console.error('Failed to delete contact:', e);
      if (api?.toast) api.toast('Severance Failed', e.message, 'error');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return <div className="p-8 text-center min-h-full flex items-center justify-center font-space-mono tracking-widest text-[var(--text-muted)] uppercase text-xs animate-pulse">Loading Contacts Matrix...</div>;
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="h-full flex flex-col space-y-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-[var(--border-color)] pb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-end gap-3">
            <div className="w-12 h-12 rounded-full bg-[rgb(var(--rgb-accent-sec))] text-black flex items-center justify-center font-bold font-space-mono shadow-[0_0_20px_rgba(var(--rgb-accent-sec),0.4)] relative z-10 shrink-0 mb-0.5">
              <User size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold font-space-grotesk text-[var(--text-main)] uppercase tracking-widest flex items-center gap-3">
              CRM <span className="text-[rgb(var(--rgb-accent-main))]">Matrix</span>
            </h2>
            <p className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-[0.2em]">Your relationship network</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all bg-transparent text-[var(--text-main)] border border-[var(--border-color)] hover:border-[rgb(var(--rgb-accent-main))]">
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0">
        {[
          { label: 'Total Contacts', value: stats.total || 0, color: 'text-[var(--text-main)]', glow: 'var(--text-main)' },
          { label: 'Active', value: stats.active || 0, color: 'text-emerald-500', glow: '16, 185, 129' },
          { label: 'New', value: stats.new || 0, color: 'text-blue-500', glow: '59, 130, 246' },
          { label: 'Ignored', value: stats.ignored || 0, color: 'text-red-500', glow: '239, 68, 68' }
        ].map((stat, i) => (
          <motion.div key={i} variants={staggerItem} className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-6 text-center !py-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[9px] font-space-mono uppercase tracking-widest text-[var(--text-muted)]">{stat.label}</span>
            </div>
            <div className={`text-3xl font-bold font-space-grotesk ${stat.color}`} style={{ textShadow: `0 0 15px rgba(${stat.glow}, 0.5)` }}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-[var(--bg-panel)] p-1.5 rounded-full border border-[var(--border-color)] w-max shrink-0">
        <button
          onClick={() => setView('contacts')}
          className={`px-6 py-2 rounded-full text-[10px] font-space-mono uppercase tracking-widest transition-all ${view === 'contacts'
            ? 'bg-[rgb(var(--rgb-accent-sec))] text-black font-bold shadow-[0_0_15px_rgba(var(--rgb-accent-sec),0.4)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
        >
          All Contacts
        </button>
        <button
          onClick={() => setView('nudges')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-space-mono uppercase tracking-widest transition-all ${view === 'nudges'
            ? 'bg-[rgb(var(--rgb-accent-sec))] text-black font-bold shadow-[0_0_15px_rgba(var(--rgb-accent-sec),0.4)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
        >
          <Bell size={12} className={view === 'nudges' ? 'text-black' : 'text-[var(--text-muted)]'} />
          Nudges
          <span className="bg-[var(--bg-card)] px-2 py-0.5 rounded-full text-[8px] border border-[var(--border-color)] ml-1">{nudges.length}</span>
        </button>
      </div>

      {/* Content */}
      <LobsterScrollArea className="flex-1" contentClassName="space-y-4 pr-2">
        {/* Nudges View */}
        {view === 'nudges' && (
          <motion.div variants={staggerContainer} className="space-y-4">
            {nudges.length === 0 ? (
              <div className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-12 text-center text-[var(--text-muted)]">
                <Star size={48} className="mx-auto mb-4 opacity-50 text-[var(--text-faint)]" />
                <p className="font-space-mono text-xs uppercase tracking-widest">No contacts need attention!</p>
              </div>
            ) : (
              nudges.map((contact, i) => (
                <motion.div key={contact.id || i} variants={staggerItem}
                  className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-[var(--border-highlight)] transition-all duration-300">
                  <div className="flex-1 w-full md:w-auto text-center md:text-left">
                    <div className="font-space-grotesk text-xl font-bold text-[var(--text-main)] tracking-wide mb-1">{contact.name}</div>
                    <div className="font-space-mono text-[10px] text-[var(--text-muted)] tracking-widest">{contact.email}</div>
                    <div className="font-space-mono text-[10px] text-amber-500 mt-3 flex items-center justify-center md:justify-start gap-2 bg-amber-500/10 w-fit px-3 py-1.5 rounded-lg border border-amber-500/20 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)] animate-pulse" />
                      {contact.reason}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto md:border-l md:border-[var(--border-color)] pl-0 md:pl-6 justify-between md:justify-end">
                    <div className="text-center">
                      <div className={`font-space-grotesk text-3xl font-bold ${getScoreColor(contact.relationship_score)} drop-shadow-[0_0_10px_currentColor]`}>
                        {contact.relationship_score}
                      </div>
                      <div className="font-space-mono text-[8px] tracking-[0.2em] text-[var(--text-muted)] uppercase mt-1">Score</div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleDecision(contact.id, 'active')}
                        className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all" title="Approve">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleDecision(contact.id, 'ignored')}
                        className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all" title="Ignore">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Contacts View */}
        {view === 'contacts' && (
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {contacts.map((contact, i) => (
              <motion.div key={contact.id || i} variants={staggerItem} onClick={() => setSelectedContact(contact)}
                className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-6 cursor-pointer flex flex-col justify-between group hover:border-[var(--border-highlight)] transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-[rgb(var(--rgb-accent-main))]/10 border border-[rgb(var(--rgb-accent-main))]/30 flex items-center justify-center text-[rgb(var(--rgb-accent-main))] font-space-grotesk font-bold text-xl shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.2)] shrink-0">
                    {contact.name ? contact.name[0].toUpperCase() : (contact.email ? contact.email[0].toUpperCase() : '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-space-grotesk text-[var(--text-main)] font-bold text-lg truncate tracking-wide">
                      {contact.name || 'Unknown'}
                    </div>
                    <div className="font-space-mono text-[var(--text-muted)] text-[9px] uppercase tracking-widest truncate mt-0.5">
                      {contact.email}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-5 border-t border-[var(--border-color)] mt-auto">
                  <span className={`px-2.5 py-1 rounded-full font-space-mono text-[8px] uppercase tracking-widest border ${contact.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                    contact.status === 'ignored' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                      'bg-blue-500/10 text-blue-500 border-blue-500/30'
                    }`}>
                    {contact.status}
                  </span>
                  <div className="flex items-center gap-1.5 text-[var(--text-main)] font-space-mono text-xs bg-[var(--bg-panel)] px-3 py-1.5 rounded-full border border-[var(--border-color)]">
                    <MessageCircle size={12} className="text-[var(--text-muted)]" />
                    <span>{contact.interaction_count}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </LobsterScrollArea>

      {/* Contact Modal */}
      <AnimatePresence>
        {selectedContact && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedContact(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[999] p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-8 max-w-[480px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative"
            >
              <Crosshair className="-top-[5px] -left-[5px]" />
              <Crosshair className="-top-[5px] -right-[5px]" />
              <Crosshair className="-bottom-[5px] -left-[5px]" />
              <Crosshair className="-bottom-[5px] -right-[5px]" />

              <div className="flex justify-between items-start mb-8 pb-6 border-b border-[var(--border-color)] relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[rgb(var(--rgb-accent-main))]/10 border border-[rgb(var(--rgb-accent-main))]/30 flex items-center justify-center text-[rgb(var(--rgb-accent-main))] font-space-grotesk font-bold text-3xl shadow-[0_0_20px_rgba(var(--rgb-accent-main),0.3)] shrink-0">
                    {selectedContact.name ? selectedContact.name[0].toUpperCase() : (selectedContact.email ? selectedContact.email[0].toUpperCase() : '?')}
                  </div>
                  <div>
                    <h2 className="font-space-grotesk text-2xl font-bold text-[var(--text-main)] tracking-wide m-0">{selectedContact.name || 'Unknown'}</h2>
                    <p className="font-space-mono text-[10px] text-[var(--text-muted)] tracking-widest mt-1 uppercase">{selectedContact.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-panel)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-main)] transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-3 relative z-10">
                <div className="flex justify-between items-center p-4 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl hover:border-[var(--border-highlight)] transition-all group">
                  <span className="font-space-mono text-[8px] uppercase tracking-[0.2em] text-[var(--text-muted)] flex items-center gap-2"><Star size={12} /> Relationship Score</span>
                  <span className={`font-space-grotesk font-bold text-xl drop-shadow-[0_0_10px_currentColor] transition-colors ${getScoreColor(selectedContact.relationship_score)}`}>
                    {selectedContact.relationship_score}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl hover:border-[var(--border-highlight)] transition-all group">
                  <span className="font-space-mono text-[8px] uppercase tracking-[0.2em] text-[var(--text-muted)] flex items-center gap-2"><MessageCircle size={12} /> Interactions</span>
                  <span className="font-space-grotesk font-bold text-[var(--text-main)] text-xl group-hover:text-white transition-colors">{selectedContact.interaction_count}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl hover:border-[var(--border-highlight)] transition-all group">
                  <span className="font-space-mono text-[8px] uppercase tracking-[0.2em] text-[var(--text-muted)] flex items-center gap-2"><Calendar size={12} /> Last Contacted</span>
                  <span className="font-space-mono text-[10px] text-[var(--text-main)] transition-colors uppercase">{formatDate(selectedContact.last_contacted)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl hover:border-[var(--border-highlight)] transition-all group">
                  <span className="font-space-mono text-[8px] uppercase tracking-[0.2em] text-[var(--text-muted)] flex items-center gap-2"><Target size={12} /> Priority</span>
                  <span className="font-space-mono text-[10px] text-[var(--text-main)] capitalize transition-colors flex items-center gap-2 uppercase">
                    {selectedContact.priority}
                    {selectedContact.priority === 'high' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" />}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-[var(--border-color)] relative z-10">
                <button
                  onClick={() => { handleDecision(selectedContact.id, 'active'); setSelectedContact(null); }}
                  className="flex-1 py-3.5 px-4 rounded-full font-space-grotesk font-bold text-xs uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Approve
                </button>
                <button
                  onClick={() => { handleDecision(selectedContact.id, 'ignored'); setSelectedContact(null); }}
                  className="flex-1 py-3.5 px-4 rounded-full font-space-grotesk font-bold text-xs uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all flex items-center justify-center gap-2"
                >
                  <X size={16} /> Ignore
                </button>
                <button
                  onClick={() => handleDeleteContact(selectedContact.id)}
                  className="py-3.5 px-4 rounded-full font-space-grotesk font-bold text-xs uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all flex items-center justify-center gap-2"
                  title="Delete contact"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[999] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-8 max-w-[480px] w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative">
              <Crosshair className="-top-[5px] -left-[5px]" />
              <Crosshair className="-top-[5px] -right-[5px]" />
              <Crosshair className="-bottom-[5px] -left-[5px]" />
              <Crosshair className="-bottom-[5px] -right-[5px]" />

              <div className="flex justify-between items-center mb-8 pb-6 border-b border-[var(--border-color)] relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[rgb(var(--rgb-accent-sec))]/10 border border-[rgb(var(--rgb-accent-sec))]/30 flex items-center justify-center text-[rgb(var(--rgb-accent-sec))]">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h2 className="font-space-grotesk text-2xl font-bold text-[var(--text-main)] tracking-wide m-0">New Contact</h2>
                    <p className="font-space-mono text-[10px] text-[var(--text-muted)] tracking-widest mt-1 uppercase">Add to your network</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-[var(--bg-panel)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 relative z-10">
                <input type="text" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Name" className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] font-space-mono focus:outline-none focus:border-[var(--border-highlight)]" autoFocus />
                <input type="email" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="Email" className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] font-space-mono focus:outline-none focus:border-[var(--border-highlight)]" />
                <input type="tel" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="Phone" className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] font-space-mono focus:outline-none focus:border-[var(--border-highlight)]" />
                <select value={newContact.priority} onChange={e => setNewContact({ ...newContact, priority: e.target.value })}
                  className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] font-space-mono focus:outline-none focus:border-[var(--border-highlight)]">
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-[var(--border-color)] relative z-10">
                <button onClick={handleAddContact}
                  className="flex-1 py-3.5 px-4 rounded-full font-space-grotesk font-bold text-xs uppercase tracking-widest text-[rgb(var(--rgb-accent-sec))] bg-[rgba(var(--rgb-accent-sec),0.1)] border border-[rgba(var(--rgb-accent-sec),0.3)] hover:bg-[rgba(var(--rgb-accent-sec),0.2)] hover:shadow-[0_0_20px_rgba(var(--rgb-accent-sec),0.2)] transition-all flex items-center justify-center gap-2">
                  <Plus size={16} /> Add Contact
                </button>
                <button onClick={() => setShowAddModal(false)}
                  className="py-3.5 px-6 rounded-full font-space-grotesk font-bold text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
