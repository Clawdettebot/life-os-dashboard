import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, MoreHorizontal, Radio, Plus } from 'lucide-react';
import { Card, Badge, Button, ScrambleText, staggerContainer, staggerItem } from './ui/NewDesignComponents';
import DashboardCalendarWidget from './DashboardCalendarWidget';
import LobsterScrollArea from './ui/LobsterScrollArea';
import { CorticalSparksWidget, ContentPipelineWidget } from './ui/DashboardWidgets';

export default function DashboardView({
  tasks = [],
  projects = [],
  finances = [],
  habits = [],
  streams = [],
  ideas = [],
  notes = [],
  blog = [],
  api,
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
  const safeFinances = Array.isArray(finances) ? finances : [];
  const incomeTotal = safeFinances.filter(f => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0);

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

      <Card title="Priority Tasks" className="col-span-12 lg:col-span-6" action={<Button variant="ghost" className="!px-2 !py-1"><MoreHorizontal size={16} /></Button>}>
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

      {/* Row 3 - Action Widgets */}
      <div className="col-span-12 lg:col-span-4 h-[350px]">
        <CorticalSparksWidget ideas={ideas} notes={notes} onViewSection={(section) => setActivePage && setActivePage(section)} />
      </div>

      <div className="col-span-12 lg:col-span-4 h-[350px]">
        <ContentPipelineWidget posts={blog} onViewSection={(section) => setActivePage && setActivePage(section)} />
      </div>

      <div className="col-span-12 lg:col-span-4 h-[350px] mb-8">
        <DashboardCalendarWidget
          connected={googleCalendarConnected}
          onViewCalendar={() => setActivePage && setActivePage('calendar')}
          api={api}
        />
      </div>
    </motion.div>
  );
}
