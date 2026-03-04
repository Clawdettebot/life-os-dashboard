import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, MoreHorizontal, Radio, Plus } from 'lucide-react';
import { Card, Badge, Button, ScrambleText, staggerContainer, staggerItem } from './ui/NewDesignComponents';
import GoogleCalendarWidget from './GoogleCalendarWidget';

export default function DashboardView({
    tasks = [],
    projects = [],
    finances = [],
    habits = [],
    streams = [],
    toggleTask,
    setActivePage,
    setActiveModal,
    googleCalendarConnected,
    activeTab,
    currentTheme
}) {
    const tasksArray = Array.isArray(tasks) ? tasks : (tasks?.active || []);
    const activeTasks = tasksArray.filter(t => t.status !== 'completed').slice(0, 5);
    const completedTasks = tasksArray.filter(t => t.status === 'completed');
    const incomeTotal = (finances || []).filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0);

    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-12 gap-6 w-full mx-auto">
        <div className="col-span-12 lg:col-span-6 grid grid-cols-2 gap-4">
          <Card className="items-center justify-center text-center !p-8 hover:border-[var(--border-highlight)] group">
            <div className="text-5xl font-bold tracking-tighter mb-2 text-[var(--text-main)] font-space-grotesk group-hover:text-[rgb(var(--rgb-accent-red))] transition-colors duration-500">
              <ScrambleText text={tasksArray.length || "0"} activeTab={activeTab} theme={currentTheme} />
            </div>
            <div className="text-[10px] font-space-mono uppercase tracking-[0.3em] text-[var(--text-muted)] transition-colors duration-500">Total Tasks</div>
          </Card>
          <Card className="items-center justify-center text-center !p-8 hover:border-[var(--border-highlight)] group">
            <div className="text-5xl font-bold tracking-tighter mb-2 text-[var(--text-main)] font-space-grotesk group-hover:text-[rgb(var(--rgb-accent-main))] transition-colors duration-500">
              <ScrambleText text={projects.length || "0"} activeTab={activeTab} theme={currentTheme} />
            </div>
            <div className="text-[10px] font-space-mono uppercase tracking-[0.3em] text-[var(--text-muted)] transition-colors duration-500">Active Projects</div>
          </Card>
          <Card className="items-center justify-center text-center !p-8 hover:border-[var(--border-highlight)] group">
            <div className="text-4xl font-bold tracking-tighter mb-2 text-[var(--text-main)] font-space-mono group-hover:text-[rgb(var(--rgb-accent-sec))] transition-colors duration-500 flex items-center justify-center">
              <span className="text-[rgb(var(--rgb-accent-sec))] opacity-50 mr-1">$</span>
              <ScrambleText text={incomeTotal.toLocaleString() || "0"} activeTab={activeTab} theme={currentTheme} />
            </div>
            <div className="text-[10px] font-space-mono uppercase tracking-[0.3em] text-[var(--text-muted)] transition-colors duration-500">MRR Income</div>
          </Card>
          <Card className="items-center justify-center text-center !p-8 hover:border-[var(--border-highlight)] group">
            <div className="text-5xl font-bold tracking-tighter mb-2 text-[var(--text-main)] font-space-grotesk group-hover:text-[var(--text-main)] opacity-90 transition-colors duration-500">
              <ScrambleText text={habits.length || "0"} activeTab={activeTab} theme={currentTheme} />
            </div>
            <div className="text-[10px] font-space-mono uppercase tracking-[0.3em] text-[var(--text-muted)] transition-colors duration-500">Tracked Habits</div>
          </Card>
        </div>

        <Card title="Priority Tasks" className="col-span-12 lg:col-span-6" action={<Button variant="ghost" className="!px-2 !py-1"><MoreHorizontal size={16}/></Button>}>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
            {activeTasks.length === 0 ? (
              <div className="text-[10px] font-space-mono uppercase tracking-[0.3em] text-[var(--text-muted)] text-center p-8 border border-dashed border-[var(--border-color)] rounded-[1.5rem]">
                No priority operations currently active.
              </div>
            ) : (
              activeTasks.map((t, i) => (
                <motion.div variants={staggerItem} key={i} onClick={() => toggleTask && toggleTask(t)} className="hover-spotlight group flex items-center justify-between p-4 rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--bg-panel)] hover:bg-[var(--bg-overlay)] hover:border-[var(--border-highlight)] transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4 relative z-10 w-full overflow-hidden">
                    <button className={`shrink-0 transition-colors duration-500 ${t.status === 'completed' ? 'text-[rgb(var(--rgb-accent-sec))]' : 'text-[var(--text-faint)] group-hover:text-[rgb(var(--rgb-accent-main))]'}`}>
                      <Circle size={18} />
                    </button>
                    <span className={`text-sm font-medium transition-opacity font-space-grotesk truncate ${t.status === 'completed' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)] opacity-80 group-hover:opacity-100'}`}>{t.description || t.title}</span>
                  </div>
                  <div className="relative z-10 shrink-0 ml-4">
                    <Badge variant={t.priority || 'MEDIUM'}>
                      {t.priority || 'MEDIUM'}
                    </Badge>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </Card>

        <Card title="Upcoming Streams" className="col-span-12" action={<Button variant="accent" onClick={() => setActivePage && setActivePage('streams')}>View All</Button>}>
          {streams.filter(s => s.status === 'planned').length === 0 ? (
            <div onClick={() => setActiveModal && setActiveModal('newStream')} className="h-32 rounded-[2rem] border border-dashed border-[var(--border-color)] bg-[var(--bg-panel)] flex flex-col items-center justify-center text-[var(--text-muted)] gap-3 hover:border-[rgba(var(--rgb-accent-main),0.5)] hover:bg-[rgba(var(--rgb-accent-main),0.05)] transition-all duration-500 group cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none" />
              <Radio size={24} className="group-hover:text-[rgb(var(--rgb-accent-main))] transition-colors duration-500 relative z-10" />
              <span className="text-xs font-space-mono uppercase tracking-[0.2em] group-hover:text-[var(--text-main)] transition-colors duration-500 relative z-10">No Broadcasts Planned - Click to Schedule</span>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 relative z-10 snap-x scrollbar-hide">
              {streams.filter(s => s.status === 'planned').map((stream, i) => (
                <div key={i} className="min-w-[280px] w-[280px] bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-5 hover:border-[rgba(var(--rgb-accent-sec),0.3)] transition-all snap-start flex flex-col justify-between h-[120px] group cursor-pointer hover-spotlight">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-bold text-[var(--text-main)] font-space-grotesk truncate max-w-[180px] group-hover:text-[rgb(var(--rgb-accent-sec))] transition-colors">{stream.title}</h4>
                            <span className="w-2 h-2 rounded-full bg-[rgb(var(--rgb-accent-sec))] animate-pulse shadow-[0_0_8px_rgba(var(--rgb-accent-sec),0.8)]"></span>
                        </div>
                        <div className="text-[10px] font-space-mono text-[var(--text-muted)] flex items-center gap-2 uppercase tracking-widest mt-4">
                            <span className="bg-[var(--bg-overlay)] px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-main)]">{stream.platform}</span>
                            <span>{new Date(stream.scheduledDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="col-span-12 h-[500px] mb-8">
            <GoogleCalendarWidget
                connected={googleCalendarConnected}
                onViewCalendar={() => setActivePage && setActivePage('calendar')}
            />
        </div>
      </motion.div>
    );
}
