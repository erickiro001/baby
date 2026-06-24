import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerProps {
  images: string[];
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

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  initialIndex,
  onClose,
  date,
  description,
  babyName,
  babyBirthday,
}) => {
  const [current, setCurrent] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [scale, setScale] = useState(1);
  const lastScale = useRef(1);
  const touchStart = useRef<{ x: number; y: number; dist: number } | null>(null);
  const touchRef = useRef<HTMLDivElement>(null);

  const dateDisplay = date ? formatDate(date) : '';
  const ageDisplay = useMemo(() => {
    if (!babyBirthday || !date) return '';
    return computeAge(babyBirthday, date);
  }, [babyBirthday, date]);

  const goNext = useCallback(() => {
    if (current < images.length - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
      setScale(1);
      lastScale.current = 1;
    }
  }, [current, images.length]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setDirection(-1);
      setCurrent((c) => c - 1);
      setScale(1);
      lastScale.current = 1;
    }
  }, [current]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Touch handlers
  const getTouches = (e: React.TouchEvent) => Array.from(e.touches);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touches = getTouches(e);
    if (touches.length === 2) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      touchStart.current = { x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2, dist: Math.hypot(dx, dy) };
    } else {
      touchStart.current = { x: touches[0].clientX, y: touches[0].clientY, dist: 0 };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touches = getTouches(e);
    if (touches.length === 2 && touchStart.current.dist > 0) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = Math.max(0.5, Math.min(3, lastScale.current * (dist / touchStart.current.dist)));
      setScale(newScale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || scale > 1) {
      lastScale.current = scale;
      touchStart.current = null;
      return;
    }
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goPrev();
      else goNext();
    }
    touchStart.current = null;
  };

  const mouseStart = useRef<{ x: number } | null>(null);
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStart.current = { x: e.clientX };
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!mouseStart.current) return;
    const dx = e.clientX - mouseStart.current.x;
    if (Math.abs(dx) > 50) {
      if (dx > 0) goPrev();
      else goNext();
    }
    mouseStart.current = null;
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: '#FFFCF7' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 z-10 shrink-0"
        style={{ backgroundColor: 'rgba(255,252,247,0.92)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-heading font-semibold" style={{ color: '#5C4033' }}>
            {current + 1} / {images.length}
          </span>
          {(dateDisplay || ageDisplay) && (
            <span className="text-[11px] font-body mt-0.5" style={{ color: '#8B7355' }}>
              {dateDisplay}
              {ageDisplay && babyName && ` · ${babyName}${ageDisplay}`}
            </span>
          )}
        </div>
        <motion.button
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(92,64,51,0.08)' }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <X size={18} color="#5C4033" />
        </motion.button>
      </div>

      {/* Image area */}
      <div
        className="relative flex-1 min-h-0"
        ref={touchRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={current}
            className="absolute inset-0 flex items-center justify-center"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ touchAction: 'none' }}
          >
            <img
              src={images[current]}
              alt=""
              className="w-full h-full object-contain select-none"
              style={{ transform: `scale(${scale})`, transition: scale === 1 ? 'transform 0.3s ease' : 'none' }}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {current > 0 && (
          <motion.button
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(92,64,51,0.12)' }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          >
            <ChevronLeft size={22} color="#5C4033" />
          </motion.button>
        )}
        {current < images.length - 1 && (
          <motion.button
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(92,64,51,0.12)' }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); goNext(); }}
          >
            <ChevronRight size={22} color="#5C4033" />
          </motion.button>
        )}
      </div>

      {/* Description footer */}
      {description && (
        <div className="px-4 py-3 z-10 shrink-0" style={{ backgroundColor: 'rgba(255,252,247,0.92)', backdropFilter: 'blur(8px)' }}>
          <p className="text-[15px] font-body leading-relaxed" style={{ color: '#5C4033' }}>{description}</p>
        </div>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {images.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === current ? 16 : 6,
                height: 6,
                backgroundColor: i === current ? '#5C4033' : 'rgba(92,64,51,0.25)',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ImageViewer;
