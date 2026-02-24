import React, { useState } from 'react';
import { Shield, Clock, Crown } from 'lucide-react';

// Agent avatars from assets/avatars
const agentAvatars = {
  clawdette: '/avatars/269bd57c-88ba-4d02-9b70-40511a27d1bc.png',
  'knowledge-knaight': '/avatars/2c45e97d-c391-4d77-9778-821e2dee82d6.png',
  'affairs-knaight': '/avatars/8cd7f326-500b-4757-bca1-132886fc8c76.png',
  'clawthchilds': '/avatars/99f2a89b-8c51-4078-af63-10046a333434.png',  // Sir Clawtheus - dark
  'claudnelius': '/avatars/c44a0f21-6530-4e4b-8eb7-a27c8674299b.png',  // shrimp icon (orange)
  'labrina': '/avatars/6f9d0fbf-6011-471b-8740-397b7eeb708f.png',  // green
  soldier: '/avatars/a3010206-b78c-4da9-8971-f83294efe9a6.png'  // yellow
};

const AgentAvatar = ({ agentId, size = 64 }) => {
  const avatarSrc = agentAvatars[agentId];
  
  if (!avatarSrc) {
    // Fallback to SVG shrimp
    const colors = {
      clawdette: '#f97316',
      'knowledge-knaight': '#8b5cf6',
      'affairs-knaight': '#06b6d4',
      'clawthchilds': '#eab308',
      
      'kitchen-knaight': '#ef4444',
      soldier: '#1e293b'
    };
    const color = colors[agentId] || colors.soldier;
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ borderRadius: '50%' }}>
        <ellipse cx="50" cy="55" rx="30" ry="18" fill={color} />
        <circle cx="80" cy="50" r="15" fill={color} />
        <circle cx="85" cy="45" r="3" fill="white" />
        <circle cx="85" cy="45" r="1.5" fill="black" />
        <path d="M90 40 Q95 25 85 20" stroke={color} strokeWidth="2" fill="none" />
        <path d="M88 42 Q92 30 82 25" stroke={color} strokeWidth="2" fill="none" />
        <path d="M20 55 Q10 50 15 60 Q5 55 10 65" fill={color} />
        <path d="M35 65 L30 75 M45 65 L42 75 M55 65 L55 75 M65 65 L68 75" stroke={color} strokeWidth="2" />
        <rect x="40" y="48" width="8" height="4" rx="1" fill={color} opacity="0.7" />
        <rect x="55" y="50" width="8" height="4" rx="1" fill={color} opacity="0.7" />
        <ellipse cx="80" cy="48" rx="12" ry="8" fill={color} opacity="0.3" />
      </svg>
    );
  }
  
  return (
    <img 
      src={avatarSrc} 
      alt="Agent avatar"
      width={size}
      height={size}
      style={{ 
        borderRadius: '50%', 
        objectFit: 'cover',
        border: '2px solid #e2e8f0'
      }}
    />
  );
};

