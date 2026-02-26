import React, { useState, useEffect } from 'react';
import {
  BookOpen, Flame, ChefHat, History, Search, Plus,
  Filter, Clock, Tag, ExternalLink, Star, CheckCircle,
  Utensils, MapPin, Calendar, Lightbulb, Network,
  Globe, DollarSign, List, ShieldAlert, Users, Folder,
  ClipboardList, Smile, Sparkles, Mic, FileText, Music, Info, Heart, Film
} from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';
import { SectionParticles, getSectionConfig } from './cortex/SectionBackground';
import ViewModeToggle from './cortex/ViewModeToggle';
import LayoutTimeline from './cortex/LayoutTimeline';
import LayoutWeekender from './cortex/LayoutWeekender';
import LayoutSplitView from './cortex/LayoutSplitView';
import LayoutRecipeBook from './cortex/LayoutRecipeBook';
import './cortex/CortexLayouts.css'; // New Custom Layouts

// Helper to safely render any array item
const renderItem = (item) => {
  if (typeof item === 'string') return item;
  if (typeof item === 'object') return JSON.stringify(item);
  return String(item);
};

// Helper to render objects with common fields
const renderObj = (obj, field) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj[field] === 'string') return obj[field];
  if (typeof obj[field] === 'object') return JSON.stringify(obj[field]);
  return String(obj[field] || '');
};

const SECTIONS = {
  emerald_tablets: {
    label: 'Emerald Tablets',
    icon: History,
    color: '#10b981',
    categories: ['african_american', 'filipino', 'oakland', 'hiphop', 'family']
  },
  hitchhiker_guide: {
    label: "Hitchhiker's Guide",
    icon: BookOpen,
    color: '#00D4FF',
    categories: ['diy', 'foraging', 'wildlife', 'shelter', 'water', 'food_preservation']
  },
  all_spark: {
    label: 'The All Spark',
    icon: Flame,
    color: '#FFD700',
    categories: ['ideas', 'rants', 'comedy', 'art', 'movies', 'manga', 'merch_concepts', 'film', 'skit', 'joke', 'blog', 'music', 'character', 'idea', 'game', 'app']
  },
  howls_kitchen: {
    label: "Howl's Kitchen",
    icon: ChefHat,
    color: '#FF6B35',
    categories: ['vegan', 'beef', 'fish', 'poultry', 'quick', 'cheap', 'dessert']
  }
};

