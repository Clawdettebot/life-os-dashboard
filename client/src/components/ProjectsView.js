import React, { useState, useEffect } from 'react';
import {
  Plus, Folder, Archive, FileText, Tag, Calendar,
  CheckSquare, Square, Trash2, Edit2, ChevronRight,
  ChevronDown, X, Save, ArchiveRestore, AlertCircle,
  Clock, Flag, MoreVertical
} from 'lucide-react';
import { GlassyPill } from './ui/GlassyPill';
import { WidgetCard } from './ui/WidgetCard';
import LobsterScrollArea from './ui/LobsterScrollArea';

const categoryColors = {
  'Cinematic Universe': { bg: '#8b5cf6', glass: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
  'Music & Audio': { bg: '#ec4899', glass: 'bg-pink-500/10 border-pink-500/20 text-pink-400' },
  'Food & Hospitality': { bg: '#f59e0b', glass: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  'Manga & Narrative': { bg: '#10b981', glass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  'Gaming & Interactive': { bg: '#3b82f6', glass: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  'Products & Merch': { bg: '#ef4444', glass: 'bg-red-500/10 border-red-500/20 text-red-400' },
  'Language & Education': { bg: '#06b6d4', glass: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
  'Tech & Infrastructure': { bg: '#6366f1', glass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
  'Uncategorized': { bg: '#94a3b8', glass: 'bg-slate-500/10 border-slate-500/20 text-slate-400' }
};

const statusConfig = {
  'active': { color: '#10b981', label: 'Active', icon: Folder, glass: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' },
  'concept': { color: '#3b82f6', label: 'Concept', icon: AlertCircle, glass: 'bg-blue-500/5 border-blue-500/20 text-blue-400' },
  'in_progress': { color: '#f59e0b', label: 'In Progress', icon: Clock, glass: 'bg-amber-500/5 border-amber-500/20 text-amber-400' },
  'on_hold': { color: '#94a3b8', label: 'On Hold', icon: Archive, glass: 'bg-slate-500/5 border-slate-500/20 text-slate-400' },
  'completed': { color: '#6366f1', label: 'Completed', icon: CheckSquare, glass: 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400' },
  'archived': { color: '#64748b', label: 'Archived', icon: Archive, glass: 'bg-gray-500/5 border-gray-500/20 text-gray-400' }
};

const priorityConfig = {
  'high': { color: '#ef4444', label: 'High', glass: 'bg-red-500/10 text-red-400 border-red-500/20' },
  'medium': { color: '#f59e0b', label: 'Medium', glass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'low': { color: '#10b981', label: 'Low', glass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
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
      const res = await fetch(`/api/projects/${selectedProject.id}`);
      const data = await res.json();
      setSelectedProject(data.project);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh] animate-in-fade-slide">
      {/* Left Panel - Project List */}
      <div className="flex-1 min-w-0 space-y-8">
        {/* Navigation & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            {[
              { id: 'active', label: 'Active Strategy', count: projects.filter(p => p.status !== 'archived').length, icon: Folder },
              { id: 'archived', label: 'Archived Matrix', count: projects.filter(p => p.status === 'archived').length, icon: Archive }
            ].map(tab => (
              <button
                key={tab.id}
                className={`
                  px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3
                  ${activeTab === tab.id ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-gray-500 hover:text-white'}
                `}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={14} />
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${activeTab === tab.id ? 'bg-black/20' : 'bg-white/5'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <GlassyPill variant="primary" className="!px-6 !py-3" onClick={() => setShowNewProjectForm(true)}>
            <Plus size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Spawn Project</span>
          </GlassyPill>
        </div>

        {/* New Project Form Modal */}
        {showNewProjectForm && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in-fade">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowNewProjectForm(false)}></div>
            <WidgetCard className="relative w-full max-w-lg overflow-visible animate-in-slide-up">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-black text-white font-premium tracking-tight uppercase tracking-widest">Initialize Mission</h3>
                <button onClick={() => setShowNewProjectForm(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Project Name</label>
                  <input
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-gray-600"
                    placeholder="Operation title..."
                    value={newProject.title}
                    onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Department</label>
                    <select
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold appearance-none cursor-pointer"
                      value={newProject.category}
                      onChange={e => setNewProject({ ...newProject, category: e.target.value })}
                    >
                      {defaultCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-[#0a0a0b]">{cat.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Priority Scale</label>
                    <select
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold appearance-none cursor-pointer"
                      value={newProject.priority}
                      onChange={e => setNewProject({ ...newProject, priority: e.target.value })}
                    >
                      <option value="high" className="bg-[#0a0a0b]">CRITICAL</option>
                      <option value="medium" className="bg-[#0a0a0b]">STANDARD</option>
                      <option value="low" className="bg-[#0a0a0b]">BUFFER</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mission Brief</label>
                  <textarea
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-medium placeholder:text-gray-600 min-h-[100px] resize-none"
                    placeholder="Define operational goals..."
                    value={newProject.description}
                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tags (Internal Markers)</label>
                  <input
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-mono placeholder:text-gray-600"
                    placeholder="marker1, marker2..."
                    value={newProject.tags}
                    onChange={e => setNewProject({ ...newProject, tags: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-8 bg-white/[0.01] border-t border-white/5 flex gap-3">
                <GlassyPill className="flex-1 !py-4" onClick={() => setShowNewProjectForm(false)}>
                  <span className="text-[10px] font-black uppercase tracking-widest">Abort Initialization</span>
                </GlassyPill>
                <GlassyPill variant="primary" className="flex-2 !py-4" onClick={handleCreateProject}>
                  <Save size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Deploy Matrix</span>
                </GlassyPill>
              </div>
            </WidgetCard>
          </div>
        )}

        {/* Projects by Category */}
        <div className="space-y-12">
          {Object.keys(projectsByCategory).length === 0 ? (
            <div className="py-24 text-center opacity-30 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-8">
                <Folder size={40} />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.4em]">Zero Active Signals in Current Sector</p>
            </div>
          ) : (
            Object.entries(projectsByCategory).map(([category, categoryProjects]) => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-4 group cursor-default">
                  <div className={`w-3 h-3 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.2)]`} style={{ background: categoryColors[category]?.bg || '#94a3b8' }} />
                  <h2 className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em] group-hover:text-white transition-colors">
                    {category}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2.5 py-0.5 rounded-full">
                    {categoryProjects.length} NODE(S)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {categoryProjects.map(project => {
                    const status = statusConfig[project.status] || statusConfig.active;
                    const priority = priorityConfig[project.priority] || priorityConfig.medium;
                    const isSelected = selectedProject?.id === project.id;

                    return (
                      <WidgetCard
                        key={project.id}
                        className={`group/card relative overflow-hidden transition-all duration-500 cursor-pointer p-6
                          ${isSelected ? 'border-amber-500/40 ring-1 ring-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.05)] bg-white/[0.04]' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}
                        `}
                        onClick={() => setSelectedProject(project)}
                      >
                        {isSelected && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/50 glow-amber-sm"></div>}

                        <div className="flex justify-between items-start mb-4">
                          <h4 className={`text-lg font-bold text-white font-premium tracking-tight group-hover/card:text-amber-500 transition-colors ${isSelected ? 'text-amber-500' : ''}`}>
                            {project.title}
                          </h4>
                          <div className="flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            {project.status === 'archived' ? (
                              <button onClick={(e) => { e.stopPropagation(); handleUnarchiveProject(project.id); }} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all">
                                <ArchiveRestore size={12} />
                              </button>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); handleArchiveProject(project.id); }} className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/20 hover:text-white transition-all">
                                <Archive size={12} />
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-2 mb-6 font-medium italic leading-relaxed group-hover/card:text-gray-400">
                          {project.description || 'No operational brief established.'}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-6">
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${status.glass}`}>
                            <status.icon size={10} />
                            {status.label}
                          </div>
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${priority.glass}`}>
                            <Flag size={10} />
                            {priority.label}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] font-mono text-gray-600 uppercase tracking-tighter">
                          <div className="flex items-center gap-1.5">
                            <Clock size={10} />
                            {formatDate(project.updated_at)}
                          </div>
                          {project.tasks && project.tasks.length > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-1000"
                                  style={{ width: `${(project.tasks.filter(t => t.completed).length / project.tasks.length) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-white/60">
                                {project.tasks.filter(t => t.completed).length}/{project.tasks.length}
                              </span>
                            </div>
                          )}
                        </div>

                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-white/5">
                            {project.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-[8px] font-mono text-gray-500 border border-white/5">
                                #{tag}
                              </span>
                            ))}
                            {project.tags.length > 3 && (
                              <span className="text-[8px] font-mono text-gray-600">+{project.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </WidgetCard>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Project Details */}
      {selectedProject && (
        <div className="w-full lg:w-[450px] shrink-0 animate-in-slide-right relative z-20">
          <WidgetCard className="sticky top-8 overflow-hidden border-white/10 shadow-3xl bg-black/40 backdrop-blur-2xl">
            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white font-premium tracking-tight mb-1">{selectedProject.title}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: categoryColors[selectedProject.category]?.bg || '#94a3b8' }}></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{selectedProject.category}</span>
                  </div>
                </div>
                <button
                  className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                  onClick={() => setSelectedProject(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Current State</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black text-white uppercase tracking-widest outline-none appearance-none hover:bg-white/10 transition-all cursor-pointer"
                    value={selectedProject.status}
                    onChange={e => handleUpdateProject(selectedProject.id, { status: e.target.value })}
                  >
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <option key={key} value={key} className="bg-[#0a0a0b]">{config.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Priority LVL</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black text-white uppercase tracking-widest outline-none appearance-none hover:bg-white/10 transition-all cursor-pointer"
                    value={selectedProject.priority}
                    onChange={e => handleUpdateProject(selectedProject.id, { priority: e.target.value })}
                  >
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <option key={key} value={key} className="bg-[#0a0a0b]">{config.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <LobsterScrollArea className="max-h-[calc(100vh-350px)]" contentClassName="p-8 space-y-10 glass-scroll">
              {/* Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-amber-500/60" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Operational Brief</h4>
                </div>
                <textarea
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-sm text-gray-300 leading-relaxed outline-none focus:border-amber-500/30 transition-all italic min-h-[120px] resize-none"
                  value={selectedProject.description || ''}
                  onChange={e => handleUpdateProject(selectedProject.id, { description: e.target.value })}
                  placeholder="Establishing operational parameters..."
                />
              </div>

              {/* Tasks */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <CheckSquare size={16} className="text-emerald-500/60" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Payload Progress</h4>
                  </div>
                  <button
                    className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    onClick={() => setShowTaskForm(true)}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {showTaskForm && (
                  <div className="flex gap-3 animate-in-slide-down">
                    <input
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500/50 transition-all font-bold"
                      value={newTask}
                      onChange={e => setNewTask(e.target.value)}
                      placeholder="Add objective..."
                      autoFocus
                      onKeyPress={e => e.key === 'Enter' && handleAddTask()}
                    />
                    <GlassyPill variant="primary" className="!px-4" onClick={handleAddTask}>
                      <Plus size={16} />
                    </GlassyPill>
                    <button className="text-gray-500 hover:text-white px-2" onClick={() => { setShowTaskForm(false); setNewTask(''); }}>
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="space-y-2.5">
                  {(selectedProject.tasks || []).length === 0 ? (
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center py-8 border border-dashed border-white/5 rounded-2xl">Buffer Empty</p>
                  ) : (
                    selectedProject.tasks.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group/task
                          ${task.completed ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}
                        `}
                      >
                        <button
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all
                            ${task.completed ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500 hover:text-white'}
                          `}
                          onClick={() => handleToggleTask(task.id)}
                        >
                          {task.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                        </button>
                        <span className={`text-xs font-bold leading-none flex-1 ${task.completed ? 'text-emerald-500/50 line-through' : 'text-gray-300'}`}>
                          {task.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-blue-500/60" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Tactical Journal</h4>
                  </div>
                  <button
                    className="text-[10px] font-black text-amber-500 hover:text-white transition-colors uppercase tracking-widest"
                    onClick={() => setShowNoteForm(true)}
                  >
                    Edit Log
                  </button>
                </div>

                {showNoteForm ? (
                  <div className="space-y-4 animate-in-slide-down">
                    <textarea
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-gray-300 leading-relaxed outline-none min-h-[200px] font-mono glass-scroll"
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      placeholder="Input encrypted data..."
                      autoFocus
                    />
                    <div className="flex gap-3 justify-end">
                      <button className="px-6 py-2 text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest" onClick={() => { setShowNoteForm(false); setNewNote(''); }}>Abort</button>
                      <GlassyPill variant="primary" className="!px-8 !py-2" onClick={handleAddNote}>Save Logic</GlassyPill>
                    </div>
                  </div>
                ) : (
                  <LobsterScrollArea className="max-h-[300px]" contentClassName="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-xs text-gray-500 font-mono leading-relaxed whitespace-pre-wrap glass-scroll">
                    {selectedProject.notes || 'No tactical log entries for this mission segment.'}
                  </LobsterScrollArea>
                )}
              </div>
            </LobsterScrollArea>

            <div className="p-8 bg-black/40 border-t border-white/5 flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Temporal Signature</div>
                <div className="text-[10px] font-mono text-gray-400">EXP_{formatDate(selectedProject.created_at)}</div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Active Link</span>
              </div>
            </div>
          </WidgetCard>
        </div>
      )}
    </div>
  );
}
