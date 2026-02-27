import React, { useState, useEffect } from 'react';
import {
  Plus, CalendarDays, AlertCircle, CheckCircle2, Circle,
  Edit2, Trash2, GripVertical, CheckCircle
} from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassyPill } from './ui/GlassPill';

const columns = [
  { id: 'backlog', label: 'Backlog', color: '#94a3b8', glowClass: 'shadow-[0_0_15px_rgba(148,163,184,0.3)]', bgClass: 'bg-slate-400' },
  { id: 'todo', label: 'Todo', color: '#3b82f6', glowClass: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]', bgClass: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b', glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', bgClass: 'bg-orange-500' },
  { id: 'review', label: 'Review', color: '#8b5cf6', glowClass: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]', bgClass: 'bg-purple-500' },
  { id: 'done', label: 'Done', color: '#10b981', glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', bgClass: 'bg-green-500' }
];

const priorityConfig = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'High', icon: AlertCircle },
  medium: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Medium', icon: Circle },
  low: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Low', icon: CheckCircle2 }
};

export default function KanbanBoard({ tasks = [], api }) {
  const [kanbanTasks, setKanbanTasks] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [showAddForm, setShowAddForm] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', dueDate: '', tags: [] });

  const getColumnForStatus = (status) => {
    const statusToColumn = {
      'completed': 'done', 'done': 'done', 'in_progress': 'in_progress',
      'review': 'review', 'todo': 'todo', 'backlog': 'backlog', 'pending': 'backlog'
    };
    return statusToColumn[status] || 'todo';
  };

  useEffect(() => {
    const organized = {};
    columns.forEach(col => organized[col.id] = []);
    tasks.forEach(task => {
      const columnId = getColumnForStatus(task.status);
      if (!organized[columnId]) organized[columnId] = [];
      organized[columnId].push(task);
    });
    setKanbanTasks(organized);
  }, [tasks]);

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTask) return;

    setKanbanTasks(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => { newState[key] = newState[key].filter(t => t.id !== draggedTask.id); });
      newState[columnId] = [...(newState[columnId] || []), { ...draggedTask, status: columnId }];
      return newState;
    });

    try {
      const response = await fetch(`/api/tasks/${draggedTask.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column: columnId })
      });
      if (response.ok && api?.fetchAllData) api.fetchAllData();
    } catch (err) { console.error('Failed to move task:', err); }
    setDraggedTask(null);
  };

  const handleAddTask = async (columnId) => {
    if (!newTask.title.trim()) return;
    await api.create('tasks', { title: newTask.title, description: newTask.title, status: columnId, priority: newTask.priority, dueDate: newTask.dueDate, tags: newTask.tags });
    setShowAddForm(null);
    setNewTask({ title: '', priority: 'medium', dueDate: '', tags: [] });
  };

  const formatDueDate = (date) => {
    if (!date) return null;
    const due = new Date(date);
    const today = new Date();
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { color: 'text-red-400', text: 'Overdue' };
    if (diff === 0) return { color: 'text-orange-400', text: 'Today' };
    if (diff === 1) return { color: 'text-orange-400', text: 'Tomorrow' };
    return { color: 'text-green-400', text: `${diff}d left` };
  };

  return (
    <div className="animate-in-fade-slide h-full">
      <div className="flex gap-4 overflow-x-auto glass-scroll pb-6 min-h-[500px] h-full items-start snap-x pr-4">
        {columns.map(column => (
          <WidgetCard
            key={column.id}
            className={`min-w-[260px] flex-1 flex flex-col p-2 transition-all duration-300 snap-start h-[calc(100vh-250px)]
              ${dragOverColumn === column.id ? 'border-white/40 scale-[1.01] shadow-[0_0_40px_rgba(255,255,255,0.1)]' : 'border-white/[0.05]'}
            `}
          >
            <div
              className="h-full flex flex-col"
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(column.id); }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="p-4 flex justify-between items-center mb-2 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${column.bgClass} ${column.glowClass}`}></div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest font-premium">{column.label}</h3>
                  <span className="bg-black/40 border border-white/10 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-gray-400">
                    {(kanbanTasks[column.id] || []).length}
                  </span>
                </div>
                <button
                  onClick={() => setShowAddForm(column.id)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors border border-white/5 hover:border-white/20"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Add Task Form */}
              {showAddForm === column.id && (
                <div className="mx-3 mb-4 p-4 bg-white/[0.03] border border-white/[0.08] rounded-[20px] animate-in-fade-slide">
                  <input
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-medium mb-3 outline-none focus:border-white/30 transition-colors placeholder:text-gray-600"
                    placeholder="Operation title..."
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    autoFocus
                  />
                  <div className="flex gap-2 mb-4">
                    <select
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-gray-300 font-bold uppercase outline-none focus:border-white/30"
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <input
                      type="date"
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-gray-300 font-bold uppercase outline-none focus:border-white/30"
                      value={newTask.dueDate}
                      onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <GlassyPill className="!py-1.5 !px-4" onClick={() => setShowAddForm(null)}>Abort</GlassyPill>
                    <GlassyPill variant="primary" className="!py-1.5 !px-4" onClick={() => handleAddTask(column.id)}>Commit</GlassyPill>
                  </div>
                </div>
              )}

              {/* Task Cards Container */}
              <div className="flex-1 overflow-y-auto glass-scroll px-3 pb-4 space-y-3">
                {(kanbanTasks[column.id] || []).map(task => {
                  const dueInfo = formatDueDate(task.dueDate);
                  const prior = priorityConfig[task.priority] || priorityConfig.medium;
                  const PIcon = prior.icon;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTask(task)}
                      className="group bg-white/[0.03] border border-white/[0.08] rounded-[24px] p-4 cursor-grab active:cursor-grabbing hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl`}></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${prior.bg} ${prior.border}`}>
                          <PIcon className={`w-3 h-3 ${prior.color}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${prior.color}`}>{prior.label}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-gray-500 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => api.delete('tasks', task.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      <div className={`font-semibold text-sm leading-snug mb-3 relative z-10 ${column.id === 'done' ? 'text-gray-500 line-through' : 'text-gray-100'}`}>
                        {task.title || task.description}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 relative z-10">
                        {dueInfo && (
                          <div className={`flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase ${dueInfo.color}`}>
                            <CalendarDays className="w-3 h-3" />
                            {dueInfo.text}
                          </div>
                        )}
                        {task.tags && task.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-mono text-gray-400 uppercase tracking-tighter">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </WidgetCard>
        ))}
      </div>
    </div>
  );
}
