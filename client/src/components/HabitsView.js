import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame, Check, Plus, Trophy, TrendingUp,
  Droplets, BookOpen, Dumbbell, Moon, Sun,
  Brain, Music, Code, PenTool,
  Coffee, Camera, Zap, Target, Star,
  PersonStanding, Bike, Apple, X
} from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassyPill } from './ui/GlassyPill';
import AnimatedIcon from './AnimatedIcon';

const habitIcons = {
  water: Droplets,
  read: BookOpen,
  workout: Dumbbell,
  sleep: Moon,
  wake: Sun,
  meditate: Brain,
  music: Music,
  code: Code,
  write: PenTool,
  coffee: Coffee,
  photo: Camera,
  energy: Zap,
  target: Target,
  star: Star,
  run: PersonStanding,
  bike: Bike,
  apple: Apple
};

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function HabitsView({ habits = [], api }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: 'star', color: '#f59e0b' });
  const [animatingHabit, setAnimatingHabit] = useState(null);
  const [habitStats, setHabitStats] = useState({});

  useEffect(() => {
    const stats = {};
    const today = new Date();

    habits.forEach(habit => {
      const historyMap = {};
      (habit.history || []).forEach(h => {
        if (h.completed) historyMap[h.date] = true;
      });

      const fullHistory = [];
      let weeklyCompleted = 0;

      for (let i = 27; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-CA');

        const isCompleted = !!historyMap[dateStr];
        fullHistory.push({
          date: dateStr,
          completed: isCompleted
        });

        if (i < 7 && isCompleted) weeklyCompleted++;
      }

      stats[habit.id] = {
        weeklyCompletion: Math.round((weeklyCompleted / 7) * 100),
        totalCompletion: fullHistory.length > 0 ? Math.round((fullHistory.filter(h => h.completed).length / fullHistory.length) * 100) : 0,
        history: fullHistory
      };
    });
    setHabitStats(stats);
  }, [habits]);

  const handleCheckIn = async (habit) => {
    setAnimatingHabit(habit.id);
    const now = new Date();
    const localDate = now.toLocaleDateString('en-CA');

    // Optimistic UI update
    setHabitStats(prev => {
      const next = { ...prev };
      if (next[habit.id]) {
        const historyCopy = [...next[habit.id].history];
        const todayIndex = historyCopy.findIndex(h => h.date === localDate);
        if (todayIndex !== -1) historyCopy[todayIndex].completed = true;
        next[habit.id] = { ...next[habit.id], history: historyCopy };
      }
      return next;
    });

    try {
      await fetch(`/api/habits/${habit.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: localDate })
      });
      api.fetchAllData && api.fetchAllData();
    } catch (err) {
      console.error('Check-in failed:', err);
    }
    setTimeout(() => setAnimatingHabit(null), 1000);
  };

  const handleAddHabit = async () => {
    if (!newHabit.name.trim()) return;
    await api.create('habits', {
      name: newHabit.name,
      icon: newHabit.icon,
      color: newHabit.color,
      streak: { current: 0, highest: 0 }
    });
    setShowAddForm(false);
    setNewHabit({ name: '', icon: 'star', color: '#f59e0b' });
  };

  const getHabitIcon = (iconName) => {
    return habitIcons[iconName] || Star;
  };

  const overallStats = useMemo(() => {
    if (habits.length === 0) return { completion: 0, totalCheckins: 0 };
    let totalCompletion = 0;
    let totalCheckins = 0;
    habits.forEach(habit => {
      const stats = habitStats[habit.id];
      if (stats) {
        totalCompletion += stats.weeklyCompletion;
        totalCheckins += habit.streak?.current || 0;
      }
    });
    return {
      completion: Math.round(totalCompletion / habits.length),
      totalCheckins
    };
  }, [habits, habitStats]);

  return (
    <div className="space-y-6 animate-in-fade-slide relative overflow-hidden">
      {/* Milord's Avatar Background - full cover, low opacity */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <img src="/avatars/guapdad-avatar.png" alt="" className="w-full h-full object-contain object-center" />
      </div>

      {/* stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 relative z-10 w-full max-w-4xl">
        <WidgetCard className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-1">Active Protocols</span>
          <div className="text-2xl font-black text-white font-premium">{habits.length}</div>
        </WidgetCard>

        <WidgetCard className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-1">Weekly Efficiency</span>
          <div className={`text-2xl font-black font-premium ${overallStats.completion > 70 ? 'text-green-400' : 'text-amber-500'}`}>
            {overallStats.completion}%
          </div>
        </WidgetCard>

        <WidgetCard className="p-4 flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
          <span className="text-[9px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-1">Total Momentum</span>
          <div className="flex items-center gap-2">
            <AnimatedIcon Icon={Trophy} size={24} className="text-amber-500" />
            <div className="text-2xl font-black text-white font-premium">{overallStats.totalCheckins}</div>
          </div>
        </WidgetCard>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 relative z-10">
        {habits.map(habit => {
          const Icon = getHabitIcon(habit.icon);
          const stats = habitStats[habit.id] || { weeklyCompletion: 0, history: [] };
          const isAnimating = animatingHabit === habit.id;
          const color = habit.color || '#f59e0b';
          const streakActive = (habit.streak?.current || 0) > 0;

          return (
            <WidgetCard
              key={habit.id}
              className={`group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] 
                ${isAnimating ? 'ring-2 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}
              `}
              style={{
                boxShadow: `0 4px 20px ${color}0a`
              }}
            >
              {/* Subtle background glow */}
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-[30px]"
                style={{ backgroundColor: color }}
              ></div>

              <div className="p-4 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500"
                      style={{ boxShadow: `inset 0 0 10px ${color}10` }}
                    >
                      <AnimatedIcon Icon={Icon} size={20} style={{ color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-0.5 font-premium tracking-wide leading-tight line-clamp-1" title={habit.name}>{habit.name}</h3>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        <TrendingUp size={10} style={{ color }} className="opacity-80" />
                        {stats.weeklyCompletion}% eff
                      </div>
                    </div>
                  </div>
                </div>

                {/* Heatmap Section */}
                <div className="mb-4 flex-grow">
                  <div className="grid grid-cols-7 gap-1">
                    {stats.history.slice(-14).map((day, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-[4px] transition-all duration-300 border
                          ${day.completed
                            ? 'shadow-[inset_0_0_8px_rgba(255,255,255,0.4)] opacity-100'
                            : 'bg-black/30 border-white/[0.02] opacity-50'}
                        `}
                        style={{
                          backgroundColor: day.completed ? color : undefined,
                          borderColor: day.completed ? color : undefined,
                          boxShadow: day.completed ? `0 0 12px ${color}80` : undefined
                        }}
                        title={`${day.date}: ${day.completed ? 'Success' : 'Missing'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Streak + Action */}
                <div className="flex items-center justify-between mt-auto">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-500
                      ${streakActive
                      ? 'bg-white/5 shadow-sm'
                      : 'bg-transparent border-transparent text-gray-600'}
                    `}
                    style={{
                      borderColor: streakActive ? `${color}30` : 'transparent',
                      color: streakActive ? color : undefined
                    }}
                  >
                    <Flame size={12} className={isAnimating ? 'animate-pulse' : ''} />
                    <span className="text-[10px] font-black font-mono">{habit.streak?.current || 0}</span>
                  </div>

                  <button
                    onClick={() => handleCheckIn(habit)}
                    className={`h-8 px-3 rounded-full flex items-center justify-center text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-all duration-300 ${isAnimating
                      ? 'bg-emerald-500 text-white w-full ml-2'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                      }`}
                    style={{
                      backgroundColor: isAnimating ? undefined : `${color}15`,
                      borderColor: isAnimating ? undefined : `${color}30`,
                      color: isAnimating ? undefined : color
                    }}
                  >
                    {isAnimating ? (
                      <div className="flex items-center gap-1.5">
                        <Check size={14} className="animate-bounce" />
                        <span>Logged</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                        <span>Check In</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </WidgetCard>
          );
        })}

        {/* Add Habit Placeholder */}
        <WidgetCard
          className="group cursor-pointer border-dashed border-white/10 hover:border-amber-500/30 hover:bg-amber-500/[0.02] transition-all duration-500 flex flex-col items-center justify-center h-full min-h-[160px]"
          onClick={() => setShowAddForm(true)}
        >
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-amber-500/30 transition-all duration-500">
            <Plus size={20} className="text-gray-500 group-hover:text-amber-500 transition-colors" />
          </div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] group-hover:text-white transition-colors">New Protocol</span>
        </WidgetCard>
      </div>

      {/* Add Habit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020203]/80 backdrop-blur-sm" onClick={() => setShowAddForm(false)}></div>
          <WidgetCard className="relative w-full max-w-sm overflow-visible animate-in-fade-slide">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-white font-premium tracking-tight">New Protocol</h2>
                <button onClick={() => setShowAddForm(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Protocol Identifier</label>
                  <input
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500/50 transition-colors placeholder:text-gray-700"
                    placeholder="e.g., Deep Focus"
                    value={newHabit.name}
                    onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Symbology</label>
                  <div className="grid grid-cols-6 gap-2">
                    {Object.entries(habitIcons).map(([name, Icon]) => (
                      <button
                        key={name}
                        onClick={() => setNewHabit({ ...newHabit, icon: name })}
                        className={`aspect-square rounded-lg border flex items-center justify-center transition-all
                          ${newHabit.icon === name ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 scale-110' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'}
                        `}
                      >
                        <Icon size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Energy Signature</label>
                  <div className="flex gap-2 flex-wrap">
                    {['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'].map(color => (
                      <button
                        key={color}
                        onClick={() => setNewHabit({ ...newHabit, color })}
                        className={`w-8 h-8 rounded-full transition-all duration-300 relative
                          ${newHabit.color === color ? 'scale-125 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'hover:scale-110'}
                        `}
                        style={{ background: color }}
                      >
                        {newHabit.color === color && (
                          <div className="absolute inset-0 border-[1.5px] border-white rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <GlassyPill className="flex-1 !py-2.5 text-xs" onClick={() => setShowAddForm(false)}>Abort</GlassyPill>
                <GlassyPill variant="primary" className="flex-1 !py-2.5 text-xs" onClick={handleAddHabit}>Initiate</GlassyPill>
              </div>
            </div>
          </WidgetCard>
        </div>
      )}
    </div>
  );
}
