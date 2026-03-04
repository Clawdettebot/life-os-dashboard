import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Search, X, MoreHorizontal,
  ShoppingBag, Coffee, Home, Car, Zap, Heart, Briefcase, Gift, DollarSign
} from 'lucide-react';

// Sir Clawthchilds SVG for decorations
import SirClawthchilds from './knights/SirClawthchilds';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Crosshair = ({ className = '' }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" className={`absolute text-[var(--text-faint)] transition-colors duration-500 pointer-events-none z-20 ${className}`} fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M5 0v10M0 5h10" />
  </svg>
);

const categoryIcons = {
  food: Coffee, shopping: ShoppingBag, housing: Home, transport: Car,
  utilities: Zap, health: Heart, work: Briefcase, gift: Gift,
  income: DollarSign, other: Wallet
};

const categoryColors = {
  food: '#ff6b6b', shopping: '#4ecdc4', housing: '#45b7d1', transport: '#f9ca24',
  utilities: '#6c5ce7', health: '#a29bfe', work: '#74b9ff', gift: '#fd79a8',
  income: '#00b894', other: '#dfe6e9'
};

export default function FinanceView({ finances = [] }) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('financeActiveTab') || 'transactions');
  const [showAddForm, setShowAddForm] = useState(false);
  const [animateSir, setAnimateSir] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '', amount: '', category: 'other', type: 'expense',
    date: new Date().toISOString().split('T')[0]
  });

  // Persist tab choice
  useEffect(() => {
    localStorage.setItem('financeActiveTab', activeTab);
  }, [activeTab]);

  // Trigger Sir Clawthchilds animation when form is submitted
  const handleAddTransaction = () => {
    setAnimateSir(true);
    setTimeout(() => setAnimateSir(false), 1000); // Reset after 1 second
  };

  const totals = useMemo(() => {
    const income = finances.filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0);
    const expenses = finances.filter(f => f.type === 'expense').reduce((s, f) => s + Number(f.amount), 0);
    return { income, expenses, balance: income - expenses };
  }, [finances]);

  const byCategory = useMemo(() => {
    const grouped = {};
    finances.forEach(f => {
      if (!grouped[f.category]) grouped[f.category] = 0;
      grouped[f.category] += Number(f.amount);
    });
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [finances]);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const tabs = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'opportunities', label: 'Opportunities' }
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="h-full flex flex-col space-y-6 relative overflow-hidden">
      {/* Sir Clawthchilds PNG Background - full cover, low opacity */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-30">
        <img src="/avatars/99f2a89b-8c51-4078-af63-10046a333434.png" alt="" className="w-full h-full object-contain object-center" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-[var(--border-color)] pb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-end gap-3">
            {/* Sir Clawthchilds SVG - animated on transaction add */}
            <motion.div
              className="w-12 h-[72px] cursor-pointer opacity-90 transition-transform flex items-end justify-center"
              animate={animateSir ? { scale: [1, 1.2, 1.2, 1], rotate: [0, 10, -10, 0] } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
              title="Sir Clawthchilds - Bull Market Warrior"
            >
              <SirClawthchilds className="w-full h-full drop-shadow-lg" size={null} />
            </motion.div>
            <div className="w-12 h-12 rounded-full bg-[rgb(var(--rgb-accent-sec))] text-black flex items-center justify-center font-bold font-space-mono shadow-[0_0_20px_rgba(var(--rgb-accent-sec),0.4)] relative z-10 shrink-0 mb-0.5">
              <DollarSign size={20} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold font-space-grotesk text-[var(--text-main)] uppercase tracking-widest flex items-center gap-3">
              Finances <span className="text-[rgb(var(--rgb-accent-main))]">2026</span>
            </h2>
            <p className="text-[10px] font-space-mono text-[var(--text-muted)] uppercase tracking-[0.2em]">Track Your Wealth & Expenses</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="SEARCH TRANSACTIONS..." className="pl-10 pr-4 py-2.5 rounded-full border border-[var(--border-color)] text-[10px] font-space-mono focus:outline-none focus:border-[var(--text-main)] focus:bg-[var(--bg-overlay)] w-64 bg-[var(--bg-panel)] text-[var(--text-main)] placeholder-[var(--text-faint)] transition-all duration-300" />
          </div>
          <button onClick={() => setShowAddForm(true)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all bg-transparent text-[var(--text-main)] border border-[var(--border-color)] hover:border-[rgb(var(--rgb-accent-main))]">
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6 shrink-0">
        {[
          { label: 'Income', value: totals.income, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Expenses', value: totals.expenses, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Balance', value: totals.balance, icon: Wallet, color: totals.balance >= 0 ? 'text-green-500' : 'text-red-500', bg: 'bg-[rgb(var(--rgb-accent-main))]/10' }
        ].map((stat, i) => (
          <motion.div key={i} variants={staggerItem} className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-6 text-center !py-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <stat.icon size={20} className={stat.color} />
              <span className="text-[9px] font-space-mono uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className={`text-3xl font-bold font-space-grotesk ${stat.color} drop-shadow-[0_0_15px_rgba(var(--rgb-accent-sec),0.5)]`}>
              {formatCurrency(stat.value)}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-[var(--bg-panel)] p-1.5 rounded-full border border-[var(--border-color)] w-max shrink-0">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-full text-[10px] font-space-mono uppercase tracking-widest transition-all ${activeTab === tab.id
              ? 'bg-[rgb(var(--rgb-accent-sec))] text-black font-bold shadow-[0_0_15px_rgba(var(--rgb-accent-sec),0.4)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex gap-6">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
          {activeTab === 'transactions' && (
            <motion.div variants={staggerContainer} className="space-y-3">
              {finances.length === 0 ? (
                <div className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-12 text-center">
                  <Wallet size={48} className="mx-auto mb-4 text-[var(--text-faint)]" />
                  <p className="text-[var(--text-muted)] font-space-mono">No transactions yet</p>
                </div>
              ) : (
                finances.slice(0, 20).map((item, i) => {
                  const Icon = categoryIcons[item.category] || Wallet;
                  const color = categoryColors[item.category] || '#666';
                  return (
                    <motion.div key={item.id || i} variants={staggerItem}
                      className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] p-5 flex items-center justify-between group hover:border-[var(--border-highlight)] transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-main)] font-space-grotesk">{item.description}</h4>
                          <div className="flex items-center gap-2 text-[9px] font-space-mono text-[var(--text-muted)]">
                            <span className="uppercase">{item.category}</span>
                            <span>•</span>
                            <span>{item.date || 'No date'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-bold font-space-mono ${item.type === 'income' ? 'text-green-500' : 'text-[var(--text-main)]'}`}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-[var(--bg-overlay)] rounded-full transition-all">
                          <MoreHorizontal size={16} className="text-[var(--text-muted)]" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <div className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--text-main)] font-space-grotesk flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--border-highlight)]" /> Spending by Category
                </h3>
              </div>
              <div className="space-y-4">
                {byCategory.map(([category, amount], i) => {
                  const Icon = categoryIcons[category] || Wallet;
                  const color = categoryColors[category] || '#666';
                  return (
                    <motion.div key={category} variants={staggerItem} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
                          <Icon size={20} />
                        </div>
                        <span className="text-sm font-space-mono uppercase text-[var(--text-main)]">{category}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-[var(--bg-panel)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(amount / totals.expenses) * 100}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-sm font-bold font-space-mono text-[var(--text-main)] w-24 text-right">{formatCurrency(amount)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'opportunities' && (
            <div className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-12 text-center">
              <p className="text-[var(--text-muted)] font-space-mono">Investment insights coming soon</p>
            </div>
          )}
        </div>

        {/* Add Form Panel */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-80 shrink-0">
              <div className="hover-spotlight bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-6 flex flex-col relative">
                <Crosshair className="-top-[5px] -left-[5px]" />
                <Crosshair className="-top-[5px] -right-[5px]" />
                <Crosshair className="-bottom-[5px] -left-[5px]" />
                <Crosshair className="-bottom-[5px] -right-[5px]" />

                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--text-main)] font-space-grotesk">New Transaction</h3>
                  <button onClick={() => setShowAddForm(false)}><X size={16} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" /></button>
                </div>

                <div className="space-y-4 relative z-10">
                  <input type="text" value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] font-space-mono focus:outline-none focus:border-[var(--text-main)]" placeholder="Description" />
                  <input type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] font-space-mono focus:outline-none focus:border-[var(--text-main)]" placeholder="0.00" />
                  <select value={newTransaction.category} onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                    className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] font-space-mono focus:outline-none focus:border-[var(--text-main)]">
                    {Object.keys(categoryIcons).map(cat => (<option key={cat} value={cat}>{cat.toUpperCase()}</option>))}
                  </select>
                  <div className="flex gap-2">
                    {['expense', 'income'].map(type => (
                      <button key={type} onClick={() => setNewTransaction({ ...newTransaction, type })}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-space-mono uppercase tracking-widest transition-all ${newTransaction.type === type
                          ? type === 'expense' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-green-500/20 text-green-500 border border-green-500/30'
                          : 'bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-color)]'
                          }`}>
                        {type}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { handleAddTransaction(); setShowAddForm(false); }} className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[var(--logo-bg)] text-[var(--logo-text)] shadow-[0_0_15px_var(--border-highlight)]">
                    Save Transaction
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
