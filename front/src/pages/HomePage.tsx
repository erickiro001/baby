import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Star, Trash2, X, Image, Play, FileText, Calendar, ChevronRight, ChevronLeft, VolumeX, Volume2, Maximize } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { smartTimeDisplay } from '@/lib/timeFormat';
import BottomNav from '@/components/BottomNav';
import CommentsDrawer from '@/components/CommentsDrawer';
import ImageViewer from '@/components/MediaViewer';
import type { TimelineEntry, ContentType } from '@/types';
import type { MediaItem } from '@/components/MediaViewer';

type FilterMode = { type: 'all' } | { type: 'content'; contentType: ContentType };

/* ─── helpers ─── */
const avatarColor = (name: string) => {
  const colors = ['#FFD6E5', '#A8D8EA', '#FFF4E1', '#B8D4E3', '#FF8A8A', '#D4E5A8'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

/* ─── Card Wrapper ─── */
const CardWrapper: React.FC<{ entry: TimelineEntry; index: number; children: React.ReactNode }> = ({ entry, index, children }) => (
  <motion.div
    className="rounded-xl overflow-hidden mb-4 select-none relative"
    style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', boxShadow: 'rgba(92,64,51,0.08) 0 3px 10px' }}
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.35 }}
    data-date={entry.date}
  >
    {children}
  </motion.div>
);

/* ─── Author Row ─── */
const AuthorRow: React.FC<{ entry: TimelineEntry }> = ({ entry }) => (
  <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-1.5">
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-heading font-bold shrink-0" style={{ backgroundColor: avatarColor(entry.authorName), color: '#5C4033' }}>
      {entry.authorName.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-heading font-semibold truncate" style={{ color: '#5C4033' }}>{entry.authorName}</span>
        {entry.featured && <Star size={11} color="#5C4033" fill="#FFD6E5" strokeWidth={2} />}
      </div>
      <span className="text-[11px]" style={{ color: '#A09890' }}>{smartTimeDisplay(entry.date)}</span>
    </div>
  </div>
);

/* ─── Tag Row ─── */
const TagRow: React.FC<{ tags: string[] }> = ({ tags }) => {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1 px-3.5 pb-1.5">
      {tags.map((tag) => <span key={tag} className="text-[11px] font-heading px-2 py-0.5 rounded-full" style={{ backgroundColor: '#A8D8EA25', color: '#5C4033' }}>{tag}</span>)}
    </div>
  );
};

/* ─── Action Bar ─── */
const ActionBar: React.FC<{ entry: TimelineEntry }> = ({ entry }) => {
  const toggleLike = useStore((s) => s.toggleLike);
  const deleteTimelineEntry = useStore((s) => s.deleteTimelineEntry);
  const openComments = useStore((s) => s.openComments);
  const [likedAnim, setLikedAnim] = useState(false);
  const handleLike = () => { toggleLike(entry.id); if (!entry.liked) { setLikedAnim(true); setTimeout(() => setLikedAnim(false), 400); } };
  const handleDelete = () => { if (confirm('确定删除这条动态吗？')) { deleteTimelineEntry(entry.id); } };

  return (
    <div className="flex items-center gap-4 px-3.5 py-2.5 border-t" style={{ borderColor: 'rgba(92,64,51,0.06)' }}>
      <motion.button className="flex items-center gap-1.5" whileTap={{ scale: 0.8 }} onClick={handleLike}>
        <motion.div animate={likedAnim ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.3 }}>
          <Heart size={18} strokeWidth={2} fill={entry.liked ? '#FF8A8A' : 'none'} color={entry.liked ? '#FF8A8A' : '#A09890'} />
        </motion.div>
        <span className="text-xs font-heading" style={{ color: entry.liked ? '#FF8A8A' : '#A09890' }}>{entry.likes}</span>
      </motion.button>
      <motion.button className="flex items-center gap-1.5" whileTap={{ scale: 0.9 }} onClick={() => openComments(entry.id)}>
        <MessageCircle size={18} strokeWidth={1.5} color="#A09890" />
        <span className="text-xs font-heading" style={{ color: '#A09890' }}>{entry.comments.length}</span>
      </motion.button>
      <div className="flex-1" />
      <motion.button className="flex items-center gap-1" whileTap={{ scale: 0.9 }} onClick={handleDelete}>
        <Trash2 size={15} strokeWidth={1.5} color="#A09890" />
      </motion.button>
    </div>
  );
};

