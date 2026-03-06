import React from 'react';
import { Lightbulb, Edit3, ArrowRight } from 'lucide-react';
import LobsterScrollArea from './LobsterScrollArea';

export function CorticalSparksWidget({ ideas = [], notes = [], onViewSection }) {
    // Merge and sort newest first
    const safeIdeas = Array.isArray(ideas) ? ideas : [];
    const safeNotes = Array.isArray(notes) ? notes : [];

    const recentSparks = [
        ...safeIdeas.map(i => ({ ...i, source: 'idea' })),
        ...safeNotes.map(n => ({ ...n, source: 'note', title: n.title || 'Quick Note' }))
    ].sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)).slice(0, 8);

    return (
        <div className="h-full w-full rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col overflow-hidden hover:border-[rgba(var(--rgb-accent-sec),0.3)] transition-colors duration-500 group">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-panel)] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[rgba(var(--rgb-accent-sec),0.1)] border border-[rgba(var(--rgb-accent-sec),0.2)] flex items-center justify-center text-[rgb(var(--rgb-accent-sec))] shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                        <Lightbulb size={14} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[var(--text-main)] font-space-grotesk tracking-tight group-hover:text-[rgb(var(--rgb-accent-sec))] transition-colors">Cortical Sparks</h3>
                        <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Recent Ideas & Notes</p>
                    </div>
                </div>
            </div>

            <LobsterScrollArea className="flex-1" contentClassName="p-3" size="small">
                {recentSparks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-40 p-6">
                        <Lightbulb size={24} className="mb-3" />
                        <span className="text-[9px] font-space-mono uppercase tracking-widest text-center">No recent sparks captured</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {recentSparks.map((spark, i) => (
                            <div
                                key={i}
                                onClick={() => onViewSection(spark.source === 'idea' ? 'ideas' : 'notes')}
                                className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-overlay)] hover:bg-[rgba(var(--rgb-accent-sec),0.05)] hover:border-[rgba(var(--rgb-accent-sec),0.2)] cursor-pointer transition-all flex items-start gap-3 group/item"
                            >
                                <div className="mt-0.5 shrink-0 opacity-50 group-hover/item:text-[rgb(var(--rgb-accent-sec))] group-hover/item:opacity-100 transition-colors">
                                    {spark.source === 'idea' ? <Lightbulb size={12} /> : <Edit3 size={12} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-bold text-[var(--text-main)] truncate group-hover/item:text-[rgb(var(--rgb-accent-sec))] transition-colors">
                                        {spark.title || spark.content}
                                    </div>
                                    <div className="text-[8px] font-space-mono uppercase tracking-widest text-[var(--text-faint)] mt-1 flex justify-between">
                                        <span>{spark.source === 'idea' ? spark.status || 'captured' : 'note'}</span>
                                        <span>{new Date(spark.created_at || spark.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </LobsterScrollArea>
        </div>
    );
}

export function ContentPipelineWidget({ posts = [], onViewSection }) {
    const safePosts = Array.isArray(posts) ? posts : [];
    const recentPosts = [...safePosts]
        .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
        .slice(0, 6);

    return (
        <div className="h-full w-full rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col overflow-hidden hover:border-[rgba(var(--rgb-accent-main),0.3)] transition-colors duration-500 group">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-panel)] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[rgba(var(--rgb-accent-main),0.1)] border border-[rgba(var(--rgb-accent-main),0.2)] flex items-center justify-center text-[rgb(var(--rgb-accent-main))] shadow-[0_0_10px_rgba(234,88,12,0.1)]">
                        <Edit3 size={14} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[var(--text-main)] font-space-grotesk tracking-tight group-hover:text-[rgb(var(--rgb-accent-main))] transition-colors">Content Pipeline</h3>
                        <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Latest Blog Drafts</p>
                    </div>
                </div>
                <button onClick={() => onViewSection('blog')} className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--bg-overlay)] hover:bg-[var(--border-highlight)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]">
                    <ArrowRight size={12} />
                </button>
            </div>

            <LobsterScrollArea className="flex-1" contentClassName="p-3" size="small">
                {recentPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-40 p-6">
                        <Edit3 size={24} className="mb-3" />
                        <span className="text-[9px] font-space-mono uppercase tracking-widest text-center">Pipeline Empty</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {recentPosts.map((post, i) => (
                            <div
                                key={i}
                                onClick={() => onViewSection('blog')}
                                className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-overlay)] hover:bg-[rgba(var(--rgb-accent-main),0.05)] hover:border-[rgba(var(--rgb-accent-main),0.2)] cursor-pointer transition-all flex flex-col gap-2 group/item"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="text-[11px] font-bold text-[var(--text-main)] truncate group-hover/item:text-[rgb(var(--rgb-accent-main))] transition-colors flex-1">
                                        {post.title}
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${post.status === 'published' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-color)]'}`}>
                                        {post.status || 'draft'}
                                    </span>
                                </div>
                                <div className="text-[8px] font-space-mono uppercase tracking-widest text-[var(--text-faint)] flex items-center gap-2">
                                    <span className="bg-[var(--bg-panel)] px-1.5 py-0.5 rounded">{post.category || 'general'}</span>
                                    <span>{new Date(post.created_at || post.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </LobsterScrollArea>
        </div>
    );
}
