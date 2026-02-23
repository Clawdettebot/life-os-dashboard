import React, { useState, useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';
import { 
  TrendingUp, TrendingDown, Wallet, Calendar, Repeat, 
  ShoppingBag, Coffee, Home, Car, Zap, Heart, 
  Briefcase, Gift, DollarSign, Edit2, Check, X, Plus,
  Mail, RefreshCw, Filter, AlertTriangle, Clock, Bell
} from 'lucide-react';

const categoryIcons = {
  food: Coffee,
  shopping: ShoppingBag,
  housing: Home,
  transport: Car,
  utilities: Zap,
  health: Heart,
  work: Briefcase,
  gift: Gift,
  income: DollarSign,
  transfer: DollarSign,
  other: Wallet
};

const categoryColors = {
  food: '#ff6b6b',
  shopping: '#4ecdc4',
  housing: '#45b7d1',
  transport: '#f9ca24',
  utilities: '#6c5ce7',
  health: '#a29bfe',
  work: '#74b9ff',
  gift: '#fd79a8',
  income: '#00b894',
  transfer: '#00cec9',
  other: '#dfe6e9'
};

// Opportunity type config
const TYPE_CONFIG = {
  refund: { label: 'Refund', color: '#4caf50', icon: '💰' },
  payment_received: { label: 'Payment', color: '#2196f3', icon: '💵' },
  bonus: { label: 'Bonus', color: '#ff9800', icon: '🎁' },
  urgent: { label: 'Urgent', color: '#f44336', icon: '⚠️' },
  follow_up: { label: 'Follow Up', color: '#9c27b0', icon: '📝' }
};

const getCategoryIcon = (category) => {
  const Icon = categoryIcons[category] || Wallet;
  return <Icon size={20} />;
};

export default function FinanceView({ finances = [], api }) {
  const [activeTab, setActiveTab] = useState('transactions'); // transactions, expenses, opportunities
  const [viewMode, setViewMode] = useState('monthly');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    recurring: false
  });
  
  // Email expenses state
  const [emailExpenses, setEmailExpenses] = useState([]);
  const [recurringData, setRecurringData] = useState(null);
  const [scanning, setScanning] = useState(false);
  
  // Opportunities state
  const [opportunities, setOpportunities] = useState([]);
  
  const lineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const lineCanvasRef = useRef(null);
  const doughnutCanvasRef = useRef(null);

  // Fetch email data
  const fetchEmailData = async () => {
    try {
      const [emailRes, recurringRes, oppsRes] = await Promise.all([
        fetch('/api/finances/email-detected'),
        fetch('/api/finances/recurring'),
        fetch('/api/opportunities')
      ]);
      
      const emailData = await emailRes.json();
      const recurringData = await recurringRes.json();
      const oppsData = await oppsRes.json();
      
      setEmailExpenses(emailData.expenses || []);
      setRecurringData(recurringData);
      setOpportunities(oppsData.opportunities || []);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    fetchEmailData();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      await fetch('/api/finances/scan', { method: 'POST' });
      await fetchEmailData();
    } catch (e) {
      console.error('Scan error:', e);
    }
    setScanning(false);
  };

  const handleScanOpps = async () => {
    setScanning(true);
    try {
      await fetch('/api/finances/scan', { method: 'POST' });
      await fetchEmailData();
    } catch (e) {
      console.error('Scan error:', e);
    }
    setScanning(false);
  };

  // Filter transactions based on view mode
  const filteredFinances = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    
    if (viewMode === 'weekly') {
      cutoff.setDate(now.getDate() - 7);
    } else {
      cutoff.setMonth(now.getMonth() - 1);
    }
    
    return finances.filter(f => {
      const date = new Date(f.date || f.created_at);
      return date >= cutoff;
    });
  }, [finances, viewMode]);

  // Stats
  const stats = useMemo(() => {
    const income = filteredFinances
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + Number(f.amount), 0);
    const expenses = filteredFinances
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + Number(f.amount), 0);
    const recurring = filteredFinances.filter(f => f.recurring).length;

    return { income, expenses, balance: income - expenses, recurring };
  }, [filteredFinances]);

  // Chart data
  const chartData = useMemo(() => {
    const expensesByCategory = {};
    const incomeByDate = {};
    const expenseByDate = {};
    
    filteredFinances.forEach(f => {
      if (f.type === 'expense') {
        expensesByCategory[f.category] = (expensesByCategory[f.category] || 0) + Number(f.amount);
        const date = new Date(f.date || f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        expenseByDate[date] = (expenseByDate[date] || 0) + Number(f.amount);
      } else {
        const date = new Date(f.date || f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        incomeByDate[date] = (incomeByDate[date] || 0) + Number(f.amount);
      }
    });
    
    return { expensesByCategory, incomeByDate, expenseByDate };
  }, [filteredFinances]);

  useEffect(() => {
    if (!lineCanvasRef.current || !doughnutCanvasRef.current) return;

    if (lineChartRef.current) lineChartRef.current.destroy();
    if (doughnutChartRef.current) doughnutChartRef.current.destroy();

    const allDates = [...new Set([...Object.keys(chartData.incomeByDate), ...Object.keys(chartData.expenseByDate)])].sort();
    
    lineChartRef.current = new Chart(lineCanvasRef.current, {
      type: 'line',
      data: {
        labels: allDates.slice(-10),
        datasets: [
          { label: 'Income', data: allDates.slice(-10).map(d => chartData.incomeByDate[d] || 0), borderColor: '#00b894', backgroundColor: 'rgba(0, 184, 148, 0.1)', tension: 0.4, fill: true },
          { label: 'Expenses', data: allDates.slice(-10).map(d => chartData.expenseByDate[d] || 0), borderColor: '#ff6b6b', backgroundColor: 'rgba(255, 107, 107, 0.1)', tension: 0.4, fill: true }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
    });

    const categories = Object.keys(chartData.expensesByCategory);
    const amounts = Object.values(chartData.expensesByCategory);
    const colors = categories.map(cat => categoryColors[cat] || categoryColors.other);
    
    doughnutChartRef.current = new Chart(doughnutCanvasRef.current, {
      type: 'doughnut',
      data: { labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)), datasets: [{ data: amounts, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });

    return () => {
      if (lineChartRef.current) lineChartRef.current.destroy();
      if (doughnutChartRef.current) doughnutChartRef.current.destroy();
    };
  }, [chartData]);

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditForm({ ...transaction });
  };

  const handleSave = async (id) => {
    await api.update('finances', id, editForm);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAdd = async () => {
    if (!newTransaction.title || !newTransaction.amount) return;
    await api.create('finances', newTransaction);
    setNewTransaction({ title: '', amount: '', type: 'expense', category: 'food', date: new Date().toISOString().split('T')[0], recurring: false });
    setShowAddForm(false);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="finance-view">
      {/* Tab Navigation */}
      <div className="finance-tabs">
        <button className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
          💰 Transactions
        </button>
        <button className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
          📧 Email Expenses
        </button>
        <button className={`tab-btn ${activeTab === 'opportunities' ? 'active' : ''}`} onClick={() => setActiveTab('opportunities')}>
          💡 Opportunities
        </button>
      </div>

      {/* TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <>
          <div className="grid-4" style={{ marginBottom: '20px' }}>
            <div className="stat-card">
              <div className="stat-label">Income</div>
              <div className="stat-value" style={{ color: '#00b894' }}><TrendingUp size={20} style={{ display: 'inline', marginRight: '5px' }} />${stats.income.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Expenses</div>
              <div className="stat-value" style={{ color: '#ff6b6b' }}><TrendingDown size={20} style={{ display: 'inline', marginRight: '5px' }} />${stats.expenses.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Balance</div>
              <div className="stat-value" style={{ color: stats.balance >= 0 ? '#00b894' : '#ff6b6b' }}><Wallet size={20} style={{ display: 'inline', marginRight: '5px' }} />${stats.balance.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Recurring</div>
              <div className="stat-value"><Repeat size={20} style={{ display: 'inline', marginRight: '5px' }} />{stats.recurring}</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <span className="card-title">Financial Overview</span>
              <div className="view-toggle">
                <button className={`view-toggle-btn ${viewMode === 'weekly' ? 'active' : ''}`} onClick={() => setViewMode('weekly')}><Calendar size={14} /> Weekly</button>
                <button className={`view-toggle-btn ${viewMode === 'monthly' ? 'active' : ''}`} onClick={() => setViewMode('monthly')}><Calendar size={14} /> Monthly</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '300px' }}>
              <div><canvas ref={lineCanvasRef}></canvas></div>
              <div><canvas ref={doughnutCanvasRef}></canvas></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Transactions</span>
              <button className="btn btn-sm" onClick={() => setShowAddForm(!showAddForm)}><Plus size={14} /> Add</button>
            </div>
            
            {showAddForm && (
              <div className="transaction-form" style={{ padding: '15px', background: 'var(--grey-100)', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  <input className="form-input" placeholder="Description" value={newTransaction.title} onChange={e => setNewTransaction({...newTransaction, title: e.target.value})} />
                  <input className="form-input" type="number" placeholder="Amount" value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})} />
                  <select className="form-select" value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value})}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <select className="form-select" value={newTransaction.category} onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}>
                    {Object.keys(categoryIcons).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                  <button className="btn btn-primary" onClick={handleAdd}>Add</button>
                </div>
              </div>
            )}
            
            <div className="transaction-list">
              {filteredFinances.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)).map(transaction => (
                <div key={transaction.id} className="transaction-item" style={{ display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--grey-200)', gap: '15px' }}>
                  {editingId === transaction.id ? (
                    <>
                      <input className="form-input" style={{ flex: 2 }} value={editForm.title || editForm.description || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                      <input className="form-input" type="number" style={{ flex: 1 }} value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} />
                      <select className="form-select" style={{ flex: 1 }} value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                        {Object.keys(categoryIcons).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                      <button className="btn btn-sm btn-primary" onClick={() => handleSave(transaction.id)}><Check size={14} /></button>
                      <button className="btn btn-sm" onClick={handleCancel}><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: categoryColors[transaction.category] || categoryColors.other, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div style={{ flex: 2 }}>
                        <div style={{ fontWeight: '600' }}>{transaction.title || (typeof transaction.description === 'string' ? transaction.description : '')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {formatDate(transaction.date || transaction.created_at)}
                          {transaction.recurring && <Repeat size={12} />}
                          {transaction.source === 'email' && <Mail size={12} />}
                        </div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'right', color: transaction.type === 'income' ? '#00b894' : '#ff6b6b', fontWeight: '600' }}>
                        {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn btn-sm" onClick={() => handleEdit(transaction)}><Edit2 size={14} /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => api.delete('finances', transaction.id)}><X size={14} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* EMAIL EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <>
          <div className="section-header" style={{ marginBottom: '20px' }}>
            <h1 className="section-title">Email Expenses</h1>
            <button className={`btn btn-primary ${scanning ? 'loading' : ''}`} onClick={handleScan} disabled={scanning}>
              <RefreshCw size={16} className={scanning ? 'spin' : ''} />
              {scanning ? 'Scanning...' : 'Scan Emails'}
            </button>
          </div>

          {/* Recurring Summary */}
          {recurringData && (
            <div className="grid-3" style={{ marginBottom: '20px' }}>
              <div className="stat-card">
                <div className="stat-label">Monthly Recurring</div>
                <div className="stat-value">${recurringData.monthlyTotal?.toFixed(2) || '0.00'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Yearly Recurring</div>
                <div className="stat-value">${((recurringData.yearlyTotal || 0) * 12).toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Subscriptions</div>
                <div className="stat-value">{recurringData.expenses?.length || 0}</div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span className="card-title">Detected from Email</span>
              <Mail size={16} />
            </div>
            {emailExpenses.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                <Mail size={48} style={{ opacity: 0.5 }} />
                <p>No email expenses found</p>
                <button className="btn" onClick={handleScan}>Scan Now</button>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Vendor</th><th>Category</th><th>Amount</th><th>Type</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {emailExpenses.map(expense => (
                      <tr key={expense.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{expense.vendor || expense.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--grey-400)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {expense.emailSubject}
                          </div>
                        </td>
                        <td><span className="category-badge" style={{ backgroundColor: categoryColors[expense.category] || categoryColors.other }}>{expense.category}</span></td>
                        <td style={{ fontWeight: 600, color: expense.type === 'income' ? '#00b894' : '#ff6b6b' }}>
                          {expense.type === 'income' ? '+' : '-'}${Number(expense.amount).toFixed(2)}
                        </td>
                        <td>{expense.type}</td>
                        <td>{formatDate(expense.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* OPPORTUNITIES TAB */}
      {activeTab === 'opportunities' && (
        <>
          <div className="section-header" style={{ marginBottom: '20px' }}>
            <h1 className="section-title">Money Opportunities</h1>
            <button className={`btn btn-primary ${scanning ? 'loading' : ''}`} onClick={handleScanOpps} disabled={scanning}>
              <RefreshCw size={16} className={scanning ? 'spin' : ''} />
              {scanning ? 'Scanning...' : 'Scan Emails'}
            </button>
          </div>

          <div className="grid-3" style={{ marginBottom: '20px' }}>
            <div className="stat-card">
              <div className="stat-value">{opportunities.filter(o => o.status === 'pending').length}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #f44336' }}>
              <div className="stat-value">{opportunities.filter(o => o.priority === 'high' && o.status === 'pending').length}</div>
              <div className="stat-label">Urgent</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{opportunities.length}</div>
              <div className="stat-label">Total Found</div>
            </div>
          </div>

          <div className="opp-list">
            {opportunities.length === 0 ? (
              <div className="card empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                <AlertTriangle size={48} style={{ opacity: 0.5 }} />
                <p>No opportunities found</p>
                <button className="btn" onClick={handleScanOpps}>Scan Now</button>
              </div>
            ) : (
              opportunities.map(opp => (
                <div key={opp.id} className="card" style={{ marginBottom: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="category-badge" style={{ backgroundColor: TYPE_CONFIG[opp.type]?.color, marginRight: '8px' }}>
                        {TYPE_CONFIG[opp.type]?.icon} {TYPE_CONFIG[opp.type]?.label}
                      </span>
                      <span style={{ color: opp.priority === 'high' ? '#f44336' : '#999', fontSize: '0.75rem', textTransform: 'uppercase' }}>{opp.priority} priority</span>
                      <h3 style={{ margin: '8px 0' }}>{opp.title}</h3>
                      <p style={{ color: '#666', fontSize: '0.85rem' }}>{opp.description}</p>
                      {opp.amount && <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#2196f3' }}>${opp.amount.toFixed(2)}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {opp.status === 'pending' && (
                        <>
                          <button className="btn btn-sm btn-success"><Check size={14} /> Claim</button>
                          <button className="btn btn-sm btn-danger"><X size={14} /> Dismiss</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <style>{`
        .finance-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          background: #e8e8e8;
          padding: 4px;
          border-radius: 10px;
        }
        .tab-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          color: #666;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .tab-btn:hover {
          color: #333;
        }
        .tab-btn.active {
          color: #fff;
          background: #222;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .category-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          color: white;
          font-weight: 500;
          text-transform: capitalize;
        }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #eee; }
        .data-table th { font-weight: 600; color: #666; font-size: 0.75rem; text-transform: uppercase; }
        .data-table tr:hover { background: #fafafa; }
      `}</style>
    </div>
  );
}
