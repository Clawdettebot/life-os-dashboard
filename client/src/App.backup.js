import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('');
  const [subagents, setSubagents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    // Connect to server
    const newSocket = io('http://76.13.119.78:3000');
    setSocket(newSocket);

    // Listen for updates
    newSocket.on('status_update', (data) => {
      setStatus(data.status);
    });

    newSocket.on('command_result', (data) => {
      setOutput(JSON.stringify(data, null, 2));
    });

    // Fetch initial data
    fetchData();

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, subagentsRes, sessionsRes, projectsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/subagents'),
        fetch('/api/sessions'),
        fetch('/api/projects')
      ]);

      const statusData = await statusRes.json();
      const subagentsData = await subagentsRes.json();
      const sessionsData = await sessionsRes.json();
      const projectsData = await projectsRes.json();

      setStatus(statusData.status || 'Unknown');
      setSubagents(subagentsData.subagents ? subagentsData.subagents.split('\n') : []);
      setSessions(sessionsData.sessions ? sessionsData.sessions.split('\n') : []);
      setProjects(projectsData.projects ? projectsData.projects.split('\n') : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (socket && command.trim()) {
      socket.emit('run_command', { command: command.trim() });
      setCommand('');
    }
  };

  const spawnSubagent = async () => {
    const task = prompt('Enter task for new subagent:');
    if (task) {
      try {
        const response = await fetch('/api/subagents/spawn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task })
        });
        const result = await response.json();
        setOutput(JSON.stringify(result, null, 2));
        fetchData(); // Refresh data
      } catch (error) {
        setOutput(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="App">
      <header className="dashboard-header">
        <h1>🦞 OpenClaw Dashboard</h1>
        <div className="status-indicator">
          <span className={`status-light ${status.includes('running') ? 'active' : 'inactive'}`}></span>
          <span>{status.includes('running') ? 'Online' : 'Offline'}</span>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'status' ? 'active' : ''}
          onClick={() => setActiveTab('status')}
        >
          System Status
        </button>
        <button 
          className={activeTab === 'subagents' ? 'active' : ''}
          onClick={() => setActiveTab('subagents')}
        >
          Subagents
        </button>
        <button 
          className={activeTab === 'projects' ? 'active' : ''}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        <button 
          className={activeTab === 'terminal' ? 'active' : ''}
          onClick={() => setActiveTab('terminal')}
        >
          Terminal
        </button>
      </nav>

      <main className="dashboard-main">
        {activeTab === 'status' && (
          <div className="tab-content">
            <h2>System Status</h2>
            <div className="status-card">
              <h3>OpenClaw Status</h3>
              <pre>{status}</pre>
            </div>
            <div className="quick-stats">
              <div className="stat-card">
                <h4>Active Sessions</h4>
                <span className="stat-number">{sessions.length}</span>
              </div>
              <div className="stat-card">
                <h4>Subagents</h4>
                <span className="stat-number">{subagents.length}</span>
              </div>
              <div className="stat-card">
                <h4>Projects</h4>
                <span className="stat-number">{projects.length}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subagents' && (
          <div className="tab-content">
            <h2>Subagents Management</h2>
            <button className="spawn-button" onClick={spawnSubagent}>
              Spawn New Subagent
            </button>
            <div className="subagents-list">
              {subagents.map((subagent, index) => (
                <div key={index} className="subagent-card">
                  <h4>Subagent {index + 1}</h4>
                  <pre>{subagent}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="tab-content">
            <h2>Creative Empire Projects</h2>
            <div className="projects-grid">
              {projects.map((project, index) => (
                <div key={index} className="project-card">
                  <h4>Project {index + 1}</h4>
                  <pre>{project}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="tab-content">
            <h2>Command Terminal</h2>
            <form onSubmit={handleCommandSubmit} className="command-form">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter OpenClaw command..."
                className="command-input"
              />
              <button type="submit" className="command-button">
                Run Command
              </button>
            </form>
            {output && (
              <div className="output-container">
                <h4>Output:</h4>
                <pre className="command-output">{output}</pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;