/* ─── Photo Grid Card ─── */
const PhotoGridCard: React.FC<{ entry: TimelineEntry; index: number; onImageClick: (entry: TimelineEntry, images: string[], idx: number) => void }> = ({ entry, index, onImageClick }) => {
  const images = entry.images || [];
  const count = images.length;

  const imageEl = (src: string, i: number, className: string) => (
    <div key={i} className={`${className} rounded-lg overflow-hidden cursor-pointer`} onClick={(e) => { e.stopPropagation(); onImageClick(entry, images, i); }}>
      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
    </div>
  );

  const renderGrid = () => {
    if (count === 1) return <div className="px-3.5 pb-2"><div className="rounded-lg overflow-hidden cursor-pointer" onClick={(e) => { e.stopPropagation(); onImageClick(entry, images, 0); }}><img src={images[0]} alt="" className="w-full aspect-[4/3] object-cover" loading="lazy" /></div></div>;
    if (count === 2) return <div className="px-3.5 pb-2 grid grid-cols-2 gap-1">{images.map((img, i) => imageEl(img, i, 'aspect-square'))}</div>;
    if (count <= 4) return <div className="px-3.5 pb-2 grid grid-cols-2 gap-1">{images.map((img, i) => imageEl(img, i, 'aspect-square'))}</div>;
    return <div className="px-3.5 pb-2 grid grid-cols-3 gap-1">{images.slice(0, 9).map((img, i) => (
      <div key={i} className="relative rounded-lg overflow-hidden aspect-square cursor-pointer" onClick={(e) => { e.stopPropagation(); onImageClick(entry, images, i); }}>
        <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
        {i === 8 && count > 9 && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><span className="text-white font-heading font-bold text-base">+{count - 9}</span></div>}
      </div>
    ))}</div>;
  };
  return <CardWrapper entry={entry} index={index}><AuthorRow entry={entry} /><p className="text-[15px] font-body leading-relaxed px-3.5 pb-2" style={{ color: '#5C4033' }}>{entry.description}</p>{renderGrid()}<TagRow tags={entry.tags} /><ActionBar entry={entry} /></CardWrapper>;
};

/* ─── Video Card ─── */
const VideoCard: React.FC<{ entry: TimelineEntry; index: number }> = ({ entry, index }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      v.requestFullscreen();
    }
  };

  // If we have a real video URL, render video player
  if (entry.videoUrl) {
    return (
      <CardWrapper entry={entry} index={index}>
        <AuthorRow entry={entry} />
        <p className="text-[15px] font-body leading-relaxed px-3.5 pb-2" style={{ color: '#5C4033' }}>{entry.description}</p>
        <div className="px-3.5 pb-2">
          <div className="relative rounded-lg overflow-hidden bg-black" onClick={togglePlay}>
            <video
              ref={videoRef}
              src={entry.videoUrl}
              className="w-full aspect-video object-contain"
              playsInline
              webkit-playsinline="true"
              x5-video-player-type="h5"
              x5-video-player-fullscreen="true"
              x5-video-orientation="portraint"
              muted={muted}
              loop
              onEnded={() => setPlaying(false)}
              onPause={() => setPlaying(false)}
              onPlay={() => setPlaying(true)}
            />
            {/* Play overlay */}
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                <motion.div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)', border: '2px solid #5C4033' }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Play size={20} color="#5C4033" fill="#5C4033" className="ml-0.5" />
                </motion.div>
              </div>
            )}
            {/* Mute toggle */}
            <motion.button
              className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
            >
              {muted ? <VolumeX size={14} color="#fff" /> : <Volume2 size={14} color="#fff" />}
            </motion.button>
            {/* Fullscreen toggle */}
            <motion.button
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleFullscreen}
            >
              <Maximize size={14} color="#fff" />
            </motion.button>
          </div>
        </div>
        <TagRow tags={entry.tags} /><ActionBar entry={entry} />
      </CardWrapper>
    );
  }

  // Fallback: only cover image (no video source)
  return (
    <CardWrapper entry={entry} index={index}>
      <AuthorRow entry={entry} />
      <p className="text-[15px] font-body leading-relaxed px-3.5 pb-2" style={{ color: '#5C4033' }}>{entry.description}</p>
      {entry.imageUrl && (
        <div className="px-3.5 pb-2 relative">
          <div className="rounded-lg overflow-hidden aspect-video relative">
            <img src={entry.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
              <motion.div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.85)', border: '2px solid #5C4033' }} whileTap={{ scale: 0.9 }}>
                <Play size={20} color="#5C4033" fill="#5C4033" className="ml-0.5" />
              </motion.div>
            </div>
          </div>
        </div>
      )}
      <TagRow tags={entry.tags} /><ActionBar entry={entry} />
    </CardWrapper>
  );
};

