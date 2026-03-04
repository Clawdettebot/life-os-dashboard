import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './KnowledgeChat.css';
import { KnowledgeKnaight } from './knights';

// Knight avatars for quick actions - using user's PNGs
const SECTION_KNIGHTS = {
  cortex: { name: 'Sir Clawthchilds', avatar: '/avatars/99f2a89b-8c51-4078-af63-10046a333434.png', color: '#fbbf24' },
  ideas: { name: 'Shrimp Soldier', avatar: '/avatars/a3010206-b78c-4da9-8971-f83294efe9a6.png', color: '#8b5cf6' },
  blog: { name: 'Labrina', avatar: '/avatars/6f9d0fbf-6011-471b-8740-397b7eeb708f.png', color: '#ec4899' },
  discord: { name: 'Knaight of Affairs', avatar: '/avatars/8cd7f326-500b-4757-bca1-132886fc8c76.png', color: '#06b6d4' },
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
    
    if (section === 'ideas') {
      setMessages(prev => [...prev, { role: 'assistant', content: `Let's add an idea. What do you have in mind?`, section: 'ideas' }]);
    } else if (section === 'cortex') {
      setMessages(prev => [...prev, { role: 'assistant', content: `What should I remember for you?`, section: 'cortex' }]);
    } else if (section === 'blog') {
      setMessages(prev => [...prev, { role: 'assistant', content: `Let's draft a blog. What's the title and content?`, section: 'blog' }]);
    } else if (section === 'discord') {
      setMessages(prev => [...prev, { role: 'assistant', content: `What message should I send to Discord?`, section: 'discord' }]);
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
  };

  const formatModelName = (name) => name.replace(/^qwen2\.5:/, 'Qwen ').replace(/^qwen3:/, 'Qwen3 ').replace(/^llama3\.1:/, 'Llama ');

  return (
    <div className="knowledge-chat-full">
      {/* Alert Toast */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className={`alert-toast ${alert.type}`}
          >
            {alert.type === 'success' ? '✓' : '✕'} {alert.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-Column Layout */}
      <div className="chat-container">
        {/* LEFT: Chat Area */}
        <div className="chat-main">
          {/* Header */}
          <motion.div 
            className="chat-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="header-left">
              <h2>Knowledge Knight Chat</h2>
            </div>
            <div className="header-right">
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="model-select"
              >
                {models.map(m => (
                  <option key={m.name} value={m.name}>{formatModelName(m.name)}</option>
                ))}
              </select>
              <button onClick={clearChat} className="clear-btn">Reset</button>
            </div>
          </motion.div>

          {/* Quick Action Buttons - Using Knight Avatars */}
          <motion.div 
            className="quick-actions"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {Object.entries(SECTION_KNIGHTS).map(([key, knight]) => (
              <button 
                key={key} 
                className={`action-btn ${activeSection === key ? 'active' : ''}`}
                onClick={() => handleQuickAction(key)}
              >
                <img src={knight.avatar} alt={knight.name} className="action-icon" />
                <span>{knight.name.split(' ')[0]}</span>
              </button>
            ))}
          </motion.div>

          {/* Messages Area */}
          <div className="chat-messages">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`message ${msg.role}`}
                >
                  {msg.role === 'assistant' && (
                    <motion.div 
                      className="message-knight-avatar"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
                    >
                      <KnowledgeKnaight size={50} />
                    </motion.div>
                  )}
                  
                  <div className="message-bubble">
                    {msg.content}
                  </div>

                  {msg.role === 'user' && (
                    <motion.div 
                      className="message-user-avatar"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <span className="font-bold">ME</span>
                    </motion.div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="message assistant"
                >
                  <div className="message-knight-avatar">
                    <KnowledgeKnaight size={50} />
                  </div>
                  <div className="message-bubble loading">
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="chat-input">
            <div className="input-wrapper">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message or command..."
                className="message-input"
              />
              <button onClick={handleSend} className="send-btn" disabled={loading}>
                Send
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Animated Knight SVG with PNG background */}
        <motion.div 
          className="chat-knight-panel"
          variants={{
            hidden: { opacity: 0, scale: 0.9 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
          }}
          initial="hidden"
          animate="visible"
        >
          {/* Animated Background Blobs */}
          <div className="knight-bg-blobs">
            <motion.div 
              animate={{ scale: [1, 1.2, 0.9, 1], rotate: [0, 90, 180, 360], borderRadius: ["40%", "60%", "30%", "40%"] }} 
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="blob-1"
            />
            <motion.div 
              animate={{ scale: [0.9, 1.5, 1, 0.9], rotate: [360, 180, 90, 0], borderRadius: ["50%", "30%", "50%", "50%"] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="blob-2"
            />
          </div>
          
          {/* Knowledge Knight PNG behind animation */}
          <div className="knight-png-bg">
            <img 
              src="/avatars/2c45e97d-c391-4d77-9778-821e2dee82d6.png" 
              alt="Knowledge Knight" 
              className="knight-avatar-bg"
            />
          </div>
          
          {/* Gradient overlay */}
          <div className="knight-panel-bg" />
          
          {/* Animated Hexagon/Core */}
          <motion.div 
            animate={{ 
              y: [0, -15, 0], 
              scale: [1, 1.05, 1] 
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="knight-orb"
          >
            <svg width="160" height="200" viewBox="0 0 100 120" className="orb-svg">
              <defs>
                <linearGradient id="orbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(249, 115, 22, 0.3)" />
                  <stop offset="100%" stopColor="rgba(234, 179, 8, 0.2)" />
                </linearGradient>
              </defs>
              {/* Outer hexagon */}
              <path 
                d="M50 10 L90 30 L90 80 L50 110 L10 80 L10 30 Z" 
                fill="rgba(249, 115, 22, 0.1)" 
                stroke="rgb(249, 115, 22)" 
                strokeWidth="1" 
              />
              {/* Middle rotating ring */}
              <path 
                d="M50 20 L80 40 L80 70 L50 90 L20 70 L20 40 Z" 
                fill="rgba(249, 115, 22, 0.2)" 
                stroke="rgb(249, 115, 22)" 
                strokeWidth="2" 
                strokeDasharray="4 2" 
                className="animate-spin"
                style={{ transformOrigin: '50px 55px' }}
              />
              {/* Center core */}
              <circle cx="50" cy="55" r="10" fill="#fbbf24" className="animate-pulse" />
              {/* Rotating dashed circle */}
              <circle 
                cx="50" cy="55" r="15" 
                fill="none" 
                stroke="#fbbf24" 
                strokeWidth="1.5" 
                strokeDasharray="20 50" 
                className="animate-spin-reverse"
                style={{ transformOrigin: '50px 55px' }}
              />
              {/* Connection lines */}
              <path d="M50 55 L50 0 M50 55 L100 85 M50 55 L0 85" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            </svg>
          </motion.div>

          {/* System Status */}
          <div className="knight-status">
            <div className="status-label">SYSTEM CORE</div>
            <div className="audio-bars">
              {[1,2,3,4,5].map(i => (
                <motion.div 
                  key={i} 
                  animate={{ height: [8, Math.random()*20+10, 8] }} 
                  transition={{ duration: 0.5, repeat: Infinity, delay: i*0.1 }}
                  className="bar"
                />
              ))}
            </div>
          </div>

          {/* Knight Info */}
          <div className="knight-info">
            <h3>Knowledge Knight</h3>
            <p>Ready for queries</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
