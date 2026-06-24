import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Star, Trash2, Flag, X, Image, Play, FileText, Award } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { smartTimeDisplay } from '@/lib/timeFormat';
import BottomNav from '@/components/BottomNav';
import CommentsDrawer from '@/components/CommentsDrawer';
import type { TimelineEntry, ContentType } from '@/types';

type FilterMode = { type: 'all' } | { type: 'featured' } | { type: 'member'; name: string } | { type: 'content'; contentType: ContentType };

/* ─── helpers ─── */
const avatarColor = (name: string) => {
  const colors = ['#FFD6E5', '#A8D8EA', '#FFF4E1', '#B8D4E3', '#FF8A8A', '#D4E5A8'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

/* ─── Long Press Menu ─── */
const LongPressMenu: React.FC<{
  entry: TimelineEntry;
  position: { x: number; y: number };
  onClose: () => void;
}> = ({ entry, position, onClose }) => {
  const toggleFeatured = useStore((s) => s.toggleFeatured);
  const deleteTimelineEntry = useStore((s) => s.deleteTimelineEntry);

  const items = [
    { key: 'featured', label: entry.featured ? '取消精选' : '设为精选', icon: Star, color: '#5C4033', action: () => { toggleFeatured(entry.id); onClose(); } },
    { key: 'delete', label: '删除', icon: Trash2, color: '#FF8A8A', action: () => { if (confirm('确定删除这条动态吗？')) { deleteTimelineEntry(entry.id); onClose(); } } },
    { key: 'report', label: '举报', icon: Flag, color: '#A09890', action: () => { alert('举报已提交'); onClose(); } },
  ];

  const menuW = 140;
  const menuH = items.length * 44;
  const x = Math.min(Math.max(position.x - menuW / 2, 8), window.innerWidth - menuW - 8);
  const y = Math.min(Math.max(position.y - menuH / 2, 60), window.innerHeight - menuH - 80);

  return (
    <>
      <motion.div className="fixed inset-0 z-[55]" style={{ backgroundColor: 'rgba(92,64,51,0.08)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed z-[56] rounded-xl overflow-hidden py-1"
        style={{ left: x, top: y, width: menuW, backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', boxShadow: 'rgba(92,64,51,0.15) 0 4px 16px' }}
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        {items.map((item) => (
          <motion.button key={item.key} className="w-full flex items-center gap-2.5 px-3 py-3 text-left hover:bg-[#FFF4E1] transition-colors" whileTap={{ scale: 0.97 }} onClick={item.action}>
            <item.icon size={16} color={item.color} strokeWidth={2} />
            <span className="text-sm font-body" style={{ color: item.color }}>{item.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </>
  );
};

/* ─── Card Wrapper with Long Press ─── */
const CardWrapper: React.FC<{ entry: TimelineEntry; index: number; children: React.ReactNode }> = ({ entry, index, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    timerRef.current = setTimeout(() => {
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  }, []);
  const handlePointerUp = useCallback(() => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } }, []);

  return (
    <>
      <motion.div
        className="rounded-xl overflow-hidden mb-4 select-none"
        style={{ backgroundColor: '#FFFCF7', border: entry.featured ? '2px solid #5C4033' : '1.5px solid #5C4033', boxShadow: 'rgba(92,64,51,0.08) 0 3px 10px' }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.35 }}
        onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onContextMenu={(e) => e.preventDefault()}
      >
        {children}
      </motion.div>
      <AnimatePresence>{menuOpen && <LongPressMenu entry={entry} position={menuPos} onClose={() => setMenuOpen(false)} />}</AnimatePresence>
    </>
  );
};

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
    <span className="text-[10px] px-2 py-0.5 rounded-full font-heading font-medium shrink-0" style={{ backgroundColor: '#FFD6E5', color: '#5C4033' }}>
      {useStore.getState().babies.find((b) => b.id === entry.babyId)?.name || '宝宝'}
    </span>
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
  const openComments = useStore((s) => s.openComments);
  const [likedAnim, setLikedAnim] = useState(false);
  const handleLike = () => { toggleLike(entry.id); if (!entry.liked) { setLikedAnim(true); setTimeout(() => setLikedAnim(false), 400); } };

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
    </div>
  );
};

/* ─── Photo Grid Card ─── */
const PhotoGridCard: React.FC<{ entry: TimelineEntry; index: number }> = ({ entry, index }) => {
  const images = entry.images || [];
  const count = images.length;
  const renderGrid = () => {
    if (count === 1) return <div className="px-3.5 pb-2"><div className="rounded-lg overflow-hidden"><img src={images[0]} alt="" className="w-full aspect-[4/3] object-cover" loading="lazy" /></div></div>;
    if (count === 2) return <div className="px-3.5 pb-2 grid grid-cols-2 gap-1">{images.map((img, i) => <div key={i} className="rounded-lg overflow-hidden aspect-square"><img src={img} alt="" className="w-full h-full object-cover" loading="lazy" /></div>)}</div>;
    if (count <= 4) return <div className="px-3.5 pb-2 grid grid-cols-2 gap-1">{images.map((img, i) => <div key={i} className="rounded-lg overflow-hidden aspect-square"><img src={img} alt="" className="w-full h-full object-cover" loading="lazy" /></div>)}</div>;
    return <div className="px-3.5 pb-2 grid grid-cols-3 gap-1">{images.slice(0, 9).map((img, i) => <div key={i} className="relative rounded-lg overflow-hidden aspect-square"><img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />{i === 8 && count > 9 && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><span className="text-white font-heading font-bold text-base">+{count - 9}</span></div>}</div>)}</div>;
  };
  return <CardWrapper entry={entry} index={index}><AuthorRow entry={entry} /><p className="text-[15px] font-body leading-relaxed px-3.5 pb-2" style={{ color: '#5C4033' }}>{entry.description}</p>{renderGrid()}<TagRow tags={entry.tags} /><ActionBar entry={entry} /></CardWrapper>;
};

/* ─── Video Card ─── */
const VideoCard: React.FC<{ entry: TimelineEntry; index: number }> = ({ entry, index }) => (
  <CardWrapper entry={entry} index={index}>
    <AuthorRow entry={entry} />
    <p className="text-[15px] font-body leading-relaxed px-3.5 pb-2" style={{ color: '#5C4033' }}>{entry.description}</p>
    {entry.imageUrl && (
      <div className="px-3.5 pb-2 relative">
        <div className="rounded-lg overflow-hidden aspect-video relative">
          <img src={entry.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <motion.div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/85 border-2 border-[#5C4033]" whileTap={{ scale: 0.9 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#5C4033"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </motion.div>
          </div>
        </div>
      </div>
    )}
    <TagRow tags={entry.tags} /><ActionBar entry={entry} />
  </CardWrapper>
);

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
  { type: 'milestone', label: '里程碑', icon: Award },
];

const FilterBar: React.FC<{
  filter: FilterMode;
  onChange: (f: FilterMode) => void;
}> = ({ filter, onChange }) => {
  const timeline = useStore((s) => s.timeline);

  // Extract unique authors from timeline
  const authors = useMemo(() => {
    const set = new Set<string>();
    timeline.forEach((e) => set.add(e.authorName));
    return Array.from(set);
  }, [timeline]);

  const isActive = (mode: FilterMode) => {
    if (filter.type !== mode.type) return false;
    if (filter.type === 'member' && mode.type === 'member') return filter.name === (mode as { type: 'member'; name: string }).name;
    if (filter.type === 'content' && mode.type === 'content') return filter.contentType === (mode as { type: 'content'; contentType: ContentType }).contentType;
    return true;
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
      <Chip mode={{ type: 'featured' }}>精选</Chip>

      {/* Content type filters */}
      {contentTypeConfig.map((cfg) => (
        <Chip key={`c-${cfg.type}`} mode={{ type: 'content', contentType: cfg.type }} icon={cfg.icon}>
          {cfg.label}
        </Chip>
      ))}

      {/* Member filters */}
      {authors.length > 1 && <div className="w-px h-4 border-l mx-1" style={{ borderColor: '#A09890' }} />}
      {authors.map((name) => (
        <Chip key={`m-${name}`} mode={{ type: 'member', name }}>{name}</Chip>
      ))}

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

  const activeBaby = babies.find((b) => b.id === activeBabyId);
  const babyAge = activeBaby ? Math.floor((Date.now() - new Date(activeBaby.birthday).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    switch (filter.type) {
      case 'featured': return timeline.filter((e) => e.featured);
      case 'member': return timeline.filter((e) => e.authorName === filter.name);
      case 'content': return timeline.filter((e) => e.type === filter.contentType);
      default: return timeline;
    }
  }, [timeline, filter]);

  const renderCard = (entry: TimelineEntry, index: number) => {
    switch (entry.type) {
      case 'photo': return <PhotoGridCard key={entry.id} entry={entry} index={index} />;
      case 'video': return <VideoCard key={entry.id} entry={entry} index={index} />;
      case 'text': return <TextCard key={entry.id} entry={entry} index={index} />;
      case 'milestone': return <MilestoneCard key={entry.id} entry={entry} index={index} />;
      default: return <PhotoGridCard key={entry.id} entry={entry} index={index} />;
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
                {babyAge > 0 ? `${activeBaby?.name}已经${babyAge}天啦` : '记录每一个珍贵瞬间'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar filter={filter} onChange={setFilter} />
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
              key={filter.type + (filter.type === 'member' ? filter.name : filter.type === 'content' ? filter.contentType : '')}
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
    </div>
  );
};

export default HomePage;
