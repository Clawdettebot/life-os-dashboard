import React from 'react';
import AnimatedIcon from '../AnimatedIcon';
import { Clock, Flame, Utensils, Globe, Star, MapPin } from 'lucide-react';

export default function LayoutRecipeBook({ entries, color, onSelectEntry }) {
    if (entries.length === 0) return <div className="cortex-empty">No recipes yet.</div>;

    return (
        <div className="recipe-grid">
            {entries.map((entry, idx) => (
                <CardRecipe
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

function CardRecipe({ entry, color, onClick }) {
    let parsedContent = {};
    try {
        if (entry.content && entry.content.startsWith('{')) {
            parsedContent = JSON.parse(entry.content);
        }
    } catch (e) { }

    const isRestaurant = parsedContent.restaurant_name;

    return (
        <div className="recipe-card" onClick={onClick}>
            <div className="recipe-image-placeholder">
                {isRestaurant ? <MapPin size={48} opacity={0.2} /> : <Utensils size={48} opacity={0.2} />}
                <div style={{ position: 'absolute', top: '16px', right: '16px', background: color, color: '#fff', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {isRestaurant ? 'Review' : 'Recipe'}
                </div>
            </div>

            <div className="recipe-content">
                <h3 className="recipe-title">{entry.title}</h3>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {parsedContent.cuisine && <span className="recipe-meta-pill"><Globe size={12} /> {parsedContent.cuisine}</span>}
                    {parsedContent.cook_time && <span className="recipe-meta-pill"><Clock size={12} /> {parsedContent.cook_time}</span>}
                    {parsedContent.difficulty && <span className="recipe-meta-pill"><Flame size={12} /> {parsedContent.difficulty}</span>}
                    {parsedContent.rating && <span className="recipe-meta-pill"><Star size={12} /> {parsedContent.rating}/5</span>}
                </div>

                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {isRestaurant ? parsedContent.notes : (parsedContent.steps?.[0]?.instruction || entry.content?.substring(0, 100))}
                </p>
            </div>
        </div>
    );
}
