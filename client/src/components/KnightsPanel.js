import React, { useState } from 'react';
import { Brain, Shield, Calendar, Package, ListTodo, BookOpen, Radio, Crown } from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';

// Knight configurations - The Round Table crew
const KNIGHTS = [
  { id: 'sirclawthchilds', name: 'Sir Clawthchilds', section: 'finances', description: 'Finances, CRM & Inventory', color: '#4ade80', icon: Shield },
  { id: 'knaightaffairs', name: 'Knaight of Affairs', section: 'calendar', description: 'Calendar & Streams', color: '#c4b5fd', icon: Calendar },
  { id: 'shrimpsoldier', name: 'Shrimp Soldier', section: 'ideas', description: 'Ideas, Notes & Journals', color: '#f8b6cc', icon: Package },
  { id: 'labrina', name: 'Labrina', section: 'blog', description: 'Scheduler & Content', color: '#38bdf8', icon: Radio },
  { id: 'knowledgeknaight', name: 'Knowledge Knaight', section: 'cortex', description: 'Memory & Knowledge', color: '#a78bfa', icon: Brain }
];

const KnightsPanel = ({ onSectionClick }) => {
  const [activeKnight, setActiveKnight] = useState(null);

  const handleKnightClick = (knight) => {
    setActiveKnight(knight.id);
    if (onSectionClick) {
      onSectionClick(knight.section);
    }
  };

  return (
    <WidgetCard className="p-4 border-purple-500/20">
      <div className="flex items-center gap-1 mb-4">
        <Crown className="w-4 h-4 text-purple-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Round Table
        </h3>
      </div>
      
      <div className="grid grid-cols-5 gap-1">
        {KNIGHTS.map(knight => {
          const Icon = knight.icon;
          return (
            <button
              key={knight.id}
              onClick={() => handleKnightClick(knight)}
              className={`
                p-2 rounded-lg border transition-all duration-200 text-left
                ${activeKnight === knight.id 
                  ? 'border-white/30 bg-white/10' 
                  : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'}
              `}
              style={{ 
                borderColor: activeKnight === knight.id ? knight.color : undefined,
                boxShadow: activeKnight === knight.id ? `0 0 15px ${knight.color}40` : 'none'
              }}
            >
              <div className="flex items-center gap-1 mb-1">
                <Icon className="w-3 h-3" style={{ color: knight.color }} />
                <span className="text-[9px] font-medium truncate" style={{ color: knight.color, fontFamily: 'Rajdhani, sans-serif' }}>
                  {knight.name}
                </span>
              </div>
              <p className="text-[7px] text-gray-500 truncate">{knight.description}</p>
            </button>
          );
        })}
      </div>
    </WidgetCard>
  );
};

export default KnightsPanel;
export { KNIGHTS };
