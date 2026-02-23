import React, { useState, useEffect } from 'react';
import { 
  Plus, Folder, Archive, FileText, Tag, Calendar, 
  CheckSquare, Square, Trash2, Edit2, ChevronRight,
  ChevronDown, X, Save, ArchiveRestore, AlertCircle,
  Clock, Flag, MoreVertical
} from 'lucide-react';

const categoryColors = {
  'Cinematic Universe': '#8b5cf6',
  'Music & Audio': '#ec4899',
  'Food & Hospitality': '#f59e0b',
  'Manga & Narrative': '#10b981',
  'Gaming & Interactive': '#3b82f6',
  'Products & Merch': '#ef4444',
  'Language & Education': '#06b6d4',
  'Tech & Infrastructure': '#6366f1',
  'Uncategorized': '#94a3b8'
};

const statusConfig = {
  'active': { color: '#10b981', label: 'Active', icon: Folder },
  'concept': { color: '#3b82f6', label: 'Concept', icon: AlertCircle },
  'in_progress': { color: '#f59e0b', label: 'In Progress', icon: Clock },
  'on_hold': { color: '#94a3b8', label: 'On Hold', icon: Archive },
  'completed': { color: '#6366f1', label: 'Completed', icon: CheckSquare },
  'archived': { color: '#64748b', label: 'Archived', icon: Archive }
};

const priorityConfig = {
  'high': { color: '#ef4444', label: 'High' },
  'medium': { color: '#f59e0b', label: 'Medium' },
  'low': { color: '#10b981', label: 'Low' }
};

const defaultCategories = [
  'Cinematic Universe',
  'Music & Audio',
  'Food & Hospitality',
  'Manga & Narrative',
  'Gaming & Interactive',
  'Products & Merch',
  'Language & Education',
  'Tech & Infrastructure',
  'Uncategorized'
];

