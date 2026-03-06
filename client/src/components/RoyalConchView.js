import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, Square, Pause, Search,
    Activity, Terminal, ChevronRight, Zap, Clock, Palette
} from 'lucide-react';
import ShrimpSoldier from './knights/ShrimpSoldier';

// --- MOCK DATA ---
const INITIAL_HISTORY = [
    { id: 't1', date: 'TODAY', time: '14:30', title: 'Q3 PRODUCT SYNC', duration: '45:00' },
    { id: 't2', date: 'YESTERDAY', time: '16:00', title: 'DESIGN REVIEW', duration: '01:20:00' },
    { id: 't3', date: 'OCT 12', time: '11:00', title: 'CLIENT KICKOFF', duration: '55:00' },
];

const MOCK_TRANSCRIPT_POOL = [
    "Initiating audio capture protocol.", "Signal strength nominal.", "Voice identified as user: Alpha.",
    "Discussing the implementation of the new tactical lobster interface.", "The framer motion physics need to feel heavier.",
    "Consider adding a spring simulation to the main record button.", "Yes, that aligns with the teenage engineering aesthetic.",
    "Next agenda item: payload optimization.", "Ensure the payload is under 2MB.",
    "Running horizontal scanning animation.", "Deploying audio reactive protocols."
];

// --- TECHNICAL LOBSTER SVG COMPONENT ---
const TacticalLobster = ({ isMoving, isTyping, className = "" }) => {
    const leftClawRot = isTyping ? [-35, 0, -35] : isMoving ? [-15, 0, -15] : 0;
    const rightClawRot = isTyping ? [35, 0, 35] : isMoving ? [15, 0, 15] : 0;
    const animDuration = isTyping ? 0.1 : 0.3;
    const shouldRepeat = isTyping || isMoving;

    return (
        <svg width="24" height="28" viewBox="0 0 24 36" fill="none" className={`transform origin-center ${className}`}>
            <motion.path d="M 6 12 C 0 8 0 0 6 4 C 12 6 8 12 8 14 Z" fill="currentColor"
                animate={{ rotate: leftClawRot }} transition={{ repeat: shouldRepeat ? Infinity : 0, duration: animDuration }} style={{ originX: '8px', originY: '14px' }} />
            <motion.path d="M 18 12 C 24 8 24 0 18 4 C 12 6 16 12 16 14 Z" fill="currentColor"
                animate={{ rotate: rightClawRot }} transition={{ repeat: shouldRepeat ? Infinity : 0, duration: animDuration }} style={{ originX: '16px', originY: '14px' }} />
            <motion.path d="M 10 10 L 8 4 M 14 10 L 16 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"
                animate={{ rotate: isTyping ? [-10, 10, -10] : 0 }} transition={{ repeat: isTyping ? Infinity : 0, duration: 0.1 }} style={{ originY: '10px' }} />
            <rect x="8" y="12" width="8" height="14" rx="3" fill="currentColor" />
            <path d="M 8 16 L 16 16 M 8 20 L 16 20" stroke="var(--bg-panel)" strokeWidth="1.5" />
            <path d="M 8 25 L 5 32 L 12 30 L 19 32 L 16 25 Z" fill="currentColor" strokeLinejoin="round" />
            <motion.g animate={{ y: isMoving ? [-1, 1, -1] : 0 }} transition={{ repeat: isMoving ? Infinity : 0, duration: 0.2 }}>
                <line x1="8" y1="15" x2="4" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="16" y1="15" x2="20" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="8" y1="23" x2="4" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="16" y1="23" x2="20" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </motion.g>
            <motion.g animate={{ y: isMoving ? [1, -1, 1] : 0 }} transition={{ repeat: isMoving ? Infinity : 0, duration: 0.2 }}>
                <line x1="8" y1="19" x2="3" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="16" y1="19" x2="21" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </motion.g>
        </svg>
    );
};