/* ─── Text Card ─── */
const TextCard: React.FC<{ entry: TimelineEntry; index: number }> = ({ entry, index }) => (
  <CardWrapper entry={entry} index={index}>
    <AuthorRow entry={entry} />
    <div className="px-3.5 pb-3 relative"><div className="absolute left-3 top-0 bottom-1 w-0.5 rounded-full bg-[#B8D4E3]" /><p className="text-[15px] font-body leading-relaxed pl-3" style={{ color: '#5C4033' }}>{entry.description}</p></div>
    <TagRow tags={entry.tags} /><ActionBar entry={entry} />
  </CardWrapper>
);

/* ─── Milestone Card ─── */
const MilestoneCard: React.FC<{ entry: TimelineEntry; index: number }> = ({ entry, index }) => (
  <CardWrapper entry={entry} index={index}>
    <div className="px-3.5 pt-3 pb-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFF4E1' }}>
          <Star size={20} color="#5C4033" fill="#FFD6E5" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-display" style={{ color: '#5C4033' }}>{entry.milestoneTitle}</h3>
          <div className="flex items-center gap-2"><span className="text-xs" style={{ color: '#8B7355' }}>{entry.authorName} · {smartTimeDisplay(entry.date)}</span>{entry.featured && <Star size={10} color="#5C4033" fill="#FFD6E5" strokeWidth={2} />}</div>
        </div>
      </div>
    </div>
    <p className="text-[15px] font-body leading-relaxed px-3.5 pb-2" style={{ color: '#5C4033' }}>{entry.description}</p>
    <TagRow tags={entry.tags} /><ActionBar entry={entry} />
  </CardWrapper>
);

/* ─── Filter Bar ─── */
const contentTypeConfig: { type: ContentType; label: string; icon: typeof Image }[] = [
  { type: 'photo', label: '照片', icon: Image },
  { type: 'video', label: '视频', icon: Play },
  { type: 'text', label: '文字', icon: FileText },
];

/** Parse "2026-06-24" or ISO string to { year, month, day } */
const parseDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
};

