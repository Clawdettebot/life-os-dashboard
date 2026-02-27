import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function LanyardLogin({ onLogin, agents = [] }) {
  const containerRef = useRef(null);
  const [isLoginForm, setIsLoginForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
    script.onload = initPhysics;
    document.head.appendChild(script);
  }, []);

  const initPhysics = () => {
    const { Engine, Runner, Bodies, Composite, Constraint } = window.Matter;
    if (!Engine) return;

    const engine = Engine.create();
    const world = engine.world;
    engine.gravity.y = 1;

    const badgeW = 320;
    const badgeH = 480;
    const anchorX = window.innerWidth / 2;
    const anchorY = -300;

    const badge = Bodies.rectangle(anchorX, anchorY + 500, badgeW, badgeH, {
      chamfer: { radius: 16 },
      frictionAir: 0.08,
      restitution: 0.1,
      density: 0.005
    });

    const anchorPoint = { x: anchorX, y: anchorY };
    const strap = Constraint.create({
      pointA: anchorPoint,
      bodyB: badge,
      pointB: { x: 0, y: -badgeH / 2 - 10 },
      stiffness: 0.1,
      damping: 0.05,
      length: 450
    });

    Composite.add(world, [badge, strap]);
    const runner = Runner.create();
    Runner.run(runner, engine);

    let dragConstraint = null;
    const badgeEl = containerRef.current.querySelector('.lanyard-badge');
    const lanyardLine = containerRef.current.querySelector('.lanyard-line');
    const lanyardShadow = containerRef.current.querySelector('.lanyard-shadow');

    const startDrag = (clientX, clientY) => {
      if (dragConstraint) return;
      const dx = clientX - badge.position.x;
      const dy = clientY - badge.position.y;
      const angle = -badge.angle;
      const localX = (dx * Math.cos(angle) - dy * Math.sin(angle));
      const localY = (dx * Math.sin(angle) + dy * Math.cos(angle));
      dragConstraint = Constraint.create({
        pointA: { x: clientX, y: clientY },
        bodyB: badge,
        pointB: { x: localX, y: localY },
        stiffness: 0.05,
        damping: 0.1,
        length: 0
      });
      Composite.add(world, dragConstraint);
    };

    const updateDrag = (clientX, clientY) => {
      if (dragConstraint) dragConstraint.pointA = { x: clientX, y: clientY };
    };

    const endDrag = () => {
      if (dragConstraint) {
        Composite.remove(world, dragConstraint);
        dragConstraint = null;
      }
    };

    const render = () => {
      const { x, y } = badge.position;
      const angle = badge.angle;
      const tiltY = badge.velocity.x * 1.5;
      const tiltX = -badge.velocity.y * 1.5;

      if (badgeEl) {
        badgeEl.style.transform = `translate3d(${x - badgeW / 2}px, ${y - badgeH / 2}px, 0) rotate(${angle}rad) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`;
      }

      const attachPoint = { x: x + Math.sin(angle) * (badgeH / 2 + 10), y: y - Math.cos(angle) * (badgeH / 2 + 10) };
      if (lanyardLine) {
        lanyardLine.setAttribute('x2', attachPoint.x);
        lanyardLine.setAttribute('y2', attachPoint.y);
      }
      if (lanyardShadow) {
        lanyardShadow.setAttribute('x2', attachPoint.x + 5);
        lanyardShadow.setAttribute('y2', attachPoint.y + 10);
      }
      requestAnimationFrame(render);
    };

    containerRef.current.addEventListener('mousedown', (e) => {
      if (e.target.closest('input') || e.target.closest('button')) return;
      startDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => updateDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', endDrag);
    render();
  };

  const handleLogin = () => {
    if (!password) return;
    setStatus('VERIFYING KEY...');
    setTimeout(() => {
      setStatus('ACCESS GRANTED');
      onLogin?.({ username, password });
    }, 1200);
  };

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(30,30,40,0.9) 0%, rgba(10,10,15,0.95) 100%)' }}>
      <svg className="lanyard-svg fixed inset-0 pointer-events-none">
        <line className="lanyard-shadow" x1="0" y1="0" x2="0" y2="0" style={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 12, strokeLinecap: 'round', filter: 'blur(3px)' }} />
        <line className="lanyard-line" x1="0" y1="0" x2="0" y2="0" style={{ stroke: '#1a1a1a', strokeWidth: 8, strokeLinecap: 'round' }} />
      </svg>

      <div className="lanyard-badge absolute top-0 left-0 w-80 rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-[#e0e0e0] p-6 flex flex-col shadow-2xl border border-[#333]">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-10 bg-gradient-to-b from-[#a8a8a8] to-[#606060] rounded-t-xl border border-[#888]">
          <div className="w-8 h-2 bg-black/60 rounded-full mx-auto mt-3"></div>
        </div>

        <div className="flex justify-center mb-5 mt-2">
          <Sparkles className="w-12 h-12 text-amber-400 animate-pulse" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }} />
        </div>

        <div className="text-center text-xs tracking-[4px] uppercase text-amber-500/80 border-b border-[#333] pb-4 mb-4">
          Life-OS All-Access
        </div>

        <div className="grid grid-cols-2 gap-3 text-[10px] uppercase text-[#666] mb-4">
          <div><div>System</div><div className="text-[#888] font-mono">v2.6.0</div></div>
          <div><div>Network</div><div className="text-green-500 font-mono">ONLINE</div></div>
        </div>

        {!isLoginForm ? (
          <div className="flex-1 cursor-pointer" onClick={() => setIsLoginForm(true)}>
            <div className="text-[10px] text-gray-500 tracking-widest mb-2">@CRUSTAZION_EMPIRE</div>
            <div className="text-2xl font-bold tracking-wider uppercase text-white mb-4">
              {agents.find(a => a.status === 'online')?.name || 'UNVERIFIED'}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              TAP TO AUTHENTICATE
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <div className="text-[10px] text-amber-500 tracking-widest mb-3">AUTHENTICATION REQUIRED</div>
            <input type="text" placeholder="USERNAME" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-[#333] rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none mb-2" />
            <input type="password" placeholder="ACCESS KEY" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-[#333] rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            <button onClick={handleLogin}
              className="w-full mt-3 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-xs uppercase tracking-wider rounded hover:from-amber-500 hover:to-amber-400 transition-all">
              Verify Identity
            </button>
            <button onClick={() => setIsLoginForm(false)} className="w-full mt-2 text-[10px] text-gray-500 hover:text-gray-300">
              ← Back
            </button>
          </div>
        )}

        <div className="flex justify-between items-end mt-4 pt-4 border-t border-[#222]">
          <div className="w-16 h-16 bg-white rounded p-1">
            <div className="w-full h-full bg-black rounded grid grid-cols-5 gap-0.5">
              {Array(25).fill(0).map((_, i) => (
                <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-black' : 'bg-white'}`}></div>
              ))}
            </div>
          </div>
          <div className="text-right text-[8px] text-[#444] leading-relaxed">
            REFERENCE ID<br/>
            <span className="text-[#666]">{Date.now().toString().slice(-8)}</span><br/><br/>
            CRUSTAZION EMPIRE<br/>
            KNIGHT PROTOCOL
          </div>
        </div>

        {status && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/90 text-white px-6 py-3 rounded-full text-xs tracking-wider backdrop-blur-xl border border-amber-500/30">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
