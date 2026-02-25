import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Calendar, Star, MessageCircle, X, Check, Trash2 } from 'lucide-react';

export default function ContactsView() {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({});
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('contacts');
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, nudgesRes] = await Promise.all([
        fetch('/api/contacts?limit=50'),
        fetch('/api/contacts/nudges')
      ]);
      const contactsData = await contactsRes.json();
      const nudgesData = await nudgesRes.json();
      setContacts(contactsData.contacts || []);
      setStats(contactsData.stats || {});
      setNudges(nudgesData.nudges || []);
    } catch (e) {
      console.error('Failed to fetch contacts:', e);
    }
    setLoading(false);
  };

  const handleDecision = async (id, decision) => {
    try {
      await fetch(`/api/contacts/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason: '' })
      });
      fetchData();
    } catch (e) {
      console.error('Decision failed:', e);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading contacts...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <User size={28} />
          CRM - Contacts
        </h1>
        <p style={{ color: '#64748b', marginTop: '8px' }}>
          Your relationship network
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.total || 0}</div>
          <div style={{ color: '#64748b', fontSize: '14px' }}>Total Contacts</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>{stats.active || 0}</div>
          <div style={{ color: '#64748b', fontSize: '14px' }}>Active</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>{stats.new || 0}</div>
          <div style={{ color: '#64748b', fontSize: '14px' }}>New</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{stats.ignored || 0}</div>
          <div style={{ color: '#64748b', fontSize: '14px' }}>Ignored</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setView('contacts')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: view === 'contacts' ? '#3b82f6' : '#f1f5f9',
            color: view === 'contacts' ? 'white' : '#64748b',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          All Contacts
        </button>
        <button
          onClick={() => setView('nudges')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: view === 'nudges' ? '#3b82f6' : '#f1f5f9',
            color: view === 'nudges' ? 'white' : '#64748b',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          🔔 Nudges ({nudges.length})
        </button>
      </div>

      {/* Nudges View */}
      {view === 'nudges' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {nudges.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>
              No contacts need attention! 🎉
            </p>
          ) : (
            nudges.map(contact => (
              <div
                key={contact.id}
                style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{contact.name}</div>
                  <div style={{ color: '#64748b', fontSize: '14px' }}>{contact.email}</div>
                  <div style={{ color: '#f59e0b', fontSize: '13px', marginTop: '4px' }}>
                    {contact.reason}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: getScoreColor(contact.relationship_score) }}>
                    {contact.relationship_score}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Score</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleDecision(contact.id, 'active')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#22c55e',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleDecision(contact.id, 'ignored')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#ef4444',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    ✗
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Contacts View */}
      {view === 'contacts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {contacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              style={{
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  {(contact.name || contact.email)[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.name || 'Unknown'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.email}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: contact.status === 'active' ? '#dcfce7' : contact.status === 'ignored' ? '#fee2e2' : '#fef3c7',
                    color: contact.status === 'active' ? '#166534' : contact.status === 'ignored' ? '#991b1b' : '#92400e'
                  }}
                >
                  {contact.status}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '13px' }}>
                  <MessageCircle size={14} />
                  {contact.interaction_count}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Modal */}
      {selectedContact && (
        <div
          onClick={() => setSelectedContact(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0 }}>{selectedContact.name || 'Unknown'}</h2>
                <p style={{ color: '#64748b', margin: '4px 0 0' }}>{selectedContact.email}</p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Relationship Score</span>
                <span style={{ fontWeight: 700, color: getScoreColor(selectedContact.relationship_score) }}>
                  {selectedContact.relationship_score}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Interactions</span>
                <span style={{ fontWeight: 600 }}>{selectedContact.interaction_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Last Contacted</span>
                <span style={{ fontWeight: 600 }}>{formatDate(selectedContact.last_contacted)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Priority</span>
                <span style={{ fontWeight: 600 }}>{selectedContact.priority}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => { handleDecision(selectedContact.id, 'active'); setSelectedContact(null); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#22c55e',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ✓ Approve
              </button>
              <button
                onClick={() => { handleDecision(selectedContact.id, 'ignored'); setSelectedContact(null); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ✗ Ignore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
