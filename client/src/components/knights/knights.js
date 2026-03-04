// KnightSVG - Animated SVG Knights for Round Table
// 7 Knights mapping to dashboard sections

export const KNIGHTS = [
  {
    id: 'eldritch',
    name: 'Eldritch Wizard',
    section: 'cortex',
    color: '#4df2ff',
    description: 'Memory & Knowledge'
  },
  {
    id: 'bullmarket',
    name: 'Bull Market',
    section: 'projects',
    color: '#4ade80',
    description: 'Projects & Finance'
  },
  {
    id: 'crab',
    name: 'Crab Knight',
    section: 'calendar',
    color: '#ff9800',
    description: 'Schedule'
  },
  {
    id: 'shrimp',
    name: 'Shrimp Knight',
    section: 'inventory',
    color: '#f8b6cc',
    description: 'Inventory & Shop'
  },
  {
    id: 'frantic',
    name: 'Frantic Mage',
    section: 'tasks',
    color: '#a78bfa',
    description: 'Tasks & Habits'
  },
  {
    id: 'iridescent',
    name: 'Iridescent Crab',
    section: 'blog',
    color: '#c4b5fd',
    description: 'Content & Blog'
  },
  {
    id: 'aquatic',
    name: 'Aquatic Warrior',
    section: 'streams',
    color: '#38bdf8',
    description: 'Streams & Social'
  }
];

// Get knight by dashboard section
export const getKnightBySection = (section) => {
  return KNIGHTS.find(k => k.section === section);
};

// Get all knights
export const getAllKnights = () => KNIGHTS;