export default function RoundTableView() {
  const [agents] = useState([
    {
      id: 'clawdette',
      name: 'Clawdette',
      role: 'CEO / Manager',
      isCEO: true,
      status: 'active',
      lastActivity: new Date().toISOString(),
      specialty: 'Oversees all operations'
    },
    {
      id: 'knowledge-knaight',
      name: 'Knowledge Knaight',
      role: 'Knowledge Keeper',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      specialty: 'URL processing, Cortex management'
    },
    {
      id: 'affairs-knaight',
      name: 'Knaight of Affairs',
      role: 'Schedule Guardian',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      specialty: 'Calendar, reminders, conflicts'
    },
    {
      id: 'clawthchilds',
      name: 'Sir Clawthchilds',
      role: 'Financial Knaight',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      specialty: 'Email scanning, recurring payments, financial reports'
    },
    {
      id: 'claudnelius',
      name: 'Claudnelius',
      role: 'Code Magician',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      specialty: 'Building tools, editing code, UI design'
    },
    {
      id: 'labrina',
      name: 'Labrina',
      role: 'Social Maven',
      status: 'active',
      lastActivity: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      specialty: 'Social media scheduling, content automation'
    }
  ]);
  
  const [shrimpSoldiers] = useState([
    { id: 1, name: 'Research Shrimp', task: 'Research topic', status: 'idle' },
    { id: 2, name: 'Scanner Shrimp', task: 'Scan emails', status: 'idle' },
    { id: 3, name: 'Writer Shrimp', task: 'Write summary', status: 'idle' },
    { id: 4, name: 'Fetcher Shrimp', task: 'Fetch data', status: 'idle' },
  ]);
  
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  const getStatusColor = (status) => {
    if (status === 'coming_soon') return '#94a3b8';
    return status === 'active' ? '#22c55e' : '#eab308';
  };
  
  const formatLastActivity = (isoString) => {
    if (!isoString) return 'Not started';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* THE KNIGHTS */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Crown size={28} style={{ color: '#fbbf24' }} />
            THE ROUND TABLE
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            Your loyal knights
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {agents.map(agent => (
            <div 
              key={agent.id}
              onClick={() => agent.status !== 'coming_soon' && setSelectedAgent(agent)}
              style={{ 
                background: agent.status === 'coming_soon' ? '#f8fafc' : 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px',
                padding: '24px',
                cursor: agent.status !== 'coming_soon' ? 'pointer' : 'default',
                transition: 'all 0.2s',
                borderLeft: `4px solid ${getStatusColor(agent.status)}`,
                opacity: agent.status === 'coming_soon' ? 0.6 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <AgentAvatar agentId={agent.id} size={64} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{agent.name}</h3>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '13px' }}>{agent.role}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  padding: '4px 10px', 
                  borderRadius: '4px', 
                  fontSize: '11px', 
                  fontWeight: 600,
                  background: agent.status === 'active' ? '#dcfce7' : agent.status === 'coming_soon' ? '#f1f5f9' : '#fef3c7',
                  color: agent.status === 'active' ? '#166534' : agent.status === 'coming_soon' ? '#64748b' : '#92400e'
                }}>
                  {agent.status === 'coming_soon' ? 'COMING SOON' : agent.status.toUpperCase()}
                </span>
                
                {agent.lastActivity && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '12px' }}>
                    <Clock size={12} />
                    {formatLastActivity(agent.lastActivity)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* SHRIMP SOLDIERS */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🦐 SHRIMP SOLDIERS
          <span style={{ fontSize: '12px', fontWeight: 400, color: '#64748b' }}>Spawn one-off task agents</span>
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {shrimpSoldiers.map(soldier => (
            <div key={soldier.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <AgentAvatar agentId="soldier" size={48} />
              <div style={{ marginTop: '8px', fontWeight: 500 }}>{soldier.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{soldier.task}</div>
              <button style={{ marginTop: '8px', padding: '4px 12px', fontSize: '12px', background: '#f0fdf4', border: '1px solid #22c55e', borderRadius: '4px', color: '#166534', cursor: 'pointer' }}>
                Spawn
              </button>
            </div>
          ))}
        </div>
        
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>Spawn Custom Shrimp</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="What should the shrimp do?" 
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
            />
            <button style={{ padding: '8px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}>
              Spawn
            </button>
          </div>
        </div>
      </div>
      
      {/* Detail Modal */}
      {selectedAgent && (
        <div style={{ 
          background: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          padding: '24px',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          maxWidth: '90vw',
          zIndex: 1000,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <AgentAvatar agentId={selectedAgent.id} size={80} />
              <div>
                <h2 style={{ margin: 0, fontSize: '22px' }}>{selectedAgent.name}</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b' }}>{selectedAgent.role}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedAgent(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#64748b' }}
            >
              ×
            </button>
          </div>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <h4 style={{ margin: '0 0 8px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Specialty</h4>
              <p style={{ margin: 0 }}>{selectedAgent.specialty}</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Status</h4>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor(selectedAgent.status) }} />
                {selectedAgent.status === 'active' ? 'Active' : selectedAgent.status === 'coming_soon' ? 'Coming Soon' : 'Idle'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {selectedAgent && (
        <div 
          onClick={() => setSelectedAgent(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        />
      )}
    </div>
  );
}
