import React, { useState } from 'react';
import { 
  Star, Heart, Zap, Target, Trophy, Flame,
  Droplets, BookOpen, Dumbbell, Moon, Sun,
  Brain, Music, Code, PenTool, Coffee,
  Camera, Activity, Smile, Frown, Meh,
  ShoppingBag, Home, Car,
  Wifi, Smartphone, Gift, DollarSign, Briefcase,
  Plane, MapPin, Music2, Film, Gamepad2,
  Utensils, Apple, Bike, PersonStanding, Sparkles,
  PawPrint, Flower2, TreePine, Cloud, SunMedium,
  Laptop, Wrench, Hammer, Paintbrush, Pencil
} from 'lucide-react';

const iconLibrary = {
  // General
  star: Star,
  heart: Heart,
  zap: Zap,
  target: Target,
  trophy: Trophy,
  flame: Flame,
  
  // Habits & Health
  water: Droplets,
  read: BookOpen,
  workout: Dumbbell,
  sleep: Moon,
  wake: Sun,
  brain: Brain,
  
  // Creative
  music: Music,
  code: Code,
  pen: PenTool,
  coffee: Coffee,
  camera: Camera,
  
  // Emotions
  smile: Smile,
  frown: Frown,
  meh: Meh,
  
  // Finance
  shopping: ShoppingBag,
  home: Home,
  car: Car,
  wifi: Wifi,
  smartphone: Smartphone,
  gift: Gift,
  dollar: DollarSign,
  briefcase: Briefcase,
  
  // Travel
  plane: Plane,
  location: MapPin,
  
  // Entertainment
  music2: Music2,
  film: Film,
  game: Gamepad2,
  
  // Food & Health
  utensils: Utensils,
  apple: Apple,
  bike: Bike,
  person: PersonStanding,
  
  // Nature
  sparkles: Sparkles,
  paw: PawPrint,
  flower: Flower2,
  tree: TreePine,
  cloud: Cloud,
  sunMedium: SunMedium,
  
  // Work
  laptop: Laptop,
  wrench: Wrench,
  hammer: Hammer,
  paintbrush: Paintbrush,
  pencil: Pencil
};

const iconCategories = {
  'All': Object.keys(iconLibrary),
  'Health': ['water', 'workout', 'sleep', 'wake', 'brain', 'apple', 'bike'],
  'Creative': ['music', 'code', 'pen', 'camera', 'paintbrush', 'pencil'],
  'Finance': ['shopping', 'dollar', 'briefcase', 'gift', 'home', 'car'],
  'Work': ['laptop', 'briefcase', 'wrench', 'hammer', 'code'],
  'Nature': ['flower', 'tree', 'cloud', 'sunMedium', 'sparkles', 'paw'],
  'Travel': ['plane', 'location', 'car'],
  'Emotions': ['smile', 'frown', 'meh', 'heart']
};

function IconPicker({ selectedIcon, onSelect, color = '#3b82f6' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = iconCategories[activeCategory].filter(iconKey => 
    iconKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SelectedIconComponent = iconLibrary[selectedIcon] || Star;

  return (
    <div className="icon-picker">
      <button 
        className="icon-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: color + '20',
          border: `2px solid ${color}`,
          borderRadius: '8px',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <SelectedIconComponent size={20} color={color} />
        <span style={{ fontSize: '0.75rem', color: color }}>
          {selectedIcon || 'Select Icon'}
        </span>
      </button>

      {isOpen && (
        <div className="icon-picker-dropdown" style={{
          position: 'absolute',
          zIndex: 1000,
          background: 'var(--white)',
          border: 'var(--border-thin)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: 'var(--shadow-manga-lg)',
          marginTop: '8px',
          minWidth: '300px'
        }}>
          <input
            type="text"
            placeholder="Search icons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'var(--border-thin)',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '0.875rem'
            }}
          />

          <div className="icon-categories" style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            flexWrap: 'wrap'
          }}>
            {Object.keys(iconCategories).map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                style={{
                  padding: '4px 12px',
                  border: activeCategory === category ? `2px solid ${color}` : 'var(--border-thin)',
                  borderRadius: '16px',
                  background: activeCategory === category ? color + '20' : 'transparent',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: activeCategory === category ? color : 'var(--ink)'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="icon-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {filteredIcons.map(iconKey => {
              const IconComponent = iconLibrary[iconKey];
              return (
                <button
                  key={iconKey}
                  onClick={() => {
                    onSelect(iconKey);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '8px',
                    border: selectedIcon === iconKey ? `2px solid ${color}` : 'var(--border-thin)',
                    borderRadius: '8px',
                    background: selectedIcon === iconKey ? color + '20' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={iconKey}
                >
                  <IconComponent size={20} color={selectedIcon === iconKey ? color : 'var(--grey-500)'} />
                  <span style={{ fontSize: '0.6rem', textTransform: 'capitalize' }}>
                    {iconKey}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default IconPicker;
