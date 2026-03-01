import React, { useEffect, useRef } from 'react';
import AnimatedIcon from '../AnimatedIcon';
import { Calendar, MapPin, Star, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Animation variants for staggered timeline entries
const timelineItemVariants = {
  initial: { opacity: 0, x: -30, scale: 0.95 },
  animate: (i) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24, delay: i * 0.08 }
  })
};

// Card hover animation
const cardHoverVariants = {
  rest: { scale: 1, y: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  hover: { scale: 1.03, y: -4, boxShadow: '0 8px 25px rgba(0,0,0,0.25)', transition: { duration: 0.2 } },
  tap: { scale: 0.98 }
};

// Detail reveal animation
const detailVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

// Helper to safely render any array item
const renderItem = (item) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object') return JSON.stringify(item);
    return String(item);
};

const renderObj = (obj, field) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj[field] === 'string') return obj[field];
    if (typeof obj[field] === 'object') return JSON.stringify(obj[field]);
    return String(obj[field] || '');
};

export default function LayoutTimeline({ entries, color, onSelectEntry, selectedEntry }) {
    const scrollRef = useRef(null);

    // Sort entries: assume missing dates are older.
    const sortedEntries = [...entries].sort((a, b) => {
        let dateA, dateB;
        try {
            const pA = JSON.parse(a.content || "{}");
            dateA = pA.event_date ? new Date(pA.event_date).getTime() : new Date(a.created_at).getTime();
        } catch { dateA = new Date(a.created_at).getTime(); }

        try {
            const pB = JSON.parse(b.content || "{}");
            dateB = pB.event_date ? new Date(pB.event_date).getTime() : new Date(b.created_at).getTime();
        } catch { dateB = new Date(b.created_at).getTime(); }

        return dateB - dateA;
    });

    if (sortedEntries.length === 0) return <div className="cortex-empty">No entries in Timeline.</div>;

    return (
        <div className="timeline-horizontal-layout">
            <div className="timeline-horizontal-track glass-scroll" ref={scrollRef}>
                <div className="timeline-horizontal-line" style={{ backgroundColor: color }}></div>
                <AnimatePresence>
                    {sortedEntries.map((entry, idx) => (
                        <motion.div
                            key={entry.id}
                            custom={idx}
                            initial="initial"
                            animate="animate"
                            variants={timelineItemVariants}
                        >
                            <CardTimelineHorizontal
                                entry={entry}
                                color={color}
                                index={idx}
                                isActive={selectedEntry?.id === entry.id}
                                onClick={() => onSelectEntry(entry)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
                {selectedEntry && (
                    <motion.div
                        className="timeline-detail-below"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={detailVariants}
                    >
                        <DetailEmerald entry={selectedEntry} color={color} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CardTimelineHorizontal({ entry, color, index, isActive, onClick }) {
    let parsedContent = {};
    try {
        if (entry.content && entry.content.startsWith('{')) {
            parsedContent = JSON.parse(entry.content);
        }
    } catch (e) { }

    const dateStr = parsedContent.event_date || new Date(entry.created_at).toLocaleDateString();

    return (
        <motion.div
            className={`timeline-node-horizontal ${isActive ? 'active' : ''}`}
            onClick={onClick}
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            style={{ 
                animationDelay: `${index * 0.05}s`,
                borderColor: isActive ? color : 'transparent',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderRadius: '12px'
            }}
        >
            <div className="timeline-dot-horizontal" style={{ borderColor: color, backgroundColor: isActive ? color : '#1a1a2e' }}></div>
            <div className="timeline-card-horizontal glass-panel" style={{ borderTop: `3px solid ${color}` }}>
                <div className="timeline-date-horizontal" style={{ color: color }}>
                    <AnimatedIcon Icon={Calendar} size={14} className="inline mr-1" />
                    {dateStr}
                </div>
                <h3 className="timeline-title-horizontal text-white text-lg font-bold mb-2">{entry.title}</h3>
                {parsedContent.summary && <p className="timeline-summary text-sm text-gray-400 line-clamp-3">{parsedContent.summary}</p>}
                {!parsedContent.summary && <p className="timeline-summary text-sm text-gray-400 line-clamp-3">{entry.content?.substring(0, 100)}...</p>}
            </div>
        </motion.div>
    );
}

function DetailEmerald({ entry, color }) {
    let parsedContent = {};
    try {
        if (entry.content && entry.content.startsWith('{')) {
            parsedContent = JSON.parse(entry.content);
        } else {
            parsedContent = { content: entry.content };
        }
    } catch (e) {
        parsedContent = { content: entry.content };
    }

    return (
        <motion.div 
            className="timeline-detail-box glass-panel" 
            style={{ borderLeft: `4px solid ${color}` }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
        >
            <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff', fontFamily: 'Outfit, sans-serif' }}>{entry.title}</h2>
            <div className="detail-meta" style={{ display: 'flex', gap: '16px', marginBottom: '24px', opacity: 0.8, fontSize: '0.9rem' }}>
                {parsedContent?.event_date && <span><AnimatedIcon Icon={Calendar} className="inline mr-1" /> {parsedContent?.event_date}</span>}
                {parsedContent?.location && <span><AnimatedIcon Icon={MapPin} className="inline mr-1" /> {parsedContent?.location}</span>}
                {parsedContent?.significance && <span><AnimatedIcon Icon={Star} className="inline mr-1" /> {parsedContent?.significance}</span>}
            </div>

            {parsedContent?.key_figures?.length > 0 && (
                <motion.div 
                    className="detail-section" 
                    style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h4 style={{ color: color, marginBottom: '8px', display: 'flex', alignItems: 'center' }}><Users size={16} className="mr-2" /> Key Figures</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {parsedContent?.key_figures.map((f, i) => (
                            <motion.span 
                                key={i} 
                                style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem' }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + (i * 0.05) }}
                            >
                                {renderItem(f)}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            )}

            {parsedContent?.summary && (
                <motion.p 
                    className="entry-summary" 
                    style={{ lineHeight: 1.6, fontSize: '1.1rem', marginBottom: '24px' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                >
                    {parsedContent?.summary}
                </motion.p>
            )}

            {parsedContent?.timeline_events?.length > 0 && (
                <motion.div 
                    className="detail-section" 
                    style={{ marginBottom: '24px' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h4 style={{ color: color, marginBottom: '12px', display: 'flex', alignItems: 'center' }}><Calendar size={16} className="mr-2" /> Timeline of Events</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {parsedContent?.timeline_events.map((e, i) => (
                            <motion.li 
                                key={i} 
                                style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderLeft: `2px solid rgba(255,255,255,0.1)` }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 + (i * 0.05) }}
                            >
                                <strong style={{ minWidth: '80px', color: color }}>{e.year || renderObj(e, 'year')}</strong>
                                <span>{renderObj(e, 'event')}</span>
                            </motion.li>
                        ))}
                    </ul>
                </motion.div>
            )}

            {(!parsedContent?.summary && !parsedContent?.timeline_events && entry.content) && (
                <div className="entry-content" style={{ marginTop: '15px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {entry.content}
                </div>
            )}
        </motion.div>
    );
}
