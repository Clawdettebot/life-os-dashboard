import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail, Search, RefreshCw, Filter, ChevronDown,
  DollarSign, Calendar, Repeat, Tag, AlertCircle, Check, X
} from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassyPill } from './ui/GlassyPill';
import AnimatedIcon from './AnimatedIcon';
import LobsterScrollArea from './ui/LobsterScrollArea';

const CATEGORY_COLORS = {
  streaming: '#ef4444',
  tech: '#8b5cf6',
  utilities: '#10b981',
  insurance: '#f59e0b',
  shopping: '#f43f5e',
  food: '#fb923c',
  finance: '#3b82f6',
  fitness: '#6366f1',
  education: '#06b6d4',
  other: '#94a3b8'
};

const CATEGORY_LABELS = {
  streaming: 'Streaming',
  tech: 'Tech',
  utilities: 'Utilities',
  insurance: 'Insurance',
  shopping: 'Shopping',
  food: 'Food',
  finance: 'Finance',
  fitness: 'Fitness',
  education: 'Education',
  other: 'Other'
};

export default function ExpensesView({ finances = [], api }) {
  const [emailExpenses, setEmailExpenses] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState({ category: 'all', type: 'all', source: 'all' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emailRes, recurringRes] = await Promise.all([
        fetch('/api/finances/email-detected'),
        fetch('/api/finances/recurring')
      ]);

      const emailData = await emailRes.json();
      const recurringData = await recurringRes.json();

      setEmailExpenses(emailData.expenses || []);
      setRecurringExpenses(recurringData);
    } catch (e) {
      console.error('Error fetching expenses:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/finances/scan', { method: 'POST' });
      const data = await res.json();
      if (api?.refresh) api.refresh();
      if (data.success) {
        await fetchData();
      }
    } catch (e) {
      console.error('Scan error:', e);
    }
    setScanning(false);
  };

  const filteredExpenses = useMemo(() => {
    return emailExpenses.filter(exp => {
      if (filter.category !== 'all' && exp.category !== filter.category) return false;
      if (filter.type !== 'all' && exp.type !== filter.type) return false;
      if (filter.source !== 'all' && exp.source !== filter.source) return false;
      return true;
    });
  }, [emailExpenses, filter]);

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory = filteredExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
    return { total, count: filteredExpenses.length, byCategory };
  }, [filteredExpenses]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const categories = [...new Set(emailExpenses.map(e => e.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 animate-pulse">
        <div className="text-gray-500 uppercase tracking-[0.3em] text-xs font-bold">Decrypting Ledgers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in-fade-slide relative z-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white font-premium tracking-tight mb-1">Fiscal Intelligence</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email-detected transaction analysis</p>
        </div>
        <GlassyPill
          variant={scanning ? 'primary' : 'default'}
          className="!px-6 !py-3"
          onClick={handleScan}
          disabled={scanning}
        >
          <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
          <span className="uppercase tracking-widest text-[10px] font-bold">{scanning ? 'Analyzing...' : 'Scan Matrix'}</span>
        </GlassyPill>
      </div>

      {/* Stats Summary */}
      {recurringExpenses && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WidgetCard className="p-6 border-l-4 border-amber-500/50">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Monthly Burn Rate</span>
            <div className="text-3xl font-black text-white font-premium">
              <span className="text-amber-500/50 mr-1">$</span>
              {recurringExpenses.monthlyTotal?.toFixed(2) || '0.00'}
            </div>
          </WidgetCard>

          <WidgetCard className="p-6 border-l-4 border-red-500/50">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Projected Annual</span>
            <div className="text-3xl font-black text-white font-premium">
              <span className="text-red-500/50 mr-1">$</span>
              {(recurringExpenses.monthlyTotal * 12)?.toFixed(2) || '0.00'}
            </div>
          </WidgetCard>

          <WidgetCard className="p-6 border-l-4 border-blue-500/50">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Active Pipelines</span>
            <div className="text-3xl font-black text-white font-premium">
              {recurringExpenses.expenses?.length || 0}
            </div>
          </WidgetCard>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Sidebar: Filters & Summary */}
        <div className="xl:col-span-1 space-y-6">
          <WidgetCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Filter size={16} className="text-amber-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Data Filters</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Sector</label>
                <div className="relative">
                  <select
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-gray-300 outline-none appearance-none focus:border-amber-500/50 transition-colors"
                    value={filter.category}
                    onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                  >
                    <option value="all">All Sectors</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex justify-between text-[10px] font-medium">
                  <span className="text-gray-500 uppercase tracking-widest">Selected Entries</span>
                  <span className="text-white font-mono">{stats.count}</span>
                </div>
                <div className="flex justify-between text-[10px] font-medium">
                  <span className="text-gray-500 uppercase tracking-widest">Aggregate Total</span>
                  <span className="text-amber-500 font-mono font-bold">${stats.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </WidgetCard>

          {/* Category Breakdown */}
          {Object.keys(stats.byCategory).length > 0 && (
            <WidgetCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Tag size={16} className="text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Allocation</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.byCategory).map(([cat, amount]) => (
                  <div key={cat} className="group">
                    <div className="flex justify-between text-[10px] mb-1.5 font-bold uppercase tracking-tight">
                      <div className="flex items-center gap-2 text-gray-400 group-hover:text-white transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other }}></div>
                        {CATEGORY_LABELS[cat] || cat}
                      </div>
                      <span className="text-gray-500 group-hover:text-amber-500 transition-colors font-mono tracking-tighter">${amount.toFixed(2)}</span>
                    </div>
                    <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full opacity-60 group-hover:opacity-100 transition-all duration-700"
                        style={{
                          width: `${(amount / stats.total) * 100}%`,
                          background: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other,
                          boxShadow: `0 0 10px ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.other}40`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </WidgetCard>
          )}
        </div>

        {/* Table Area */}
        <WidgetCard className="xl:col-span-3 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-amber-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Transaction Ledger</h3>
            </div>
          </div>

          <LobsterScrollArea direction="horizontal" contentClassName="glass-scroll">
            {filteredExpenses.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Mail size={32} className="text-gray-700" />
                </div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">No transaction signals detected</p>
                <GlassyPill className="mt-6" onClick={handleScan}>Re-initialize Scan</GlassyPill>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vendor / Agent</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sector</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Debit</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Timeline</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recursion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="group hover:bg-white/[0.03] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-amber-500 transition-colors">
                            {expense.vendor || expense.title}
                          </span>
                          {expense.emailSubject && (
                            <span className="text-[10px] text-gray-500 font-medium truncate max-w-[240px] mt-0.5">
                              {expense.emailSubject}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other}15`,
                            color: CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other,
                            border: `1px solid ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other}30`
                          }}
                        >
                          {CATEGORY_LABELS[expense.category] || expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-red-400 group-hover:drop-shadow-[0_0_8px_rgba(248,113,113,0.4)] transition-all">
                          -${Number(expense.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4">
                        {expense.recurring?.is_recurring ? (
                          <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-tight">
                            <Repeat size={12} className="opacity-70" />
                            {expense.recurring.frequency}
                          </div>
                        ) : (
                          <span className="text-gray-700 text-[10px] font-bold uppercase tracking-widest">Singular</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </LobsterScrollArea>
        </WidgetCard>
      </div>
    </div>
  );
}
