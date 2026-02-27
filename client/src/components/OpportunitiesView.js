import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, RefreshCw, Filter, AlertTriangle, DollarSign,
  Clock, Check, X, Bell, Trash2, Mail, Info
} from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassyPill } from './ui/GlassyPill';
import AnimatedIcon from './AnimatedIcon';

const TYPE_CONFIG = {
  refund: { label: 'Refund', color: '#10b981', icon: DollarSign },
  payment_received: { label: 'Payment', color: '#3b82f6', icon: Check },
  bonus: { label: 'Bonus', color: '#f59e0b', icon: Trophy },
  urgent: { label: 'Urgent', color: '#ef4444', icon: AlertTriangle },
  follow_up: { label: 'Follow Up', color: '#8b5cf6', icon: Mail }
};

const Trophy = ({ size, className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const PRIORITY_CONFIG = {
  high: { label: 'High', color: '#ef4444' },
  medium: { label: 'Medium', color: '#f59e0b' },
  low: { label: 'Low', color: '#10b981' }
};

export default function OpportunitiesView({ api }) {
  const [opportunities, setOpportunities] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', type: 'all', priority: 'all' });
  const [showReminderModal, setShowReminderModal] = useState(null);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/opportunities');
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/opportunities/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchOpportunities();
      }
    } catch (e) {
      console.error('Scan error:', e);
    }
    setScanning(false);
  };

  const handleAction = async (id, action) => {
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'dismiss' ? 'dismissed' : 'claimed', action })
      });
      await fetchOpportunities();
    } catch (e) {
      console.error('Error:', e);
    }
  };

  const handleSetReminder = async (id, date) => {
    try {
      await fetch(`/api/opportunities/${id}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderDate: date })
      });
      setShowReminderModal(null);
      await fetchOpportunities();
    } catch (e) {
      console.error('Error:', e);
    }
  };

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (filter.status !== 'all' && opp.status !== filter.status) return false;
      if (filter.type !== 'all' && opp.type !== filter.type) return false;
      if (filter.priority !== 'all' && opp.priority !== filter.priority) return false;
      return true;
    });
  }, [opportunities, filter]);

  const stats = useMemo(() => ({
    pending: opportunities.filter(o => o.status === 'pending').length,
    urgent: opportunities.filter(o => o.priority === 'high' && o.status === 'pending').length,
    total: opportunities.length
  }), [opportunities]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 animate-pulse">
        <div className="text-gray-500 uppercase tracking-[0.3em] text-xs font-bold">Scanning Event Horizon...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in-fade-slide">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white font-premium tracking-tight mb-1">Fiscal Prospects</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Opportunistic financial signal detection</p>
        </div>
        <GlassyPill
          variant={scanning ? 'primary' : 'default'}
          className="!px-6 !py-3"
          onClick={handleScan}
          disabled={scanning}
        >
          <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
          <span className="uppercase tracking-widest text-[10px] font-bold">{scanning ? 'Calibrating...' : 'Sweep Frequencies'}</span>
        </GlassyPill>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WidgetCard className="p-6 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Pending Vector</span>
          <div className="text-4xl font-black text-white font-premium">{stats.pending}</div>
        </WidgetCard>

        <WidgetCard className="p-6 flex flex-col items-center justify-center text-center border-l-4 border-red-500/50">
          <span className="text-[9px] font-bold text-red-500/70 uppercase tracking-widest mb-2">Critical Priority</span>
          <div className="text-4xl font-black text-red-400 font-premium shadow-red-500/20 drop-shadow-lg">{stats.urgent}</div>
        </WidgetCard>

        <WidgetCard className="p-6 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Signal History</span>
          <div className="text-4xl font-black text-white font-premium">{stats.total}</div>
        </WidgetCard>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6 relative z-10">
        {/* Filter Bar */}
        <WidgetCard className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <Filter size={14} className="text-amber-500" />
              <select
                className="bg-transparent text-[10px] font-bold text-gray-400 uppercase tracking-widest outline-none cursor-pointer hover:text-white transition-colors"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="all">Status: All</option>
                <option value="pending">Pending</option>
                <option value="claimed">Claimed</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <Tag size={14} className="text-blue-400" />
              <select
                className="bg-transparent text-[10px] font-bold text-gray-400 uppercase tracking-widest outline-none cursor-pointer hover:text-white transition-colors"
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              >
                <option value="all">Type: All</option>
                {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
            Filter results: <span className="text-white ml-1 font-mono">{filteredOpportunities.length}</span>
          </div>
        </WidgetCard>

        {/* Opportunities List */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredOpportunities.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-6">
                <Search size={32} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.3em]">No prospects identified in current sweep</p>
              <GlassyPill className="mt-8" onClick={handleScan}>Re-initialize Sweep</GlassyPill>
            </div>
          ) : (
            filteredOpportunities.map(opp => {
              const type = TYPE_CONFIG[opp.type] || { label: opp.type, color: '#94a3b8', icon: Info };
              const priority = PRIORITY_CONFIG[opp.priority] || PRIORITY_CONFIG.medium;
              const TypeIcon = type.icon;

              return (
                <WidgetCard
                  key={opp.id}
                  className={`group relative overflow-hidden transition-all duration-500
                    ${opp.status !== 'pending' ? 'opacity-50 grayscale-[0.5]' : 'hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]'}
                  `}
                >
                  {/* Priority border */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ background: priority.color, boxShadow: `2px 0 10px ${priority.color}40` }}
                  ></div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-500"
                          style={{
                            backgroundColor: `${type.color}15`,
                            borderColor: `${type.color}30`,
                            color: type.color
                          }}
                        >
                          <AnimatedIcon Icon={TypeIcon} size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: type.color }}>
                          {type.label}
                        </span>
                      </div>
                      <div
                        className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10"
                        style={{ color: priority.color }}
                      >
                        {priority.label}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <h3 className="text-lg font-bold text-white font-premium tracking-tight leading-snug group-hover:text-amber-500 transition-colors">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 italic">
                        "{opp.description}"
                      </p>
                      {opp.amount && (
                        <div className="flex items-center gap-2 mt-4">
                          <DollarSign size={18} className="text-green-500" />
                          <span className="text-2xl font-black text-white font-premium tracking-tighter">
                            {opp.amount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4 text-[10px] text-gray-600 font-mono uppercase">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="opacity-60" />
                        {formatDate(opp.emailDate)}
                      </div>
                      {opp.reminderDate && (
                        <div className="flex items-center gap-1.5 text-amber-500/80">
                          <Bell size={12} />
                          {formatDate(opp.reminderDate)}
                        </div>
                      )}
                    </div>

                    {opp.status === 'pending' ? (
                      <div className="flex gap-2 mt-6 pt-6 border-t border-white/5">
                        {['refund', 'payment_received', 'bonus'].includes(opp.type) && (
                          <GlassyPill variant="primary" className="flex-1 !py-2.5" onClick={() => handleAction(opp.id, 'claim')}>
                            <Check size={14} /> <span className="uppercase tracking-widest text-[9px] font-black">Secure</span>
                          </GlassyPill>
                        )}
                        <GlassyPill className="flex-1 !py-2.5" onClick={() => setShowReminderModal(opp.id)}>
                          <Clock size={14} /> <span className="uppercase tracking-widest text-[9px] font-black">Defer</span>
                        </GlassyPill>
                        <GlassyPill className="!px-3 !py-2.5 hover:!bg-red-500/10 hover:!text-red-500 hover:!border-red-500/30" onClick={() => handleAction(opp.id, 'dismiss')}>
                          <Trash2 size={14} />
                        </GlassyPill>
                      </div>
                    ) : (
                      <div className="mt-8 flex items-center justify-center gap-2 py-2 border border-white/5 bg-white/[0.01] rounded-xl">
                        {opp.status === 'claimed' ? (
                          <><Check size={14} className="text-green-500" /> <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Protocol Executed</span></>
                        ) : (
                          <><X size={14} className="text-gray-700" /> <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Signal Terminated</span></>
                        )}
                      </div>
                    )}
                  </div>
                </WidgetCard>
              )
            })
          )}
        </div>
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020203]/80 backdrop-blur-sm" onClick={() => setShowReminderModal(null)}></div>
          <WidgetCard className="relative w-full max-w-sm animate-in-fade-slide">
            <div className="p-8">
              <h3 className="text-xl font-black text-white font-premium tracking-tight mb-6 uppercase tracking-widest">Schedule Reminder</h3>
              <div className="space-y-4">
                <input
                  type="datetime-local"
                  id="reminder-input"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-amber-500/50 transition-colors font-mono"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <GlassyPill className="flex-1 !py-4" onClick={() => setShowReminderModal(null)}>Abort</GlassyPill>
                <GlassyPill variant="primary" className="flex-1 !py-4" onClick={() => {
                  const date = document.getElementById('reminder-input').value;
                  if (date) handleSetReminder(showReminderModal, date);
                }}>Confirm</GlassyPill>
              </div>
            </div>
          </WidgetCard>
        </div>
      )}
    </div>
  );
}
