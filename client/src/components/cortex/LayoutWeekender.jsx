import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_IMAGES = {
    diy: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800',
    foraging: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800',
    wildlife: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800',
    shelter: 'https://images.unsplash.com/photo-1542332213-31f87348057f?w=800',
    water: 'https://images.unsplash.com/photo-1437622368342-7a3d73a40cfa?w=800',
    food_preservation: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800',
    default: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
};

// Animation variants for staggered grid entries
const gridItemVariants = {
    initial: { opacity: 0, y: 30, scale: 0.9 },
    animate: (i) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { 
            type: 'spring', 
            stiffness: 300, 
            damping: 24, 
            delay: i * 0.06 
        }
    })
};

// Card hover animation
const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { 
        scale: 1.05, 
        y: -8,
        transition: { duration: 0.25, ease: 'easeOut' } 
    },
    tap: { scale: 0.98 }
};

export default function LayoutWeekender({ entries, color, onSelectEntry }) {
    if (entries.length === 0) return <div className="cortex-empty">No entries in Guide.</div>;

    return (
        <div className="weekender-grid">
            <AnimatePresence>
                {entries.map((entry, idx) => (
                    <motion.div
                        key={entry.id}
                        custom={idx}
                        initial="initial"
                        animate="animate"
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        variants={gridItemVariants}
                    >
                        <CardWeekender
                            entry={entry}
                            color={color}
                            onClick={() => onSelectEntry(entry)}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function CardWeekender({ entry, color, onClick }) {
    let parsedContent = {};
    if (entry.content && entry.content.startsWith('{')) {
        try { parsedContent = JSON.parse(entry.content); } catch (e) { }
    }

    const bgImage = CATEGORY_IMAGES[entry.category] || CATEGORY_IMAGES.default;

    return (
        <motion.div 
            className="weekender-card" 
            onClick={onClick}
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            style={{ 
                borderColor: 'transparent',
                borderWidth: '2px',
                borderStyle: 'solid'
            }}
        >
            <div
                className="weekender-bg"
                style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="weekender-overlay">
                <div className="weekender-badge-wrap">
                    <motion.span 
                        className="weekender-badge"
                        whileHover={{ scale: 1.1 }}
                        style={{ backgroundColor: color }}
                    >
                        {entry.category || 'Guide'}
                    </motion.span>
                </div>
                <div>
                    <h3 className="weekender-title">{entry.title}</h3>
                    <p className="weekender-desc">{parsedContent.summary || entry.content?.substring(0, 100)}</p>
                </div>
            </div>
        </motion.div>
    );
}
