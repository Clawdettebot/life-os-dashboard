import React from 'react';
import AnimatedIcon from '../AnimatedIcon';
import { Calendar } from 'lucide-react';

export default function LayoutTimeline({ entries, color, onSelectEntry }) {
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
        <div className="timeline-layout">
            <div className="timeline-line" style={{ backgroundColor: color }}></div>
            {sortedEntries.map((entry, idx) => (
                <CardTimeline
                    key={entry.id}
                    entry={entry}
                    color={color}
                    index={idx}
                    onClick={() => onSelectEntry(entry)}
                />
            ))}
        </div>
    );
}

function CardTimeline({ entry, color, index, onClick }) {
    let parsedContent = {};
    try {
        if (entry.content && entry.content.startsWith('{')) {
            parsedContent = JSON.parse(entry.content);
        }
    } catch (e) { }

    const dateStr = parsedContent.event_date || new Date(entry.created_at).toLocaleDateString();
    const alignClass = index % 2 === 0 ? 'timeline-left' : 'timeline-right';

    return (
        <div
            className={`timeline-node ${alignClass}`}
            onClick={onClick}
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="timeline-dot" style={{ borderColor: color, backgroundColor: '#1a1a2e' }}></div>
            <div className="timeline-card" style={{ borderTop: `3px solid ${color}` }}>
                <div className="timeline-date" style={{ color: color }}>
                    <AnimatedIcon Icon={Calendar} size={14} className="inline mr-1" />
                    {dateStr}
                </div>
                <h3 className="timeline-title">{entry.title}</h3>
                {parsedContent.summary && <p className="timeline-summary text-sm text-gray-400">{parsedContent.summary}</p>}
                {!parsedContent.summary && <p className="timeline-summary text-sm text-gray-400">{entry.content?.substring(0, 100)}...</p>}
            </div>
        </div>
    );
}
