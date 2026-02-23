/**
 * View Mode Toggle Component
 * Switch between Grid, List, and Section-specific views
 */

import React from 'react';
import { Grid, List, Clock, Map } from 'lucide-react';

const viewModes = {
  grid: { icon: Grid, label: 'Grid' },
  list: { icon: List, label: 'List' },
  timeline: { icon: Clock, label: 'Timeline' },
  compact: { icon: Map, label: 'Compact' }
};

// Get available views per section
export function getAvailableViews(section) {
  const viewsBySection = {
    emerald_tablets: ['grid', 'list', 'timeline'],
    howls_kitchen: ['grid', 'list'],
    hitchhiker_guide: ['grid', 'list', 'compact'],
    all_spark: ['grid', 'list', 'masonry']
  };
  return viewsBySection[section] || ['grid', 'list'];
}

export function ViewModeToggle({ section, activeView, onChange }) {
  const available = getAvailableViews(section);
  
  return (
    <div className="view-mode-toggle" style={{
      display: 'flex',
      gap: '4px',
      background: 'rgba(0,0,0,0.05)',
      padding: '4px',
      borderRadius: '8px'
    }}>
      {available.map(viewKey => {
        const ViewIcon = viewModes[viewKey]?.icon || Grid;
        const isActive = activeView === viewKey;
        
        return (
          <button
            key={viewKey}
            onClick={() => onChange(viewKey)}
            title={viewModes[viewKey]?.label || viewKey}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 10px',
              border: 'none',
              background: isActive ? '#fff' : 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease',
              color: isActive ? '#333' : '#666'
            }}
          >
            <ViewIcon size={16} />
          </button>
        );
      })}
    </div>
  );
}

export default ViewModeToggle;