// --- BIG ANALYZING CRAB COMPONENT ---
const BigAnalyzingCrab = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center bg-[var(--bg-panel)]/90 backdrop-blur-xl z-50 overflow-hidden"
    >
        <svg
            viewBox="0 0 300 300"
            className="absolute w-[250%] h-[250%] md:w-[150%] md:h-[150%] opacity-40 text-[rgb(var(--rgb-accent-main))] pointer-events-none"
        >
            <defs>
                <path id="pathInner" d="M 150, 150 m -65, 0 a 65,65 0 1,1 130,0 a 65,65 0 1,1 -130,0" fill="none" />
                <path id="pathMiddle" d="M 150, 150 m -95, 0 a 95,95 0 1,1 190,0 a 95,95 0 1,1 -190,0" fill="none" />
                <path id="pathOuter" d="M 150, 150 m -135, 0 a 135,135 0 1,1 270,0 a 135,135 0 1,1 -270,0" fill="none" />
            </defs>

            <motion.g animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} style={{ transformOrigin: "150px 150px" }}>
                <text className="text-[7px] font-space-mono font-bold tracking-[0.4em] uppercase" fill="currentColor">
                    <textPath href="#pathInner" startOffset="0%">
                        DECRYPTING AUDIO FRAGMENTS • SECURE CONNECTION ESTABLISHED • DECRYPTING AUDIO FRAGMENTS •
                    </textPath>
                </text>
                <text className="text-[9px] font-space-mono font-bold tracking-[0.5em] uppercase" fill="currentColor">
                    <textPath href="#pathMiddle" startOffset="0%">
                        ANALYZING NEURAL AUDIO PATTERNS • EXTRACTING SENTIMENT • PROCESSING DATA CORE •
                    </textPath>
                </text>
            </motion.g>

            <motion.g animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 35, ease: "linear" }} style={{ transformOrigin: "150px 150px" }}>
                <text className="text-[14px] font-space-grotesk font-bold tracking-[0.3em] uppercase" fill="currentColor" opacity="0.8">
                    <textPath href="#pathOuter" startOffset="0%">
                        SYSTEM OVERRIDE • DEEP SCANNING ACTIVE • COGNITIVE ANALYSIS PROTOCOL INITIATED • SYSTEM OVERRIDE • DEEP SCANNING ACTIVE •
                    </textPath>
                </text>
            </motion.g>
        </svg>

        <motion.div
            animate={{ scale: [1, 1.15, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="relative z-10 text-[rgb(var(--rgb-accent-main))] drop-shadow-[0_0_40px_rgba(var(--rgb-accent-main),0.8)]"
        >
            <TacticalLobster isMoving={true} isTyping={false} className="w-40 h-auto" />
        </motion.div>

        <div className="absolute bottom-12 left-0 w-full text-center z-20">
            <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-sm font-space-grotesk uppercase tracking-[0.6em] text-[rgb(var(--rgb-accent-main))] font-black bg-[var(--bg-base)]/80 backdrop-blur-sm px-8 py-3 rounded-full border border-[rgb(var(--rgb-accent-main))] shadow-[0_0_20px_rgba(var(--rgb-accent-main),0.3)]"
            >
                Processing...
            </motion.span>
        </div>
    </motion.div>
);

// --- MAIN APP COMPONENT ---
export default function RoyalConchView({ api, data, loading }) {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // States: 'idle', 'recording', 'paused', 'analyzing'
    const [recState, setRecState] = useState('idle');
    const [timer, setTimer] = useState(0);
    const [isTyping, setIsTyping] = useState(false);

    const [transcript, setTranscript] = useState([{ speaker: 'SYS', text: 'SYSTEM READY. AWAITING AUDIO...', time: '00:00' }]);
    const transcriptEndRef = useRef(null);
    const [audioData, setAudioData] = useState(new Array(48).fill(10));

    // MediaRecorder Refs
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const activeRecordingIdRef = useRef(null);

    // Fetch History on Mount
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const resp = await fetch('/api/recordings');
            const data = await resp.json();
            if (data.recordings) {
                const mapped = data.recordings.map(r => ({
                    id: r.id,
                    date: new Date(r.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase(),
                    time: new Date(r.recorded_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
                    title: r.title || 'VOICE RECORDING',
                    duration: r.duration_seconds ? `${Math.floor(r.duration_seconds / 60)}:${(r.duration_seconds % 60).toString().padStart(2, '0')}` : '--',
                    status: r.status
                }));
                setHistory(mapped);
            }
        } catch (e) {
            console.error('Failed to fetch recordings:', e);
        } finally {
            setLoadingHistory(false);
        }
    };

    // --- MOCK LOGIC: Timer & Visualizer ---
    useEffect(() => {
        let interval;
        if (recState === 'recording') {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
                setAudioData(Array.from({ length: 48 }, () => Math.floor(Math.random() * 90) + 10));
            }, 100);
        } else {
            setAudioData(new Array(48).fill(5));
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [recState]);

    // Derived audio level for reactive effects (0 to 100 approx)
    const averageAudioLevel = useMemo(() => {
        if (recState !== 'recording') return 0;
        return audioData.reduce((a, b) => a + b, 0) / audioData.length;
    }, [audioData, recState]);

    // --- MOCK LOGIC: Live Transcription ---
    useEffect(() => {
        let typeInterval;
        if (recState === 'recording') {
            let wordIndex = 0;
            typeInterval = setInterval(() => {
                if (wordIndex < MOCK_TRANSCRIPT_POOL.length) {
                    if (Math.random() > 0.6) {
                        setIsTyping(true);
                        setTimeout(() => setIsTyping(false), 800);

                        const mins = Math.floor(timer / 600).toString().padStart(2, '0');
                        const secs = Math.floor((timer % 600) / 10).toString().padStart(2, '0');
                        setTranscript(prev => [...prev, {
                            speaker: Math.random() > 0.5 ? 'USR-1' : 'USR-2',
                            text: MOCK_TRANSCRIPT_POOL[Math.floor(Math.random() * MOCK_TRANSCRIPT_POOL.length)],
                            time: `${mins}:${secs}`
                        }]);
                    }
                }
            }, 1500);
        }
        return () => clearInterval(typeInterval);
    }, [recState, timer]);

    // Auto-scroll transcript
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const formatTime = (timeInTenths) => {
        const mins = Math.floor(timeInTenths / 600).toString().padStart(2, '0');
        const secs = Math.floor((timeInTenths % 600) / 10).toString().padStart(2, '0');
        const ms = (timeInTenths % 10).toString();
        return `${mins}:${secs}.${ms}`;
    };

    const handleRecordToggle = async () => {
        if (recState === 'idle') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                audioChunksRef.current = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                recorder.onstart = () => {
                    setRecState('recording');
                    setTranscript([{ speaker: 'SYS', text: 'RECORDING STARTED. LISTENING...', time: '00:00' }]);
                    setTimer(0);
                };

                // Create recording in DB
                const resp = await fetch('/api/recordings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'New Royal Conch Recording' })
                });
                const { recording } = await resp.json();
                activeRecordingIdRef.current = recording.id;

                recorder.start(100); // 100ms chunks for visualizer mock data if needed

                // Add to temporary history for UI feel
                const now = new Date();
                setHistory(prev => [
                    {
                        id: recording.id,
                        date: 'TODAY',
                        time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
                        title: 'ACTIVE CAPTURE...',
                        duration: '--'
                    },
                    ...prev
                ]);

            } catch (err) {
                console.error("Mic access denied or error:", err);
                setTranscript(prev => [...prev, { speaker: 'SYS', text: 'ERROR: MIC ACCESS DENIED.', time: '00:00' }]);
            }
        } else if (recState === 'recording') {
            mediaRecorderRef.current.pause();
            setRecState('paused');
        } else if (recState === 'paused') {
            mediaRecorderRef.current.resume();
            setRecState('recording');
        }
    };

    const handleStop = () => {
        if (!mediaRecorderRef.current || recState === 'idle' || recState === 'analyzing') return;

        const recorder = mediaRecorderRef.current;
        const recordingId = activeRecordingIdRef.current;
        const finalTimer = timer;

        recorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', audioBlob, `recording-${recordingId}.webm`);

            try {
                setRecState('analyzing');
                setTranscript(prev => [...prev, { speaker: 'SYS', text: 'UPLOADING AUDIO...', time: formatTime(finalTimer).split('.')[0] }]);

                // 1. Upload the file
                await fetch(`/api/recordings/${recordingId}/upload`, {
                    method: 'POST',
                    body: formData
                });

                // 2. Update duration in DB
                await fetch(`/api/recordings/${recordingId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'transcribing',
                        duration_seconds: Math.floor(finalTimer / 10)
                    })
                });

                setTranscript(prev => [...prev, { speaker: 'SYS', text: 'AUDIO UPLOADED. ANALYSIS STARTED.', time: formatTime(finalTimer).split('.')[0] }]);

                // Refresh history to show updated duration and status
                fetchHistory();

                // Poll for completion
                let attempts = 0;
                const pollInterval = setInterval(async () => {
                    attempts++;
                    try {
                        const checkResp = await fetch(`/api/recordings/${recordingId}`);
                        const { recording } = await checkResp.json();

                        if (recording.status === 'analyzed' || attempts > 5) {
                            clearInterval(pollInterval);
                            setRecState('idle');
                            setTranscript(prev => [
                                ...prev,
                                { speaker: 'SYS', text: 'PROCESS COMPLETE. VIEW IN CORTEX.', time: formatTime(finalTimer).split('.')[0] }
                            ]);
                            fetchHistory();
                        }
                    } catch (e) {
                        console.error("Polling error:", e);
                    }
                }, 3000);

            } catch (e) {
                console.error("Upload failed:", e);
                setRecState('idle');
                setTranscript(prev => [...prev, { speaker: 'SYS', text: 'ERROR: UPLOAD FAILED.', time: formatTime(finalTimer).split('.')[0] }]);
            }

            // Stop all tracks
            recorder.stream.getTracks().forEach(track => track.stop());
        };

        recorder.stop();
    };

    return (
        <div className="w-full h-full bg-transparent text-[var(--text-main)] font-space-grotesk relative overflow-hidden flex flex-col items-center transition-colors duration-700">

            {/* THE ROYAL CONCH - Animated Title */}
            <motion.h1
                initial={{ opacity: 0, y: -20, letterSpacing: '0em' }}
                animate={{ opacity: 1, y: 0, letterSpacing: '0.15em' }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ filter: 'drop-shadow(0 0 15px var(--text-faint))' }}
                className="text-[var(--text-main)] font-black text-3xl md:text-5xl uppercase font-space-grotesk mt-8 md:mt-12 z-40 relative transition-colors duration-700"
            >
                The Royal Conch
            </motion.h1>

            {/* HORIZONTAL SCROLLABLE TIMELINE (Replaces Pill Nav) */}
            <motion.div
                layout
                className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mt-8 mb-6 z-50 shrink-0 px-4"
            >
                <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-hide w-full pb-2 relative">
                    <AnimatePresence>
                        {history.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                layout
                                className={`min-w-[160px] md:min-w-[180px] p-3 rounded-xl border flex flex-col gap-1.5 shrink-0 transition-colors cursor-pointer relative overflow-hidden ${item.duration === '--'
                                    ? 'bg-[var(--bg-overlay)] border-[rgb(var(--rgb-accent-main))] shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.2)]'
                                    : 'bg-[var(--bg-panel)] border-[var(--border-color)] hover:border-[var(--border-highlight)]'
                                    }`}
                            >
                                {/* Active Recording Pulse Indicator */}
                                {item.duration === '--' && (
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-[rgb(var(--rgb-accent-main))] shadow-[0_0_8px_rgba(var(--rgb-accent-main),1)]" />
                                )}

                                <div className="text-[9px] font-space-mono text-[var(--text-muted)] flex justify-between items-center w-full">
                                    <span>{item.date}</span>
                                    <span>{item.time}</span>
                                </div>
                                <div className={`font-bold text-[10px] tracking-widest uppercase truncate ${item.duration === '--' ? 'text-[rgb(var(--rgb-accent-main))]' : 'text-[var(--text-main)]'
                                    }`}>
                                    {item.title}
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-space-mono text-[var(--text-faint)]">
                                    <Clock size={10} />
                                    {item.duration === '--' ? (
                                        <span className="text-[rgb(var(--rgb-accent-main))] animate-pulse">RECORDING...</span>
                                    ) : (
                                        item.duration
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Search Bar appended to the end of the timeline row */}
                <div className="relative w-full md:w-64 shrink-0 pb-2 md:pb-0">
                    <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] md:-mt-1" />
                    <input
                        type="text"
                        placeholder="SEARCH RECORDS..."
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-space-mono uppercase tracking-widest text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-highlight)] transition-colors shadow-inner md:-mt-2"
                    />
                </div>
            </motion.div>

            {/* MAIN VERTICAL CONTENT STACK */}
            <div className="w-full max-w-5xl relative z-10 flex flex-col gap-6 flex-1 overflow-hidden pb-6 px-4">

                {/* HARDWARE CONTROL DECK */}
                <motion.div
                    layout
                    style={{
                        boxShadow: recState === 'recording'
                            ? `0 0 ${averageAudioLevel}px rgba(var(--rgb-accent-main), 0.2), inset 0 0 ${averageAudioLevel * 0.5}px rgba(var(--rgb-accent-main), 0.05)`
                            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row items-center gap-6 lg:gap-8 relative overflow-hidden group shrink-0 transition-shadow duration-75"
                >
                    {/* Aesthetic overlays */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--border-color)] via-[rgba(var(--rgb-accent-main),0.4)] to-[var(--border-color)] opacity-50" />

                    {/* ========================================================= */}
                    {/* RIGHT CORNER GRAPHICS / PLACEHOLDERS (Shrimp Placeholders) */}
                    {/* ========================================================= */}
                    <div className="absolute -right-4 -bottom-4 opacity-30 pointer-events-none w-[200px] h-[200px] flex items-center justify-center">

                        {/* 1. PLACEHOLDER FOR MAIN SHRIMP PNG (Replaces the big Radio icon) */}
                        <div className="w-full h-full flex items-center justify-center rounded-full bg-[var(--bg-overlay)]/40 overflow-hidden">
                            <ShrimpSoldier size={180} className="mt-8 scale-x-[-1] opacity-70" />
                        </div>

                        {/* 2. PLACEHOLDER FOR SMALLER SHRIMP SVG (At the corner of the box) */}
                        <div className="absolute bottom-6 right-6 w-[60px] h-[60px] border border-[rgb(var(--rgb-accent-main))] bg-[var(--bg-panel)] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.3)] overflow-hidden">
                            <ShrimpSoldier size={50} className="mt-4" />
                        </div>

                    </div>
                    {/* ========================================================= */}

                    {/* 1. Horizontal Cortex Branding */}
                    <div className="flex items-center gap-4 relative w-full lg:w-48 shrink-0 overflow-hidden bg-[var(--bg-panel)] p-4 rounded-2xl border border-[var(--border-color)]">
                        {recState === 'recording' && (
                            <motion.div
                                animate={{ y: [-20, 80, -20] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                className="absolute left-0 right-0 h-0.5 bg-[rgb(var(--rgb-accent-main))] shadow-[0_0_8px_rgba(var(--rgb-accent-main),1)] opacity-50 z-20 pointer-events-none"
                            />
                        )}
                        <div className="w-10 h-10 rounded-xl border border-[var(--border-highlight)] flex items-center justify-center bg-[var(--bg-base)] shadow-inner relative z-10">
                            <Activity size={18} className="text-[rgb(var(--rgb-accent-main))]" />
                        </div>
                        <div className="flex flex-col z-10">
                            <h1 className="font-bold text-sm tracking-[0.3em] text-[var(--text-main)] uppercase font-space-grotesk whitespace-nowrap flex items-center gap-2">
                                CORTEX
                                <motion.div
                                    animate={{ opacity: recState === 'recording' ? [1, 0.2, 1] : 1 }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                >
                                    <span className="text-[var(--text-muted)]">.REC</span>
                                </motion.div>
                            </h1>
                            <span className="text-[8px] font-space-mono text-[var(--text-faint)] tracking-[0.2em]">AUDIO INTEL ENGINE</span>
                        </div>
                    </div>

                    {/* 2. Audio Reactive Controls */}
                    <div className="flex items-center gap-4 z-10 shrink-0">
                        <button
                            onClick={handleRecordToggle}
                            disabled={recState === 'analyzing'}
                            className="relative w-16 h-16 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-center shadow-inner group/btn hover:border-[var(--border-highlight)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <motion.div
                                animate={recState === 'recording' ? {
                                    scale: 0.9 + (averageAudioLevel / 300),
                                    boxShadow: `0 0 ${averageAudioLevel * 0.4}px rgba(var(--rgb-accent-main),0.8), inset 0 0 10px rgba(255,255,255,0.5)`
                                } : { scale: 1, boxShadow: 'none' }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${recState === 'recording'
                                    ? 'bg-[rgb(var(--rgb-accent-main))]'
                                    : 'bg-[var(--border-color)] group-hover/btn:bg-[var(--border-highlight)]'
                                    }`}
                            >
                                {recState === 'recording' ? (
                                    <Pause size={16} fill="currentColor" className="text-[var(--bg-base)]" />
                                ) : (
                                    <Mic size={16} className={recState === 'paused' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'} />
                                )}
                            </motion.div>
                        </button>

                        <button
                            onClick={handleStop}
                            disabled={recState === 'idle' || recState === 'analyzing'}
                            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${recState !== 'idle' && recState !== 'analyzing'
                                ? 'bg-[var(--bg-base)] border-[var(--border-color)] hover:border-[var(--text-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer'
                                : 'bg-transparent border-transparent text-[var(--text-faint)] cursor-not-allowed'
                                }`}
                        >
                            <Square size={14} fill={recState !== 'idle' && recState !== 'analyzing' ? 'currentColor' : 'none'} />
                        </button>
                    </div>

                    {/* 3. LCD Timer Display */}
                    <div className="flex flex-col items-center justify-center lg:border-x border-[var(--border-color)] lg:px-8 w-full lg:w-auto z-10 shrink-0">
                        <div className="flex items-center gap-3 mb-1">
                            <div className={`w-2 h-2 rounded-full ${recState === 'recording' ? 'bg-[rgb(var(--rgb-accent-main))] animate-pulse shadow-[0_0_10px_rgba(var(--rgb-accent-main),1)]' : recState === 'analyzing' ? 'bg-[var(--text-main)] animate-bounce' : 'bg-[var(--text-faint)]'}`} />
                            <span className="text-[10px] font-space-mono tracking-[0.3em] uppercase text-[var(--text-muted)]">
                                {recState === 'recording' ? 'REC_ACTIVE' : recState === 'analyzing' ? 'SYS_ANALYZING' : recState === 'paused' ? 'REC_PAUSED' : 'STANDBY'}
                            </span>
                        </div>
                        <div className={`text-4xl lg:text-5xl font-space-mono font-bold tracking-wider transition-colors ${recState === 'recording' ? 'text-[rgb(var(--rgb-accent-main))] drop-shadow-[0_0_10px_rgba(var(--rgb-accent-main),0.4)]' : 'text-[var(--text-muted)]'}`}>
                            {formatTime(timer)}
                        </div>
                    </div>

                    {/* 4. Horizontal Audio Visualizer */}
                    <div className="flex-1 flex items-end justify-between h-12 w-full gap-0.5 lg:gap-1 px-2 z-10">
                        {audioData.map((height, i) => (
                            <motion.div
                                key={i}
                                animate={{ height: `${height}%` }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={`w-full rounded-t-sm transition-colors ${recState === 'recording'
                                    ? 'bg-[rgb(var(--rgb-accent-main))] opacity-80'
                                    : recState === 'analyzing' ? 'bg-[var(--text-main)] opacity-30'
                                        : 'bg-[var(--border-color)]'
                                    }`}
                                style={{
                                    minHeight: '2px',
                                    boxShadow: recState === 'recording' ? `0 0 ${height * 0.2}px rgba(var(--rgb-accent-main), 0.5)` : 'none'
                                }}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* TRANSCRIPTION TERMINAL */}
                <motion.div layout className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-3xl flex flex-col relative overflow-hidden shadow-2xl">

                    <AnimatePresence>
                        {recState === 'analyzing' && <BigAnalyzingCrab key="analyzing" />}
                    </AnimatePresence>

                    {/* Terminal Header & Lobster Track */}
                    <div className="h-12 bg-[var(--bg-overlay)] border-b border-[var(--border-color)] flex items-center px-6 shrink-0 relative overflow-hidden">
                        <div className="flex items-center gap-3 z-10 bg-[var(--bg-overlay)] pr-4 backdrop-blur-sm">
                            <Terminal size={14} className="text-[var(--text-muted)]" />
                            <span className="text-[10px] font-space-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">Live_Feed.log</span>
                        </div>

                        {/* Running Track for the Lobster */}
                        <div className="flex-1 h-full relative border-b-2 border-dashed border-[var(--border-color)] mx-4 hidden sm:block">
                            <motion.div
                                className="absolute bottom-[2px] left-0 text-[rgb(var(--rgb-accent-main))] origin-bottom"
                                animate={
                                    recState === 'recording'
                                        ? { x: [0, 400, 400, 0, 0], scaleX: [1, 1, -1, -1, 1] }
                                        : { x: 0, scaleX: 1 }
                                }
                                transition={{
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: "linear",
                                    times: [0, 0.45, 0.5, 0.95, 1]
                                }}
                            >
                                <TacticalLobster
                                    isMoving={recState === 'recording'}
                                    isTyping={isTyping}
                                    className="drop-shadow-[0_0_10px_rgba(var(--rgb-accent-main),0.5)]"
                                />
                            </motion.div>
                        </div>

                        <span className="text-[9px] font-space-mono tracking-widest text-[var(--text-faint)] z-10 bg-[var(--bg-overlay)] sm:pl-4 backdrop-blur-sm ml-auto sm:ml-0">
                            {recState === 'recording' ? 'OPERATOR_ACTIVE' : recState === 'analyzing' ? 'SYS_BUSY' : 'OPERATOR_IDLE'}
                        </span>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 relative">
                        <AnimatePresence>
                            {recState !== 'analyzing' && (
                                <motion.div
                                    key="transcript"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 p-6 lg:p-8 overflow-y-auto font-space-mono text-sm leading-relaxed space-y-4"
                                >
                                    {transcript.map((line, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col sm:flex-row gap-2 sm:gap-6 group"
                                        >
                                            <div className="w-16 shrink-0 text-[10px] text-[var(--text-faint)] pt-1 select-none flex items-center gap-2">
                                                <ChevronRight size={10} className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity" />
                                                {line.time}
                                            </div>
                                            <div className="flex-1 bg-[var(--bg-base)] sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none border border-[var(--border-color)] sm:border-transparent">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-3 uppercase tracking-wider ${line.speaker === 'SYS' ? 'bg-[var(--border-color)] text-[var(--text-main)]' :
                                                    line.speaker === 'USR-1' ? 'bg-[rgba(var(--rgb-accent-main),0.2)] text-[rgb(var(--rgb-accent-main))] border border-[rgba(var(--rgb-accent-main),0.3)]' :
                                                        'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] border border-[var(--border-color)]'
                                                    }`}>
                                                    {line.speaker}
                                                </span>
                                                <span className={`${line.speaker === 'SYS' ? 'text-[var(--text-muted)] italic' : 'text-[var(--text-main)]'} inline-block mt-2 sm:mt-0`}>
                                                    {line.text}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {recState === 'recording' && (
                                        <div className="flex gap-6 mt-4 items-center">
                                            <div className="w-16 hidden sm:block" />
                                            <Zap size={12} className="text-[rgb(var(--rgb-accent-main))] opacity-50" />
                                            <div className="w-3 h-5 bg-[rgb(var(--rgb-accent-main))] animate-blink shadow-[0_0_8px_rgba(var(--rgb-accent-main),0.8)]" />
                                        </div>
                                    )}
                                    <div ref={transcriptEndRef} className="h-4" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-8 bg-[var(--bg-base)] border-t border-[var(--border-color)] flex items-center justify-between px-6 shrink-0 relative z-30">
                        <span className="text-[9px] font-space-mono tracking-[0.2em] text-[var(--text-faint)] hidden md:block">
                            CONNECTION: SECURE | ENCRYPTION: 256-BIT
                        </span>
                        <span className="text-[9px] font-space-mono tracking-[0.2em] text-[var(--text-faint)] md:hidden">
                            SECURE 256-BIT
                        </span>
                        <span className={`text-[9px] font-space-mono tracking-[0.2em] font-bold ${recState === 'recording' ? 'text-[rgb(var(--rgb-accent-main))]' : 'text-[var(--text-faint)]'}`}>
                            STATUS: {recState.toUpperCase()}
                        </span>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
