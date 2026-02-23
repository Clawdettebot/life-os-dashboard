import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, Check, Plus, Trophy, TrendingUp,
  Droplets, BookOpen, Dumbbell, Moon, Sun,
  Heart, Brain, Music, Code, PenTool,
  Coffee, Camera, Zap, Target, Star,
  PersonStanding, Bike, Apple
} from 'lucide-react';

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
  heart: Heart,
  run: PersonStanding,
  bike: Bike,
  apple: Apple
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Generate mock history data for heatmap (in real app, comes from API)
const generateMockHistory = (habitId, streak) => {
  const history = [];
  const today = new Date();
  for (let i = 0; i < 28; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // Simulate check-ins based on streak
    const shouldBeChecked = i < streak || (i < streak + 3 && Math.random() > 0.3);
    history.unshift({
      date: date.toISOString().split('T')[0],
      completed: shouldBeChecked
    });
  }
  return history;
};

export default function HabitsView({ habits = [], api }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: 'star', color: '#3b82f6' });
  const [animatingHabit, setAnimatingHabit] = useState(null);
  const [habitStats, setHabitStats] = useState({});

  // Calculate completion stats for each habit
  useEffect(() => {
    const stats = {};
    const today = new Date();
    
    habits.forEach(habit => {
      // Create a map of existing history for O(1) lookup
      const historyMap = {};
      (habit.history || []).forEach(h => {
        if (h.completed) historyMap[h.date] = true;
      });
      
      const fullHistory = [];
      let weeklyCompleted = 0;
      
      // Generate last 28 days
      for (let i = 27; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        // Use local date string YYYY-MM-DD
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
      // Use local date for check-in to avoid timezone issues
      const now = new Date();
      const localDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

      await fetch(`/api/habits/${habit.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: localDate })
      });
      
      // Trigger refresh
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
      streak: 0
    });
    
    setShowAddForm(false);
    setNewHabit({ name: '', icon: 'star', color: '#3b82f6' });
  };

  const getHabitIcon = (iconName) => {
    const Icon = habitIcons[iconName] || Star;
    return Icon;
  };

  const getHeatmapColor = (completed, baseColor) => {
    if (!completed) return '#fee2e2'; // Distinct red for missed days
    return baseColor;
  };

  // Calculate overall weekly stats
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
    <div className="habits-view">
      {/* Stats Overview */}
      <div className="grid-3" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-label">Active Habits</div>
          <div className="stat-value">{habits.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Weekly Completion</div>
          <div className="stat-value" style={{ color: overallStats.completion > 70 ? '#22c55e' : '#f59e0b' }}>
            {overallStats.completion}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Check-ins</div>
          <div className="stat-value">
            <Trophy size={20} style={{ display: 'inline', marginRight: '5px', color: '#f59e0b' }} />
            {overallStats.totalCheckins}
          </div>
        </div>
      </div>

      {/* Habits Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {habits.map(habit => {
          const Icon = getHabitIcon(habit.icon);
          const stats = habitStats[habit.id] || { weeklyCompletion: 0, history: [] };
          const isAnimating = animatingHabit === habit.id;
          
          return (
            <div 
              key={habit.id}
              className="habit-card"
              style={{
                background: 'var(--white)',
                border: 'var(--border-thick)',
                boxShadow: 'var(--shadow-manga)',
                padding: '20px',
                borderRadius: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: habit.color || '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{habit.name}</div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--grey-500)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <TrendingUp size={12} />
                      {stats.weeklyCompletion}% this week
                    </div>
                  </div>
                </div>
                
                {/* Streak Counter */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  background: (habit.streak?.current || 0) > 7 ? '#fef3c7' : 'var(--grey-100)',
                  borderRadius: '20px',
                  color: (habit.streak?.current || 0) > 7 ? '#d97706' : 'var(--ink)'
                }}>
                  <Flame size={18} className={isAnimating ? 'flame-animate' : ''} />
                  <span style={{ fontWeight: '700', fontSize: '1rem' }}>
                    {habit.streak?.current || 0}
                  </span>
                </div>
              </div>

              {/* Weekly Heatmap */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '0.7rem',
                  color: 'var(--grey-500)'
                }}>
                  <span>Last 4 weeks</span>
                  <span>{stats.totalCompletion || 0}% overall</span>
                </div>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '4px'
                }}>
                  {stats.history.map((day, i) => (
                    <div
                      key={i}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '4px',
                        background: getHeatmapColor(day.completed, habit.color || '#3b82f6'),
                        opacity: day.completed ? 0.8 + (i % 3) * 0.1 : 1,
                        border: '1px solid var(--grey-200)'
                      }}
                      title={`${day.date}: ${day.completed ? 'Done' : 'Missed'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Check-in Button */}
              <button
                className={`btn btn-primary checkin-btn ${isAnimating ? 'animate-checkin' : ''}`}
                onClick={() => handleCheckIn(habit)}
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: isAnimating ? habit.color : undefined
                }}
              >
                {isAnimating ? (
                  <>
                    <Check size={20} /> Checked In!
                  </>
                ) : (
                  <>
                    <Check size={20} /> Check In
                  </>
                )}
              </button>
            </div>
          );
        })}

        {/* Add New Habit Card */}
        <div 
          onClick={() => setShowAddForm(true)}
          style={{
            background: 'var(--grey-100)',
            border: '2px dashed var(--grey-300)',
            padding: '20px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            minHeight: '200px',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={40} color="var(--grey-400)" />
          <span style={{ marginTop: '10px', color: 'var(--grey-500)' }}>Add New Habit</span>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddForm && (
        <div className="modal-overlay active" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create New Habit</span>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <input 
                className="form-input"
                placeholder="Habit name (e.g., Drink Water)"
                value={newHabit.name}
                onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                style={{ marginBottom: '15px' }}
              />
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '8px',
                  color: 'var(--grey-500)'
                }}>
                  Choose Icon
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '10px'
                }}>
                  {Object.entries(habitIcons).map(([name, Icon]) => (
                    <button
                      key={name}
                      onClick={() => setNewHabit({...newHabit, icon: name})}
                      style={{
                        padding: '12px',
                        border: newHabit.icon === name ? `2px solid ${newHabit.color}` : 'var(--border-thin)',
                        borderRadius: '8px',
                        background: newHabit.icon === name ? `${newHabit.color}20` : 'var(--white)',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon size={20} color={newHabit.icon === name ? newHabit.color : 'var(--ink)'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '8px',
                  color: 'var(--grey-500)'
                }}>
                  Choose Color
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewHabit({...newHabit, color})}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: color,
                        border: newHabit.color === color ? '3px solid var(--ink)' : '2px solid transparent',
                        cursor: 'pointer',
                        transform: newHabit.color === color ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddHabit}>Create Habit</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .habit-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .day-cell {
          aspect-ratio: 1;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .day-cell.missed {
          background: #fee2e2 !important;
          border: 1px solid #fecaca;
        }
        .day-cell:hover {
          transform: scale(1.1);
          z-index: 1;
        }
        @keyframes checkin-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes checkin-fill {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
        .animate-checkin {
          animation: checkin-pop 0.4s ease;
          background-size: 200% 100%;
          animation: checkin-fill 0.6s ease-out;
        }
        .flame-animate {
          animation: flame-pulse 0.5s ease infinite;
        }
        @keyframes flame-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
