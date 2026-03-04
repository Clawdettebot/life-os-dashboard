import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Lightbulb, Sparkles, Book, Tent, Navigation,
    Droplet, Compass, Leaf, Settings, Utensils, Flame,
    History, Clock, Search
} from 'lucide-react';
import {
    Card, Button, Badge, Crosshair, staggerContainer, staggerItem
} from '../ui/NewDesignComponents';

export const CortexAllSpark = ({ entries }) => (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
        <motion.div variants={staggerItem} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] p-6 flex items-center gap-6 relative overflow-hidden group hover:border-yellow-500/30 transition-colors shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-50 pointer-events-none" />
            <div className="w-12 h-12 rounded-full border border-[var(--border-color)] flex items-center justify-center text-yellow-500 relative z-10 bg-[var(--bg-base)]">
                <Zap size={20} className="drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
            </div>
            <div className="relative z-10">
                <h2 className="text-lg font-bold font-space-grotesk text-[var(--text-main)] uppercase tracking-widest">The All Spark</h2>
                <p className="text-[10px] font-space-mono text-[var(--text-muted)] mt-1">Your inspiration hub: ideas, rants, comedy, art, movies, manga, games, apps, merch concepts.</p>
            </div>
        </motion.div>

        <div className="flex-1 flex gap-6 overflow-hidden">
            <motion.div variants={staggerItem} className="w-1/3 flex flex-col gap-4 border-r border-[var(--border-color)] pr-6 h-full overflow-hidden">
                <div className="flex gap-2 shrink-0">
                    <span className="px-4 py-1.5 rounded-full bg-[var(--text-main)] text-[var(--bg-base)] text-[9px] font-space-mono uppercase tracking-widest font-bold">all</span>
                    <span className="px-4 py-1.5 rounded-full border border-[var(--border-color)] text-[var(--text-muted)] text-[9px] font-space-mono uppercase tracking-widest">idea</span>
                    <span className="px-4 py-1.5 rounded-full border border-[var(--border-color)] text-[var(--text-muted)] text-[9px] font-space-mono uppercase tracking-widest">note</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pb-4">
                    {entries.map((item, i) => (
                        <div key={i} className={`p-5 rounded-[1.5rem] border cursor-pointer transition-all duration-300 relative overflow-hidden group ${item.active ? 'bg-yellow-500/5 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-highlight)]'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <span className={`text-[9px] font-space-mono uppercase tracking-widest flex items-center gap-1.5 font-bold ${item.active ? 'text-yellow-500' : 'text-yellow-500/70'}`}><Lightbulb size={10} /> IDEA</span>
                                <span className="text-[9px] font-space-mono text-[var(--text-faint)]">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-sm font-bold text-[var(--text-main)] font-space-grotesk leading-snug mb-2 line-clamp-2">{item.title}</h4>
                            <p className="text-[10px] font-space-grotesk text-[var(--text-muted)] line-clamp-2 leading-relaxed">{item.content}</p>
                        </div>
                    ))}
                    {entries.length === 0 && (
                        <div className="p-8 text-center text-[var(--text-faint)] font-space-mono text-xs uppercase tracking-widest">
                            No ideas stored in the matrix.
                        </div>
                    )}
                </div>
            </motion.div>

            <motion.div variants={staggerItem} className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden hover-spotlight group transition-colors h-full">
                <Crosshair className="-top-[5px] -left-[5px]" />
                <Crosshair className="-top-[5px] -right-[5px]" />
                <Crosshair className="-bottom-[5px] -left-[5px]" />
                <Crosshair className="-bottom-[5px] -right-[5px]" />

                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--border-color)] relative z-10 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                        <Lightbulb size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-[var(--text-main)] font-space-grotesk leading-snug">Select an entry to view details</h2>
                </div>

                <div className="flex-1 overflow-y-auto font-space-mono text-[11px] text-[var(--text-muted)] leading-relaxed space-y-6 relative z-10 scrollbar-hide pb-4">
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] p-4 rounded-xl text-[var(--text-main)]">
                        <div className="flex items-center gap-2 mb-2 text-yellow-500 font-bold uppercase tracking-widest text-[9px]"><Sparkles size={12} /> System Buffer</div>
                        <p>Waiting for neural uplink...</p>
                    </div>
                </div>
            </motion.div>
        </div>
    </motion.div>
);

export const CortexHitchhikersGuide = ({ entries }) => (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
        <motion.div variants={staggerItem} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] p-6 flex items-center gap-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-50 pointer-events-none" />
            <div className="w-12 h-12 rounded-full border border-[var(--border-color)] flex items-center justify-center text-cyan-400 relative z-10 bg-[var(--bg-base)]">
                <Book size={20} className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </div>
            <div className="relative z-10">
                <h2 className="text-lg font-bold font-space-grotesk text-[var(--text-main)] uppercase tracking-widest">Hitchhiker's Guide</h2>
                <p className="text-[10px] font-space-mono text-[var(--text-muted)] mt-1">Survival knowledge extracted from videos: DIY builds, foraging, wildlife, off-grid living.</p>
            </div>
        </motion.div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {entries.map((item, i) => {
                    const Icon = [Tent, Navigation, Droplet, Compass, Leaf, Settings][i % 6];
                    return (
                        <motion.div variants={staggerItem} key={i} className="group relative overflow-hidden rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all duration-500 hover-spotlight h-80 cursor-pointer">
                            <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
                            <div className="h-36 bg-cyan-900/10 relative overflow-hidden flex items-center justify-center border-b border-[var(--border-color)]">
                                {item.media_url ? (
                                    <img src={item.media_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <Icon size={48} className="text-cyan-500/20 group-hover:text-cyan-400/40 transition-colors duration-500 group-hover:scale-110 transform" />
                                )}
                                <span className="absolute top-4 left-4 bg-cyan-500 text-black font-space-mono font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-[0_0_10px_rgba(34,211,238,0.5)] z-10">
                                    {item.category || 'SKILL'}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
                            </div>
                            <div className="p-6 flex-1 flex flex-col relative z-10">
                                <h4 className="text-sm font-bold text-[var(--text-main)] font-space-grotesk leading-snug mb-2 group-hover:text-cyan-400 transition-colors">{item.title}</h4>
                                <p className="text-[10px] font-space-mono text-[var(--text-muted)] line-clamp-3 leading-relaxed mt-auto">
                                    {item.content}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
                {entries.length === 0 && (
                    <div className="col-span-full py-20 text-center border border-dashed border-[var(--border-color)] rounded-[2.5rem] bg-[var(--bg-panel)]">
                        <span className="text-[10px] font-space-mono text-[var(--text-faint)] tracking-[0.3em] uppercase">No manual data scanned.</span>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

export const CortexHowlsKitchen = ({ entries }) => (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
        <motion.div variants={staggerItem} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] p-6 flex items-center gap-6 relative overflow-hidden group hover:border-orange-500/30 transition-colors shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-50 pointer-events-none" />
            <div className="w-12 h-12 rounded-full border border-[var(--border-color)] flex items-center justify-center text-orange-500 relative z-10 bg-[var(--bg-base)]">
                <Flame size={20} className="drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            </div>
            <div className="relative z-10">
                <h2 className="text-lg font-bold font-space-grotesk text-[var(--text-main)] uppercase tracking-widest">Howl's Kitchen</h2>
                <p className="text-[10px] font-space-mono text-[var(--text-muted)] mt-1">Restaurant reviews and recipe tracker. Mark as cooked or wishlist for later.</p>
            </div>
        </motion.div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {entries.map((item, i) => (
                    <motion.div variants={staggerItem} key={i} className="group relative overflow-hidden rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-all duration-500 hover-spotlight h-80 cursor-pointer">
                        <div className="h-36 bg-[var(--bg-panel)] relative overflow-hidden flex items-center justify-center border-b border-[var(--border-color)]">
                            {item.media_url ? (
                                <img src={item.media_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <Utensils size={64} className="text-orange-500/5 group-hover:text-orange-500/20 transition-colors duration-500" />
                            )}
                            <span className="absolute top-4 right-4 bg-orange-500 text-white font-space-mono font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-[0_0_10px_rgba(249,115,22,0.5)] z-10">
                                {item.category || 'RECIPE'}
                            </span>
                        </div>
                        <div className="p-6 flex-1 flex flex-col relative z-10">
                            <h4 className="text-sm font-bold text-[var(--text-main)] font-space-grotesk leading-snug mb-3 group-hover:text-orange-400 transition-colors">{item.title}</h4>
                            <p className="text-[11px] font-space-mono text-[var(--text-muted)] line-clamp-4 leading-relaxed">
                                {item.content}
                            </p>
                        </div>
                    </motion.div>
                ))}
                {entries.length === 0 && (
                    <div className="col-span-full py-20 text-center border border-dashed border-[var(--border-color)] rounded-[2.5rem] bg-[var(--bg-panel)]">
                        <span className="text-[10px] font-space-mono text-[var(--text-faint)] tracking-[0.3em] uppercase">Kitchen is empty. Order up!</span>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

export const CortexEmeraldTablets = ({ entries }) => (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex-1 flex flex-col h-full overflow-hidden">
        <motion.div variants={staggerItem} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] p-6 flex items-center gap-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors shrink-0 mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-50 pointer-events-none" />
            <div className="w-12 h-12 rounded-full border border-[var(--border-color)] flex items-center justify-center text-emerald-400 relative z-10 bg-[var(--bg-base)]">
                <History size={20} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
            <div className="relative z-10">
                <h2 className="text-lg font-bold font-space-grotesk text-[var(--text-main)] uppercase tracking-widest">Emerald Tablets</h2>
                <p className="text-[10px] font-space-mono text-[var(--text-muted)] mt-1">Historical knowledge: African American, Filipino, Oakland/Bay Area, Hip-Hop, and Family history with timeline views.</p>
            </div>
        </motion.div>

        <div className="flex-1 relative w-full overflow-x-auto overflow-y-hidden scrollbar-hide py-12 flex items-center">
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} className="absolute top-1/2 left-0 right-0 h-0.5 bg-[var(--border-color)] origin-left z-0">
                <div className="absolute top-0 left-0 bottom-0 w-full bg-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </motion.div>

            <div className="flex gap-12 min-w-max px-8 items-center h-full relative z-10">
                {entries.map((item, i) => (
                    <div key={i} className={`relative flex flex-col items-center w-80 ${i % 2 === 0 ? 'translate-y-[calc(-50%-2rem)]' : 'translate-y-[calc(50%+2rem)]'}`}>
                        <motion.div initial={{ height: 0 }} animate={{ height: '2rem' }} transition={{ delay: 0.5 + (i * 0.2), duration: 0.5 }} className={`absolute w-0.5 bg-emerald-500/50 ${i % 2 === 0 ? 'bottom-[-2rem]' : 'top-[-2rem]'}`} />
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + (i * 0.2), type: "spring" }} className={`absolute w-4 h-4 rounded-full border-2 border-emerald-400 bg-[var(--bg-base)] shadow-[0_0_15px_rgba(16,185,129,0.8)] z-20 ${i % 2 === 0 ? 'bottom-[-2.5rem]' : 'top-[-2.5rem]'}`} />

                        <motion.div variants={staggerItem} className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] p-6 hover-spotlight group hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500 cursor-pointer">
                            <div className="flex items-center gap-2 mb-3 text-[10px] font-space-mono text-emerald-400 font-bold tracking-widest uppercase">
                                <Clock size={12} /> {new Date(item.created_at).toLocaleDateString()}
                            </div>
                            {item.media_url && (
                                <img src={item.media_url} alt={item.title} className="w-full h-32 object-cover rounded-xl mb-3 border border-[var(--border-color)]" />
                            )}
                            <h4 className="text-sm font-bold text-[var(--text-main)] font-space-grotesk leading-snug mb-3 group-hover:text-emerald-300 transition-colors">{item.title}</h4>
                            <p className="text-[11px] font-space-mono text-[var(--text-muted)] line-clamp-3 leading-relaxed">{item.content}</p>
                        </motion.div>
                    </div>
                ))}
                {entries.length === 0 && (
                    <div className="px-20 py-10 bg-[var(--bg-panel)] rounded-full border border-dashed border-[var(--border-color)]">
                        <span className="text-[10px] font-space-mono text-[var(--text-faint)] tracking-[0.3em] uppercase">Temporal archive empty.</span>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);
