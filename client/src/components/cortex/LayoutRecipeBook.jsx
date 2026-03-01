import React from 'react';
import AnimatedIcon from '../AnimatedIcon';
import { Clock, Flame, Utensils, Globe, Star, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Animation variants for staggered recipe cards
const recipeCardVariants = {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: (i) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { 
            type: 'spring', 
            stiffness: 300, 
            damping: 24, 
            delay: i * 0.07 
        }
    })
};

// Card hover animation
const cardHoverVariants = {
    rest: { scale: 1, y: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    hover: { 
        scale: 1.02, 
        y: -6,
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
        transition: { duration: 0.25, ease: 'easeOut' } 
    },
    tap: { scale: 0.98 }
};

// Badge pulse animation
const badgeVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, transition: { duration: 0.2 } }
};

export default function LayoutRecipeBook({ entries, color, onSelectEntry }) {
    if (entries.length === 0) return <div className="cortex-empty">No recipes yet.</div>;

    return (
        <div className="recipe-grid">
            <AnimatePresence>
                {entries.map((entry, idx) => (
                    <motion.div
                        key={entry.id}
                        custom={idx}
                        initial="initial"
                        animate="animate"
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        variants={recipeCardVariants}
                    >
                        <CardRecipe
                            entry={entry}
                            color={color}
                            index={idx}
                            onClick={() => onSelectEntry(entry)}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
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
        <motion.div 
            className="recipe-card" 
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
            <div className="recipe-image-placeholder">
                {isRestaurant ? <MapPin size={48} opacity={0.2} /> : <Utensils size={48} opacity={0.2} />}
                <motion.div 
                    style={{ position: 'absolute', top: '16px', right: '16px', background: color, color: '#fff', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 'bold' }}
                    variants={badgeVariants}
                    initial="initial"
                    whileHover="hover"
                >
                    {isRestaurant ? 'Review' : 'Recipe'}
                </motion.div>
            </div>

            <div className="recipe-content">
                <h3 className="recipe-title">{entry.title}</h3>

                <motion.div 
                    style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {parsedContent.cuisine && <span className="recipe-meta-pill"><Globe size={12} /> {parsedContent.cuisine}</span>}
                    {parsedContent.cook_time && <span className="recipe-meta-pill"><Clock size={12} /> {parsedContent.cook_time}</span>}
                    {parsedContent.difficulty && <span className="recipe-meta-pill"><Flame size={12} /> {parsedContent.difficulty}</span>}
                    {parsedContent.rating && <span className="recipe-meta-pill"><Star size={12} /> {parsedContent.rating}/5</span>}
                </motion.div>

                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {isRestaurant ? parsedContent.notes : (parsedContent.steps?.[0]?.instruction || entry.content?.substring(0, 100))}
                </p>
            </div>
        </motion.div>
    );
}
