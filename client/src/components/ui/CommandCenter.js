import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';

export default function CommandCenter({ isOpen, onClose, navSections, navigateTo }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
        }
    }, [isOpen]);

    const allItems = navSections ? navSections.flatMap(section =>
        section.items.map(item => ({ ...item, sectionName: section.title }))
    ) : [];

    const filteredItems = query.trim() === ''
        ? allItems
        : allItems.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.sectionName.toLowerCase().includes(query.toLowerCase())
        );

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed top-[20vh] left-1/2 -translate-x-1/2 z-[9995] w-full max-w-xl bg-[var(--bg-card)] border border-[var(--border-highlight)] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        <div className="flex items-center px-4 border-b border-[var(--border-color)]">
                            <Search className="text-[var(--text-muted)] w-5 h-5 mx-2" />
                            <input
                                ref={inputRef}
                                className="w-full bg-transparent border-none text-[var(--text-main)] placeholder-[var(--text-faint)] focus:ring-0 px-2 py-4 text-lg font-space-grotesk outline-none"
                                placeholder="Search modules... (e.g. Finance, Projects)"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                            <div className="text-[10px] font-space-mono text-[var(--text-faint)] border border-[var(--border-color)] px-1.5 py-0.5 rounded bg-[var(--bg-overlay)]">ESC</div>
                        </div>

                        <div className="max-h-[350px] overflow-y-auto p-2 glass-scroll">
                            {filteredItems.length === 0 ? (
                                <div className="p-8 text-center text-[var(--text-muted)] text-sm">No modules found.</div>
                            ) : (
                                filteredItems.map(item => {
                                    const Icon = item.icon || ChevronRight;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { navigateTo(item.id); onClose(); }}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-overlay)] group transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-center group-hover:border-[var(--border-highlight)] group-hover:text-[rgb(var(--rgb-accent-main))] transition-colors">
                                                    <Icon size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-[var(--text-main)] group-hover:text-[rgb(var(--rgb-accent-main))] transition-colors">{item.label}</div>
                                                    <div className="text-[10px] font-space-mono uppercase text-[var(--text-faint)]">{item.sectionName}</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className="text-[var(--text-faint)] group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
