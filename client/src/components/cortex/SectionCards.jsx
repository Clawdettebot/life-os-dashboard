/**
 * Custom Cortex Cards by Section
 * Each section gets its own card style
 */

import React from 'react';

// Card wrapper with section-specific styling
export function CortexCard({ entry, section, onClick }) {
  const sectionStyle = getSectionStyle(section);
  
  return (
    <div 
      className={`cortex-card cortex-card-${section}`}
      style={sectionStyle.card}
      onClick={onClick}
    >
      <div style={sectionStyle.header}>
        <span className="card-badge" style={sectionStyle.badge}>
          {entry.category || entry.content_type || 'entry'}
        </span>
        {getStatusBadge(entry.status, section)}
      </div>
      
      <h4 style={sectionStyle.title}>{entry.title}</h4>
      
      <p style={sectionStyle.preview}>
        {getPreview(entry)}
      </p>
      
      <div style={sectionStyle.meta}>
        <span>📅 {formatDate(entry.created_at)}</span>
        {entry.source_url && <span>🔗 Link</span>}
      </div>
      
      {/* Section-specific decorative element */}
      <div style={sectionStyle.decoration} />
    </div>
  );
}

function getSectionStyle(section) {
  const styles = {
    emerald_tablets: {
      card: {
        background: 'linear-gradient(145deg, #fdfbf7 0%, #f5f5f0 100%)',
        borderLeft: '4px solid #10b981',
        boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
      },
      header: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
      badge: { 
        background: '#10b981', 
        color: '#fff', 
        padding: '2px 8px', 
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontFamily: 'var(--font-mono)'
      },
      title: { 
        fontSize: '1rem', 
        fontWeight: '700', 
        marginBottom: '8px',
        color: '#1a1a1a'
      },
      preview: { 
        fontSize: '0.85rem', 
        color: '#666',
        lineHeight: '1.4'
      },
      meta: { 
        display: 'flex', 
        gap: '12px', 
        fontSize: '0.75rem', 
        color: '#999',
        marginTop: '12px'
      },
      decoration: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '30px',
        height: '30px',
        background: 'radial-gradient(circle, #10b98120 0%, transparent 70%)',
        borderRadius: '50%'
      }
    },
    
    howls_kitchen: {
      card: {
        background: '#fff',
        borderLeft: '4px solid #FF6B35',
        position: 'relative',
        overflow: 'hidden',
      },
      header: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
      badge: { 
        background: 'linear-gradient(135deg, #FF6B35, #DC2626)', 
        color: '#fff', 
        padding: '2px 8px', 
        borderRadius: '12px',
        fontSize: '0.7rem'
      },
      title: { 
        fontSize: '1.05rem', 
        fontWeight: '600', 
        marginBottom: '8px',
        color: '#1a1a1a'
      },
      preview: { 
        fontSize: '0.85rem', 
        color: '#555',
        lineHeight: '1.4'
      },
      meta: { 
        display: 'flex', 
        gap: '12px', 
        fontSize: '0.75rem', 
        color: '#FF6B35',
        marginTop: '12px',
        fontWeight: '500'
      },
      decoration: {
        position: 'absolute',
        bottom: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        background: 'radial-gradient(circle, #FF6B3510 0%, transparent 70%)',
        borderRadius: '50%'
      }
    },
    
    hitchhiker_guide: {
      card: {
        background: '#0a1628',
        borderLeft: '4px solid #00D4FF',
        border: '1px solid #00D4FF30',
        color: '#fff'
      },
      header: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
      badge: { 
        background: '#00D4FF20', 
        color: '#00D4FF', 
        padding: '2px 8px', 
        borderRadius: '2px',
        fontSize: '0.7rem',
        fontFamily: 'monospace',
        border: '1px solid #00D4FF40'
      },
      title: { 
        fontSize: '1rem', 
        fontWeight: '600', 
        marginBottom: '8px',
        color: '#fff'
      },
      preview: { 
        fontSize: '0.8rem', 
        color: '#00D4FF90',
        fontFamily: 'monospace',
        lineHeight: '1.5'
      },
      meta: { 
        display: 'flex', 
        gap: '12px', 
        fontSize: '0.7rem', 
        color: '#00D4FF70',
        marginTop: '12px',
        fontFamily: 'monospace'
      },
      decoration: {
        position: 'absolute',
        top: '0',
        right: '0',
        width: '60px',
        height: '60px',
        background: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #00D4FF05 5px, #00D4FF05 10px)',
        borderRadius: '0 0 0 100%'
      }
    },
    
    all_spark: {
      card: {
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a1a 100%)',
        borderLeft: '4px solid #FFD700',
        border: '1px solid #FFD70030',
        position: 'relative',
        overflow: 'hidden'
      },
      header: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
      badge: { 
        background: '#FFD700', 
        color: '#000', 
        padding: '2px 8px', 
        borderRadius: '50%',
        fontSize: '0.7rem',
        fontWeight: '700'
      },
      title: { 
        fontSize: '1.1rem', 
        fontWeight: '700', 
        marginBottom: '8px',
        background: 'linear-gradient(90deg, #FFD700, #F59E0B)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      },
      preview: { 
        fontSize: '0.85rem', 
        color: '#FFD70090',
        fontStyle: 'italic',
        lineHeight: '1.5'
      },
      meta: { 
        display: 'flex', 
        gap: '12px', 
        fontSize: '0.75rem', 
        color: '#FFD70070',
        marginTop: '12px'
      },
      decoration: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, #FFD70015 0%, transparent 70%)',
        pointerEvents: 'none'
      }
    }
  };
  
  return styles[section] || styles.all_spark;
}

function getStatusBadge(status, section) {
  if (status === 'cooked') {
    return <span style={{color: '#10b981', fontSize: '0.8rem'}}>✓</span>;
  }
  if (status === 'wishlist') {
    return <span style={{color: '#FFD700', fontSize: '0.8rem'}}>★</span>;
  }
  return null;
}

function getPreview(entry) {
  try {
    const parsed = JSON.parse(entry.content);
    return parsed.summary || parsed.content?.substring(0, 100) || '';
  } catch {
    return entry.content?.substring(0, 100) || '';
  }
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

export default CortexCard;
