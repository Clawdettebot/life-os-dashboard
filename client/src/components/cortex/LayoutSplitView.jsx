import React, { useState, useEffect } from 'react';
import AnimatedIcon from '../AnimatedIcon';
import { Film, Smile, Flame, FileText, Music, Users, Lightbulb, Mic, Folder, ClipboardList, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const typeIconMap = { film: Film, skit: Smile, joke: Smile, rant: Flame, blog: FileText, music: Music, character: Users, idea: Lightbulb, voice_note: Mic };

export default function LayoutSplitView({ entries, color }) {
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (entries.length > 0 && (!selectedEntry || !entries.find(e => e.id === selectedEntry.id))) {
            setSelectedEntry(entries[0]);
        }
    }, [entries, selectedEntry]);

    const categories = ['all', ...new Set(entries.map(e => e.content_type || e.category || 'idea'))];

    const filteredEntries = filter === 'all' ? entries : entries.filter(e => (e.content_type || e.category || 'idea') === filter);

    if (entries.length === 0) return <div className="cortex-empty">No entries in The All Spark.</div>;

    return (
        <div className="splitview-container">
            <div className="splitview-list glass-scroll">
                <div className="splitview-filters glass-scroll">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`misso-pill ${filter === cat ? 'active' : ''}`}
                            onClick={() => setFilter(cat)}
                        >
                            {cat.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <AnimatePresence>
                        {filteredEntries.map(entry => (
                            <motion.div
                                key={entry.id}
                                layout="position"
                                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                            >
                                <CardMisso
                                    entry={entry}
                                    color={color}
                                    isActive={selectedEntry?.id === entry.id}
                                    onClick={() => setSelectedEntry(entry)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <div className="splitview-detail glass-scroll">
                <AnimatePresence mode="wait">
                    {selectedEntry ? (
                        <motion.div
                            key={selectedEntry.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{ height: '100%' }}
                        >
                            <DetailMisso entry={selectedEntry} color={color} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ opacity: 0.5, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            Select an entry to view details
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function CardMisso({ entry, color, isActive, onClick }) {
    let parsedContent = {};
    try {
        if (entry.content && entry.content.startsWith('{')) {
            parsedContent = JSON.parse(entry.content);
        }
    } catch (e) { }

    const type = parsedContent.content_type || entry.category || 'idea';
    const TypeIcon = typeIconMap[type] || Lightbulb;

    return (
        <motion.div
            className={`misso-card ${isActive ? 'active' : ''}`}
            onClick={onClick}
            whileHover={{ scale: isActive ? 1.02 : 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={isActive ? { borderColor: color, boxShadow: `0 8px 32px ${color}20` } : {}}
        >
            <div className="misso-card-header">
                <span style={{ fontSize: '0.8rem', color: color, display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    <AnimatedIcon Icon={TypeIcon} size={14} /> {type.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(entry.created_at).toLocaleDateString()}</span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#fff' }}>{entry.title}</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {parsedContent.summary || parsedContent.core_idea || entry.content?.substring(0, 100)}
            </p>
        </motion.div>
    );
}

function DetailMisso({ entry, color }) {
    let parsedContent = {};
    try {
        if (entry.content && entry.content.startsWith('{')) {
            parsedContent = JSON.parse(entry.content);
        }
    } catch (e) { }

    const type = parsedContent.content_type || entry.category || 'idea';
    const TypeIcon = typeIconMap[type] || Lightbulb;

    const renderItem = (item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object') return JSON.stringify(item);
        return String(item);
    };

    return (
        <div style={{ color: '#fff' }}>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}
            >
                <div style={{ background: color, padding: '12px', borderRadius: '16px', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${color}40` }}>
                    <TypeIcon size={24} />
                </div>
                <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '2rem', fontFamily: 'Outfit, sans-serif' }}>{entry.title}</h2>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                        {parsedContent.category && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Folder size={14} /> {parsedContent.category}</span>}
                        {parsedContent.status && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ClipboardList size={14} /> {parsedContent.status}</span>}
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}
            >
                <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: color }}>
                    <Sparkles size={18} /> Overview
                </h3>

                {type === 'film' && <>
                    {parsedContent.logline && <p><strong>Logline:</strong> {parsedContent.logline}</p>}
                    {parsedContent.characters?.length > 0 && <div><h4 style={{ marginTop: '16px' }}>Characters</h4><ul style={{ paddingLeft: '20px' }}>{parsedContent.characters.map((c, i) => <li key={i}>{renderItem(c)}</li>)}</ul></div>}
                </>}

                {type === 'music' && <>
                    {parsedContent.hook_line && <p><strong>Hook:</strong> {parsedContent.hook_line}</p>}
                    {parsedContent.genre && <p><strong>Genre:</strong> {parsedContent.genre}</p>}
                </>}

                {type === 'rant' && parsedContent.key_points?.length > 0 && <div>
                    <h4>Key Points</h4><ul style={{ paddingLeft: '20px' }}>{parsedContent.key_points.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>}

                {type === 'character' && <>
                    {parsedContent.backstory && <p><strong>Backstory:</strong> {parsedContent.backstory}</p>}
                    {parsedContent.personality && <div><h4 style={{ marginTop: '16px' }}>Personality</h4><ul style={{ paddingLeft: '20px' }}>{parsedContent.personality.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
                </>}

                {parsedContent.mood_keywords?.length > 0 && <div style={{ marginTop: '16px' }}>
                    <h4>Mood</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {parsedContent.mood_keywords.map((m, i) => <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.8rem' }}>{renderItem(m)}</span>)}
                    </div>
                </div>}

                {parsedContent.core_idea && <p style={{ marginTop: '16px', lineHeight: '1.6' }}>{parsedContent.core_idea}</p>}

                {parsedContent.transcript && <div style={{ marginTop: '24px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mic size={16} /> Transcript</h4>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px' }}>{parsedContent.transcript}</p>
                </div>}

                {(!parsedContent.core_idea && !parsedContent.transcript && !parsedContent.logline) && <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{entry.content}</p>}
            </motion.div>
        </div>
    );
}
