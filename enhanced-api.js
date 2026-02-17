const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Enhanced API endpoints for creative empire integration

// Memory system integration
app.get('/api/memory/all', async (req, res) => {
  try {
    const memoryPath = '/root/.openclaw/workspace/MEMORY.md';
    const content = await fs.readFile(memoryPath, 'utf8');
    
    // Parse memory sections
    const sections = {};
    const lines = content.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').trim();
        sections[currentSection] = [];
      } else if (currentSection && line.trim()) {
        sections[currentSection].push(line.trim());
      }
    });
    
    res.json({ sections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Content calendar system
app.get('/api/content/calendar', async (req, res) => {
  try {
    const calendarPath = '/root/.openclaw/workspace/content_calendar_a_few_things.md';
    const content = await fs.readFile(calendarPath, 'utf8');
    
    // Parse content calendar
    const calendar = {
      title: 'A Few Things Release Campaign',
      releaseDate: 'February 25th, 2025',
      weeks: []
    };
    
    const weekPattern = /## Week (\d+) \(([^)]+)\)/g;
    const dayPattern = /### February (\d+) \(([^)]+)\)/g;
    
    let weekMatch;
    while ((weekMatch = weekPattern.exec(content)) !== null) {
      const week = {
        number: parseInt(weekMatch[1]),
        dateRange: weekMatch[2],
        days: []
      };
      
      // Find days within this week
      let dayMatch;
      while ((dayMatch = dayPattern.exec(content)) !== null) {
        const dayIndex = content.indexOf(dayMatch[0]);
        if (dayIndex > weekMatch.index && (weekMatch.index + 1000 > dayIndex)) { // Rough boundary check
          const day = {
            date: parseInt(dayMatch[1]),
            dayOfWeek: dayMatch[2],
            content: {}
          };
          
          // Extract content details
          const lines = content.substring(dayIndex).split('\n');
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('### ')) break; // Next day
            if (line.startsWith('- **')) {
              const [key, value] = line.replace('- **', '').split(':**');
              day.content[key.trim()] = value ? value.trim() : '';
            }
          }
          
          week.days.push(day);
        }
      }
      
      calendar.weeks.push(week);
    }
    
    res.json(calendar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Project overview with detailed info
app.get('/api/projects/detailed', async (req, res) => {
  try {
    const projectsDir = '/root/.openclaw/workspace/projects';
    const files = await fs.readdir(projectsDir);
    
    const projects = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(projectsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Parse project file
        const project = {
          filename: file,
          title: '',
          status: 'unknown',
          category: 'uncategorized',
          lastModified: (await fs.stat(filePath)).mtime
        };
        
        // Extract title and key info
        const lines = content.split('\n');
        lines.forEach(line => {
          if (line.startsWith('# ')) {
            project.title = line.replace('# ', '').trim();
          }
          if (line.includes('Status:')) {
            project.status = line.split('Status:')[1].trim();
          }
          if (line.includes('Category:')) {
            project.category = line.split('Category:')[1].trim();
          }
        });
        
        projects.push(project);
      }
    }
    
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Asset library browser
app.get('/api/assets/library', async (req, res) => {
  try {
    const assetsDir = '/root/.openclaw/workspace/assets';
    const categories = {};
    
    const scanDirectory = async (dir, category = '') => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          const newCategory = category ? `${category}/${item.name}` : item.name;
          await scanDirectory(path.join(dir, item.name), newCategory);
        } else if (item.isFile() && !item.name.startsWith('.')) {
          const filePath = path.join(dir, item.name);
          const stat = await fs.stat(filePath);
          
          if (!categories[category]) categories[category] = [];
          categories[category].push({
            name: item.name,
            size: stat.size,
            modified: stat.mtime,
            type: path.extname(item.name)
          });
        }
      }
    };
    
    await scanDirectory(assetsDir);
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Task management system
app.get('/api/tasks', async (req, res) => {
  try {
    // Look for task files in workspace
    const taskFiles = [
      '/root/.openclaw/workspace/HEARTBEAT.md',
      '/root/.openclaw/workspace/PROJECTS.md'
    ];
    
    const tasks = {
      active: [],
      completed: [],
      scheduled: []
    };
    
    for (const filePath of taskFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        
        // Extract tasks from project files
        if (filePath.includes('PROJECTS.md')) {
          const lines = content.split('\n');
          lines.forEach(line => {
            if (line.includes('Next Actions')) {
              const actionMatch = line.match(/-\s+\[([ x])\]\s+(.+)/);
              if (actionMatch) {
                tasks.active.push({
                  description: actionMatch[2],
                  completed: actionMatch[1] === 'x',
                  source: 'PROJECTS.md'
                });
              }
            }
          });
        }
        
        // Extract from heartbeat
        if (filePath.includes('HEARTBEAT.md')) {
          const lines = content.split('\n');
          lines.forEach(line => {
            if (line.includes('Critical Daily Tasks') || line.includes('Health Checks')) {
              // Parse task lines
              const taskMatch = line.match(/^-\s+(.+)/);
              if (taskMatch) {
                tasks.scheduled.push({
                  description: taskMatch[1],
                  source: 'HEARTBEAT.md'
                });
              }
            }
          });
        }
      } catch (err) {
        console.log(`Could not read ${filePath}: ${err.message}`);
      }
    }
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics and insights
app.get('/api/analytics', async (req, res) => {
  try {
    const workspaceDir = '/root/.openclaw/workspace';
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      projectCount: 0,
      memoryEntries: 0,
      lastActivity: null
    };
    
    const scanWorkspace = async (dir) => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          await scanWorkspace(path.join(dir, item.name));
        } else if (item.isFile() && item.name.endsWith('.md')) {
          const filePath = path.join(dir, item.name);
          const stat = await fs.stat(filePath);
          
          stats.totalFiles++;
          stats.totalSize += stat.size;
          
          if (filePath.includes('projects/')) stats.projectCount++;
          if (filePath.includes('MEMORY.md')) {
            const content = await fs.readFile(filePath, 'utf8');
            stats.memoryEntries = content.split('\n').filter(line => line.trim()).length;
          }
          
          if (!stats.lastActivity || stat.mtime > stats.lastActivity) {
            stats.lastActivity = stat.mtime;
          }
        }
      }
    };
    
    await scanWorkspace(workspaceDir);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;