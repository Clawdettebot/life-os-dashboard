import React, { useState, useEffect } from 'react';

const GoogleCalendarWidget = ({ connected, onViewCalendar }) => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected) {
      fetchUpcomingEvents();
    }
  }, [connected]);

  const fetchUpcomingEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/google-calendar/upcoming?days=7');
      const data = await res.json();
      if (data.events) {
        setUpcomingEvents(data.events.slice(0, 5));
      }
    } catch (e) {
      console.error('Failed to fetch upcoming events:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div className="card-header">
        <span className="card-title">
          {connected ? '📅 Upcoming Events' : '📅 Calendar'}
        </span>
        <span className="card-icon">{connected ? '☁️' : '⚠️'}</span>
        <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={onViewCalendar}>
          {connected ? 'View Calendar' : 'Connect'}
        </button>
      </div>
      <div style={{ padding: '10px 0' }}>
        {!connected ? (
          <div style={{ padding: '15px', textAlign: 'center', opacity: 0.6, fontSize: '0.85rem' }}>
            Google Calendar not connected. 
            <span style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: '5px' }} onClick={onViewCalendar}>
              Set up now.
            </span>
          </div>
        ) : loading ? (
          <div style={{ padding: '15px', textAlign: 'center', opacity: 0.6 }}>
            Loading events...
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div style={{ padding: '15px', textAlign: 'center', opacity: 0.6, fontSize: '0.85rem' }}>
            No upcoming events in the next 7 days.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '5px' }}>
            {upcomingEvents.map((event, i) => (
              <div key={i} style={{
                minWidth: '260px',
                padding: '12px',
                background: 'var(--grey-100)',
                border: 'var(--border-thin)',
                borderRadius: '6px'
              }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '6px' }}>
                  {event.summary || 'Untitled'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--grey-500)', marginBottom: '4px' }}>
                  {new Date(event.start?.dateTime || event.start?.date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })}
                  {event.start?.dateTime && (
                    <span style={{ marginLeft: '8px' }}>
                      {new Date(event.start.dateTime).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
                {event.location && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--grey-400)' }}>
                    📍 {event.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarWidget;