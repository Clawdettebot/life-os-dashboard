import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, RefreshCw, Filter, AlertTriangle, DollarSign, 
  Clock, Check, X, Bell, Trash2, Mail
} from 'lucide-react';

const TYPE_CONFIG = {
  refund: { label: 'Refund', color: '#4caf50', icon: '💰' },
  payment_received: { label: 'Payment Received', color: '#2196f3', icon: '💵' },
  bonus: { label: 'Bonus/Earnings', color: '#ff9800', icon: '🎁' },
  urgent: { label: 'Urgent', color: '#f44336', icon: '⚠️' },
  follow_up: { label: 'Follow Up', color: '#9c27b0', icon: '📝' }
};

const PRIORITY_CONFIG = {
  high: { label: 'High', color: '#f44336' },
  medium: { label: 'Medium', color: '#ff9800' },
  low: { label: 'Low', color: '#4caf50' }
};

export default function OpportunitiesView({ api }) {
  const [opportunities, setOpportunities] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', type: 'all', priority: 'all' });
  const [showReminderModal, setShowReminderModal] = useState(null);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/opportunities');
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/opportunities/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchOpportunities();
      }
    } catch (e) {
      console.error('Scan error:', e);
    }
    setScanning(false);
  };

  const handleAction = async (id, action) => {
    try {
      await fetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'dismiss' ? 'dismissed' : 'claimed', action })
      });
      await fetchOpportunities();
    } catch (e) {
      console.error('Error:', e);
    }
  };

  const handleSetReminder = async (id, date) => {
    try {
      await fetch(`/api/opportunities/${id}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderDate: date })
      });
      setShowReminderModal(null);
      await fetchOpportunities();
    } catch (e) {
      console.error('Error:', e);
    }
  };

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (filter.status !== 'all' && opp.status !== filter.status) return false;
      if (filter.type !== 'all' && opp.type !== filter.type) return false;
      if (filter.priority !== 'all' && opp.priority !== filter.priority) return false;
      return true;
    });
  }, [opportunities, filter]);

  const stats = useMemo(() => ({
    pending: opportunities.filter(o => o.status === 'pending').length,
    urgent: opportunities.filter(o => o.priority === 'high' && o.status === 'pending').length,
    total: opportunities.length
  }), [opportunities]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="opportunities-view"><div className="loading">Loading opportunities...</div></div>;
  }

  return (
    <div className="opportunities-view">
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">Money Opportunities</h1>
        <button 
          className={`btn btn-primary ${scanning ? 'loading' : ''}`}
          onClick={handleScan}
          disabled={scanning}
        >
          <RefreshCw size={16} className={scanning ? 'spin' : ''} />
          {scanning ? 'Scanning...' : 'Scan Emails'}
        </button>
      </div>

      {/* Stats */}
      <div className="opp-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card urgent">
          <div className="stat-value">{stats.urgent}</div>
          <div className="stat-label">Urgent</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Found</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <Filter size={16} />
          <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="claimed">Claimed</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
            <option value="all">All Types</option>
            {Object.entries(TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-count">
          {filteredOpportunities.length} opportunities
        </div>
      </div>

      {/* Opportunities List */}
      <div className="opp-list">
        {filteredOpportunities.length === 0 ? (
          <div className="empty-state">
            <Search size={48} />
            <p>No opportunities found</p>
            <button className="btn" onClick={handleScan}>Scan Now</button>
          </div>
        ) : (
          filteredOpportunities.map(opp => (
            <div key={opp.id} className={`opp-card ${opp.status} ${opp.priority}`}>
              <div className="opp-header">
                <span className="opp-type" style={{ backgroundColor: TYPE_CONFIG[opp.type]?.color }}>
                  {TYPE_CONFIG[opp.type]?.icon} {TYPE_CONFIG[opp.type]?.label}
                </span>
                <span className="opp-priority" style={{ color: PRIORITY_CONFIG[opp.priority]?.color }}>
                  {PRIORITY_CONFIG[opp.priority]?.label} Priority
                </span>
              </div>
              
              <div className="opp-body">
                <h3>{opp.title}</h3>
                <p className="opp-desc">{opp.description}</p>
                {opp.amount && (
                  <div className="opp-amount">
                    <DollarSign size={16} />
                    ${opp.amount.toFixed(2)}
                  </div>
                )}
              </div>
              
              <div className="opp-meta">
                <span><Mail size={12} /> {formatDate(opp.emailDate)}</span>
                {opp.reminderDate && (
                  <span className="reminder-set">
                    <Bell size={12} /> Reminder: {formatDate(opp.reminderDate)}
                  </span>
                )}
              </div>
              
              {opp.status === 'pending' && (
                <div className="opp-actions">
                  {opp.type === 'refund' || opp.type === 'payment_received' || opp.type === 'bonus' ? (
                    <button className="btn btn-sm btn-success" onClick={() => handleAction(opp.id, 'claim')}>
                      <Check size={14} /> Claim
                    </button>
                  ) : null}
                  <button className="btn btn-sm" onClick={() => setShowReminderModal(opp.id)}>
                    <Bell size={14} /> Remind
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleAction(opp.id, 'dismiss')}>
                    <X size={14} /> Dismiss
                  </button>
                </div>
              )}
              
              {opp.status === 'claimed' && (
                <div className="opp-status claimed">
                  <Check size={14} /> Claimed
                </div>
              )}
              {opp.status === 'dismissed' && (
                <div className="opp-status dismissed">
                  <X size={14} /> Dismissed
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="modal-overlay" onClick={() => setShowReminderModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Set Reminder</h3>
            <input 
              type="datetime-local" 
              id="reminder-input"
              min={new Date().toISOString().slice(0, 16)}
            />
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowReminderModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                const date = document.getElementById('reminder-input').value;
                if (date) handleSetReminder(showReminderModal, date);
              }}>Set Reminder</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .opportunities-view { padding: 20px; }
        .opp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
        .opp-stats .stat-card.urgent { border-left: 4px solid #f44336; }
        .filters-bar { 
          display: flex; justify-content: space-between; align-items: center; 
          margin-bottom: 20px; padding: 12px 16px; background: var(--white); 
          border-radius: 8px; border: var(--border-thin); 
        }
        .filter-group { display: flex; gap: 8px; align-items: center; }
        .filter-group select { padding: 6px 12px; border-radius: 6px; border: 1px solid #ddd; }
        .opp-list { display: flex; flex-direction: column; gap: 12px; }
        .opp-card { 
          background: var(--white); border-radius: 12px; padding: 16px; 
          border: var(--border-thin); transition: all 0.2s;
        }
        .opp-card:hover { box-shadow: var(--shadow-manga-sm); }
        .opp-card.claimed { opacity: 0.6; }
        .opp-card.dismissed { opacity: 0.4; }
        .opp-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .opp-type { 
          padding: 4px 12px; border-radius: 16px; font-size: 0.8rem; font-weight: 600; color: white; 
        }
        .opp-priority { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .opp-body h3 { margin: 0 0 8px; font-size: 1rem; }
        .opp-desc { color: var(--grey-400); font-size: 0.85rem; margin: 0 0 12px; }
        .opp-amount { 
          display: inline-flex; align-items: center; gap: 4px; 
          font-weight: 700; font-size: 1.2rem; color: #2196f3;
        }
        .opp-meta { display: flex; gap: 16px; margin-top: 12px; font-size: 0.75rem; color: var(--grey-400); }
        .reminder-set { color: #ff9800; }
        .opp-actions { display: flex; gap: 8px; margin-top: 16px; }
        .opp-status { 
          display: flex; align-items: center; gap: 6px; margin-top: 12px; 
          font-size: 0.85rem; font-weight: 600; 
        }
        .opp-status.claimed { color: #4caf50; }
        .opp-status.dismissed { color: var(--grey-400); }
        .empty-state { text-align: center; padding: 60px; color: var(--grey-400); }
        .empty-state svg { opacity: 0.5; margin-bottom: 16px; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); 
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal { background: var(--white); padding: 24px; border-radius: 12px; width: 320px; }
        .modal h3 { margin: 0 0 16px; }
        .modal input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
        .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .loading { text-align: center; padding: 40px; color: var(--grey-400); }
      `}</style>
    </div>
  );
}
