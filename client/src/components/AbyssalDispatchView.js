import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Palette, Crosshair, Terminal, X, Quote, ArrowRight, Activity, CornerDownRight } from 'lucide-react';

// --- ANIMATION VARIANTS ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }
};

const blockVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 25 } }
};

const articleWipe = {
  hidden: { clipPath: "inset(100% 0 0 0)", opacity: 0 },
  show: { clipPath: "inset(0% 0 0 0)", opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  exit: { clipPath: "inset(0 0 100% 0)", opacity: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

// --- TACTICAL LOBSTER ---
const TacticalLobster = ({ isMoving = false, isTyping = false, className = "" }) => {
  const leftClawRot = isTyping ? [-35, 0, -35] : isMoving ? [-15, 0, -15] : 0;
  const rightClawRot = isTyping ? [35, 0, 35] : isMoving ? [15, 0, 15] : 0;
  const animDuration = isTyping ? 0.1 : 0.3;
  const shouldRepeat = isTyping || isMoving;

  return (
    <svg viewBox="0 0 24 36" fill="none" className={className}>
      <motion.path d="M 6 12 C 0 8 0 0 6 4 C 12 6 8 12 8 14 Z" fill="currentColor" animate={{ rotate: leftClawRot }} transition={{ repeat: shouldRepeat ? Infinity : 0, duration: animDuration }} style={{ originX: '8px', originY: '14px' }} />
      <motion.path d="M 18 12 C 24 8 24 0 18 4 C 12 6 16 12 16 14 Z" fill="currentColor" animate={{ rotate: rightClawRot }} transition={{ repeat: shouldRepeat ? Infinity : 0, duration: animDuration }} style={{ originX: '16px', originY: '14px' }} />
      <motion.path d="M 10 10 L 8 4 M 14 10 L 16 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" animate={{ rotate: isTyping ? [-10, 10, -10] : 0 }} transition={{ repeat: isTyping ? Infinity : 0, duration: 0.1 }} style={{ originY: '10px' }} />
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

// --- DATA ADAPTER (Maps backend JSON to UI) ---
const parseBackendDataToUI = (data) => {
  const content = data.content || data;
  const cardTypes = ['hero-split', 'image-text-block', 'vertical-title-list', 'split-color-horizontal', 'complex-column'];
  const designIndex = typeof content.card_design === 'number' ? content.card_design : 0;
  const type = cardTypes[designIndex] || 'hero-split';

  let cardData = {};

  if (type === 'hero-split') {
    cardData = {
      headlineMain: ".DAILY", headlineSub1: "TIDE", headlineSub2: "REPORT",
      subtitle: `WOTD: ${content.word_of_the_day?.word?.toUpperCase() || 'LOADING'} - ${content.word_of_the_day?.definition?.substring(0, 60) || 'Awaiting...'}...`,
      meta1: "DATE", meta1Value: content.date || new Date().toISOString().split('T')[0],
      meta2: "AUTHOR", meta2Value: "ABYSSAL",
      meta3: "EVENTS", meta3Value: `${content.current_events?.length || 0} LOGGED`
    };
  } else if (type === 'image-text-block') {
    cardData = { title: ".NEWS_FEED", bodyTitle: content.current_events?.[0]?.title || "NO EVENTS", bodyText: content.current_events?.[0]?.description || "Awaiting...", metaLeft: `DATE: ${content.date || '--'}`, metaRight: `SOURCE: ${content.current_events?.[0]?.source || "?"}` };
  } else if (type === 'vertical-title-list') {
    cardData = { verticalLabel: "RANTS", heading1: `CONTENT ${content.date || '--'}`, heading2: `VIRAL: ${content.viral_prompt?.hook?.substring(0, 35) || '...' || 'Loading'}`, listItems: content.rant_ideas?.slice(0, 4) || [], paragraph: `ANGLE: ${content.viral_prompt?.angle || '--'} | ${content.viral_prompt?.format || '--'}` };
  } else if (type === 'split-color-horizontal') {
    cardData = { verticalLabel: "PROMPTS", heading1: "IDEATION", heading2: `DATE: ${content.date || '--'}`, listItems: content.brain_prompts?.slice(0, 4) || [] };
  } else if (type === 'complex-column') {
    cardData = { title: ".SCHEDULE", paragraph: `LINGUISTIC TARGETS // ${content.date || '--'}`, col1Title: "STREAM", col1Text: content.stream_schedule?.[0]?.activity || "None", col1Footer: content.stream_schedule?.[0]?.time || "--", col2Title: "TAGALOG", col2Text: content.tagalog_lesson?.meaning || "--", col2Footer: content.tagalog_lesson?.phrase || "--", col3Title: "FRENCH", col3Text: content.french_lesson?.meaning || "--", col3Footer: content.french_lesson?.phrase || "--" };
  }

  const articleContent = [
    { type: 'title', text: `DAILY TIDE: ${content.date || '--'}` },
    { type: 'callout', text: `WORD: ${content.word_of_the_day?.word?.toUpperCase() || 'N/A'} (${content.word_of_the_day?.partOfSpeech || ''}) - ${content.word_of_the_day?.definition || ''}` },
    { type: 'quote', text: content.quote?.text || "The depths remember.", author: content.quote?.author || "Crustazion" },
    { type: 'title', text: "EVENTS" },
    ...(content.current_events || []).map(ev => ({ type: 'body', text: `[${ev.source}] ${ev.title} - ${ev.description}` })),
    { type: 'title', text: "LANGUAGES" },
    { type: 'body', text: `TAGALOG: "${content.tagalog_lesson?.phrase}" (${content.tagalog_lesson?.meaning}) - ${content.tagalog_lesson?.usage}` },
    { type: 'body', text: `FRENCH: "${content.french_lesson?.phrase}" (${content.french_lesson?.meaning}) - ${content.french_lesson?.usage}` },
    { type: 'title', text: "RANTS & CONTENT" },
    { type: 'callout', text: `VIRAL: ${content.viral_prompt?.hook || 'No prompt'}` },
    { type: 'body', text: `FORMAT: ${content.viral_prompt?.format} | ${content.viral_prompt?.hashtags}` },
    { type: 'body', text: `RANTS: ${(content.rant_ideas || []).join(', ')}` },
    { type: 'title', text: "BRAIN PROMPTS" },
    { type: 'body', text: (content.brain_prompts || []).join(' // ') }
  ];

  return { id: data.id, cardType: type, cardData, articleContent };
};

// --- CARD WRAPPER ---
const InteractiveCardWrapper = ({ children, onClick }) => (
  <motion.div variants={cardVariant} whileHover={{ scale: 0.99, y: -4 }} whileTap={{ scale: 0.97 }} onClick={onClick} className="w-full h-full cursor-pointer relative">
    {children}
  </motion.div>
);

// --- LAYOUTS ---
const LayoutHeroSplit = ({ data, onClick }) => (
  <InteractiveCardWrapper onClick={onClick}>
    <div className="border-4 border-white bg-black flex flex-col w-full h-full group hover:border-[rgb(var(--rgb-accent-main))] transition-colors">
      <div className="flex flex-col md:flex-row p-6 md:p-8 gap-6 flex-1">
        <div className="flex flex-col flex-1 text-white font-space-grotesk font-black uppercase tracking-tighter leading-[0.85] text-5xl sm:text-6xl md:text-7xl lg:text-8xl group-hover:text-red-500 transition-colors break-words min-w-0">
          <span className="text-red-500 group-hover:text-white transition-colors">{data.headlineMain}</span>
          <span className="break-words">{data.headlineSub1}</span>
          <span className="break-words">{data.headlineSub2}</span>
        </div>
        <div className="w-full md:w-1/3 flex flex-col justify-between gap-6">
          <div className="border-4 border-white bg-[#0a0a0c] flex-1 min-h-[150px] flex items-center justify-center p-4">
            <span className="font-space-mono text-[10px] text-gray-400 text-center leading-tight">{data.subtitle?.substring(0, 80)}...</span>
          </div>
        </div>
      </div>
      <div className="border-t-4 border-white bg-white text-black p-4 flex flex-col md:flex-row justify-between font-space-mono text-[10px] font-bold uppercase tracking-widest gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex gap-4"><span className="w-16 opacity-70">{data.meta1}:</span> <span>{data.meta1Value}</span></div>
          <div className="flex gap-4"><span className="w-16 opacity-70">{data.meta2}:</span> <span>{data.meta2Value}</span></div>
          <div className="flex gap-4"><span className="w-16 opacity-70">{data.meta3}:</span> <span>{data.meta3Value}</span></div>
        </div>
      </div>
    </div>
  </InteractiveCardWrapper>
);

const LayoutImageTextBlock = ({ data, onClick }) => (
  <InteractiveCardWrapper onClick={onClick}>
    <div className="border-4 border-white bg-black flex flex-col w-full h-full p-4 md:p-6 gap-4 group hover:border-red-500 transition-colors">
      <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-space-grotesk font-black text-white uppercase tracking-tighter leading-none -ml-1 group-hover:text-red-500 transition-colors break-words min-w-0">{data.title}</h2>
      <div className="border-4 border-white flex flex-col md:flex-row flex-1">
        <div className="w-full md:w-1/3 aspect-square md:aspect-auto border-b-4 md:border-b-0 md:border-r-4 border-white bg-[#0a0a0c] flex items-center justify-center shrink-0 p-4"><span className="font-space-mono text-[10px] text-gray-400">IMG</span></div>
        <div className="w-full md:w-2/3 bg-white text-black p-6 md:p-8 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <h3 className="font-space-grotesk font-black text-xl md:text-2xl uppercase leading-tight">{data.bodyTitle}</h3>
            <p className="font-space-grotesk text-sm font-medium leading-relaxed tracking-wide line-clamp-3">{data.bodyText}</p>
          </div>
          <div className="flex justify-between items-center font-space-mono text-[10px] font-bold tracking-widest uppercase border-t border-black pt-4"><span>{data.metaLeft}</span><span>{data.metaRight}</span></div>
        </div>
      </div>
    </div>
  </InteractiveCardWrapper>
);

const LayoutVerticalTitleList = ({ data, onClick }) => (
  <InteractiveCardWrapper onClick={onClick}>
    <div className="border-4 border-white bg-black flex flex-row w-full h-full min-h-[350px] group hover:border-red-500 transition-colors">
      <div className="w-16 md:w-20 bg-white text-black flex items-center justify-center shrink-0 group-hover:bg-red-500 transition-colors overflow-hidden">
        <h2 className="vertical-text font-space-grotesk font-black text-3xl md:text-4xl uppercase tracking-widest whitespace-nowrap truncate">{data.verticalLabel}</h2>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b-4 border-white flex flex-col gap-4 min-w-0">
          <h3 className="font-space-grotesk font-black text-2xl md:text-3xl lg:text-4xl uppercase tracking-tighter leading-none text-white break-words">{data.heading1}</h3>
          <div className="h-1 w-full bg-white shrink-0" />
          <h4 className="font-space-grotesk font-bold text-base md:text-lg uppercase leading-none text-white break-words">{data.heading2}</h4>
        </div>
        <div className="flex-1 flex flex-col md:flex-row p-6 gap-6">
          <div className="w-full md:w-1/3 aspect-square border-4 border-white bg-[#0a0a0c] flex items-center justify-center shrink-0"><span className="font-space-mono text-[10px] text-gray-400">IMG</span></div>
          <div className="w-full md:w-2/3 flex flex-col gap-4 justify-between">
            <ul className="font-space-grotesk text-sm font-bold uppercase tracking-tight leading-relaxed text-white space-y-2 list-disc pl-4">{(data.listItems || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
            <p className="font-space-mono text-[9px] text-gray-400 uppercase tracking-wider">{data.paragraph}</p>
          </div>
        </div>
      </div>
    </div>
  </InteractiveCardWrapper>
);

const LayoutSplitColorHorizontal = ({ data, onClick }) => (
  <InteractiveCardWrapper onClick={onClick}>
    <div className="border-4 border-white bg-black flex flex-row w-full h-full min-h-[350px] group hover:border-red-500 transition-colors">
      <div className="w-16 md:w-20 flex flex-col shrink-0 overflow-hidden relative">
        <div className="flex-1 bg-black" />
        <div className="flex-1 bg-red-600" />
        <div className="absolute top-0 bottom-0 left-0 w-16 md:w-20 flex items-center justify-center z-10 pointer-events-none mix-blend-difference text-white">
          <h2 className="vertical-text font-space-grotesk font-black text-3xl md:text-4xl uppercase tracking-widest whitespace-nowrap truncate">{data.verticalLabel}</h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col border-l-4 border-white min-w-0">
        <div className="flex-1 p-6 bg-black flex flex-col gap-4 border-b-4 border-white justify-center min-w-0">
          <h3 className="font-space-grotesk font-black text-2xl md:text-3xl lg:text-4xl uppercase tracking-tighter leading-none text-white break-words">{data.heading1}</h3>
          <div className="h-1 w-full bg-white shrink-0" />
          <h4 className="font-space-grotesk font-bold text-sm md:text-base uppercase leading-none text-white break-words">{data.heading2}</h4>
        </div>
        <div className="flex-1 p-6 bg-red-600 flex flex-col md:flex-row gap-6 justify-between items-center text-black">
          <ul className="font-space-grotesk text-sm font-bold uppercase tracking-tight leading-relaxed space-y-1 list-disc pl-4 flex-1">{(data.listItems || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
          <div className="w-32 h-20 border-2 border-black bg-black/20 flex items-center justify-center shrink-0"><span className="font-space-mono text-[9px]">IMG</span></div>
        </div>
      </div>
    </div>
  </InteractiveCardWrapper>
);

const LayoutComplexColumn = ({ data, onClick }) => (
  <InteractiveCardWrapper onClick={onClick}>
    <div className="border-4 border-white bg-black flex flex-col w-full h-full p-4 md:p-6 gap-6 group hover:border-red-500 transition-colors">
      <div className="flex flex-col md:flex-row gap-6 items-end border-b-4 border-white pb-4 min-w-0">
        <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-space-grotesk font-black text-white uppercase tracking-tighter leading-none -ml-1 group-hover:text-red-500 transition-colors break-words min-w-0">{data.title}</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-6 flex-1">
        <div className="w-full md:w-1/3 min-h-[250px] border-4 border-white bg-[#0a0a0c] flex items-center justify-center shrink-0 p-4"><span className="font-space-mono text-[10px] text-gray-400">IMG</span></div>
        <div className="w-full md:w-2/3 flex flex-col gap-6">
          <p className="font-space-grotesk text-sm font-medium tracking-wide uppercase leading-[1.6] text-white">{data.paragraph}</p>
          <div className="bg-red-600 text-black flex-1 grid grid-cols-3 gap-4 p-6 border-4 border-white">
            <div className="flex flex-col justify-between"><div><h4 className="font-space-grotesk font-black text-sm uppercase mb-2 whitespace-pre-line leading-tight">{data.col1Title}</h4><p className="font-space-mono text-[9px] leading-tight opacity-90">{data.col1Text}</p></div><span className="font-space-grotesk font-black text-xl md:text-2xl mt-4">{data.col1Footer}</span></div>
            <div className="flex flex-col justify-between"><div><h4 className="font-space-grotesk font-black text-sm uppercase mb-2 whitespace-pre-line leading-tight">{data.col2Title}</h4><p className="font-space-mono text-[9px] leading-tight opacity-90">{data.col2Text}</p></div><span className="font-space-grotesk font-black text-xl md:text-2xl mt-4">{data.col2Footer}</span></div>
            <div className="flex flex-col justify-between"><div><h4 className="font-space-grotesk font-black text-sm uppercase mb-2 whitespace-pre-line leading-tight">{data.col3Title}</h4><p className="font-space-mono text-[9px] leading-tight opacity-90">{data.col3Text}</p></div><span className="font-space-grotesk font-black text-xl md:text-2xl mt-4">{data.col3Footer}</span></div>
          </div>
        </div>
      </div>
    </div>
  </InteractiveCardWrapper>
);

// --- ARTICLE VIEW ---
const ArticleView = ({ entry, onClose }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const lobsterLeft = useTransform(scrollYProgress, [0, 1], ["0%", "calc(100% - 32px)"]);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'auto'; }; }, []);

  const getHeroTitle = () => { const c = entry.cardData; if (c.headlineMain) return `${c.headlineMain} ${c.headlineSub1 || ''}`; if (c.title) return c.title; if (c.heading1) return c.heading1; return "LOG ENTRY"; };

  return (
    <motion.div variants={articleWipe} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-[60] bg-black overflow-hidden flex flex-col">
      <div className="flex-none h-12 bg-black border-b-2 border-gray-800 relative w-full z-[70] overflow-hidden">
        <div className="absolute top-1/2 left-4 right-4 md:left-8 md:right-8 h-[2px] bg-gradient-to-r from-gray-800 via-white to-gray-800 -translate-y-1/2" />
        <div className="absolute top-0 bottom-0 left-4 right-12 md:left-8 md:right-16">
          <motion.div style={{ left: lobsterLeft }} className="absolute top-1/2 -translate-y-1/2 w-8 h-8 text-red-500 drop-shadow-md bg-black flex items-center justify-center rounded-full">
            <TacticalLobster isMoving={true} className="w-6 h-6" />
          </motion.div>
        </div>
      </div>
      <div className="flex-none bg-white text-black flex items-center justify-between p-4 md:px-8 z-50 relative">
        <div className="flex items-center gap-4"><Activity className="w-6 h-6" /><span className="font-space-mono text-xs font-bold tracking-widest uppercase">TIDE CORE // {entry.id?.slice(0,8)}</span></div>
        <motion.button whileHover={{ scale: 1.05, backgroundColor: "rgb(220,38,38)", borderColor: "rgb(220,38,38)", color: "#fff" }} whileTap={{ scale: 0.95 }} onClick={onClose} className="flex items-center gap-2 border-2 border-black px-4 py-2 font-space-mono text-xs font-bold uppercase tracking-widest transition-colors">CLOSE <X size={16} /></motion.button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: "spring" }} className="border-b-4 border-white pb-8 mb-12 flex flex-col gap-6">
            <div className="flex items-center gap-2 font-space-mono text-xs text-red-500 tracking-widest uppercase font-bold"><CornerDownRight size={16} /> {entry.cardData.date || "TODAY"}</div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[7rem] font-space-grotesk font-black uppercase tracking-tighter leading-[0.85] text-white break-words hyphens-auto w-full">{getHeroTitle()}</h1>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="col-span-1 lg:col-span-3 flex flex-col gap-8 lg:sticky lg:top-12 h-fit">
              <div className="border-4 border-white bg-[#0a0a0c] p-6 flex flex-col items-center gap-4">
                <TacticalLobster className="w-16 h-16 text-white" />
                <div className="h-px w-full bg-gray-800 my-2" />
                <div className="w-full flex justify-between font-space-mono text-[10px] uppercase font-bold text-gray-400"><span>STATUS:</span> <span className="text-red-500">VERIFIED</span></div>
              </div>
            </motion.div>
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="col-span-1 lg:col-span-9 flex flex-col gap-16 pb-32">
              {entry.articleContent.map((block, index) => {
                switch (block.type) {
                  case 'title': return <motion.div key={index} variants={blockVariant} className="border-l-8 border-red-500 pl-6 py-2"><h2 className="text-3xl md:text-5xl font-space-grotesk font-black uppercase tracking-tighter text-white leading-[1.1] whitespace-pre-line">{block.text}</h2></motion.div>;
                  case 'body': return <motion.p key={index} variants={blockVariant} className="font-space-grotesk text-lg md:text-xl font-medium tracking-tight leading-[1.7] text-gray-300 max-w-4xl whitespace-pre-line">{block.text}</motion.p>;
                  case 'callout': return <motion.div key={index} variants={blockVariant} className="border-4 border-white bg-white text-black p-6 md:p-8 flex items-start gap-6 shadow-[8px_8px_0_rgb(220,38,38)]"><Terminal className="shrink-0 mt-1" size={32} /><p className="font-space-grotesk font-black text-xl md:text-3xl uppercase tracking-widest leading-tight whitespace-pre-line">{block.text}</p></motion.div>;
                  case 'quote': return <motion.div key={index} variants={blockVariant} className="relative py-12 my-8 px-8 md:px-16 border-2 border-white bg-[#0a0a0c]"><Quote className="absolute top-4 left-4 text-red-500 opacity-20 w-24 h-24 pointer-events-none" /><blockquote className="relative z-10 text-3xl md:text-5xl lg:text-6xl font-space-grotesk font-black uppercase italic tracking-tighter leading-[1.05] text-white">"{block.text}"</blockquote><div className="mt-8 flex items-center gap-4"><div className="h-[4px] w-16 bg-red-500" /><cite className="font-space-mono text-sm uppercase tracking-[0.2em] font-bold text-white bg-white/10 px-3 py-1">{block.author}</cite></div></motion.div>;
                  default: return null;
                }
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---
export default function AbyssalDispatchView() {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/abyssal-dispatch')
      .then(r => r.json())
      .then(data => {
        setDispatches(data.dispatches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const feedData = useMemo(() => dispatches.map(parseBackendDataToUI), [dispatches]);

  return (
    <div className="w-full min-h-screen bg-black text-white font-space-grotesk relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        .font-space-grotesk { font-family: 'Space Grotesk', sans-serif; }
        .font-space-mono { font-family: 'Space Mono', monospace; }
        .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); }
      `}</style>

      <AnimatePresence>{selectedEntry && <ArticleView key="article" entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}</AnimatePresence>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-24 md:py-32 flex flex-col gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col gap-2 mb-8 border-b-4 border-white pb-8">
          <h1 className="text-5xl md:text-7xl font-space-grotesk font-black uppercase tracking-tighter text-white">THE DAILY TIDE</h1>
          <p className="font-space-mono text-sm tracking-[0.3em] text-red-500 uppercase font-bold">// ABYSSAL DISPATCH</p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20"><TacticalLobster className="w-12 h-12 text-red-500 animate-pulse" /><span className="font-space-mono text-xs text-gray-400">LOADING DISPATCHES...</span></div>
        ) : feedData.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20"><TacticalLobster className="w-12 h-12 text-gray-600" /><span className="font-space-mono text-xs text-gray-400">NO DISPATCHES YET</span><button onClick={() => fetch('/api/abyssal-dispatch/generate', { method: 'POST' }).then(() => window.location.reload())} className="px-4 py-2 border-2 border-white text-white font-space-mono text-xs uppercase hover:bg-white hover:text-black transition-colors">GENERATE FIRST</button></div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
            {feedData.map((entry) => {
              const CardComponent = { 'hero-split': LayoutHeroSplit, 'image-text-block': LayoutImageTextBlock, 'vertical-title-list': LayoutVerticalTitleList, 'split-color-horizontal': LayoutSplitColorHorizontal, 'complex-column': LayoutComplexColumn }[entry.cardType] || LayoutHeroSplit;
              return <motion.div key={entry.id} className={entry.cardType === 'hero-split' ? "md:col-span-2" : ""}><CardComponent data={entry.cardData} onClick={() => setSelectedEntry(entry)} /></motion.div>;
            })}
          </motion.div>
        )}
        
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="w-full py-16 flex flex-col items-center justify-center gap-6 border-t-4 border-dashed border-gray-800 mt-8">
          <TacticalLobster className="w-12 h-12 text-red-500" />
          <span className="font-space-mono text-xs text-gray-500 uppercase tracking-[0.4em] font-bold">END OF STREAM</span>
        </motion.div>
      </div>
    </div>
  );
}
