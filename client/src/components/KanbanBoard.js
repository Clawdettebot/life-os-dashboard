import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Clock, Tag, GripVertical, 
  AlertCircle, CheckCircle2, Circle, Timer,
  MoreHorizontal, Edit2, Trash2
} from 'lucide-react';

const columns = [
  { id: 'backlog', label: 'Backlog', color: '#94a3b8' },
  { id: 'todo', label: 'Todo', color: '#3b82f6' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { id: 'review', label: 'Review', color: '#8b5cf6' },
  { id: 'done', label: 'Done', color: '#10b981' }
];

const priorityConfig = {
  high: { color: '#ef4444', label: 'High', icon: AlertCircle },
  medium: { color: '#f59e0b', label: 'Medium', icon: Circle },
  low: { color: '#10b981', label: 'Low', icon: CheckCircle2 }
};

export default function KanbanBoard({ tasks = [], api }) {
  const [kanbanTasks, setKanbanTasks] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [showAddForm, setShowAddForm] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', dueDate: '', tags: [] });

  // Map task status to kanban column
  const getColumnForStatus = (status) => {
    const statusToColumn = {
      'completed': 'done',
      'done': 'done',
      'in_progress': 'in_progress',
      'review': 'review',
      'todo': 'todo',
      'backlog': 'backlog',
      'pending': 'backlog' // Legacy support
    };
    return statusToColumn[status] || 'todo';
  };

  // Organize tasks by column
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

  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedTask) return;
    
    // Update local state immediately for responsiveness
    setKanbanTasks(prev => {
      const newState = { ...prev };
      // Remove from old column
      Object.keys(newState).forEach(key => {
        newState[key] = newState[key].filter(t => t.id !== draggedTask.id);
      });
      // Add to new column
      newState[columnId] = [...(newState[columnId] || []), { ...draggedTask, status: columnId }];
      return newState;
    });

    // API call to update status
    try {
      const response = await fetch(`/api/tasks/${draggedTask.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column: columnId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Trigger parent refresh to ensure sync
      if (api && api.fetchAllData) {
        api.fetchAllData();
      }
    } catch (err) {
      console.error('Failed to move task:', err);
    }
    
    setDraggedTask(null);
  };

  const handleAddTask = async (columnId) => {
    if (!newTask.title.trim()) return;
    
    const taskData = {
      title: newTask.title,
      description: newTask.title,
      status: columnId,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      tags: newTask.tags
    };
    
    await api.create('tasks', taskData);
    setShowAddForm(null);
    setNewTask({ title: '', priority: 'medium', dueDate: '', tags: [] });
  };

  const handleDelete = async (taskId) => {
    await api.delete('tasks', taskId);
  };

  const getPriorityBadge = (priority) => {
    const config = priorityConfig[priority] || priorityConfig.medium;
    const Icon = config.icon;
    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '3px',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.65rem',
        background: `${config.color}20`,
        color: config.color,
        fontWeight: '600'
      }}>
        <Icon size={10} />
        {config.label}
      </span>
    );
  };

  const formatDueDate = (date) => {
    if (!date) return null;
    const due = new Date(date);
    const today = new Date();
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    let color = '#10b981';
    let text = `${diff}d`;
    
    if (diff < 0) {
      color = '#ef4444';
      text = 'Overdue';
    } else if (diff === 0) {
      color = '#f59e0b';
      text = 'Today';
    } else if (diff === 1) {
      color = '#f59e0b';
      text = 'Tomorrow';
    }
    
    return { color, text };
  };

  return (
    <div className="kanban-board" style={{ 
      display: 'flex', 
      gap: '16px', 
      overflowX: 'auto',
      paddingBottom: '20px',
      minHeight: '500px'
    }}>
      {columns.map(column => (
        <div 
          key={column.id}
          className={`kanban-column ${dragOverColumn === column.id ? 'drag-over' : ''}`}
          style={{ 
            minWidth: '280px',
            maxWidth: '280px',
            background: dragOverColumn === column.id ? 'var(--grey-200)' : 'var(--grey-100)',
            borderRadius: '12px',
            padding: '12px',
            border: dragOverColumn === column.id ? '2px dashed var(--ink)' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '2px solid var(--grey-200)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: column.color 
              }} />
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{column.label}</span>
              <span style={{ 
                background: 'var(--grey-200)', 
                padding: '2px 8px', 
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {(kanbanTasks[column.id] || []).length}
              </span>
            </div>
            <button 
              className="btn btn-sm"
              onClick={() => setShowAddForm(column.id)}
              style={{ padding: '4px' }}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add Task Form */}
          {showAddForm === column.id && (
            <div className="kanban-add-form" style={{ 
              padding: '12px', 
              borderRadius: '8px',
              marginBottom: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <input 
                className="form-input"
                placeholder="Task title..."
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                style={{ marginBottom: '8px' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select 
                  className="form-select"
                  value={newTask.priority}
                  onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  style={{ flex: 1 }}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <input 
                  className="form-input"
                  type="date"
                  value={newTask.dueDate}
                  onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-sm"
                  onClick={() => setShowAddForm(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => handleAddTask(column.id)}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Task Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(kanbanTasks[column.id] || []).map(task => {
              const dueInfo = formatDueDate(task.dueDate);
              
              return (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  className="kanban-card"
                  style={{ 
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    cursor: 'grab',
                    borderLeft: `4px solid ${column.color}`,
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    {getPriorityBadge(task.priority || 'medium')}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className="btn btn-sm" 
                        style={{ padding: '2px' }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        style={{ padding: '2px' }}
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '0.9rem' }}>
                    {task.title || task.description}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {dueInfo && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        color: dueInfo.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <Calendar size={12} />
                        {dueInfo.text}
                      </span>
                    )}
                    {task.tags && task.tags.map((tag, i) => (
                      <span key={i} className="tag" style={{ fontSize: '0.6rem' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