export default function ProjectsView({ api }) {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    category: 'Uncategorized',
    description: '',
    priority: 'medium',
    tags: '',
    notes: ''
  });
  const [newNote, setNewNote] = useState('');
  const [newTask, setNewTask] = useState('');
  const [expandedTasks, setExpandedTasks] = useState({});

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      const endpoint = activeTab === 'archived' 
        ? '/api/projects/archived' 
        : '/api/projects/active';
      const res = await fetch(endpoint);
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeTab]);

  // Filter projects by category for display
  const projectsByCategory = projects.reduce((acc, project) => {
    const cat = project.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(project);
    return acc;
  }, {});

  // Create new project
  const handleCreateProject = async () => {
    if (!newProject.title.trim()) return;
    
    const projectData = {
      ...newProject,
      tags: newProject.tags.split(',').map(t => t.trim()).filter(t => t),
      status: 'active'
    };

    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      setShowNewProjectForm(false);
      setNewProject({
        title: '',
        category: 'Uncategorized',
        description: '',
        priority: 'medium',
        tags: '',
        notes: ''
      });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  // Update project
  const handleUpdateProject = async (id, updates) => {
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      fetchProjects();
      if (selectedProject) {
        const res = await fetch(`/api/projects/${id}`);
        const data = await res.json();
        setSelectedProject(data.project);
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  // Archive project
  const handleArchiveProject = async (id) => {
    try {
      await fetch(`/api/projects/${id}/archive`, { method: 'POST' });
      fetchProjects();
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error archiving project:', error);
    }
  };

  // Unarchive project
  const handleUnarchiveProject = async (id) => {
    try {
      await fetch(`/api/projects/${id}/unarchive`, { method: 'POST' });
      fetchProjects();
    } catch (error) {
      console.error('Error unarchiving project:', error);
    }
  };

  // Delete project
  const handleDeleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      fetchProjects();
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // Add note to project
  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedProject) return;
    try {
      await fetch(`/api/projects/${selectedProject.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote })
      });
      setNewNote('');
      setShowNoteForm(false);
      // Refresh selected project
      const res = await fetch(`/api/projects/${selectedProject.id}`);
      const data = await res.json();
      setSelectedProject(data.project);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // Add task to project
  const handleAddTask = async () => {
    if (!newTask.trim() || !selectedProject) return;
    try {
      await fetch(`/api/projects/${selectedProject.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask })
      });
      setNewTask('');
      setShowTaskForm(false);
      // Refresh selected project
      const res = await fetch(`/api/projects/${selectedProject.id}`);
      const data = await res.json();
      setSelectedProject(data.project);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Toggle task completion
  const handleToggleTask = async (taskId) => {
    if (!selectedProject) return;
    try {
      await fetch(`/api/projects/${selectedProject.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      // Refresh selected project
      const res = await fetch(`/api/projects/${selectedProject.id}`);
      const data = await res.json();
      setSelectedProject(data.project);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="projects-container" style={{ display: 'flex', gap: '20px', minHeight: '70vh' }}>
      {/* Left Panel - Project List */}
      <div className="projects-list-panel" style={{ flex: '1', minWidth: '0' }}>
        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          borderBottom: '2px solid var(--grey-200)',
          paddingBottom: '10px'
        }}>
          <button 
            className={`btn ${activeTab === 'active' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('active')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Folder size={16} />
            Active ({projects.filter(p => p.status !== 'archived').length})
          </button>
          <button 
            className={`btn ${activeTab === 'archived' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('archived')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Archive size={16} />
            Archive ({projects.filter(p => p.status === 'archived').length})
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewProjectForm(true)}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* New Project Form Modal */}
        {showNewProjectForm && (
          <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Create New Project</h3>
              <button className="btn btn-sm" onClick={() => setShowNewProjectForm(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                className="form-input"
                placeholder="Project Title *"
                value={newProject.title}
                onChange={e => setNewProject({...newProject, title: e.target.value})}
              />
              <select 
                className="form-select"
                value={newProject.category}
                onChange={e => setNewProject({...newProject, category: e.target.value})}
              >
                {defaultCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <textarea 
                className="form-input"
                placeholder="Description"
                value={newProject.description}
                onChange={e => setNewProject({...newProject, description: e.target.value})}
                style={{ minHeight: '80px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <select 
                  className="form-select"
                  value={newProject.priority}
                  onChange={e => setNewProject({...newProject, priority: e.target.value})}
                  style={{ flex: 1 }}
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <input 
                  className="form-input"
                  placeholder="Tags (comma separated)"
                  value={newProject.tags}
                  onChange={e => setNewProject({...newProject, tags: e.target.value})}
                  style={{ flex: 1 }}
                />
              </div>
              <button className="btn btn-primary" onClick={handleCreateProject}>
                <Save size={16} /> Create Project
              </button>
            </div>
          </div>
        )}

        {/* Projects by Category */}
        {Object.keys(projectsByCategory).length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            opacity: 0.6 
          }}>
            <Folder size={48} style={{ marginBottom: '10px' }} />
            <p>No {activeTab} projects yet.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowNewProjectForm(true)}
            >
              Create your first project
            </button>
          </div>
        ) : (
          Object.entries(projectsByCategory).map(([category, categoryProjects]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '2px solid var(--grey-200)'
              }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  background: categoryColors[category] || categoryColors['Uncategorized']
                }} />
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{category}</span>
                <span style={{ 
                  background: 'var(--grey-200)', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  fontSize: '0.75rem'
                }}>
                  {categoryProjects.length}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {categoryProjects.map(project => {
                  const StatusIcon = statusConfig[project.status]?.icon || Folder;
                  const statusColor = statusConfig[project.status]?.color || '#94a3b8';
                  const priorityColor = priorityConfig[project.priority]?.color || '#f59e0b';
                  
                  return (
                    <div 
                      key={project.id}
                      className="project-card"
                      onClick={() => setSelectedProject(project)}
                      style={{ 
                        padding: '16px',
                        borderRadius: '12px',
                        background: selectedProject?.id === project.id ? 'var(--grey-100)' : 'var(--card-bg)',
                        border: selectedProject?.id === project.id ? '2px solid var(--ink)' : '1px solid var(--grey-200)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{project.title}</h4>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {project.status === 'archived' ? (
                            <button 
                              className="btn btn-sm"
                              onClick={(e) => { e.stopPropagation(); handleUnarchiveProject(project.id); }}
                              title="Unarchive"
                            >
                              <ArchiveRestore size={14} />
                            </button>
                          ) : (
                            <button 
                              className="btn btn-sm"
                              onClick={(e) => { e.stopPropagation(); handleArchiveProject(project.id); }}
                              title="Archive"
                            >
                              <Archive size={14} />
                            </button>
                          )}
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <p style={{ 
                        fontSize: '0.85rem', 
                        opacity: 0.8, 
                        marginBottom: '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {project.description || 'No description'}
                      </p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          background: `${statusColor}20`,
                          color: statusColor,
                          fontWeight: '600'
                        }}>
                          <StatusIcon size={12} />
                          {statusConfig[project.status]?.label || project.status}
                        </span>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          background: `${priorityColor}20`,
                          color: priorityColor,
                          fontWeight: '600'
                        }}>
                          <Flag size={12} />
                          {priorityConfig[project.priority]?.label || 'Medium'}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', opacity: 0.6 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {formatDate(project.updated_at)}
                        </span>
                        {project.tasks && project.tasks.length > 0 && (
                          <span>
                            {project.tasks.filter(t => t.completed).length}/{project.tasks.length} tasks
                          </span>
                        )}
                      </div>
                      
                      {project.tags && project.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                          {project.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="tag" style={{ fontSize: '0.65rem' }}>
                              {tag}
                            </span>
                          ))}
                          {project.tags.length > 3 && (
                            <span className="tag" style={{ fontSize: '0.65rem' }}>
                              +{project.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right Panel - Project Details */}
      {selectedProject && (
        <div className="project-details-panel" style={{ 
          width: '400px', 
          minWidth: '350px',
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid var(--grey-200)',
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>{selectedProject.title}</h3>
              <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{selectedProject.category}</span>
            </div>
            <button className="btn btn-sm" onClick={() => setSelectedProject(null)}>
              <X size={16} />
            </button>
          </div>

          {/* Status and Priority */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <select 
              className="form-select"
              value={selectedProject.status}
              onChange={e => handleUpdateProject(selectedProject.id, { status: e.target.value })}
              style={{ flex: 1 }}
            >
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select 
              className="form-select"
              value={selectedProject.priority}
              onChange={e => handleUpdateProject(selectedProject.id, { priority: e.target.value })}
              style={{ flex: 1 }}
            >
              {Object.entries(priorityConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label} Priority</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Description</label>
            <textarea 
              className="form-input"
              value={selectedProject.description || ''}
              onChange={e => handleUpdateProject(selectedProject.id, { description: e.target.value })}
              placeholder="Add a description..."
              style={{ minHeight: '80px', fontSize: '0.9rem' }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Tags</label>
            <input 
              className="form-input"
              value={(selectedProject.tags || []).join(', ')}
              onChange={e => handleUpdateProject(selectedProject.id, { 
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
              })}
              placeholder="Add tags (comma separated)..."
            />
          </div>

          {/* Tasks Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px' 
            }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckSquare size={14} />
                Tasks
              </label>
              <button className="btn btn-sm" onClick={() => setShowTaskForm(true)}>
                <Plus size={14} />
              </button>
            </div>
            
            {showTaskForm && (
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                marginBottom: '10px',
                padding: '10px',
                background: 'var(--grey-100)',
                borderRadius: '8px'
              }}>
                <input 
                  className="form-input"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder="Add a task..."
                  autoFocus
                  onKeyPress={e => e.key === 'Enter' && handleAddTask()}
                />
                <button className="btn btn-sm btn-primary" onClick={handleAddTask}>
                  <Plus size={14} />
                </button>
                <button className="btn btn-sm" onClick={() => { setShowTaskForm(false); setNewTask(''); }}>
                  <X size={14} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(selectedProject.tasks || []).length === 0 ? (
                <p style={{ fontSize: '0.8rem', opacity: 0.5, textAlign: 'center', padding: '10px' }}>
                  No tasks yet
                </p>
              ) : (
                selectedProject.tasks.map(task => (
                  <div 
                    key={task.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px',
                      background: task.completed ? 'var(--grey-100)' : 'transparent',
                      borderRadius: '6px',
                      opacity: task.completed ? 0.6 : 1
                    }}
                  >
                    <button 
                      className="btn btn-sm"
                      onClick={() => handleToggleTask(task.id)}
                      style={{ padding: '2px' }}
                    >
                      {task.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <span style={{ 
                      fontSize: '0.85rem',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      flex: 1
                    }}>
                      {task.title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px' 
            }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} />
                Notes
              </label>
              <button className="btn btn-sm" onClick={() => setShowNoteForm(true)}>
                <Plus size={14} />
              </button>
            </div>

            {showNoteForm && (
              <div style={{ marginBottom: '10px' }}>
                <textarea 
                  className="form-input"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  autoFocus
                  style={{ minHeight: '100px', marginBottom: '6px' }}
                />
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-sm" onClick={() => { setShowNoteForm(false); setNewNote(''); }}>
                    Cancel
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={handleAddNote}>
                    <Save size={14} /> Save Note
                  </button>
                </div>
              </div>
            )}

            <div style={{ 
              fontSize: '0.85rem', 
              whiteSpace: 'pre-wrap',
              opacity: 0.8,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {selectedProject.notes || 'No notes yet. Click + to add one.'}
            </div>
          </div>

          {/* Meta Info */}
          <div style={{ 
            paddingTop: '16px', 
            borderTop: '1px solid var(--grey-200)',
            fontSize: '0.75rem',
            opacity: 0.6
          }}>
            <div>Created: {formatDate(selectedProject.created_at)}</div>
            <div>Updated: {formatDate(selectedProject.updated_at)}</div>
            {selectedProject.archived_at && (
              <div>Archived: {formatDate(selectedProject.archived_at)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