const FilterBar: React.FC<{
  filter: FilterMode;
  onChange: (f: FilterMode) => void;
  timeline: TimelineEntry[];
  onJumpToDate: (year: number, month?: number, day?: number) => void;
}> = ({ filter, onChange, timeline, onJumpToDate }) => {
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [pickYear, setPickYear] = useState<number | null>(null);
  const [pickMonth, setPickMonth] = useState<number | null>(null);

  const isActive = (mode: FilterMode) => {
    if (filter.type !== mode.type) return false;
    if (filter.type === 'content' && mode.type === 'content') return filter.contentType === (mode as { type: 'content'; contentType: ContentType }).contentType;
    return true;
  };

  // Compute available years / months / days from timeline
  const { years, months, days } = useMemo(() => {
    const yearSet = new Set<number>();
    const monthSet = new Set<number>();
    const daySet = new Set<number>();
    timeline.forEach((e) => {
      const d = parseDate(e.date);
      if (!d) return;
      yearSet.add(d.year);
      if (pickYear === d.year) {
        monthSet.add(d.month);
        if (pickMonth === d.month) daySet.add(d.day);
      }
    });
    return {
      years: [...yearSet].sort((a, b) => b - a),
      months: [...monthSet].sort((a, b) => a - b),
      days: [...daySet].sort((a, b) => b - a),
    };
  }, [timeline, pickYear, pickMonth]);

  const openPicker = () => {
    setPickYear(null);
    setPickMonth(null);
    setTimePickerOpen(true);
  };
  const closePicker = () => setTimePickerOpen(false);

  const selectYear = (y: number) => {
    setPickYear(y);
    setPickMonth(null);
    onJumpToDate(y);
  };
  const selectMonth = (m: number) => {
    setPickMonth(m);
    if (pickYear) onJumpToDate(pickYear, m);
  };
  const selectDay = (d: number) => {
    if (pickYear && pickMonth) onJumpToDate(pickYear, pickMonth, d);
    closePicker();
  };

  const goBack = () => {
    if (pickMonth !== null) {
      setPickMonth(null);
    } else if (pickYear !== null) {
      setPickYear(null);
    } else {
      closePicker();
    }
  };

  const Chip: React.FC<{ mode: FilterMode; children: React.ReactNode; icon?: typeof Image }> = ({ mode, children, icon: Icon }) => (
    <motion.button
      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap shrink-0 border-2 transition-colors"
      style={{
        backgroundColor: isActive(mode) ? '#FFD6E5' : '#FFFCF7',
        borderColor: isActive(mode) ? '#5C4033' : '#A09890',
        color: '#5C4033',
      }}
      whileTap={{ scale: 0.93 }}
      onClick={() => onChange(mode)}
    >
      {Icon && <Icon size={12} strokeWidth={2} />}
      {children}
    </motion.button>
  );

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 -mx-4 px-4">
      <Chip mode={{ type: 'all' }}>全部</Chip>

      {contentTypeConfig.map((cfg) => (
        <Chip key={`c-${cfg.type}`} mode={{ type: 'content', contentType: cfg.type }} icon={cfg.icon}>
          {cfg.label}
        </Chip>
      ))}

      {/* Time jump button */}
      <motion.button
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap shrink-0 border-2 transition-colors ml-1"
        style={{
          backgroundColor: '#FFFCF7',
          borderColor: '#A09890',
          color: '#5C4033',
        }}
        whileTap={{ scale: 0.93 }}
        onClick={openPicker}
      >
        <Calendar size={12} strokeWidth={2} />
        时间
      </motion.button>

      {/* Clear filter */}
      {filter.type !== 'all' && (
        <motion.button
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-1"
          style={{ backgroundColor: '#FFF4E1' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange({ type: 'all' })}
        >
          <X size={12} color="#5C4033" />
        </motion.button>
      )}

      {/* Time picker popover */}
      <AnimatePresence>
        {timePickerOpen && (
          <>
            <motion.div className="fixed inset-0 z-[55]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePicker} />
            <motion.div
              className="absolute top-full left-4 right-4 z-[56] mt-1 rounded-xl overflow-hidden"
              style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', boxShadow: 'rgba(92,64,51,0.15) 0 4px 16px' }}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
                <button className="w-6 h-6 flex items-center justify-center" onClick={goBack}>
                  <ChevronLeft size={16} color="#5C4033" />
                </button>
                <span className="text-sm font-heading font-semibold" style={{ color: '#5C4033' }}>
                  {pickYear === null ? '选择年份' : pickMonth === null ? `${pickYear}年` : `${pickYear}年${pickMonth}月`}
                </span>
              </div>

              {/* Pick list */}
              <div className="max-h-48 overflow-y-auto no-scrollbar p-2 grid grid-cols-4 gap-1.5">
                {pickYear === null &&
                  years.map((y) => (
                    <motion.button
                      key={y}
                      className="py-2 rounded-lg text-sm font-heading font-semibold"
                      style={{ backgroundColor: '#FFFCF7', color: '#5C4033', border: '1px solid rgba(92,64,51,0.2)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => selectYear(y)}
                    >
                      {y}
                    </motion.button>
                  ))}
                {pickYear !== null && pickMonth === null &&
                  months.map((m) => (
                    <motion.button
                      key={m}
                      className="py-2 rounded-lg text-sm font-heading font-semibold"
                      style={{ backgroundColor: '#FFFCF7', color: '#5C4033', border: '1px solid rgba(92,64,51,0.2)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => selectMonth(m)}
                    >
                      {m}月
                    </motion.button>
                  ))}
                {pickYear !== null && pickMonth !== null &&
                  days.map((d) => (
                    <motion.button
                      key={d}
                      className="py-2 rounded-lg text-sm font-heading font-semibold"
                      style={{ backgroundColor: '#FFFCF7', color: '#5C4033', border: '1px solid rgba(92,64,51,0.2)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => selectDay(d)}
                    >
                      {d}日
                    </motion.button>
                  ))}
                {years.length === 0 && (
                  <p className="col-span-4 text-center py-4 text-xs" style={{ color: '#A09890' }}>暂无动态记录</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Main Home Page ─── */
const HomePage: React.FC = () => {
  const timeline = useStore((s) => s.timeline);
  const user = useStore((s) => s.user);
  const babies = useStore((s) => s.babies);
  const activeBabyId = useStore((s) => s.activeBabyId);
  const [filter, setFilter] = useState<FilterMode>({ type: 'all' });

  // Image viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<MediaItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerEntry, setViewerEntry] = useState<TimelineEntry | null>(null);

  const openImageViewer = (entry: TimelineEntry, images: string[], idx: number) => {
    setViewerItems(images.map((url) => ({ url, type: 'photo' as const })));
    setViewerIndex(idx);
    setViewerEntry(entry);
    setViewerOpen(true);
  };

  const handleJumpToDate = (year: number, month?: number, day?: number) => {
    // Build a selector to find the matching entry
    let selector = `[data-date^="${year}-`;
    if (month !== undefined) {
      const mm = String(month).padStart(2, '0');
      selector += `${mm}`;
      if (day !== undefined) {
        const dd = String(day).padStart(2, '0');
        selector += `-${dd}`;
      }
    }
    selector += '"]';
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeBaby = babies.find((b) => b.id === activeBabyId);
  const babyAgeDisplay = activeBaby ? (() => {
    const birth = new Date(activeBaby.birthday);
    const totalDays = Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24));
    if (totalDays < 0) return '';
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    const days = totalDays % 365 % 30;
    const parts: string[] = [];
    if (years > 0) parts.push(`${years}岁`);
    if (months > 0) parts.push(`${months}个月`);
    if (days > 0 || parts.length === 0) parts.push(`${days}天`);
    return `${activeBaby.name}已经${parts.join('')}啦`;
  })() : '';

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    switch (filter.type) {
      case 'content': return timeline.filter((e) => e.type === filter.contentType);
      default: return timeline;
    }
  }, [timeline, filter]);

  const renderCard = (entry: TimelineEntry, index: number) => {
    switch (entry.type) {
      case 'photo': return <PhotoGridCard key={entry.id} entry={entry} index={index} onImageClick={openImageViewer} />;
      case 'video': return <VideoCard key={entry.id} entry={entry} index={index} />;
      case 'text': return <TextCard key={entry.id} entry={entry} index={index} />;
      case 'milestone': return <MilestoneCard key={entry.id} entry={entry} index={index} />;
      default: return <PhotoGridCard key={entry.id} entry={entry} index={index} onImageClick={openImageViewer} />;
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#FFFCF7' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-0" style={{ backgroundColor: '#FFFCF7' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-heading font-bold shrink-0 overflow-hidden"
              style={{
                backgroundColor: activeBaby?.avatar ? 'transparent' : avatarColor(user?.name || '我'),
                color: '#5C4033',
                border: '2px solid #5C4033',
              }}
            >
              {activeBaby?.avatar ? (
                <img src={activeBaby.avatar} alt={activeBaby.name} className="w-full h-full object-cover" />
              ) : activeBaby ? (
                activeBaby.name.charAt(0)
              ) : (
                '我'
              )}
            </div>
            <div>
              <h1 className="text-lg font-display" style={{ color: '#5C4033' }}>
                {activeBaby ? `${activeBaby.name}的成长记录` : '宝宝时光'}
              </h1>
              <p className="text-xs font-heading" style={{ color: '#8B7355' }}>
                {babyAgeDisplay || '记录每一个珍贵瞬间'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar filter={filter} onChange={setFilter} timeline={timeline} onJumpToDate={handleJumpToDate} />
      </div>

      {/* Timeline */}
      <div className="px-4 pt-2">
        <AnimatePresence mode="wait">
          {filteredTimeline.length === 0 ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Star size={28} color="#A09890" strokeWidth={1.5} />
              <p className="text-sm font-body mt-2" style={{ color: '#A09890' }}>没有符合条件的动态</p>
            </motion.div>
          ) : (
            <motion.div
              key={filter.type === 'content' ? filter.contentType : 'all'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filteredTimeline.map((entry, index) => renderCard(entry, index))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CommentsDrawer />
      <BottomNav />

      {/* Image Viewer */}
      {viewerOpen && viewerEntry && (
          <ImageViewer
            items={viewerItems}
            initialIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
            date={viewerEntry.date}
            description={viewerEntry.description}
            babyName={activeBaby?.name}
            babyBirthday={activeBaby?.birthday}
          />
      )}
    </div>
  );
};

export default HomePage;
