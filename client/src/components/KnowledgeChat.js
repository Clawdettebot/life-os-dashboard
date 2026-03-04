import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './KnowledgeChat.css';
import { KnowledgeKnaight } from './knights';
import { ChevronDown } from 'lucide-react';

const SECTION_KNIGHTS = {
  cortex: { name: 'Sir Clawthchilds', avatar: '/avatars/99f2a89b-8c51-4078-af63-10046a333434.png', color: '#fbbf24' },
  ideas: { name: 'Shrimp Soldier', avatar: '/avatars/a3010206-b78c-4da9-8971-f83294efe9a6.png', color: '#8b5cf6' },
  blog: { name: 'Labrina', avatar: '/avatars/6f9d0fbf-6011-471b-8740-397b7eeb708f.png', color: '#ec4899' },
  discord: { name: 'Knaight of Affairs', avatar: '/avatars/8cd7f326-500b-4757-bca1-132886fc8c76.png', color: '#06b6d4' },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function KnowledgeChat() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('qwen2.5:3b');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Greetings, Milord. I am your Knowledge Knight. Use the quick buttons to interact with your data or state your query...' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/ollama/models');
      const data = await res.json();
      setModels(data);
      if (data.length > 0 && !selectedModel) {
        setSelectedModel(data[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
  };

  const handleQuickAction = (section) => {
    setActiveSection(section);

    let promptText = '';
    if (section === 'ideas') {
      promptText = `Let's add an idea. What do you have in mind?`;
    } else if (section === 'cortex') {
      promptText = `What should I remember for you?`;
    } else if (section === 'blog') {
      promptText = `Let's draft a blog. What's the title and content?`;
    } else if (section === 'discord') {
      promptText = `What message should I send to Discord?`;
    }

    if (promptText) {
      setMessages(prev => [...prev, { role: 'assistant', content: promptText, section }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ollama/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not connect to knowledge base.' }]);
    }
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Greetings, Milord. I am your Knowledge Knight. Use the quick buttons to interact with your data.' }]);
    setActiveSection(null);
  };

  const formatModelName = (name) => name.replace(/^qwen2\.5:/, 'Qwen ').replace(/^qwen3:/, 'Qwen3 ').replace(/^llama3\.1:/, 'Llama ');

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="h-full flex flex-col relative w-full overflow-hidden">
      {/* Alert Toast */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl font-space-mono font-bold text-xs uppercase tracking-widest shadow-2xl ${alert.type === 'success' ? 'bg-emerald-500 text-black shadow-[0_4px_20px_rgba(16,185,129,0.4)]' : 'bg-red-500 text-[var(--text-main)] shadow-[0_4px_20px_rgba(239,68,68,0.4)]'
              }`}
          >
            {alert.type === 'success' ? '✓' : '✕'} {alert.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-6 shrink-0 relative z-10 w-full">
        <div>
          <h2 className="text-lg font-bold font-space-grotesk text-[var(--text-main)] uppercase tracking-widest flex items-center gap-3">
            Knowledge Knight Chat
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none px-4 py-2 pr-8 rounded-full border border-[var(--border-color)] bg-[var(--bg-panel)] text-[var(--text-muted)] text-[10px] font-space-mono outline-none cursor-pointer"
            >
              {models.length > 0 ? models.map(m => (
                <option key={m.name} value={m.name}>{formatModelName(m.name)}</option>
              )) : (
                <option value="qwen2.5:3b">Qwen 3b</option>
              )}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>

          <button onClick={clearChat} className="px-5 py-2.5 rounded-full text-[10px] font-space-mono font-bold uppercase tracking-widest transition-all active:scale-95 duration-500 bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]">
            Reset
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0 relative z-10 w-full overflow-hidden">
        <div className="flex-1 flex flex-col bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none" />

          <div className="p-4 border-b border-[var(--border-color)] flex gap-2 relative z-10 bg-[var(--bg-base)]/50 backdrop-blur-md overflow-x-auto scrollbar-hide shrink-0">
            {Object.entries(SECTION_KNIGHTS).map(([key, knight]) => (
              <button
                key={key}
                onClick={() => handleQuickAction(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border bg-[var(--bg-card)] hover:bg-[var(--bg-overlay)] transition-colors text-[10px] font-space-mono uppercase tracking-widest whitespace-nowrap ${activeSection === key
                  ? 'border-[rgb(var(--rgb-accent-main))] text-[rgb(var(--rgb-accent-main))] shadow-[0_0_10px_rgba(var(--rgb-accent-main),0.2)]'
                  : 'border-[var(--border-color)] text-[var(--text-main)]'
                  }`}
              >
                <img src={knight.avatar} alt={knight.name} className="w-4 h-4 rounded-full object-cover" />
                {knight.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative z-10">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'self-end flex-row-reverse ml-auto' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 overflow-hidden ${msg.role === 'user'
                    ? 'border-[var(--border-color)] bg-[var(--bg-card)]'
                    : 'border-[rgb(var(--rgb-accent-main))] bg-[rgba(var(--rgb-accent-main),0.1)] shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.3)]'
                    }`}>
                    {msg.role === 'assistant' ? (
                      <KnowledgeKnaight size={24} />
                    ) : (
                      <span className="font-bold text-[10px] font-space-mono text-[var(--text-main)]">ME</span>
                    )}
                  </div>
                  <div className={`border p-5 text-sm font-space-mono leading-relaxed shadow-lg ${msg.role === 'user'
                    ? 'bg-[rgb(var(--rgb-accent-main))] text-[var(--bg-[var(--bg-card)] border-[rgb(var(--rgb-accent-main))] rounded-2xl rounded-tr-none'
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] opacity-90 rounded-2xl rounded-tl-none'
                    }`}>
                    {msg.content}
                    {msg.role === 'assistant' && idx === 0 && (
                      <>
                        <br /><br />
                        <span className="text-[var(--text-main)]/60">🧠 Available Commands:</span><br />
                        <span className="text-[var(--text-faint)]">
                          • "show cortex" / "add to cortex: [memory]"<br />
                          • "show ideas" / "add idea: [idea]"<br />
                          • "show blog posts" / "draft blog [title]: [content]"<br />
                          • "send to discord: [message]"
                        </span>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4 max-w-3xl"
                >
                  <div className="w-10 h-10 rounded-full border border-[rgb(var(--rgb-accent-main))] bg-[rgba(var(--rgb-accent-main),0.1)] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.3)]">
                    <KnowledgeKnaight size={24} />
                  </div>
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] opacity-90 rounded-2xl rounded-tl-none p-5 flex items-center gap-1 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-[rgb(var(--rgb-accent-main))] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[rgb(var(--rgb-accent-main))] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[rgb(var(--rgb-accent-main))] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </AnimatePresence>
          </div>

          <div className="p-4 border-t border-[var(--border-color)] relative z-10 bg-[var(--bg-base)]/80 backdrop-blur-xl shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message or command..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full py-4 pl-6 pr-24 text-xs font-space-mono text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[rgb(var(--rgb-accent-main))] transition-colors shadow-inner"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="absolute right-2 bg-[rgb(var(--rgb-accent-main))] text-[rgba(0,0,0,0.8)] px-6 py-2.5 rounded-full text-[10px] font-space-mono uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.5)] hover:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <motion.div variants={staggerItem} className="w-64 shrink-0 flex flex-col items-center justify-center border border-[var(--border-color)] bg-[var(--bg-panel)] rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(var(--rgb-accent-main),0.05)] to-[rgba(var(--rgb-accent-main),0.1)] pointer-events-none" />

          {/* Animated Background Blobs */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <motion.div
              animate={{ scale: [1, 1.2, 0.9, 1], rotate: [0, 90, 180, 360], borderRadius: ["40%", "60%", "30%", "40%"] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute w-[200px] h-[200px] bg-[rgba(var(--rgb-accent-main),0.15)] blur-[60px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
            <motion.div
              animate={{ scale: [0.9, 1.5, 1, 0.9], rotate: [360, 180, 90, 0], borderRadius: ["50%", "30%", "50%", "50%"] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute w-[180px] h-[180px] bg-[rgba(var(--rgb-accent-sec),0.1)] blur-[50px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>

          {/* Knowledge Knight PNG behind animation */}
          <div className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
            <img
              src="/avatars/2c45e97d-c391-4d77-9778-821e2dee82d6.png"
              alt="Knowledge Knight"
              className="w-[140px] h-[140px] rounded-full object-cover opacity-40 blur-[1px]"
            />
          </div>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--rgb-accent-main),0.1)_0%,transparent_70%)] pointer-events-none z-[2]" />

          {/* Animated Hexagon/Core */}
          <motion.div
            animate={{
              y: [0, -15, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 flex items-center justify-center"
          >
            <svg width="160" height="200" viewBox="0 0 100 120" className="drop-shadow-[0_0_20px_rgba(var(--rgb-accent-main),0.6)]">
              <defs>
                <linearGradient id="orbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(var(--rgb-accent-main), 0.3)" />
                  <stop offset="100%" stopColor="rgba(var(--rgb-accent-sec), 0.2)" />
                </linearGradient>
              </defs>
              {/* Outer hexagon */}
              <path
                d="M50 10 L90 30 L90 80 L50 110 L10 80 L10 30 Z"
                fill="rgba(var(--rgb-accent-main), 0.1)"
                stroke="rgb(var(--rgb-accent-main))"
                strokeWidth="1"
              />
              {/* Middle rotating ring */}
              <path
                d="M50 20 L80 40 L80 70 L50 90 L20 70 L20 40 Z"
                fill="rgba(var(--rgb-accent-main), 0.2)"
                stroke="rgb(var(--rgb-accent-main))"
                strokeWidth="2"
                strokeDasharray="4 2"
                className="animate-[spin_10s_linear_infinite]"
                style={{ transformOrigin: '50px 55px' }}
              />
              {/* Center core */}
              <circle cx="50" cy="55" r="10" fill="rgb(var(--rgb-accent-sec))" className="animate-pulse" />
              <circle
                cx="50" cy="55" r="15"
                fill="none"
                stroke="rgb(var(--rgb-accent-sec))"
                strokeWidth="1.5"
                strokeDasharray="20 50"
                className="animate-[spin_4s_linear_infinite_reverse]"
                style={{ transformOrigin: '50px 55px' }}
              />
              <path d="M50 55 L50 0 M50 55 L100 85 M50 55 L0 85" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            </svg>
          </motion.div>

          <div className="mt-8 text-center relative z-10">
            <div className="text-xs font-bold font-space-mono text-[var(--text-main)] uppercase tracking-[0.3em] mb-2">SYSTEM CORE</div>
            <div className="flex gap-1 justify-center h-4 items-end">
              {[1, 2, 3, 4, 5].map(i => (
                <motion.div
                  key={i}
                  animate={{ height: [8, Math.random() * 20 + 10, 8] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1 bg-[rgb(var(--rgb-accent-main))]"
                />
              ))}
            </div>

            <div className="mt-4">
              <h3 className="font-space-mono text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--text-main)]">Knowledge Knight</h3>
              <p className="font-space-mono text-[8px] uppercase tracking-widest text-[var(--text-muted)] mt-1">Ready for queries</p>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
