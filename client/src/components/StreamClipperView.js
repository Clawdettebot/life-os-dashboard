import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, Scissors, Download, Folder, Clock,
  Video, Trash2, Volume2, VolumeX, Maximize, FileVideo,
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle, AlertCircle,
  Eye, Zap, Radio, CheckCircle2, MoreHorizontal, Database,
  SkipForward, History, FolderOpen, Plus, ListVideo, Trash, X,
  Smartphone, GripHorizontal, Monitor
} from 'lucide-react';
import LobsterScrollArea from './ui/LobsterScrollArea';

// ─── Animation variants ────────────────────────────────────────────────────────
const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVars = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseTime(str) {
  if (!str) return 0;
  const parts = str.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseFloat(str) || 0;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function formatFileSize(bytes) {
  if (!bytes) return '—';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

// ─── Timeline (with optional waveform) ─────────────────────────────────────
function Timeline({ duration, currentTime, inTime, outTime, onSeek, onInChange, onOutChange, waveformPeaks }) {
  const barRef = useRef(null);
  const [dragging, setDragging] = useState(null); // 'seek' | 'in' | 'out'

  const pct = (t) => duration > 0 ? clamp((t / duration) * 100, 0, 100) : 0;

  const timeAtEvent = (e) => {
    if (!barRef.current || duration <= 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    return clamp(x, 0, 1) * duration;
  };

  const handleMouseDown = (e, type) => {
    e.preventDefault(); e.stopPropagation();
    setDragging(type);
  };

  const handleBarClick = (e) => {
    if (!duration) return;
    onSeek(timeAtEvent(e));
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const t = timeAtEvent(e);
      if (dragging === 'seek') onSeek(t);
      else if (dragging === 'in') onInChange(Math.min(t, outTime > 0 ? outTime - 0.5 : duration));
      else if (dragging === 'out') onOutChange(Math.max(t, inTime + 0.5));
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, inTime, outTime, duration, onSeek, onInChange, onOutChange]);

  const inPct = pct(inTime);
  const outPct = pct(outTime || duration);
  const playPct = pct(currentTime);

  return (
    <div className="relative w-full select-none py-2">
      {/* Container Bar */}
      <div
        ref={barRef}
        onClick={handleBarClick}
        className="relative w-full h-8 rounded-full bg-[var(--bg-panel)] border border-[var(--border-color)] cursor-pointer overflow-visible shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex items-center"
        style={{ touchAction: 'none' }}
      >
        {/* Track Line */}
        <div className="absolute left-2 right-2 h-1 bg-[var(--text-faint)] rounded-full" />

        {/* Waveform bars */}
        {waveformPeaks && waveformPeaks.length > 0 && (
          <div className="absolute left-2 right-2 bottom-0 top-0 flex items-center gap-px overflow-hidden rounded-full pointer-events-none">
            {waveformPeaks.map((peak, i) => (
              <div
                key={i}
                className="flex-1 rounded-full opacity-40"
                style={{
                  height: `${Math.max(4, peak * 100)}%`,
                  background: currentTime / duration * waveformPeaks.length > i
                    ? 'rgb(var(--rgb-accent-main))'
                    : 'var(--text-faint)'
                }}
              />
            ))}
          </div>
        )}

        {/* Highlight Region */}
        {outTime > 0 && (
          <div
            className="absolute h-full rounded-full bg-[rgb(var(--rgb-accent-main))]/20 border-y border-[rgb(var(--rgb-accent-main))]/50 shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.2)]"
            style={{ left: `calc(${inPct}% + 8px)`, width: `calc(${outPct - inPct}% - 16px)` }}
          />
        )}

        {/* Playhead */}
        <div
          className="absolute h-[150%] w-0.5 bg-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] pointer-events-none z-10"
          style={{ left: `${playPct}%`, transform: 'translateX(-50%)' }}
        />
        <div
          className="absolute w-5 h-5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] cursor-grab active:cursor-grabbing z-20 flex items-center justify-center border-2 border-[var(--bg-base)]"
          style={{ left: `${playPct}%`, transform: 'translateX(-50%)' }}
          onMouseDown={(e) => handleMouseDown(e, 'seek')}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-black" />
        </div>

        {/* IN Marker */}
        {inTime > 0 && (
          <div
            className="absolute top-1/2 -ml-2 -mt-4 w-4 h-8 bg-green-500 rounded-sm cursor-ew-resize z-30 shadow-[0_0_10px_rgba(34,197,94,0.6)] flex items-center justify-center border border-green-300"
            style={{ left: `${inPct}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'in')}
          >
            <span className="text-[8px] font-bold text-black font-space-mono">I</span>
          </div>
        )}

        {/* OUT Marker */}
        {outTime > 0 && (
          <div
            className="absolute top-1/2 -mt-4 w-4 h-8 bg-red-500 rounded-sm cursor-ew-resize z-30 shadow-[0_0_10px_rgba(239,68,68,0.6)] flex items-center justify-center border border-red-300"
            style={{ left: `${outPct}%`, marginLeft: inPct === outPct ? '16px' : '-8px' }}
            onMouseDown={(e) => handleMouseDown(e, 'out')}
          >
            <span className="text-[8px] font-bold text-black font-space-mono">O</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dual Viewport Overlay (Free-floating linked aspect ratio boxes) ────────
function DualViewportOverlay({ enabled, topBox, bottomBox, splitRatio, onTopBoxChange, onBottomBoxChange, onSplitRatioChange }) {
  const containerRef = useRef(null);

  // 'top-move' | 'bottom-move' | 'top-resize' | 'bottom-resize'
  const [dragging, setDragging] = useState(null);
  const dragStartRef = useRef({
    x: 0, y: 0,
    startBox: { x: 0, y: 0, w: 0, h: 0 },
    startSplit: 0
  });

  const getPosFromEvent = useCallback((e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    };
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const pos = getPosFromEvent(e);
      const deltaX = pos.x - dragStartRef.current.x;
      const deltaY = pos.y - dragStartRef.current.y;
      const startBox = dragStartRef.current.startBox;

      if (dragging === 'top-move') {
        onTopBoxChange({
          ...topBox,
          x: Math.max(0, Math.min(1 - topBox.w, startBox.x + deltaX)),
          y: Math.max(0, Math.min(1 - topBox.h, startBox.y + deltaY))
        });
      } else if (dragging === 'bottom-move') {
        onBottomBoxChange({
          ...bottomBox,
          x: Math.max(0, Math.min(1 - bottomBox.w, startBox.x + deltaX)),
          y: Math.max(0, Math.min(1 - bottomBox.h, startBox.y + deltaY))
        });
      } else if (dragging === 'top-resize') {
        // Uniform scaling maintaining aspect ratio based on current splitRatio
        const targetAspectRatio = (16 / 9) * splitRatio;

        // Prevent scaling down to less than 10% of width
        const newW = Math.max(0.1, startBox.w + deltaX);
        const newH = newW * targetAspectRatio;

        // Clamp to container bounds
        let finalW = newW;
        let finalH = newH;

        if (startBox.x + finalW > 1) {
          finalW = 1 - startBox.x;
          finalH = finalW * targetAspectRatio;
        }
        if (startBox.y + finalH > 1) {
          finalH = 1 - startBox.y;
          finalW = finalH / targetAspectRatio;
        }

        onTopBoxChange({ ...topBox, w: finalW, h: finalH });
      } else if (dragging === 'bottom-resize') {
        // Uniform scaling maintaining aspect ratio based on current splitRatio
        const targetAspectRatio = (16 / 9) * (1 - splitRatio);

        const newW = Math.max(0.1, startBox.w + deltaX);
        const newH = newW * targetAspectRatio;

        let finalW = newW;
        let finalH = newH;

        if (startBox.x + finalW > 1) {
          finalW = 1 - startBox.x;
          finalH = finalW * targetAspectRatio;
        }
        if (startBox.y + finalH > 1) {
          finalH = 1 - startBox.y;
          finalW = finalH / targetAspectRatio;
        }

        onBottomBoxChange({ ...bottomBox, w: finalW, h: finalH });
      }
    };

    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, topBox, bottomBox, splitRatio, getPosFromEvent, onTopBoxChange, onBottomBoxChange]);

  if (!enabled) return null;

  // Render a single box
  const renderBox = (box, label, moveType, resizeType, isTop) => {
    return (
      <div
        className={`absolute border-2 shadow-[0_0_20px_rgba(var(--rgb-accent-main),0.4)] transition-colors ${dragging && dragging !== moveType && dragging !== resizeType ? 'opacity-40 border-white/20' : 'border-[rgb(var(--rgb-accent-main))] pointer-events-auto'}`}
        style={{
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.w * 100}%`,
          height: `${box.h * 100}%`,
        }}
      >
        {/* Background translucent fill — acts as drag handle */}
        <div
          className="absolute inset-0 bg-black/20 cursor-move hover:bg-black/30 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            const pos = getPosFromEvent(e);
            dragStartRef.current = { x: pos.x, y: pos.y, startBox: box, startSplit: splitRatio };
            setDragging(moveType);
          }}
        />

        {/* Label */}
        <div className="absolute -top-3.5 left-2 px-2 py-0.5 bg-[rgb(var(--rgb-accent-main))] text-white rounded text-[8px] font-space-mono font-bold uppercase tracking-widest shadow-lg pointer-events-none">
          {label} ({(isTop ? splitRatio : 1 - splitRatio) * 100 | 0}%)
        </div>

        {/* Corner Resize Handle */}
        <div
          className="absolute -bottom-2 -right-2 w-5 h-5 bg-[rgb(var(--rgb-accent-main))] border-2 border-white rounded-full cursor-se-resize shadow-lg flex items-center justify-center hover:scale-125 transition-transform"
          onMouseDown={(e) => {
            e.preventDefault();
            const pos = getPosFromEvent(e);
            dragStartRef.current = { x: pos.x, y: pos.y, startBox: box, startSplit: splitRatio };
            setDragging(resizeType);
          }}
        >
          <div className="w-1.5 h-1.5 rounded-sm bg-white" />
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
      {/* Dark tint over the whole video so the boxes pop */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Render the two viewports */}
      {renderBox(topBox, 'Camera 1', 'top-move', 'top-resize', true)}
      {renderBox(bottomBox, 'Camera 2', 'bottom-move', 'bottom-resize', false)}

      {/* Crosshair guide lines linking them conceptually */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <line
          x1={`${(topBox.x + topBox.w / 2) * 100}%`} y1={`${(topBox.y + topBox.h / 2) * 100}%`}
          x2={`${(bottomBox.x + bottomBox.w / 2) * 100}%`} y2={`${(bottomBox.y + bottomBox.h / 2) * 100}%`}
          stroke="rgb(var(--rgb-accent-main))" strokeWidth="2" strokeDasharray="4 4"
        />
      </svg>
    </div>
  );
}

// ─── Flexible Vertical Preview Panel (fills container, 9:16 canvas) ─────────
function VerticalPreview({ videoRef, topBox, bottomBox, viewportSplitRatio, onSplitRatioChange, setTopBox, setBottomBox, isSourceVertical }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 270, h: 480 });

  // Observe container size and adjust canvas to fill while keeping 9:16
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width <= 0 || height <= 0) continue;
        // Fit a 9:16 rectangle inside container
        const targetAspect = 9 / 16;
        const containerAspect = width / height;
        let w, h;
        if (containerAspect > targetAspect) {
          // container is wider — height-limited
          h = height;
          w = height * targetAspect;
        } else {
          // container is taller — width-limited
          w = width;
          h = width / targetAspect;
        }
        setCanvasSize({ w: Math.round(w), h: Math.round(h) });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef?.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');

    const draw = () => {
      const CW = canvasSize.w;
      const CH = canvasSize.h;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        canvas.width = CW;
        canvas.height = CH;
        ctx.clearRect(0, 0, CW, CH);

        if (isSourceVertical) {
          // Source is already vertical — draw it filling canvas preserving aspect
          const srcAspect = vw / vh;
          const canvasAspect = CW / CH;
          let dw, dh, dx, dy;
          if (srcAspect > canvasAspect) {
            dw = CW; dh = CW / srcAspect; dx = 0; dy = (CH - dh) / 2;
          } else {
            dh = CH; dw = CH * srcAspect; dx = (CW - dw) / 2; dy = 0;
          }
          ctx.drawImage(video, 0, 0, vw, vh, dx, dy, dw, dh);
        } else {
          // Draw Top Box
          const topH = CH * viewportSplitRatio;
          const srcTopX = topBox.x * vw;
          const srcTopY = topBox.y * vh;
          const srcTopW = topBox.w * vw;
          const srcTopH = topBox.h * vh;
          ctx.drawImage(video, srcTopX, srcTopY, srcTopW, srcTopH, 0, 0, CW, topH);

          // Draw Bottom Box
          const botH = CH * (1 - viewportSplitRatio);
          const srcBotX = bottomBox.x * vw;
          const srcBotY = bottomBox.y * vh;
          const srcBotW = bottomBox.w * vw;
          const srcBotH = bottomBox.h * vh;
          ctx.drawImage(video, srcBotX, srcBotY, srcBotW, srcBotH, 0, topH, CW, botH);
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [videoRef, topBox, bottomBox, viewportSplitRatio, isSourceVertical, canvasSize]);

  // Handle horizontal splitting gesture in preview
  const [isSplitting, setIsSplitting] = useState(false);
  useEffect(() => {
    if (!isSplitting) return;
    const onMove = (e) => {
      if (!canvasRef.current || !onSplitRatioChange) return;
      const rect = canvasRef.current.getBoundingClientRect();
      // Calculate normalized vertical position of mouse relative to canvas
      let rawSplit = (e.clientY - rect.top) / rect.height;
      // Clamp between 10% and 90% so neither window vanishes completely
      rawSplit = Math.max(0.1, Math.min(0.9, rawSplit));
      onSplitRatioChange(rawSplit);
    };
    const onUp = () => setIsSplitting(false);

    // Set document cursor
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isSplitting, onSplitRatioChange]);

  // Sync box heights when split ratio changes
  useEffect(() => {
    if (isSourceVertical) return;

    // Maintain aspect ratios: Height = Width * (16/9) * current_split_fraction
    const topAspectRatio = (16 / 9) * viewportSplitRatio;
    const botAspectRatio = (16 / 9) * (1 - viewportSplitRatio);

    // Only update if ratio significantly changed to avoid loops
    // But since we want "dynamic connection", we let it fly.
    setTopBox(prev => {
      const nextH = prev.w * topAspectRatio;
      // Clamp to screen
      const finalH = Math.min(nextH, 1 - prev.y);
      return { ...prev, h: finalH };
    });

    setBottomBox(prev => {
      const nextH = prev.w * botAspectRatio;
      const finalH = Math.min(nextH, 1 - prev.y);
      return { ...prev, h: finalH };
    });

  }, [viewportSplitRatio, isSourceVertical, setTopBox, setBottomBox]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      {/* Phone frame */}
      <div className="relative bg-black overflow-hidden rounded-[1.8rem] border-2 border-white/15 shadow-[0_12px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(var(--rgb-accent-main),0.15)]"
        style={{ width: canvasSize.w, height: canvasSize.h }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-black rounded-b-xl z-10 flex items-center justify-center">
          <div className="w-5 h-1 bg-white/10 rounded-full" />
        </div>

        {/* Canvas preview */}
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="block w-full h-full"
        />

        {/* Horizontal Split Draggable Handle (only active for Dual Cam) */}
        {!isSourceVertical && onSplitRatioChange && (
          <div
            className="absolute left-0 right-0 z-20 flex items-center justify-center cursor-row-resize pointer-events-auto"
            style={{
              top: `calc(${viewportSplitRatio * 100}% - 14px)`,
              height: '28px'
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsSplitting(true);
            }}
          >
            {/* Splitter pill */}
            <div className={`w-20 h-5 bg-black/50 backdrop-blur-md rounded-full border shadow-lg flex items-center justify-center gap-1 transition-colors ${isSplitting ? 'border-[rgb(var(--rgb-accent-main))] shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.5)]' : 'border-white/20'}`}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-1 h-1 rounded-full ${isSplitting ? 'bg-[rgb(var(--rgb-accent-main))]' : 'bg-white/50'}`} />
              ))}
            </div>
            {/* Accent divider line across video */}
            <div className={`absolute top-1/2 left-0 right-0 h-px transition-colors ${isSplitting ? 'bg-[rgb(var(--rgb-accent-main))] shadow-[0_0_10px_rgba(var(--rgb-accent-main),0.8)]' : 'bg-transparent'}`} />
          </div>
        )}

        {/* Bottom footer label */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 flex items-center justify-between pointer-events-none">
          <span className="text-[8px] font-space-mono font-bold text-white/50 uppercase tracking-widest">Vertical Preview</span>
          <span className="text-[8px] font-space-mono font-bold text-[rgb(var(--rgb-accent-main))]">{isSourceVertical ? 'Native' : 'Dual Cam'}</span>
        </div>
      </div>
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────
export default function StreamClipper({ theme = 'dark' }) {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoPath, setVideoPath] = useState('/mnt/7DC21CFC5AB9C3AB/Videos/Livestream');
  const [outputDir, setOutputDir] = useState('');

  // Per-video metadata from ffprobe
  const [videoMeta, setVideoMeta] = useState({}); // { [path]: { duration, width, height, codec } }

  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const [inTime, setInTimeRaw] = useState(0);
  const [outTime, setOutTimeRaw] = useState(0);
  const [inInput, setInInput] = useState('');
  const [outInput, setOutInput] = useState('');
  const [clipName, setClipName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [exportedPath, setExportedPath] = useState('');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportEta, setExportEta] = useState(0);
  const [lastClip, setLastClip] = useState(null);
  const clipNameRef = useRef(null);

  // Clip history
  const [clipHistory, setClipHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Waveform data: { [videoPath]: number[] }
  const [waveformData, setWaveformData] = useState({});
  const [waveformLoading, setWaveformLoading] = useState(false);

  // Thumbnails: { [videoPath]: objectURL }
  const [thumbnails, setThumbnails] = useState({});

  // Batch clip queue
  const [clipQueue, setClipQueue] = useState([]); // [{id, name, inTime, outTime}]
  const [showQueue, setShowQueue] = useState(false);
  const [batchExporting, setBatchExporting] = useState(false);
  const [batchResults, setBatchResults] = useState(null);

  // Dual Viewport Overlay mode 
  const [mobileCropEnabled, setMobileCropEnabled] = useState(true);

  // The layout configuration for the two facecam/gameplay boxes
  const [viewportSplitRatio, setViewportSplitRatio] = useState(0.4); // 40% top, 60% bottom
  const [topBox, setTopBox] = useState({
    x: 0.2, y: 0.1,
    // width is arbitrary (e.g. 60%), height is derived from width + splitRatio
    w: 0.6, h: 0.6 * (16 / 9) * 0.4
  });
  const [bottomBox, setBottomBox] = useState({
    x: 0.1, y: 0.5,
    // width arbitrary, height is derived from width + (1 - splitRatio)
    w: 0.8, h: 0.8 * (16 / 9) * 0.6
  });

  const [mobileExporting, setMobileExporting] = useState(false);
  const [mobileExportStatus, setMobileExportStatus] = useState(''); // '' | 'done' | 'error:...'

  // Derive whether selected video is already vertical from metadata
  const isSourceVertical = useMemo(() => {
    if (!selectedVideo) return false;
    const meta = videoMeta[selectedVideo.path];
    if (!meta || !meta.width || !meta.height) return false;
    return meta.height > meta.width;
  }, [selectedVideo, videoMeta]);

  // Resizable split pane between source video and vertical preview
  const [splitRatio, setSplitRatio] = useState(0.6); // 0–1, percentage given to source panel
  const splitContainerRef = useRef(null);
  const [splitDragging, setSplitDragging] = useState(false);

  useEffect(() => {
    if (!splitDragging) return;
    const onMove = (e) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const ratio = clamp((e.clientX - rect.left) / rect.width, 0.25, 0.85);
      setSplitRatio(ratio);
    };
    const onUp = () => setSplitDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [splitDragging]);

  // Preview loop ref (so we can cancel cleanly)
  const previewStopRef = useRef(null);

  const setInTime = (v) => { setInTimeRaw(v); setInInput(formatTime(v)); };
  const setOutTime = (v) => { setOutTimeRaw(v); setOutInput(formatTime(v)); };

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stream-clipper/videos?path=${encodeURIComponent(videoPath)}`);
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (e) {
      console.error('Failed to load videos:', e);
    }
    setLoading(false);
  }, [videoPath]);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  // Load clip history on mount
  const loadClipHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/stream-clipper/clips');
      // Guard against non-JSON responses (e.g. HTML error pages)
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return;
      const data = await res.json();
      setClipHistory(data.clips || []);
    } catch (e) {
      console.error('Failed to load clip history:', e);
    }
  }, []);

  useEffect(() => { loadClipHistory(); }, [loadClipHistory]);

  // Probe metadata for a video file (lazy, only when not already fetched)
  const probeVideo = useCallback(async (file) => {
    if (videoMeta[file.path]) return;
    try {
      const res = await fetch(`/api/stream-clipper/probe?path=${encodeURIComponent(file.path)}`);
      const data = await res.json();
      if (!data.error) {
        setVideoMeta(prev => ({ ...prev, [file.path]: data }));
      }
    } catch (e) {
      // silently fail — not critical
    }
  }, [videoMeta]);

  // Probe all videos in the list sequentially after they load
  useEffect(() => {
    const runProbes = async () => {
      for (const f of videos) {
        if (!videoMeta[f.path]) {
          await probeVideo(f);
          // Small delay to prevent blocking the UI thread too much
          await new Promise(r => setTimeout(r, 100));
        }
      }
    };
    if (videos.length > 0) runProbes();
  }, [videos, probeVideo, videoMeta]);

  // Thumbnail: fetch once per video, lazy
  const fetchThumbnail = useCallback(async (file) => {
    if (thumbnails[file.path]) return;
    try {
      const url = `/api/stream-clipper/thumbnail?path=${encodeURIComponent(file.path)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      setThumbnails(prev => ({ ...prev, [file.path]: objUrl }));
    } catch (e) { /* silent */ }
  }, [thumbnails]);

  // Thumbnail: fetch sequentially after probes are settled
  useEffect(() => {
    const runThumbnails = async () => {
      for (const f of videos) {
        if (!thumbnails[f.path]) {
          await fetchThumbnail(f);
          await new Promise(r => setTimeout(r, 50));
        }
      }
    };
    if (videos.length > 0) runThumbnails();
  }, [videos, fetchThumbnail, thumbnails]);

  // Waveform: fetch when a video is selected (can be slow, runs async)
  const fetchWaveform = useCallback(async (file) => {
    if (waveformData[file.path]) return;
    setWaveformLoading(true);
    try {
      const res = await fetch(`/api/stream-clipper/waveform?path=${encodeURIComponent(file.path)}&buckets=150`);
      const data = await res.json();
      if (data.peaks) setWaveformData(prev => ({ ...prev, [file.path]: data.peaks }));
    } catch (e) { /* silent */ }
    setWaveformLoading(false);
  }, [waveformData]);

  // Batch queue helpers
  const addToQueue = () => {
    if (!selectedVideo || !clipDuration || !clipName) return;
    const entry = {
      id: Date.now(),
      name: clipName,
      inTime,
      outTime,
      sourcePath: selectedVideo.path,
      sourceName: selectedVideo.name
    };
    setClipQueue(q => [...q, entry]);
    // Reset markers for next clip
    setInTimeRaw(0); setInInput('');
    setOutTimeRaw(0); setOutInput('');
    setClipName(selectedVideo.name.replace(/\.[^/.]+$/, '') + `_clip${clipQueue.length + 2}`);
  };

  const removeFromQueue = (id) => setClipQueue(q => q.filter(c => c.id !== id));

  const runBatchExport = async () => {
    if (clipQueue.length === 0 || batchExporting) return;
    setBatchExporting(true);
    setBatchResults(null);
    try {
      const jobs = clipQueue.map(c => ({
        inputPath: c.sourcePath,
        outputName: c.name,
        startTime: c.inTime,
        endTime: c.outTime
      }));
      const res = await fetch('/api/stream-clipper/batch-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs, outputDir: outputDir || undefined })
      });
      const data = await res.json();
      setBatchResults(data);
      if (data.successCount === clipQueue.length) setClipQueue([]);
      loadClipHistory();
    } catch (e) {
      setBatchResults({ error: e.message });
    }
    setBatchExporting(false);
  };

  const handleVideoSelect = (file) => {
    setSelectedVideo(file);
    setInTimeRaw(0); setInInput('');
    setOutTimeRaw(0); setOutInput('');
    setClipName(file.name.replace(/\.[^/.]+$/, '') + '_clip');
    setExportStatus(''); setExportedPath('');
    setVideoReady(false); setCurrentTime(0); setDuration(0); setPlaying(false);
    // Kick off waveform fetch in background
    fetchWaveform(file);
  };

  const onVideoLoaded = () => { if (videoRef.current) { setDuration(videoRef.current.duration); setVideoReady(true); } };
  const onTimeUpdate = () => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); };
  const onEnded = () => setPlaying(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
  };

  const handleSeek = (t) => { if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t); } };
  const handleVolume = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) { videoRef.current.volume = val; videoRef.current.muted = val === 0; }
    setMuted(val === 0);
  };
  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !muted;
    setMuted(next); videoRef.current.muted = next;
    if (!next && volume === 0) { setVolume(0.5); videoRef.current.volume = 0.5; }
  };
  const handleFullscreen = () => { if (videoRef.current) videoRef.current.requestFullscreen?.(); };

  const markIn = () => { const t = videoRef.current?.currentTime || 0; setInTime(Math.min(t, outTime > 0 ? outTime - 0.5 : t)); };
  const markOut = () => { const t = videoRef.current?.currentTime || 0; setOutTime(Math.max(t, inTime + 0.5)); };
  const jumpToIn = () => { if (inTime >= 0) handleSeek(inTime); };
  const jumpToOut = () => { if (outTime > 0) handleSeek(outTime); };

  const onInInputChange = (v) => { setInInput(v); const t = parseTime(v); if (!isNaN(t)) setInTimeRaw(t); };
  const onOutInputChange = (v) => { setOutInput(v); const t = parseTime(v); if (!isNaN(t)) setOutTimeRaw(t); };

  // Preview clip using timeupdate event, not polling
  const previewClip = () => {
    const v = videoRef.current;
    if (!v || !inTime || !outTime) return;

    // Cancel any previous preview
    if (previewStopRef.current) {
      v.removeEventListener('timeupdate', previewStopRef.current);
      previewStopRef.current = null;
    }

    v.currentTime = inTime;
    v.play(); setPlaying(true);

    const stopCheck = () => {
      if (v.currentTime >= outTime) {
        v.pause(); setPlaying(false);
        v.removeEventListener('timeupdate', stopCheck);
        previewStopRef.current = null;
      }
    };
    previewStopRef.current = stopCheck;
    v.addEventListener('timeupdate', stopCheck);
  };

  // Cleanup preview listener on unmount
  useEffect(() => {
    return () => {
      if (previewStopRef.current && videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', previewStopRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Don't fire when typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (!videoReady) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'i':
        case 'I':
          markIn();
          break;
        case 'o':
        case 'O':
          markOut();
          break;
        case '[':
          jumpToIn();
          break;
        case ']':
          jumpToOut();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [videoReady, playing, inTime, outTime]);

  // Fixed: check outTime > inTime (not just !outTime which is falsy at 0)
  const clipDuration = (inTime >= 0 && outTime > 0 && outTime > inTime) ? outTime - inTime : 0;
  const canExport = clipDuration > 0 && clipName && !exporting;

  const exportClip = async () => {
    if (!selectedVideo || !canExport) return;

    // Start animated progress
    setExporting(true);
    setExportStatus('');
    setExportedPath('');
    setExportProgress(0);

    // Estimate duration: stream copy is ~1-3s, re-encode longer.
    // We'll animate to 90% over ~4s then hold until done.
    const estimatedMs = Math.max(2000, (outTime - inTime) * 50); // rough heuristic
    const intervalMs = 80;
    const increment = (90 / (estimatedMs / intervalMs));
    let progress = 0;
    const timer = setInterval(() => {
      progress = Math.min(progress + increment, 90);
      setExportProgress(progress);
      // ETA display: remaining % of estimated time
      const msRemaining = ((90 - progress) / 90) * estimatedMs;
      setExportEta(Math.ceil(msRemaining / 1000));
    }, intervalMs);

    const savedClipName = clipName;
    try {
      const res = await fetch('/api/stream-clipper/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputPath: selectedVideo.path,
          outputName: savedClipName,
          startTime: inTime,
          endTime: outTime,
          outputDir: outputDir || undefined
        })
      });
      const data = await res.json();
      clearInterval(timer);
      setExportProgress(100);
      setExportEta(0);
      if (data.success) {
        setLastClip({ name: savedClipName, path: data.outputPath });
        setExportStatus('done');
        loadClipHistory();
        // Auto-reset for next clip: clear name & focus input after brief delay
        setTimeout(() => {
          setExportedPath('');
          setClipName('');
          setExportProgress(0);
          setExportStatus('');
          clipNameRef.current?.focus();
          clipNameRef.current?.select();
        }, 1800);
      } else {
        setExportStatus(`error:${data.error}`);
        setExportProgress(0);
      }
    } catch (e) {
      clearInterval(timer);
      setExportStatus(`error:${e.message}`);
      setExportProgress(0);
    }
    setExporting(false);
  };

  const downloadClip = (clipPath, name) => {
    const resolvedPath = clipPath || exportedPath;
    const resolvedName = name || clipName;
    if (!resolvedPath) return;
    const url = `/api/stream-clipper/download?path=${encodeURIComponent(resolvedPath)}`;
    const a = document.createElement('a');
    a.href = url; a.download = resolvedName + '.mp4';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const exportMobileClip = async () => {
    if (!selectedVideo || !canExport || mobileExporting) return;
    const meta = videoMeta[selectedVideo.path];
    const vidW = meta?.width || 1920;
    const vidH = meta?.height || 1080;

    setMobileExporting(true);
    setMobileExportStatus('');
    try {
      let res;
      if (isSourceVertical) {
        // Already vertical — use fast stream copy, no crop needed
        res = await fetch('/api/stream-clipper/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputPath: selectedVideo.path,
            outputName: clipName + '_vertical',
            startTime: inTime,
            endTime: outTime,
            outputDir: outputDir || undefined
          })
        });
      } else {
        // Horizontal source — crop to 9:16
        res = await fetch('/api/stream-clipper/export-mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputPath: selectedVideo.path,
            outputName: clipName,
            startTime: inTime,
            endTime: outTime,
            topBox,
            bottomBox,
            videoWidth: vidW,
            videoHeight: vidH,
            outputDir: outputDir || undefined
          })
        });
      }
      const data = await res.json();
      if (data.success) {
        setMobileExportStatus('done');
        setLastClip({ name: isSourceVertical ? clipName + '_vertical' : clipName + '_mobile', path: data.outputPath });
        loadClipHistory();
        setTimeout(() => setMobileExportStatus(''), 3000);
      } else {
        setMobileExportStatus(`error:${data.error}`);
      }
    } catch (e) {
      setMobileExportStatus(`error:${e.message}`);
    }
    setMobileExporting(false);
  };


  return (
    <div className="w-full flex gap-6 h-full font-space-grotesk text-[var(--text-main)] max-w-[1600px] mx-auto overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <motion.div variants={containerVars} initial="hidden" animate="show" className="w-[320px] shrink-0 flex flex-col gap-4">

        {/* Header Block */}
        <motion.div variants={itemVars} className="p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover-spotlight hover:border-[var(--border-highlight)] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(var(--rgb-accent-main),0.05)] rounded-full blur-2xl pointer-events-none group-hover:bg-[rgba(var(--rgb-accent-main),0.15)] transition-colors" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[rgb(var(--rgb-accent-main))] text-[white] rounded-full shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.4)]">
                <Video size={16} />
              </div>
              <h2 className="font-bold uppercase tracking-widest text-[11px] font-space-mono text-[var(--text-main)]">Raw Footage<br /><span className="text-[var(--text-faint)]">Array</span></h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-[var(--bg-overlay)] rounded-full text-[8px] font-bold font-space-mono uppercase flex items-center gap-1 border border-[var(--border-color)]">
                {videos.length} <span className="opacity-50">files</span>
              </div>
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex bg-[var(--bg-panel)] rounded-xl border border-[var(--border-color)] overflow-hidden">
              <input
                type="text"
                value={videoPath}
                onChange={(e) => setVideoPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadVideos()}
                placeholder="Mount Path..."
                className="flex-1 bg-transparent px-3 py-2 text-[10px] font-space-mono text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none"
              />
              <button onClick={loadVideos} title="Refresh" className="px-3 hover:bg-[var(--bg-overlay)] transition-colors border-l border-[var(--border-color)]">
                <RefreshCw size={12} className={loading ? 'animate-spin text-[var(--text-main)]' : 'text-[var(--text-muted)]'} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Video List */}
        <motion.div variants={itemVars} className="flex-1 overflow-hidden bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover-spotlight hover:border-[var(--border-highlight)] transition-colors flex flex-col p-2">
          <LobsterScrollArea className="flex-1" contentClassName="p-4 space-y-2">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10 font-space-mono text-[10px] uppercase text-[var(--text-muted)]">Scanning DIR...</motion.div>
              ) : videos.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10 opacity-50">
                  <Database size={24} className="mx-auto mb-3" />
                  <p className="font-space-mono text-[10px] uppercase tracking-widest">Directory Void</p>
                </motion.div>
              ) : (
                videos.map((file) => {
                  const isSelected = selectedVideo?.path === file.path;
                  const meta = videoMeta[file.path];
                  return (
                    <motion.div
                      key={file.path}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleVideoSelect(file)}
                      className={`p-3 rounded-[1.5rem] cursor-pointer transition-all border-2 group ${isSelected ? 'bg-[var(--bg-panel)] border-[rgb(var(--rgb-accent-main))] shadow-[0_5px_20px_rgba(var(--rgb-accent-main),0.15)]' : 'bg-transparent border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-overlay)]'}`}
                    >
                      <div className="flex gap-3 items-center">
                        {/* Thumbnail or icon */}
                        <div className={`w-16 h-10 rounded-xl shrink-0 overflow-hidden border transition-colors flex items-center justify-center ${isSelected ? 'border-[rgb(var(--rgb-accent-main))]' : 'border-[var(--border-color)]'}`}>
                          {thumbnails[file.path] ? (
                            <img src={thumbnails[file.path]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileVideo size={16} className="text-[var(--text-faint)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-[rgb(var(--rgb-accent-main))]' : 'text-[var(--text-main)]'}`}>{file.name.replace(/\.[^/.]+$/, '')}</p>
                          <div className="flex items-center gap-2 mt-1 opacity-60">
                            <p className="text-[10px] font-space-mono uppercase">{formatFileSize(file.size)}</p>
                            {meta && (
                              <>
                                <span className="opacity-40">·</span>
                                <p className="text-[10px] font-space-mono uppercase">{formatTime(meta.duration)}</p>
                              </>
                            )}
                          </div>
                        </div>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[rgb(var(--rgb-accent-main))] shrink-0 shadow-[0_0_8px_rgba(var(--rgb-accent-main),0.8)]" />}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </LobsterScrollArea>
        </motion.div>

        {/* Clip History Toggle */}
        <motion.div variants={itemVars}>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowHistory(h => !h); setShowQueue(false); }}
              className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-2xl border transition-colors text-left ${showHistory ? 'bg-[var(--bg-panel)] border-[rgb(var(--rgb-accent-main))]' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-highlight)]'
                }`}
            >
              <div className="flex items-center gap-2">
                <History size={13} className="text-[var(--text-muted)]" />
                <span className="text-[10px] font-space-mono uppercase tracking-widest font-bold">History</span>
              </div>
              <span className="text-[10px] font-space-mono text-[var(--text-faint)]">{clipHistory.length}</span>
            </button>
            <button
              onClick={() => { setShowQueue(q => !q); setShowHistory(false); }}
              className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-2xl border transition-colors text-left ${showQueue ? 'bg-[var(--bg-panel)] border-[rgb(var(--rgb-accent-main))]' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-highlight)]'
                }`}
            >
              <div className="flex items-center gap-2">
                <ListVideo size={13} className="text-[var(--text-muted)]" />
                <span className="text-[10px] font-space-mono uppercase tracking-widest font-bold">Queue</span>
              </div>
              <span className={`text-[10px] font-space-mono ${clipQueue.length > 0 ? 'text-[rgb(var(--rgb-accent-main))] font-bold' : 'text-[var(--text-faint)]'}`}>{clipQueue.length}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden gap-4">
        <AnimatePresence mode="wait">
          {/* Clip History Panel */}
          {showHistory ? (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] flex flex-col overflow-hidden">
              <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[rgba(var(--rgb-accent-main),0.1)] rounded-xl">
                    <History size={16} className="text-[rgb(var(--rgb-accent-main))]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Clip History</h3>
                    <p className="text-[10px] font-space-mono text-[var(--text-faint)] uppercase tracking-widest">{clipHistory.length} clips this session</p>
                  </div>
                </div>
                <button onClick={() => setShowHistory(false)} className="px-4 py-2 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-color)] text-[11px] font-space-mono uppercase hover:border-[var(--border-highlight)] transition-colors">
                  Back to Editor
                </button>
              </div>
              <LobsterScrollArea className="flex-1" contentClassName="p-6 space-y-3">
                {clipHistory.length === 0 ? (
                  <div className="text-center py-16 opacity-40">
                    <Scissors size={32} className="mx-auto mb-3" />
                    <p className="font-space-mono text-[11px] uppercase tracking-widest">No clips yet this session</p>
                  </div>
                ) : clipHistory.map((clip) => (
                  <motion.div key={clip.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-4 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-color)] hover:border-[var(--border-highlight)] transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-[rgba(var(--rgb-accent-main),0.1)] flex items-center justify-center shrink-0">
                      <Scissors size={14} className="text-[rgb(var(--rgb-accent-main))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{clip.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 opacity-60">
                        <span className="text-[10px] font-space-mono">{formatTime(clip.startTime)} → {formatTime(clip.endTime)}</span>
                        <span className="opacity-40">·</span>
                        <span className="text-[10px] font-space-mono">{formatTime(clip.duration)}</span>
                        <span className="opacity-40">·</span>
                        <span className="text-[10px] font-space-mono">{formatFileSize(clip.size)}</span>
                      </div>
                      <p className="text-[9px] font-space-mono text-[var(--text-faint)] truncate mt-0.5">{clip.sourceName}</p>
                    </div>
                    <button
                      onClick={() => downloadClip(clip.outputPath, clip.name)}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-overlay)] border border-[var(--border-color)] hover:bg-[rgb(var(--rgb-accent-main))] hover:text-white hover:border-[rgb(var(--rgb-accent-main))] transition-all text-[var(--text-muted)]"
                    >
                      <Download size={14} />
                    </button>
                  </motion.div>
                ))}
              </LobsterScrollArea>
            </motion.div>
          ) : showQueue ? (
            // ── Batch Queue Panel ──
            <motion.div key="queue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] flex flex-col overflow-hidden">
              <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[rgba(var(--rgb-accent-main),0.1)] rounded-xl">
                    <ListVideo size={16} className="text-[rgb(var(--rgb-accent-main))]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Batch Queue</h3>
                    <p className="text-[10px] font-space-mono text-[var(--text-faint)] uppercase tracking-widest">{clipQueue.length} clips queued</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowQueue(false)} className="px-4 py-2 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-color)] text-[11px] font-space-mono uppercase hover:border-[var(--border-highlight)] transition-colors">
                    Back
                  </button>
                  {clipQueue.length > 0 && (
                    <motion.button
                      onClick={runBatchExport} disabled={batchExporting}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="px-4 py-2 rounded-xl bg-[rgb(var(--rgb-accent-main))] text-white text-[11px] font-space-mono uppercase font-bold shadow-[0_4px_15px_rgba(var(--rgb-accent-main),0.4)] disabled:opacity-50 flex items-center gap-2"
                    >
                      {batchExporting ? <><motion.div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} /> Exporting...</> : <><Scissors size={12} /> Export All</>}
                    </motion.button>
                  )}
                </div>
              </div>
              <LobsterScrollArea className="flex-1" contentClassName="p-6 space-y-3">
                {batchResults && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-4 rounded-2xl border text-[11px] font-space-mono ${batchResults.error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                    {batchResults.error ? `Error: ${batchResults.error}` : `✓ ${batchResults.successCount}/${clipQueue.length || batchResults.results?.length} clips exported successfully`}
                  </motion.div>
                )}
                {clipQueue.length === 0 && !batchResults ? (
                  <div className="text-center py-16 opacity-40">
                    <ListVideo size={32} className="mx-auto mb-3" />
                    <p className="font-space-mono text-[11px] uppercase tracking-widest">Queue is empty</p>
                    <p className="text-[10px] font-space-mono text-[var(--text-faint)] mt-2">Set IN/OUT markers and use<br />"Add to Queue" in the editor</p>
                  </div>
                ) : clipQueue.map((clip, i) => (
                  <motion.div key={clip.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-4 bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-color)] group">
                    <div className="w-8 h-8 rounded-full bg-[rgba(var(--rgb-accent-main),0.1)] flex items-center justify-center shrink-0 text-[10px] font-space-mono font-bold text-[rgb(var(--rgb-accent-main))]">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{clip.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 opacity-60">
                        <span className="text-[10px] font-space-mono">{formatTime(clip.inTime)} → {formatTime(clip.outTime)}</span>
                        <span className="opacity-40">·</span>
                        <span className="text-[10px] font-space-mono">{formatTime(clip.outTime - clip.inTime)}</span>
                      </div>
                      <p className="text-[9px] font-space-mono text-[var(--text-faint)] truncate mt-0.5">{clip.sourceName}</p>
                    </div>
                    <button onClick={() => removeFromQueue(clip.id)} className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-overlay)] border border-[var(--border-color)] hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all text-[var(--text-muted)] opacity-0 group-hover:opacity-100">
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </LobsterScrollArea>
            </motion.div>
          ) : selectedVideo ? (
            <motion.div key="editor" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-4 overflow-hidden h-full">

              {/* Video Viewport — resizable split pane when vertical mode enabled */}
              <div
                ref={splitContainerRef}
                className={`flex-1 rounded-[2.5rem] border border-[var(--border-highlight)] shadow-2xl relative overflow-hidden group flex flex-row`}
                style={{ background: mobileCropEnabled ? 'var(--bg-base)' : 'black' }}
              >

                {/* ── Source Video Panel ── */}
                <div
                  className="relative flex flex-col overflow-hidden"
                  style={{ width: mobileCropEnabled ? `${splitRatio * 100}%` : '100%', minWidth: 0 }}
                >
                  {/* Top overlay controls */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                      <span className="text-[10px] font-space-mono uppercase text-white tracking-widest font-bold">
                        {mobileCropEnabled ? (isSourceVertical ? 'VERTICAL SOURCE' : 'SOURCE') : 'PREVIEW'}
                      </span>
                    </div>
                    {/* Vertical/Horizontal Mode Toggle */}
                    <motion.button
                      onClick={() => setMobileCropEnabled(v => !v)}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-space-mono font-bold uppercase tracking-widest transition-all shadow-lg backdrop-blur-md ${mobileCropEnabled
                        ? 'bg-[rgb(var(--rgb-accent-main))] border-[rgb(var(--rgb-accent-main))] text-white shadow-[0_0_12px_rgba(var(--rgb-accent-main),0.5)]'
                        : 'bg-black/50 border-white/10 text-white/70 hover:text-white hover:border-white/30'
                        }`}
                    >
                      {mobileCropEnabled ? <><Smartphone size={10} /> Vertical</> : <><Monitor size={10} /> Horizontal</>}
                    </motion.button>
                  </div>

                  {/* Keyboard shortcut hint */}
                  {videoReady && !mobileCropEnabled && (
                    <div className="absolute top-4 right-4 z-20">
                      <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-3">
                        {[['Space', 'Play'], ['I', 'In'], ['O', 'Out'], ['[', '→In'], [']', '→Out']].map(([key, label]) => (
                          <span key={key} className="flex items-center gap-1">
                            <kbd className="text-[8px] font-space-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/20 text-white">{key}</kbd>
                            <span className="text-[8px] text-white/40 font-space-mono">{label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video element */}
                  <div className={`flex-1 relative bg-black ${isSourceVertical ? 'flex items-center justify-center' : ''}`}>
                    <video
                      ref={videoRef}
                      src={`/api/stream-clipper/stream?path=${encodeURIComponent(selectedVideo.path)}`}
                      className="w-full h-full object-contain"
                      onLoadedMetadata={onVideoLoaded}
                      onTimeUpdate={onTimeUpdate}
                      onEnded={onEnded}
                      onPlay={() => setPlaying(true)}
                      onPause={() => setPlaying(false)}
                      preload="metadata"
                    />
                    {!videoReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 border-2 border-[rgb(var(--rgb-accent-main))] border-t-transparent rounded-full animate-spin mb-4" />
                          <span className="font-space-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Mounting Video...</span>
                        </div>
                      </div>
                    )}
                    {/* Crop overlay — only for horizontal sources when vertical mode active */}
                    {mobileCropEnabled && !isSourceVertical && (
                      <DualViewportOverlay
                        enabled={true}
                        topBox={topBox}
                        bottomBox={bottomBox}
                        splitRatio={viewportSplitRatio}
                        onTopBoxChange={setTopBox}
                        onBottomBoxChange={setBottomBox}
                        onSplitRatioChange={setViewportSplitRatio}
                      />
                    )}
                    <div className="absolute inset-0 cursor-pointer hidden group-hover:block transition-opacity" onClick={togglePlay} />
                    <AnimatePresence>
                      {!playing && videoReady && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
                        >
                          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                            <Play size={28} className="text-white ml-1.5 opacity-90" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ── Draggable Divider ── */}
                {mobileCropEnabled && videoReady && (
                  <div
                    className="relative z-30 flex items-center justify-center shrink-0 cursor-col-resize group/divider"
                    style={{ width: '16px' }}
                    onMouseDown={(e) => { e.preventDefault(); setSplitDragging(true); }}
                  >
                    {/* Divider line */}
                    <div className={`absolute inset-y-0 w-px ${splitDragging ? 'bg-[rgb(var(--rgb-accent-main))]' : 'bg-white/10 group-hover/divider:bg-white/30'} transition-colors`} />
                    {/* Grip handle */}
                    <div className={`relative w-4 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all ${splitDragging
                      ? 'bg-[rgb(var(--rgb-accent-main))] shadow-[0_0_15px_rgba(var(--rgb-accent-main),0.6)]'
                      : 'bg-[var(--bg-panel)] border border-[var(--border-color)] group-hover/divider:border-[rgb(var(--rgb-accent-main))] group-hover/divider:shadow-[0_0_10px_rgba(var(--rgb-accent-main),0.3)]'
                      }`}>
                      {[0, 1, 2].map(i => (
                        <div key={i} className={`w-1 h-1 rounded-full ${splitDragging ? 'bg-white' : 'bg-[var(--text-faint)] group-hover/divider:bg-[rgb(var(--rgb-accent-main))]'} transition-colors`} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Vertical Preview Panel ── */}
                {mobileCropEnabled && videoReady && (
                  <div
                    className="relative flex flex-col overflow-hidden bg-[var(--bg-panel)]"
                    style={{ width: `${(1 - splitRatio) * 100}%`, minWidth: 0 }}
                  >
                    {/* Panel header */}
                    <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
                      <div className="px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5">
                        <Smartphone size={9} className="text-[rgb(var(--rgb-accent-main))]" />
                        <span className="text-[9px] font-space-mono uppercase text-white/70 tracking-widest font-bold">
                          {isSourceVertical ? 'Native' : '9:16'}
                        </span>
                      </div>
                      <div className="px-2 py-1 bg-black/30 backdrop-blur-md rounded-full border border-white/10">
                        <span className="text-[8px] font-space-mono text-white/40">
                          {Math.round((1 - splitRatio) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Preview fills this container */}
                    <div className="flex-1 p-3 pt-10">
                      <VerticalPreview
                        videoRef={videoRef}
                        topBox={topBox}
                        bottomBox={bottomBox}
                        viewportSplitRatio={viewportSplitRatio}
                        onSplitRatioChange={setViewportSplitRatio}
                        setTopBox={setTopBox}
                        setBottomBox={setBottomBox}
                        isSourceVertical={isSourceVertical}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Control Deck */}
              <div className="h-[280px] shrink-0 flex gap-4">

                {/* Timeline & Markers */}
                <div className="flex-1 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] p-6 md:p-8 flex flex-col justify-between hover-spotlight shadow-sm">
                  {/* Stats Row */}
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex gap-8 items-baseline">
                      <div>
                        <span className="block text-[10px] font-space-mono uppercase tracking-widest text-[var(--text-faint)] mb-1">Playhead</span>
                        <span className="text-4xl lg:text-5xl font-bold font-space-mono tracking-tighter text-[var(--text-main)]">
                          {formatTime(currentTime)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-space-mono uppercase tracking-widest text-[var(--text-faint)] mb-1">Duration</span>
                        <span className="text-xl font-bold font-space-mono text-[var(--text-muted)]">
                          {formatTime(duration)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-[rgb(var(--rgb-accent-main))] text-white flex items-center justify-center shadow-[0_0_20px_rgba(var(--rgb-accent-main),0.4)] hover:scale-105 transition-all">
                        {playing ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                      </button>
                      <div className="flex items-center gap-2 bg-[var(--bg-panel)] px-4 py-2 rounded-full border border-[var(--border-color)]">
                        <button onClick={toggleMute} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                          {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={muted ? 0 : volume} onChange={handleVolume}
                          className="w-20 h-1 accent-[rgb(var(--rgb-accent-main))] cursor-pointer bg-[var(--text-faint)] rounded-full outline-none appearance-none"
                        />
                      </div>
                      <button onClick={handleFullscreen} className="w-10 h-10 rounded-full bg-[var(--bg-panel)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)]">
                        <Maximize size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Visual Timeline */}
                  <Timeline
                    duration={duration} currentTime={currentTime}
                    inTime={inTime} outTime={outTime}
                    onSeek={handleSeek} onInChange={setInTime} onOutChange={setOutTime}
                    waveformPeaks={waveformData[selectedVideo?.path]}
                  />
                  {waveformLoading && (
                    <div className="text-[9px] font-space-mono text-[var(--text-faint)] uppercase tracking-widest -mt-1 flex items-center gap-1">
                      <motion.div className="w-2 h-2 border border-[var(--text-faint)] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                      Analyzing waveform...
                    </div>
                  )}

                  {/* Marker Controls */}
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-3">
                      {/* IN */}
                      <div className="flex items-center gap-1.5 bg-[var(--bg-base)] px-2 py-1.5 rounded-xl border border-[var(--border-color)]">
                        <button onClick={jumpToIn} title="Jump to IN [" disabled={!inTime} className="w-6 h-6 flex items-center justify-center text-green-500/60 hover:text-green-500 disabled:opacity-20 transition-colors">
                          <SkipBack size={12} />
                        </button>
                        <button onClick={markIn} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-500 rounded-lg text-[10px] font-bold font-space-mono uppercase hover:bg-green-500/30 transition-colors">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> IN
                        </button>
                        <input type="text" value={inInput} onChange={e => onInInputChange(e.target.value)} className="w-14 bg-transparent text-center font-space-mono text-xs font-bold focus:outline-none" placeholder="0:00" />
                      </div>
                      {/* OUT */}
                      <div className="flex items-center gap-1.5 bg-[var(--bg-base)] px-2 py-1.5 rounded-xl border border-[var(--border-color)]">
                        <button onClick={markOut} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-500 rounded-lg text-[10px] font-bold font-space-mono uppercase hover:bg-red-500/30 transition-colors">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> OUT
                        </button>
                        <input type="text" value={outInput} onChange={e => onOutInputChange(e.target.value)} className="w-14 bg-transparent text-center font-space-mono text-xs font-bold focus:outline-none" placeholder="0:00" />
                        <button onClick={jumpToOut} title="Jump to OUT ]" disabled={!outTime} className="w-6 h-6 flex items-center justify-center text-red-500/60 hover:text-red-500 disabled:opacity-20 transition-colors">
                          <SkipForward size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-space-mono uppercase tracking-widest text-[var(--text-faint)]">Clip:</span>
                      <span className="font-space-mono font-bold text-lg text-[rgb(var(--rgb-accent-main))]">{formatTime(clipDuration)}</span>
                      <button onClick={previewClip} disabled={!videoReady || !inTime || !outTime} className="ml-1 w-9 h-9 rounded-full border-2 border-[var(--text-main)] flex items-center justify-center hover:bg-[var(--text-main)] hover:text-[var(--bg-base)] transition-colors disabled:opacity-30">
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={addToQueue}
                        disabled={!clipDuration || !clipName}
                        title="Add to batch queue"
                        className="w-9 h-9 rounded-full bg-[rgba(var(--rgb-accent-main),0.1)] border border-[rgba(var(--rgb-accent-main),0.3)] text-[rgb(var(--rgb-accent-main))] flex items-center justify-center hover:bg-[rgba(var(--rgb-accent-main),0.2)] transition-colors disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                      {clipQueue.length > 0 && (
                        <button onClick={() => { setShowQueue(true); setShowHistory(false); }}
                          className="px-3 py-1.5 rounded-full bg-[rgb(var(--rgb-accent-main))] text-white text-[9px] font-space-mono font-bold uppercase tracking-widest shadow-[0_0_12px_rgba(var(--rgb-accent-main),0.4)] hover:opacity-90 transition-opacity flex items-center gap-1.5"
                        >
                          <ListVideo size={10} /> {clipQueue.length}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Export Module */}
                <div className="w-[310px] border-4 border-[var(--border-color)] bg-[var(--bg-panel)] rounded-[2.5rem] flex flex-col p-6 shadow-[10px_10px_0_0_rgba(var(--rgb-accent-main),0.1)] relative overflow-hidden">

                  {/* Animated scanline bg during export */}
                  <AnimatePresence>
                    {exporting && (
                      <motion.div
                        key="scanline"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none z-0"
                        style={{
                          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(var(--rgb-accent-main),0.03) 3px, rgba(var(--rgb-accent-main),0.03) 4px)'
                        }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="relative z-10 flex flex-col h-full gap-3">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={exporting ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : { scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, repeat: exporting ? Infinity : 0 }}
                        className="w-2 h-2 rounded-full bg-[rgb(var(--rgb-accent-main))]"
                      />
                      <span className="text-[10px] font-space-mono uppercase tracking-widest font-bold">Terminal_Out</span>
                    </div>

                    {/* Clip name input */}
                    <input
                      ref={clipNameRef}
                      type="text" value={clipName} onChange={e => setClipName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && canExport && exportClip()}
                      disabled={exporting}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm font-space-mono focus:outline-none focus:border-[rgb(var(--rgb-accent-main))] placeholder:text-[var(--text-faint)] disabled:opacity-50 transition-colors"
                      placeholder="Clip filename..."
                    />

                    {/* Output directory */}
                    <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl px-3 py-2 focus-within:border-[rgb(var(--rgb-accent-main))] transition-colors">
                      <FolderOpen size={12} className="text-[var(--text-faint)] shrink-0" />
                      <input
                        type="text" value={outputDir} onChange={e => setOutputDir(e.target.value)}
                        className="flex-1 bg-transparent text-[10px] font-space-mono focus:outline-none placeholder:text-[var(--text-faint)] min-w-0"
                        placeholder="Output dir (default: ~/Videos/clips)"
                      />
                    </div>

                    {/* ── Progress bar (visible during export) ── */}
                    <div className="relative">
                      <div className="h-1.5 w-full bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border-color)]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: exportStatus === 'done' ? 'rgb(34,197,94)' :
                              exportStatus.startsWith('error') ? 'rgb(239,68,68)' :
                                'rgb(var(--rgb-accent-main))'
                          }}
                          initial={{ width: '0%' }}
                          animate={{ width: `${exportProgress}%` }}
                          transition={{ duration: 0.15, ease: 'linear' }}
                        />
                      </div>

                      {/* ETA / status text line */}
                      <div className="mt-1.5 h-4 flex items-center justify-between">
                        <AnimatePresence mode="wait">
                          {exporting && (
                            <motion.span
                              key="progress-text"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="text-[9px] font-space-mono uppercase tracking-widest text-[var(--text-muted)] tabular-nums"
                            >
                              {exportEta > 0 ? `Processing... ~${exportEta}s` : 'Finalizing...'}
                            </motion.span>
                          )}
                          {exportStatus === 'done' && !exporting && (
                            <motion.span
                              key="done-text"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="text-[9px] font-space-mono uppercase tracking-widest text-green-500"
                            >
                              ✓ Saved — enter next name
                            </motion.span>
                          )}
                          {exportStatus.startsWith('error') && !exporting && (
                            <motion.span
                              key="err-text"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="text-[9px] font-space-mono uppercase tracking-widest text-red-500 truncate max-w-[160px]"
                            >
                              {exportStatus.replace('error:', '')}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <span className="text-[9px] font-space-mono text-[var(--text-faint)] tabular-nums">
                          {exportProgress > 0 ? `${Math.round(exportProgress)}%` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Generate button — always visible */}
                    <motion.button
                      onClick={exportClip}
                      disabled={!canExport}
                      whileHover={canExport ? { scale: 1.02 } : {}}
                      whileTap={canExport ? { scale: 0.97 } : {}}
                      className="w-full py-3.5 border-2 border-[var(--text-main)] text-[var(--text-main)] rounded-xl text-xs font-space-mono font-bold uppercase tracking-widest hover:border-[rgb(var(--rgb-accent-main))] hover:text-[rgb(var(--rgb-accent-main))] transition-colors disabled:opacity-30 flex items-center justify-center gap-2 group relative overflow-hidden"
                    >
                      {/* Fill sweep animation during export */}
                      {exporting && (
                        <motion.div
                          className="absolute inset-0 bg-[rgb(var(--rgb-accent-main))]/10"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        {exporting ? (
                          <>
                            <motion.div
                              className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            />
                            GENERATING...
                          </>
                        ) : (
                          <><Scissors size={14} /> GENERATE CLIP</>
                        )}
                      </span>
                    </motion.button>

                    {/* Export Vertical button — shown when vertical mode is active */}
                    <AnimatePresence>
                      {mobileCropEnabled && (
                        <motion.div
                          key="mobile-export-section"
                          initial={{ opacity: 0, height: 0, y: -6 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col gap-1.5 overflow-hidden"
                        >
                          {/* Divider */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-[var(--border-color)]" />
                            <span className="text-[8px] font-space-mono uppercase tracking-widest text-[var(--text-faint)] flex items-center gap-1">
                              <Smartphone size={8} /> {isSourceVertical ? 'Vertical' : 'Mobile'}
                            </span>
                            <div className="flex-1 h-px bg-[var(--border-color)]" />
                          </div>

                          {/* Crop info readout */}
                          <div className="flex items-center justify-between px-1">
                            {isSourceVertical ? (
                              <>
                                <span className="text-[8px] font-space-mono text-[var(--text-faint)]">Native vertical source</span>
                                <span className="text-[8px] font-space-mono text-green-400">Stream copy ⚡</span>
                              </>
                            ) : (
                              <>
                                <span className="text-[8px] font-space-mono text-[var(--text-faint)]">Cam 1 {Math.round(viewportSplitRatio * 100)}% / Cam 2 {Math.round((1 - viewportSplitRatio) * 100)}%</span>
                                <span className="text-[8px] font-space-mono text-[rgb(var(--rgb-accent-main))]">Dual Cam 9:16</span>
                              </>
                            )}
                          </div>

                          <motion.button
                            onClick={exportMobileClip}
                            disabled={!canExport || mobileExporting}
                            whileHover={canExport && !mobileExporting ? { scale: 1.02 } : {}}
                            whileTap={canExport && !mobileExporting ? { scale: 0.97 } : {}}
                            className="w-full py-3 border-2 border-[rgb(var(--rgb-accent-main))]/60 text-[rgb(var(--rgb-accent-main))] rounded-xl text-xs font-space-mono font-bold uppercase tracking-widest hover:bg-[rgb(var(--rgb-accent-main))]/10 transition-colors disabled:opacity-30 flex items-center justify-center gap-2 relative overflow-hidden"
                          >
                            {mobileExporting && (
                              <motion.div
                                className="absolute inset-0 bg-[rgb(var(--rgb-accent-main))]/10"
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                              />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                              {mobileExporting ? (
                                <>
                                  <motion.div
                                    className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                  />
                                  {isSourceVertical ? 'EXPORTING VERTICAL...' : 'EXPORTING MOBILE...'}
                                </>
                              ) : (
                                <><Smartphone size={13} /> {isSourceVertical ? 'EXPORT VERTICAL' : 'EXPORT MOBILE'}</>
                              )}
                            </span>
                          </motion.button>

                          {/* Mobile export status */}
                          <AnimatePresence mode="wait">
                            {mobileExportStatus === 'done' && (
                              <motion.div
                                key="mob-done"
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5 text-[9px] font-space-mono text-green-400 px-1"
                              >
                                <CheckCircle2 size={10} /> {isSourceVertical ? 'Vertical clip saved!' : 'Mobile clip saved!'}
                              </motion.div>
                            )}
                            {mobileExportStatus.startsWith('error') && (
                              <motion.div
                                key="mob-err"
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="text-[9px] font-space-mono text-red-400 px-1 truncate"
                              >
                                {mobileExportStatus.replace('error:', '')}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Last exported clip badge — download without blocking next clip */}
                    <AnimatePresence>
                      {lastClip && !exporting && (
                        <motion.div
                          key={lastClip.path}
                          initial={{ opacity: 0, height: 0, y: 8 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2"
                        >
                          <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                          <span className="text-[9px] font-space-mono text-green-400 truncate flex-1">{lastClip.name}</span>
                          <button
                            onClick={() => downloadClip(lastClip.path, lastClip.name)}
                            title="Download"
                            className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-green-500/20 hover:bg-green-500/40 text-green-400 transition-colors"
                          >
                            <Download size={10} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
              <div className="w-24 h-24 rounded-[2rem] bg-[var(--bg-panel)] flex items-center justify-center mb-6 shadow-inner border border-[var(--border-color)] relative overflow-hidden">
                <div className="absolute inset-0 bg-tech-grid opacity-30" />
                <Scissors size={32} className="text-[var(--text-faint)] relative z-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Awaiting Selection</h3>
              <p className="text-[11px] font-space-mono text-[var(--text-muted)] uppercase tracking-widest mb-6">Select a file from the raw footage array.</p>
              <div className="flex items-center gap-4 opacity-50">
                {[['Space', 'Play/Pause'], ['I', 'Mark In'], ['O', 'Mark Out'], ['[', 'Jump In'], [']', 'Jump Out']].map(([key, label]) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <kbd className="px-2.5 py-1 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-color)] text-[11px] font-space-mono font-bold">{key}</kbd>
                    <span className="text-[9px] font-space-mono uppercase tracking-widest text-[var(--text-faint)]">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
