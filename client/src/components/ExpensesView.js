import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Search, RefreshCw, Filter, ChevronDown,
  DollarSign, Calendar, Repeat, Tag, AlertCircle, Check
} from 'lucide-react';

const CATEGORY_COLORS = {
  streaming: '#e50914',
  tech: '#6c5ce7',
  utilities: '#00b894',
  insurance: '#fdcb6e',
  shopping: '#ff7675',
  food: '#fab1a0',
  finance: '#74b9ff',
  fitness: '#a29bfe',
  education: '#00cec9',
  other: '#dfe6e9'
};

const CATEGORY_LABELS = {
  streaming: 'Streaming',
  tech: 'Tech',
  utilities: 'Utilities',
  insurance: 'Insurance',
  shopping: 'Shopping',
  food: 'Food',
  finance: 'Finance',
  fitness: 'Fitness',
  education: 'Education',
  other: 'Other'
};

export default function ExpensesView({ finances = [], api }) {
  const [emailExpenses, setEmailExpenses] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState({ category: 'all', type: 'all', source: 'all' });
  const [loading, setLoading] = useState(true);

  // Fetch email-detected and recurring expenses
  const fetchData = async () => {
    setLoading(true);
    try {
      const [emailRes, recurringRes] = await Promise.all([
        fetch('/api/finances/email-detected'),
        fetch('/api/finances/recurring')
      ]);
      
      const emailData = await emailRes.json();
      const recurringData = await recurringRes.json();
      
      setEmailExpenses(emailData.expenses || []);
      setRecurringExpenses(recurringData);
    } catch (e) {
      console.error('Error fetching expenses:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Scan emails for new expenses
  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/finances/scan', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        console.log(`Found ${data.found} new expenses`);
        await fetchData(); // Refresh data
      }
    } catch (e) {
      console.error('Scan error:', e);
    }
    setScanning(false);
  };

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return emailExpenses.filter(exp => {
      if (filter.category !== 'all' && exp.category !== filter.category) return false;
      if (filter.type !== 'all' && exp.type !== filter.type) return false;
      if (filter.source !== 'all' && exp.source !== filter.source) return false;
      return true;
    });
  }, [emailExpenses, filter]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory = filteredExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});
    return { total, count: filteredExpenses.length, byCategory };
  }, [filteredExpenses]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const categories = [...new Set(emailExpenses.map(e => e.category))];

  if (loading) {
    return (
      <div className="expenses-view">
        <div className="loading-state">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="expenses-view">
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">Email Expenses</h1>
        <button 
          className={`btn btn-primary ${scanning ? 'loading' : ''}`}
          onClick={handleScan}
          disabled={scanning}
        >
          <RefreshCw size={16} className={scanning ? 'spin' : ''} />
          {scanning ? 'Scanning...' : 'Scan Emails'}
        </button>
      </div>

      {/* Recurring Summary Cards */}
      {recurringExpenses && (
        <div className="recurring-summary">
          <div className="stat-card">
            <div className="stat-label">Monthly Recurring</div>
            <div className="stat-value">${recurringExpenses.monthlyTotal?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Yearly Recurring</div>
            <div className="stat-value">${(recurringExpenses.yearlyTotal * 12)?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Subscriptions</div>
            <div className="stat-value">{recurringExpenses.expenses?.length || 0}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <Filter size={16} />
          <select 
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
            ))}
          </select>
        </div>
        <div className="filter-stats">
          Showing {stats.count} expenses • Total: ${stats.total.toFixed(2)}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Detected Expenses</span>
          <Mail size={16} className="card-icon" />
        </div>
        
        {filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <Mail size={48} />
            <p>No email expenses found</p>
            <button className="btn btn-sm" onClick={handleScan}>Scan Now</button>
          </div>
        ) : (
          <div className="expenses-table">
            <table>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Recurring</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="expense-row">
                    <td>
                      <div className="expense-vendor">
                        <strong>{expense.vendor || expense.title}</strong>
                        {expense.emailSubject && (
                          <span className="expense-subject">{expense.emailSubject}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span 
                        className="category-badge"
                        style={{ backgroundColor: CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other }}
                      >
                        {CATEGORY_LABELS[expense.category] || expense.category}
                      </span>
                    </td>
                    <td className="amount-cell">
                      ${Number(expense.amount).toFixed(2)}
                    </td>
                    <td>{formatDate(expense.date)}</td>
                    <td>
                      {expense.recurring?.is_recurring ? (
                        <span className="recurring-badge">
                          <Repeat size={12} />
                          {expense.recurring.frequency}
                        </span>
                      ) : (
                        <span className="one-time">One-time</span>
                      )}
                    </td>
                    <td>
                      <span className="source-badge">
                        <Mail size={12} />
                        Email
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {Object.keys(stats.byCategory).length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">By Category</span>
            <Tag size={16} className="card-icon" />
          </div>
          <div className="category-breakdown">
            {Object.entries(stats.byCategory).map(([cat, amount]) => (
              <div key={cat} className="category-row">
                <div className="category-info">
                  <span 
                    className="category-dot"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other }}
                  />
                  <span>{CATEGORY_LABELS[cat] || cat}</span>
                </div>
                <div className="category-amount">
                  ${amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .expenses-view {
          padding: 20px;
        }
        .recurring-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 12px 16px;
          background: var(--white);
          border-radius: 8px;
          border: var(--border-thin);
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-group select {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
        }
        .expenses-table {
          overflow-x: auto;
        }
        .expenses-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .expenses-table th,
        .expenses-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .expenses-table th {
          font-weight: 600;
          color: var(--grey-500);
          font-size: 0.85rem;
          text-transform: uppercase;
        }
        .expense-row:hover {
          background: rgba(0,0,0,0.02);
        }
        .expense-vendor {
          display: flex;
          flex-direction: column;
        }
        .expense-subject {
          font-size: 0.75rem;
          color: var(--grey-400);
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .amount-cell {
          font-weight: 600;
          color: #e74c3c;
        }
        .category-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          color: white;
          font-weight: 500;
        }
        .recurring-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #e8f5e9;
          color: #2e7d32;
          border-radius: 12px;
          font-size: 0.75rem;
          text-transform: capitalize;
        }
        .one-time {
          color: var(--grey-400);
          font-size: 0.8rem;
        }
        .source-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #e3f2fd;
          color: #1565c0;
          border-radius: 12px;
          font-size: 0.75rem;
        }
        .category-breakdown {
          padding: 8px 0;
        }
        .category-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .category-row:last-child {
          border-bottom: none;
        }
        .category-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .category-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .category-amount {
          font-weight: 600;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--grey-400);
        }
        .empty-state svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .loading-state {
          text-align: center;
          padding: 40px;
          color: var(--grey-400);
        }
      `}</style>
    </div>
  );
}
