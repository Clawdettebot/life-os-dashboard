import React from 'react';

const CATEGORY_IMAGES = {
    diy: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800',
    foraging: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800',
    wildlife: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800',
    shelter: 'https://images.unsplash.com/photo-1542332213-31f87348057f?w=800',
    water: 'https://images.unsplash.com/photo-1437622368342-7a3d73a40cfa?w=800',
    food_preservation: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800',
    default: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
};

export default function LayoutWeekender({ entries, color, onSelectEntry }) {
    if (entries.length === 0) return <div className="cortex-empty">No entries in Guide.</div>;

    return (
        <div className="weekender-grid">
            {entries.map((entry, idx) => (
                <CardWeekender
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

function CardWeekender({ entry, onClick }) {
    let parsedContent = {};
    if (entry.content && entry.content.startsWith('{')) {
        try { parsedContent = JSON.parse(entry.content); } catch (e) { }
    }

    const bgImage = CATEGORY_IMAGES[entry.category] || CATEGORY_IMAGES.default;

    return (
        <div className="weekender-card" onClick={onClick}>
            <div
                className="weekender-bg"
                style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="weekender-overlay">
                <div className="weekender-badge-wrap">
                    <span className="weekender-badge">{entry.category || 'Guide'}</span>
                </div>
                <div>
                    <h3 className="weekender-title">{entry.title}</h3>
                    <p className="weekender-desc">{parsedContent.summary || entry.content?.substring(0, 100)}</p>
                </div>
            </div>
        </div>
    );
}
