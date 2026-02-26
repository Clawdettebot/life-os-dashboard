import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame, Check, Plus, Trophy, TrendingUp,
  Droplets, BookOpen, Dumbbell, Moon, Sun,
  Brain, Music, Code, PenTool,
  Coffee, Camera, Zap, Target, Star,
  PersonStanding, Bike, Apple, X
} from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassPill } from './ui/GlassPill';
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
    try {
      const now = new Date();
      const localDate = now.toLocaleDateString('en-CA');
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
    <div className="space-y-8 animate-in-fade-slide">
      {/* ambient background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] bg-red-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        <WidgetCard className="p-6 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-2">Active Protocols</span>
          <div className="text-4xl font-black text-white font-premium">{habits.length}</div>
        </WidgetCard>

        <WidgetCard className="p-6 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-2">Weekly Efficiency</span>
          <div className={`text-4xl font-black font-premium ${overallStats.completion > 70 ? 'text-green-400' : 'text-amber-500'}`}>
            {overallStats.completion}%
          </div>
        </WidgetCard>

        <WidgetCard className="p-6 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-2">Total Momentum</span>
          <div className="flex items-center gap-3">
            <AnimatedIcon Icon={Trophy} size={32} className="text-amber-500" />
            <div className="text-4xl font-black text-white font-premium">{overallStats.totalCheckins}</div>
          </div>
        </WidgetCard>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 relative z-10">
        {habits.map(habit => {
          const Icon = getHabitIcon(habit.icon);
          const stats = habitStats[habit.id] || { weeklyCompletion: 0, history: [] };
          const isAnimating = animatingHabit === habit.id;

          return (
            <WidgetCard key={habit.id} className="group relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>

              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <AnimatedIcon Icon={Icon} size={28} style={{ color: habit.color || '#f59e0b' }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 font-premium tracking-wide">{habit.name}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <TrendingUp size={12} className="text-amber-500/80" />
                        {stats.weeklyCompletion}% efficiency
                      </div>
                    </div>
                  </div>

                  {/* Streak */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500
                    ${(habit.streak?.current || 0) > 7
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : 'bg-white/5 border-white/10 text-gray-400'}
                  `}>
                    <Flame size={16} className={isAnimating ? 'animate-pulse' : ''} />
                    <span className="text-xs font-black font-mono">{habit.streak?.current || 0}</span>
                  </div>
                </div>

                {/* Heatmap Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em]">Operational History</span>
                    <span className="text-[9px] font-mono text-gray-500">{stats.totalCompletion || 0}% Total</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {stats.history.map((day, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-md transition-all duration-300 border
                          ${day.completed
                            ? 'shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]'
                            : 'bg-black/40 border-white/[0.03]'}
                        `}
                        style={{
                          backgroundColor: day.completed ? `${habit.color}30` : undefined,
                          borderColor: day.completed ? `${habit.color}50` : undefined,
                          boxShadow: day.completed ? `0 0 15px ${habit.color}20` : undefined
                        }}
                        title={`${day.date}: ${day.completed ? 'Success' : 'Missing'}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 px-0.5">
                    {weekDays.map((d, i) => (
                      <span key={i} className="text-[8px] font-bold text-gray-600 w-[calc(100%/7)] text-center">{d}</span>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <GlassPill
                  variant={isAnimating ? 'primary' : 'default'}
                  className="w-full !py-3 group/btn"
                  onClick={() => handleCheckIn(habit)}
                >
                  {isAnimating ? (
                    <div className="flex items-center gap-2">
                      <Check size={18} className="animate-bounce" />
                      <span className="uppercase tracking-[0.2em] text-[10px]">Logged</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
                      <span className="uppercase tracking-[0.2em] text-[10px]">Execute Protocol</span>
                    </div>
                  )}
                </GlassPill>
              </div>
            </WidgetCard>
          );
        })}

        {/* Add Habit Placeholder */}
        <WidgetCard
          className="group cursor-pointer border-dashed border-white/20 hover:border-amber-500/50 hover:bg-amber-500/[0.02] transition-all duration-500 flex flex-col items-center justify-center min-h-[300px]"
          onClick={() => setShowAddForm(true)}
        >
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-amber-500/30 transition-all duration-500">
            <Plus size={32} className="text-gray-500 group-hover:text-amber-500 transition-colors" />
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] group-hover:text-white transition-colors">Initialize New Habit</span>
        </WidgetCard>
      </div>

      {/* Add Habit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020203]/80 backdrop-blur-sm" onClick={() => setShowAddForm(false)}></div>
          <WidgetCard className="relative w-full max-w-lg overflow-visible animate-in-fade-slide">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white font-premium tracking-tight">New Protocol</h2>
                <button onClick={() => setShowAddForm(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Protocol Identifier</label>
                  <input
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-amber-500/50 transition-colors placeholder:text-gray-700"
                    placeholder="e.g., Deep Focus Session"
                    value={newHabit.name}
                    onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Symbology</label>
                  <div className="grid grid-cols-6 gap-3">
                    {Object.entries(habitIcons).map(([name, Icon]) => (
                      <button
                        key={name}
                        onClick={() => setNewHabit({ ...newHabit, icon: name })}
                        className={`aspect-square rounded-xl border flex items-center justify-center transition-all
                          ${newHabit.icon === name ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'}
                        `}
                      >
                        <Icon size={20} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Energy Signature</label>
                  <div className="flex gap-3 flex-wrap">
                    {['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'].map(color => (
                      <button
                        key={color}
                        onClick={() => setNewHabit({ ...newHabit, color })}
                        className={`w-10 h-10 rounded-full transition-all duration-300 relative
                          ${newHabit.color === color ? 'scale-125 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'hover:scale-110'}
                        `}
                        style={{ background: color }}
                      >
                        {newHabit.color === color && (
                          <div className="absolute inset-0 border-2 border-white rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                <GlassPill className="flex-1 !py-4" onClick={() => setShowAddForm(false)}>Abort</GlassPill>
                <GlassPill variant="primary" className="flex-1 !py-4" onClick={handleAddHabit}>Initiate</GlassPill>
              </div>
            </div>
          </WidgetCard>
        </div>
      )}
    </div>
  );
}
