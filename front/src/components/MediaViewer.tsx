import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, VolumeX, Volume2, Download } from 'lucide-react';

export interface MediaItem {
  url: string;
  type: 'photo' | 'video';
  date?: string;
  description?: string;
}

interface MediaViewerProps {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
  date?: string;
  description?: string;
  babyName?: string;
  babyBirthday?: string;
}

const computeAge = (birthday: string, targetDate: string): string => {
  const birth = new Date(birthday);
  const target = new Date(targetDate);
  const totalDays = Math.floor((target.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  if (totalDays < 0) return '';
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = totalDays % 365 % 30;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}岁`);
  if (months > 0) parts.push(`${months}个月`);
  if (days > 0 || parts.length === 0) parts.push(`${days}天`);
  return parts.join('');
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const MediaViewer: React.FC<MediaViewerProps> = ({
  items,
  initialIndex,
  onClose,
  date,
  description,
  babyName,
  babyBirthday,
}) => {
  const [current, setCurrent] = useState(initialIndex);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startX = useRef(0);
  const currentIdx = useRef(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveImage = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = url.split('/').pop() || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  currentIdx.current = current;
  const currentItem = items[current];

  // 优先使用当前 item 的 date/description，回退到 props（兼容旧调用方）
  const activeDate = currentItem?.date || date || '';
  const activeDescription = currentItem?.description || description || '';
  const dateDisplay = activeDate ? formatDate(activeDate) : '';
  const ageDisplay = useMemo(() => {
    if (!babyBirthday || !activeDate) return '';
    return computeAge(babyBirthday, activeDate);
  }, [babyBirthday, activeDate]);

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= items.length) return;
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setCurrent(idx);
    setDragOffset(0);
    setPlaying(false);
  };

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Measure container
  useEffect(() => {
    if (containerRef.current) {
      containerWidth.current = containerRef.current.offsetWidth;
    }
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragOffset(e.clientX - startX.current);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    const threshold = containerWidth.current * 0.2;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > threshold) {
      // 实际滑动了，暂停视频
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setPlaying(false);
      }
      if (dx > 0 && currentIdx.current > 0) goTo(currentIdx.current - 1);
      else if (dx < 0 && currentIdx.current < items.length - 1) goTo(currentIdx.current + 1);
      else setDragOffset(0);
    } else {
      setDragOffset(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#FFFCF7' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 z-10 shrink-0"
        style={{ backgroundColor: 'rgba(255,252,247,0.92)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-heading font-semibold" style={{ color: '#5C4033' }}>
            {current + 1} / {items.length}
          </span>
          {(dateDisplay || ageDisplay) && (
            <span className="text-[11px] font-body mt-0.5" style={{ color: '#8B7355' }}>
              {dateDisplay}
              {ageDisplay && babyName && ` · ${babyName}${ageDisplay}`}
            </span>
          )}
        </div>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(92,64,51,0.08)' }}
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <X size={18} color="#5C4033" />
        </button>
      </div>

      {/* Media track */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 overflow-hidden touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'pan-y' }}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(calc(-${current * 100}% + ${dragOffset}px))`,
            transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {items.map((item, i) => (
            <div key={i} className="w-full h-full flex-shrink-0 flex items-center justify-center">
              {item.type === 'video' ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black"
                  onClick={(e) => {
                    e.stopPropagation();
                    const v = i === current ? videoRef.current : null;
                    if (!v) return;
                    if (v.paused) { v.play(); }
                    else { v.pause(); }
                  }}
                >
                  <video
                    ref={i === current ? videoRef : undefined}
                    src={item.url}
                    className="w-full h-full object-contain"
                    playsInline
                    webkit-playsinline="true"
                    x5-video-player-type="h5"
                    muted={muted}
                    loop
                    controls={false}
                    onPlay={() => { if (i === current) setPlaying(true); }}
                    onPause={() => { if (i === current) setPlaying(false); }}
                    onEnded={() => { if (i === current) setPlaying(false); }}
                  />
                  {/* Play overlay — only when paused */}
                  {!playing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.85)', border: '2px solid #5C4033' }}>
                        <Play size={16} color="#5C4033" fill="#5C4033" className="ml-0.5" />
                      </div>
                    </div>
                  )}
                  {/* Mute toggle */}
                  <button
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                    onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                  >
                    {muted ? <VolumeX size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
                  </button>
                </div>
              ) : (
                <img
                  src={item.url}
                  alt=""
                  className="w-full h-full object-contain select-none px-4"
                  draggable={false}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    longPressTimer.current = setTimeout(() => {
                      setShowActions(true);
                    }, 600);
                  }}
                  onPointerUp={() => {
                    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                  }}
                  onPointerLeave={() => {
                    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Description footer */}
      {activeDescription && (
        <div className="px-4 py-3 z-10 shrink-0" style={{ backgroundColor: 'rgba(255,252,247,0.92)', backdropFilter: 'blur(8px)' }}>
          <p className="text-[15px] font-body leading-relaxed" style={{ color: '#5C4033' }}>{activeDescription}</p>
        </div>
      )}      {/* Save Action Bar */}
      <AnimatePresence>
        {showActions && (
          <>
            <motion.div
              className="fixed inset-0 z-[90]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActions(false)}
            />
            <motion.div
              className="fixed bottom-20 left-4 right-4 z-[91] rounded-2xl px-4 py-3 flex items-center justify-center"
              style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', boxShadow: 'rgba(92,64,51,0.15) 0 4px 16px' }}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <motion.button
                className="flex items-center gap-2 px-6 py-2"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (currentItem.url) saveImage(currentItem.url);
                  setShowActions(false);
                }}
              >
                <Download size={18} color="#5C4033" />
                <span className="text-sm font-heading font-semibold" style={{ color: '#5C4033' }}>保存到本地</span>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MediaViewer;