export default function CortexView() {
  const [activeSection, setActiveSection] = useState('all_spark');
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // grid, list, timeline
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    fetchEntries();
    fetchStats();
  }, [activeSection]);

  const fetchEntries = async () => {
    try {
      const res = await fetch(`/api/cortex?section=${activeSection}&limit=50`);
      const data = await res.json();
      setEntries(data);
    } catch (e) {
      console.error('Failed to fetch cortex entries:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/cortex/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      content: form.content.value,
      section: activeSection,
      category: form.category.value
    };

    try {
      await fetch('/api/cortex/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setShowAddModal(false);
      fetchEntries();
      form.reset();
    } catch (e) {
      console.error('Failed to add entry:', e);
    }
  };

  const SectionIcon = SECTIONS[activeSection]?.icon || BookOpen;

  return (
    <div className="cortex-view" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Section-specific animated background */}
      <SectionParticles section={activeSection} />

      {/* Header */}
      <div className="cortex-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', zIndex: 10 }}>
        <div className="cortex-pill-tabs">
          {Object.entries(SECTIONS).map(([key, section]) => {
            const Icon = section.icon;
            return (
              <button
                key={key}
                className={`cortex-pill ${activeSection === key ? 'active' : ''}`}
                onClick={() => { setActiveSection(key); setSelectedEntry(null); }}
                style={{ '--section-color': section.color }}
              >
                <Icon size={16} />
                <span>{section.label}</span>
                {stats[key] > 0 && <span style={{ background: activeSection === key ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem' }}>{stats[key]}</span>}
              </button>
            );
          })}
        </div>

        <div className="cortex-actions" style={{ display: 'flex', gap: '12px' }}>
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search your knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ViewModeToggle
            section={activeSection}
            activeView={viewMode}
            onChange={setViewMode}
          />
          <button
            className="btn btn-secondary"
            onClick={async () => {
              const task = "scan all new entries and look for links. Use internet skill to pull summaries or text, or pull from your own knowledge base to fill in information on cards and entries in the cortex in all categories. Keep things informative and on topic. The goal is to build a personal encyclopedia that you can reference for things that interest you or help you.";
              try {
                await fetch('/api/subagents/spawn', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ task, agentId: 'knowledge-knaight' })
                });
                alert('Subagent spawned! Check the Subagents page for progress.');
              } catch (e) {
                console.error(e);
              }
            }}
            title="Enrich Cortex Knowledge"
          >
            <Plus size={16} /> Enrich
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Entry
          </button>
        </div>
      </div>

      {/* Section-specific content */}
      <div className={`cortex-content cortex-grid view-mode-${viewMode}`}>
        {/* Section Header */}
        <div className="cortex-section-header" style={{ borderLeftColor: SECTIONS[activeSection].color }}>
          <SectionIcon size={24} color={SECTIONS[activeSection].color} />
          <div>
            <h2>{SECTIONS[activeSection].label}</h2>
            <p className="section-description">
              {activeSection === 'emerald_tablets' && 'Historical knowledge: African American, Filipino, Oakland/Bay Area, Hip-Hop, and Family history with timeline views.'}
              {activeSection === 'hitchhiker_guide' && 'Survival knowledge extracted from videos: DIY builds, foraging, wildlife, off-grid living.'}
              {activeSection === 'all_spark' && 'Your inspiration hub: ideas, rants, comedy, art, movies, manga, games, apps, merch concepts.'}
              {activeSection === 'howls_kitchen' && 'Restaurant reviews and recipe tracker. Mark as cooked or wishlist for later.'}
            </p>
          </div>
        </div>

        {/* Entries Grid - Now handled by dynamic layouts */}
        <div className="cortex-dynamic-layout" style={{ position: 'relative', zIndex: 5, paddingTop: '8px' }}>
          {activeSection === 'emerald_tablets' && <LayoutTimeline entries={entries} color={SECTIONS[activeSection].color} onSelectEntry={setSelectedEntry} />}
          {activeSection === 'hitchhiker_guide' && <LayoutWeekender entries={entries} color={SECTIONS[activeSection].color} onSelectEntry={setSelectedEntry} />}
          {activeSection === 'all_spark' && <LayoutSplitView entries={entries} color={SECTIONS[activeSection].color} />}
          {activeSection === 'howls_kitchen' && <LayoutRecipeBook entries={entries} color={SECTIONS[activeSection].color} onSelectEntry={setSelectedEntry} />}
        </div>
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && activeSection !== 'all_spark' && (
        <EntryModal
          entry={selectedEntry}
          section={activeSection}
          color={SECTIONS[activeSection].color}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add to {SECTIONS[activeSection].label}</h3>
              <button className="btn btn-sm" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleQuickAdd}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" name="title" className="form-input" required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" className="form-select">
                  {SECTIONS[activeSection].categories.map(cat => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea name="content" className="form-textarea" rows={6} required />
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual entry card
function EntryModal({ entry, section, color, onClose }) {
  // Parse content
  let parsedContent = {};
  try {
    if (entry.content && entry.content.startsWith('{')) {
      parsedContent = JSON.parse(entry.content) || {};
    } else {
      parsedContent = { content: entry.content };
    }
  } catch (e) {
    parsedContent = { content: entry.content };
  }

  return (
    <div className="modal-overlay active" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal entry-modal" onClick={e => e.stopPropagation()} style={{ borderTopColor: color, maxWidth: '600px', maxHeight: '80vh', overflow: 'auto', background: '#1a1a2e', padding: '20px', color: '#fff', borderRadius: '8px' }}>
        <button onClick={onClose} style={{ float: 'right', background: 'transparent', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', fontSize: '20px' }}>×</button>

        <div className="modal-header" style={{ marginBottom: '15px' }}>
          <h2 style={{ color: 'white', margin: 0 }}>{entry.title}</h2>
          <span style={{ color: '#888', fontSize: '14px' }}>{section.replace('_', ' ')}</span>
        </div>

        <div className="modal-body">
          {section === 'howls_kitchen' && <HowlKitchenDetails parsedContent={parsedContent} />}
          {section === 'hitchhiker_guide' && <HitchhikerDetails parsedContent={parsedContent} />}
          {section === 'emerald_tablets' && <EmeraldDetails parsedContent={parsedContent} />}
          {section === 'all_spark' && <AllSparkDetails parsedContent={parsedContent} />}

          {/* Show raw content if no structured data */}
          {(!parsedContent?.ingredients && !parsedContent?.logline && !parsedContent?.core_idea && entry.content) && (
            <div className="entry-content" style={{ marginTop: '15px', padding: '15px', background: '#252540', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {entry.content}
            </div>
          )}

          {entry.source_url && (
            <div className="entry-source">
              <strong>Source:</strong> <a href={entry.source_url} target="_blank" rel="noopener noreferrer">{entry.source_url}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HowlKitchenDetails({ parsedContent }) {
  if (parsedContent?.content_type === 'recipe') {
    return (
      <div className="entry-details">
        {parsedContent?.ingredients?.length > 0 && (
          <div className="detail-section"><h4><AnimatedIcon Icon={Utensils} className="inline mr-2" /> Ingredients</h4><ul>{parsedContent?.ingredients.map((ing, i) => <li key={i}>{typeof ing === 'object' ? (ing.amount ? `${ing.amount} ` : '') + (ing.item || JSON.stringify(ing)) : String(ing)}</li>)}</ul></div>
        )}
        {parsedContent?.steps?.length > 0 && (
          <div className="detail-section"><h4><AnimatedIcon Icon={ChefHat} className="inline mr-2" /> Steps</h4><ol>{parsedContent?.steps.map((step, i) => <li key={i}>{typeof step === 'object' ? (step.instruction || JSON.stringify(step)) : String(step)}</li>)}</ol></div>
        )}
        {parsedContent?.tips?.length > 0 && (
          <div className="detail-section"><h4><AnimatedIcon Icon={Lightbulb} className="inline mr-2" /> Tips</h4><ul>{parsedContent?.tips.map((tip, i) => <li key={i}>{typeof tip === 'object' ? JSON.stringify(tip) : String(tip)}</li>)}</ul></div>
        )}
        <div className="detail-meta">
          {parsedContent?.cuisine && <span><AnimatedIcon Icon={Globe} className="inline mr-1" /> {parsedContent?.cuisine}</span>}
          {parsedContent?.difficulty && <span><AnimatedIcon Icon={Clock} className="inline mr-1" /> {parsedContent?.difficulty}</span>}
          {parsedContent?.cook_time && <span><AnimatedIcon Icon={Flame} className="inline mr-1" /> {parsedContent?.cook_time}</span>}
        </div>
      </div>
    );
  }
  return (
    <div className="entry-details">
      <div className="detail-meta">
        {parsedContent?.restaurant_name && <span><AnimatedIcon Icon={MapPin} className="inline mr-1" /> {parsedContent?.restaurant_name}</span>}
        {parsedContent?.location && <span><AnimatedIcon Icon={MapPin} className="inline mr-1" /> {parsedContent?.location}</span>}
        {parsedContent?.rating && <span><AnimatedIcon Icon={Star} className="inline mr-1" /> {parsedContent?.rating}/5</span>}
        {parsedContent?.price_range && <span><AnimatedIcon Icon={DollarSign} className="inline mr-1" /> {parsedContent?.price_range}</span>}
      </div>
      {parsedContent?.best_dishes?.length > 0 && <div className="detail-section"><h4><AnimatedIcon Icon={Utensils} className="inline mr-2" /> Best Dishes</h4><ul>{parsedContent?.best_dishes.map((d, i) => <li key={i}>{typeof d === 'object' ? JSON.stringify(d) : String(d)}</li>)}</ul></div>}
      {parsedContent?.notes && <p>{typeof parsedContent?.notes === 'object' ? JSON.stringify(parsedContent?.notes) : String(parsedContent?.notes)}</p>}
    </div>
  );
}

function HitchhikerDetails({ parsedContent }) {
  return (
    <div className="entry-details">
      {parsedContent?.materials?.length > 0 && <div className="detail-section"><h4><AnimatedIcon Icon={List} className="inline mr-2" /> Materials</h4><ul>{parsedContent?.materials.map((m, i) => <li key={i}>{renderItem(m)}</li>)}</ul></div>}
      {parsedContent?.tools_needed?.length > 0 && <div className="detail-section"><h4><AnimatedIcon Icon={List} className="inline mr-2" /> Tools Needed</h4><ul>{parsedContent?.tools_needed.map((t, i) => <li key={i}>{renderItem(t)}</li>)}</ul></div>}
      {parsedContent?.steps?.length > 0 && <div className="detail-section"><h4><AnimatedIcon Icon={List} className="inline mr-2" /> Steps</h4><ol>{parsedContent?.steps.map((s, i) => <li key={i}>{renderObj(s, 'instruction')}{s.time && <span className="step-time"> ({s.time})</span>}</li>)}</ol></div>}
      {parsedContent?.warnings?.length > 0 && <div className="detail-section warnings"><h4><AnimatedIcon Icon={ShieldAlert} className="inline mr-2" /> Warnings</h4><ul>{parsedContent?.warnings.map((w, i) => <li key={i}>{renderItem(w)}</li>)}</ul></div>}
      <div className="detail-meta">
        {parsedContent?.difficulty && <span><AnimatedIcon Icon={Clock} className="inline mr-1" /> {parsedContent?.difficulty}</span>}
        {parsedContent?.time_estimate && <span><AnimatedIcon Icon={Clock} className="inline mr-1" /> {parsedContent?.time_estimate}</span>}
      </div>
    </div>
  );
}

function EmeraldDetails({ parsedContent }) {
  return (
    <div className="entry-details">
      <div className="detail-meta">
        {parsedContent?.event_date && <span><AnimatedIcon Icon={Calendar} className="inline mr-1" /> {parsedContent?.event_date}</span>}
        {parsedContent?.location && <span><AnimatedIcon Icon={MapPin} className="inline mr-1" /> {parsedContent?.location}</span>}
        {parsedContent?.significance && <span><AnimatedIcon Icon={Star} className="inline mr-1" /> {parsedContent?.significance}</span>}
      </div>
      {parsedContent?.key_figures?.length > 0 && <div className="detail-section"><h4><AnimatedIcon Icon={Users} className="inline mr-2" /> Key Figures</h4><ul>{parsedContent?.key_figures.map((f, i) => <li key={i}>{renderItem(f)}</li>)}</ul></div>}
      {parsedContent?.summary && <p className="entry-summary">{parsedContent?.summary}</p>}
      {parsedContent?.timeline_events?.length > 0 && <div className="detail-section"><h4><AnimatedIcon Icon={Calendar} className="inline mr-2" /> Timeline</h4><ul>{parsedContent?.timeline_events.map((e, i) => <li key={i}><strong>{e.year || renderObj(e, 'year')}</strong>: {renderObj(e, 'event')}</li>)}</ul></div>}
    </div>
  );
}

function AllSparkDetails({ parsedContent }) {
  const type = parsedContent?.content_type || 'idea';
  const typeIconMap = { film: Film, skit: Smile, joke: Smile, rant: Flame, blog: FileText, music: Music, character: Users, idea: Lightbulb, voice_note: Mic };
  const TypeIcon = typeIconMap[type] || Lightbulb;
  return (
    <div className="entry-details">
      <div className="detail-meta">
        <span className="type-badge"><AnimatedIcon Icon={TypeIcon} className="inline mr-1" /> {type}</span>
        {parsedContent?.category && <span><AnimatedIcon Icon={Folder} className="inline mr-1" /> {parsedContent?.category}</span>}
        {parsedContent?.status && <span><AnimatedIcon Icon={ClipboardList} className="inline mr-1" /> {parsedContent?.status}</span>}
      </div>
      {type === 'film' && <>{parsedContent?.logline && <p className="entry-summary"><strong>Logline:</strong> {parsedContent?.logline}</p>}{parsedContent?.characters?.length > 0 && <div className="detail-section"><h4><AnimatedIcon Icon={Users} className="inline mr-2" /> Characters</h4><ul>{parsedContent?.characters.map((c, i) => <li key={i}>{renderItem(c)}</li>)}</ul></div>}</>}
      {type === 'music' && <>{parsedContent?.hook_line && <p className="entry-summary"><strong>Hook:</strong> {parsedContent?.hook_line}</p>}{parsedContent?.genre && <span><AnimatedIcon Icon={Music} className="inline mr-1" /> {parsedContent?.genre}</span>}</>}
      {type === 'rant' && parsedContent?.key_points?.length > 0 && <div className="detail-section"><h4><AnimatedIcon Icon={Flame} className="inline mr-2" /> Key Points</h4><ul>{parsedContent?.key_points.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
      {type === 'blog' && <>{parsedContent?.hook && <p className="entry-summary"><strong>Hook:</strong> {parsedContent?.hook}</p>}{parsedContent?.outline?.length > 0 && <div className="detail-section"><h4><AnimatedIcon Icon={FileText} className="inline mr-2" /> Outline</h4><ol>{parsedContent?.outline.map((o, i) => <li key={i}>{o}</li>)}</ol></div>}</>}
      {type === 'character' && <>{parsedContent?.backstory && <p><strong>Backstory:</strong> {parsedContent?.backstory}</p>}{parsedContent?.personality && <div className="detail-section"><h4><AnimatedIcon Icon={Heart} className="inline mr-2" /> Personality</h4><ul>{parsedContent?.personality.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}</>}
      {parsedContent?.mood_keywords?.length > 0 && <div className="detail-section"><h4><AnimatedIcon Icon={Sparkles} className="inline mr-2" /> Mood</h4><div className="mood-tags">{parsedContent?.mood_keywords.map((m, i) => <span key={i}>{renderItem(m)}</span>)}</div></div>}
      {parsedContent?.inspiration && <p><strong><AnimatedIcon Icon={Sparkles} className="inline mr-2" /> Inspiration:</strong> {parsedContent?.inspiration}</p>}
      {parsedContent?.core_idea && <p className="entry-summary">{parsedContent?.core_idea}</p>}
      {/* Show voice note transcript if available */}
      {parsedContent?.transcript && <div className="detail-section"><h4><AnimatedIcon Icon={Mic} className="inline mr-2" /> Transcript</h4><p style={{ whiteSpace: 'pre-wrap' }}>{parsedContent?.transcript}</p></div>}
    </div>
  );
}
