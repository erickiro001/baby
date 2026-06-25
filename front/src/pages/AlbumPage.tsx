import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Search, X, Grid3X3, FolderHeart, CheckSquare,
  Download, Trash2, FolderInput, ChevronLeft, Plus, FolderOpen,
  Image, Play, Calendar, ImageOff,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import BottomNav from '@/components/BottomNav';
import MediaViewer from '@/components/MediaViewer';
import type { MediaItem } from '@/components/MediaViewer';
import type { TimelineEntry, EventAlbum } from '@/types';

/* ─── PhotoItem type ─── */
interface PhotoItem {
  entryId: string;
  imageUrl: string;
  videoUrl?: string;
  type: 'photo' | 'video';
  authorName: string;
  date: string;
  tags: string[];
  albumIds?: string[];
  description: string;
}

/* ─── Extract photos from timeline ─── */
function extractPhotos(timeline: TimelineEntry[]): PhotoItem[] {
  const items: PhotoItem[] = [];
  for (const entry of timeline) {
    if (entry.type === 'video') {
      const url = entry.imageUrl || entry.videoUrl || '';
      if (url) {
        items.push({ entryId: entry.id, imageUrl: entry.imageUrl || '', videoUrl: entry.videoUrl, type: 'video', authorName: entry.authorName, date: entry.date, tags: entry.tags, albumIds: entry.albumIds, description: entry.description });
      }
    }
    if (entry.images?.length) {
      for (const img of entry.images) items.push({ entryId: entry.id, imageUrl: img, type: 'photo', authorName: entry.authorName, date: entry.date, tags: entry.tags, albumIds: entry.albumIds, description: entry.description });
    }
    if (entry.type === 'photo' && entry.imageUrl && !entry.images) {
      items.push({ entryId: entry.id, imageUrl: entry.imageUrl, type: 'photo', authorName: entry.authorName, date: entry.date, tags: entry.tags, albumIds: entry.albumIds, description: entry.description });
    }
  }
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/* ─── Group by month ─── */
function groupByMonth(photos: PhotoItem[]): [string, PhotoItem[]][] {
  const map = new Map<string, PhotoItem[]>();
  for (const p of photos) {
    const key = format(parseISO(p.date), 'yyyy年MM月', { locale: zhCN });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries());
}

/* ─── Search match ─── */
function matchesSearch(photo: PhotoItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  if (/^\d{4}[\.\-]\d{2}$/.test(q)) { const [y, m] = q.split(/[\.\-]/); return format(parseISO(photo.date), 'yyyy.MM') === `${y}.${m}`; }
  return photo.tags.some((t) => t.toLowerCase().includes(q)) || photo.authorName.toLowerCase().includes(q) || photo.description.toLowerCase().includes(q);
}

/* ─── Filter chips ─── */
const filterChips = [
  { key: 'all' as const, label: '全部', icon: Grid3X3 },
  { key: 'photo' as const, label: '照片', icon: Image },
  { key: 'video' as const, label: '视频', icon: Play },
];

/* ═══════════════════════════════════════════
   Event Albums List
   ═══════════════════════════════════════════ */
const EventAlbumsView: React.FC<{ onOpenAlbum: (a: EventAlbum) => void; onBack: () => void }> = ({ onOpenAlbum, onBack }) => {
  const eventAlbums = useStore((s) => s.eventAlbums);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const createEventAlbum = useStore((s) => s.createEventAlbum);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createEventAlbum({ id: `ea_${Date.now()}`, title: newTitle.trim(), coverImage: '', photoCount: 0, createdAt: new Date().toISOString(), description: newDesc.trim() });
    setShowCreate(false); setNewTitle(''); setNewDesc('');
  };

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#FFFCF7' }}>
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ backgroundColor: '#FFFCF7' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: '1.5px solid #5C4033' }} whileTap={{ scale: 0.9 }} onClick={onBack}>
              <ChevronLeft size={18} color="#5C4033" strokeWidth={2} />
            </motion.button>
            <h1 className="text-xl font-display" style={{ color: '#5C4033' }}>事件相册</h1>
          </div>
          <motion.button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD6E5', border: '1.5px solid #5C4033' }} whileTap={{ scale: 0.9 }} onClick={() => setShowCreate(true)}>
            <Plus size={18} color="#5C4033" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {eventAlbums.map((album, i) => (
            <motion.button key={album.id} className="rounded-xl overflow-hidden text-left" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', boxShadow: 'rgba(92,64,51,0.08) 0 2px 8px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileTap={{ scale: 0.96 }} onClick={() => onOpenAlbum(album)}>
              <div className="aspect-square relative">
                {album.coverImage ? (
                  <>
                    <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(92,64,51,0.6) 0%, transparent 50%)' }} />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: '#F5F0EB' }}>
                    <ImageOff size={32} color="#A09890" strokeWidth={1.5} />
                    <span className="text-[10px] mt-1" style={{ color: '#A09890' }}>暂无封面</span>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(92,64,51,0.6) 0%, transparent 50%)' }} />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-sm font-heading font-bold text-white truncate">{album.title}</h3>
                  <p className="text-[10px] text-white/80">{album.photoCount} 张照片</p>
                </div>
              </div>
              {album.description && <p className="text-[11px] font-body px-2.5 py-2 truncate" style={{ color: '#8B7355' }}>{album.description}</p>}
            </motion.button>
          ))}
        </div>
      </div>
      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} />
            <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
                <h3 className="text-lg font-heading font-semibold flex-1 text-center" style={{ color: '#5C4033' }}>新建事件相册</h3>
                <button onClick={() => setShowCreate(false)}><X size={18} color="#5C4033" /></button>
              </div>
              <div className="px-4 py-4 space-y-3">
                <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>相册名称</label><input type="text" placeholder="例如：周岁生日派对" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
                <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>描述（可选）</label><input type="text" placeholder="简单描述..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
                <motion.button className="w-full py-3 rounded-full font-heading font-semibold" style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033' }} whileTap={{ scale: 0.97 }} onClick={handleCreate}>创建</motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════
   Album Detail View
   ═══════════════════════════════════════════ */
const AlbumDetailView: React.FC<{ album: EventAlbum; onBack: () => void }> = ({ album, onBack }) => {
  const timeline = useStore((s) => s.timeline);
  const setAlbumCover = useStore((s) => s.setAlbumCover);
  const photos = useMemo(() => extractPhotos(timeline).filter((p) => p.albumIds?.includes(album.id)), [timeline, album.id]);
  const grouped = useMemo(() => groupByMonth(photos), [photos]);

  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<PhotoItem | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSetAsCover = () => {
    if (coverPhoto) {
      setAlbumCover(album.id, coverPhoto.imageUrl);
      setCoverPhoto(null);
    }
  };

  const handlePointerDown = useCallback((photo: PhotoItem) => {
    timerRef.current = setTimeout(() => {
      setCoverPhoto(photo);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 600);
  }, []);
  const handlePointerUp = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const mediaItems: MediaItem[] = useMemo(() =>
    photos.map((p) => ({ url: p.type === 'video' ? (p.videoUrl || p.imageUrl) : p.imageUrl, type: p.type, date: p.date, description: p.description })),
    [photos]);
  const currentViewerPhoto = viewerOpen ? photos[viewerIndex] : null;

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#FFFCF7' }}>
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ backgroundColor: '#FFFCF7' }}>
        <div className="flex items-center gap-2">
          <motion.button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: '1.5px solid #5C4033' }} whileTap={{ scale: 0.9 }} onClick={onBack}><ChevronLeft size={18} color="#5C4033" strokeWidth={2} /></motion.button>
          <div><h1 className="text-xl font-display" style={{ color: '#5C4033' }}>{album.title}</h1><p className="text-xs font-heading" style={{ color: '#8B7355' }}>{photos.length} 张照片 · {album.description}</p></div>
        </div>
      </div>
      <div className="px-4">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20"><FolderOpen size={40} color="#A09890" strokeWidth={1.5} /><p className="text-sm font-body mt-3" style={{ color: '#A09890' }}>暂无照片</p></div>
        ) : grouped.map(([month, items]) => (
          <div key={month} className="mb-4">
            <h3 className="text-sm font-heading font-semibold mb-2 py-1" style={{ color: '#8B7355' }}>{month}</h3>
            <div className="grid grid-cols-3 gap-1">
              {items.map((photo, i) => (
                <motion.div
                  key={`${photo.entryId}-${i}`}
                  className="aspect-square rounded-sm overflow-hidden relative cursor-pointer"
                  style={{ border: '1px solid rgba(92,64,51,0.1)' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  onPointerDown={() => handlePointerDown(photo)}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                  onClick={() => { if (!coverPhoto) { const globalIdx = photos.findIndex(p => p.entryId === photo.entryId && p.imageUrl === photo.imageUrl); setViewerIndex(globalIdx); setViewerOpen(true); } }}
                >
                  {photo.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <video
                        src={photo.videoUrl || photo.imageUrl}
                        className="w-full h-full object-cover"
                        style={{ display: 'block' }}
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.8)', border: '1.5px solid #5C4033' }}>
                          <Play size={12} color="#5C4033" fill="#5C4033" className="ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : photo.imageUrl ? (
                    <img src={photo.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black"><Play size={24} color="#fff" /></div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Media Viewer */}
      {viewerOpen && currentViewerPhoto && (
        <MediaViewer
          items={mediaItems}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Cover Selection Modal */}
      <AnimatePresence>
        {coverPhoto && (
          <>
            <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCoverPhoto(null)} />
            <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
                <h3 className="text-base font-heading font-semibold text-center" style={{ color: '#5C4033' }}>设为相册封面</h3>
              </div>
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ border: '1.5px solid #5C4033' }}>
                  <img src={coverPhoto.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-sm font-body flex-1" style={{ color: '#5C4033' }}>将此照片设为 "{album.title}" 的封面？</p>
              </div>
              <div className="flex gap-2 px-4 py-3 border-t" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
                <button className="flex-1 py-2.5 rounded-full text-sm font-heading font-semibold" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', color: '#5C4033' }} onClick={() => setCoverPhoto(null)}>取消</button>
                <button className="flex-1 py-2.5 rounded-full text-sm font-heading font-semibold" style={{ backgroundColor: '#FFD6E5', border: '1.5px solid #5C4033', color: '#5C4033' }} onClick={handleSetAsCover}>确认设为封面</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════
   Move to Album Modal
   ═══════════════════════════════════════════ */
const MoveToAlbumModal: React.FC<{ photoIds: string[]; onClose: () => void }> = ({ photoIds, onClose }) => {
  const eventAlbums = useStore((s) => s.eventAlbums);
  const movePhotosToAlbum = useStore((s) => s.movePhotosToAlbum);
  const handleMove = (albumId: string) => { movePhotosToAlbum(photoIds, albumId); onClose(); };
  return (
    <>
      <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(92,64,51,0.1)' }}><h3 className="text-base font-heading font-semibold text-center" style={{ color: '#5C4033' }}>移动到事件相册</h3></div>
        <div className="max-h-[40vh] overflow-y-auto no-scrollbar py-2">
          {eventAlbums.map((album) => (
            <motion.button key={album.id} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#FFF4E1] transition-colors" whileTap={{ scale: 0.98 }} onClick={() => handleMove(album.id)}>
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid #5C4033', backgroundColor: '#F5F0EB' }}>{album.coverImage ? <img src={album.coverImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageOff size={16} color="#A09890" /></div>}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-heading font-semibold truncate" style={{ color: '#5C4033' }}>{album.title}</p><p className="text-[11px]" style={{ color: '#8B7355' }}>{album.photoCount} 张照片</p></div>
              <FolderInput size={18} color="#A09890" />
            </motion.button>
          ))}
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(92,64,51,0.1)' }}><button className="w-full py-2.5 rounded-full text-sm font-heading font-semibold" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', color: '#5C4033' }} onClick={onClose}>取消</button></div>
      </motion.div>
    </>
  );
};

/* ═══════════════════════════════════════════
   Main Album Grid View
   ═══════════════════════════════════════════ */
const AlbumGridView: React.FC<{ onOpenEvents: () => void }> = ({ onOpenEvents }) => {
  const timeline = useStore((s) => s.timeline);
  const albumFilter = useStore((s) => s.albumFilter);
  const albumSearch = useStore((s) => s.albumSearch);
  const setAlbumFilter = useStore((s) => s.setAlbumFilter);
  const setAlbumSearch = useStore((s) => s.setAlbumSearch);
  const batchMode = useStore((s) => s.batchMode);
  const selectedPhotoIds = useStore((s) => s.selectedPhotoIds);
  const setBatchMode = useStore((s) => s.setBatchMode);
  const togglePhotoSelection = useStore((s) => s.togglePhotoSelection);
  const selectAllPhotos = useStore((s) => s.selectAllPhotos);
  const clearSelection = useStore((s) => s.clearSelection);
  const deleteSelectedPhotos = useStore((s) => s.deleteSelectedPhotos);

  const [searchFocused, setSearchFocused] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allPhotos = useMemo(() => extractPhotos(timeline), [timeline]);
  const filteredPhotos = useMemo(() => {
    let r = allPhotos;
    if (albumFilter === 'photo') r = r.filter((p) => p.type === 'photo');
    if (albumFilter === 'video') r = r.filter((p) => p.type === 'video');
    if (albumSearch.trim()) r = r.filter((p) => matchesSearch(p, albumSearch));
    return r;
  }, [allPhotos, albumFilter, albumSearch]);
  const grouped = useMemo(() => groupByMonth(filteredPhotos), [filteredPhotos]);
  const selectedCount = selectedPhotoIds.length;

  // Convert to media items for viewer
  const mediaItems: MediaItem[] = useMemo(() =>
    filteredPhotos.map((p) => ({ url: p.type === 'video' ? (p.videoUrl || p.imageUrl) : p.imageUrl, type: p.type, date: p.date, description: p.description })),
    [filteredPhotos]);
  const currentViewerPhoto = viewerOpen ? filteredPhotos[viewerIndex] : null;

  const handlePointerDown = useCallback((photo: PhotoItem) => {
    if (batchMode) return;
    timerRef.current = setTimeout(() => { setBatchMode(true); togglePhotoSelection(photo.entryId); if (navigator.vibrate) navigator.vibrate(50); }, 500);
  }, [batchMode, setBatchMode, togglePhotoSelection]);
  const handlePointerUp = useCallback(() => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } }, []);

  // 下载选中的照片
  const handleDownload = useCallback(async () => {
    const selectedPhotos = allPhotos.filter((p) => selectedPhotoIds.includes(p.entryId));
    const total = selectedPhotos.length;
    if (total === 0) return;

    setDownloading(true);
    try {
      for (let i = 0; i < total; i++) {
        const photo = selectedPhotos[i];
        try {
          const response = await fetch(photo.videoUrl || photo.imageUrl);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          // 文件名：日期_序号.ext
          const ext = photo.type === 'video' ? 'mp4' : 'jpg';
          const dateStr = (photo.date || '').replace(/T.*/, '').replace(/:/g, '');
          link.download = `${dateStr || 'photo'}_${i + 1}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          // 多个文件之间稍作延迟，避免浏览器阻止
          if (i < total - 1) await new Promise((r) => setTimeout(r, 300));
        } catch {
          // 单个文件失败不影响其余，降级为直接打开链接
          window.open(photo.videoUrl || photo.imageUrl, '_blank');
        }
      }
    } finally {
      setDownloading(false);
    }
  }, [allPhotos, selectedPhotoIds]);

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#FFFCF7' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-2" style={{ backgroundColor: '#FFFCF7' }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-display" style={{ color: '#5C4033' }}>美好瞬间</h1>
          <div className="flex items-center gap-2">
            {!batchMode ? (
              <motion.button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: '1.5px solid #5C4033' }} whileTap={{ scale: 0.9 }} onClick={() => setBatchMode(true)}><CheckSquare size={16} color="#5C4033" /></motion.button>
            ) : (
              <motion.button className="px-3 py-1.5 rounded-full text-xs font-heading font-semibold" style={{ backgroundColor: '#FF8A8A', color: '#FFFCF7', border: '1.5px solid #5C4033' }} whileTap={{ scale: 0.9 }} onClick={() => { setBatchMode(false); clearSelection(); }}>完成</motion.button>
            )}
          </div>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-full mb-2" style={{ border: searchFocused ? '2px solid #FFD6E5' : '1.5px solid #5C4033', backgroundColor: '#FFFCF7', transition: 'border-color 0.2s' }}>
          <Search size={16} color="#A09890" />
          <input type="text" placeholder="搜索日期（如 2025.06）或标签" value={albumSearch} onChange={(e) => setAlbumSearch(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} className="flex-1 bg-transparent outline-none text-sm font-body" style={{ color: '#5C4033' }} />
          {albumSearch && <button onClick={() => setAlbumSearch('')}><X size={14} color="#A09890" /></button>}
        </div>
        {/* Filter chips */}
        {!batchMode && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {filterChips.map((chip) => (
              <motion.button key={chip.key} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap shrink-0 border-2" style={{ backgroundColor: albumFilter === chip.key ? '#FFD6E5' : '#FFFCF7', borderColor: albumFilter === chip.key ? '#5C4033' : '#A09890', color: '#5C4033' }} whileTap={{ scale: 0.93 }} onClick={() => setAlbumFilter(chip.key)}>
                <chip.icon size={12} />{chip.label}
              </motion.button>
            ))}
            <motion.button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-heading font-semibold whitespace-nowrap shrink-0 border-2 ml-1" style={{ backgroundColor: '#FFD6E5', borderColor: '#5C4033', color: '#5C4033' }} whileTap={{ scale: 0.93 }} onClick={onOpenEvents}>
              <FolderHeart size={12} />事件相册
            </motion.button>
          </div>
        )}
        {/* Batch info */}
        {batchMode && (
          <motion.div className="flex items-center justify-between py-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="text-xs font-heading" style={{ color: '#8B7355' }}>已选择 {selectedCount} 项</span>
            <button className="text-xs font-heading font-semibold" style={{ color: '#5C4033' }} onClick={() => selectAllPhotos([...new Set(filteredPhotos.map((p) => p.entryId))])}>全选</button>
          </motion.div>
        )}
      </div>

      {/* Masonry Grid */}
      <div className="px-4">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20"><Image size={40} color="#A09890" strokeWidth={1.5} /><p className="text-sm font-body mt-3" style={{ color: '#A09890' }}>{albumSearch ? '没有符合条件的照片' : '暂无照片'}</p></div>
        ) : grouped.map(([month, items]) => (
          <div key={month} className="mb-5">
            <div className="flex items-center gap-2 py-2 mb-2" style={{ backgroundColor: '#FFFCF7' }}>
              <Calendar size={14} color="#8B7355" /><h3 className="text-sm font-heading font-semibold" style={{ color: '#8B7355' }}>{month}</h3><span className="text-[11px]" style={{ color: '#A09890' }}>{items.length}张</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {items.map((photo, idx) => {
                const isSelected = selectedPhotoIds.includes(photo.entryId);
                return (
                  <motion.div key={`${photo.entryId}-${idx}`} className="aspect-square rounded-sm overflow-hidden relative" style={{ border: isSelected ? '2px solid #FFD6E5' : '1px solid rgba(92,64,51,0.1)', boxShadow: isSelected ? '0 0 0 2px #FFD6E5' : 'none' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} onPointerDown={() => handlePointerDown(photo)} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onContextMenu={(e) => e.preventDefault()} onClick={() => batchMode ? togglePhotoSelection(photo.entryId) : (() => { const globalIdx = filteredPhotos.findIndex(p => p.entryId === photo.entryId && p.imageUrl === photo.imageUrl); setViewerIndex(globalIdx); setViewerOpen(true); })()}>
                    {photo.type === 'video' ? (
                      <div className="relative w-full h-full">
                        <video
                          src={photo.videoUrl || photo.imageUrl}
                          className="w-full h-full object-cover"
                          style={{ display: 'block' }}
                          preload="metadata"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.8)', border: '1.5px solid #5C4033' }}>
                            <Play size={13} color="#5C4033" fill="#5C4033" className="ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : photo.imageUrl ? (
                      <img src={photo.imageUrl} alt="" className="w-full h-full object-cover" style={{ display: 'block' }} loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black"><Play size={24} color="#fff" /></div>
                    )}
                    {batchMode && <div className="absolute top-1.5 left-1.5"><div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: isSelected ? '#FFD6E5' : 'rgba(255,255,255,0.8)', border: isSelected ? '2px solid #5C4033' : '2px solid rgba(92,64,51,0.3)' }}>{isSelected && <CheckSquare size={12} color="#5C4033" />}</div></div>}
                    {photo.albumIds && photo.albumIds.length > 0 && !batchMode && <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-white/80"><FolderHeart size={10} color="#5C4033" /></div>}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Media Viewer */}
      {viewerOpen && currentViewerPhoto && (
        <MediaViewer
          items={mediaItems}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Batch Action Bar */}
      <AnimatePresence>
        {batchMode && selectedCount > 0 && (
          <motion.div className="fixed bottom-20 left-3 right-3 z-40 rounded-2xl px-4 py-3" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', boxShadow: 'rgba(92,64,51,0.15) 0 4px 16px' }} initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
            <div className="flex items-center justify-around">
              <motion.button className="flex flex-col items-center gap-1" whileTap={{ scale: 0.9 }} disabled={downloading} onClick={handleDownload}><div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A8D8EA' }}>{downloading ? <span className="text-xs font-heading font-bold" style={{ color: '#5C4033' }}>...</span> : <Download size={18} color="#5C4033" />}</div><span className="text-[10px] font-heading" style={{ color: '#5C4033' }}>{downloading ? '下载中' : '下载'}</span></motion.button>
              <motion.button className="flex flex-col items-center gap-1" whileTap={{ scale: 0.9 }} onClick={() => setShowMoveModal(true)}><div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFF4E1' }}><FolderInput size={18} color="#5C4033" /></div><span className="text-[10px] font-heading" style={{ color: '#5C4033' }}>移动</span></motion.button>
              <motion.button className="flex flex-col items-center gap-1" whileTap={{ scale: 0.9 }} onClick={() => { if (confirm(`确定删除选中的 ${selectedCount} 项吗？`)) deleteSelectedPhotos(); }}><div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FF8A8A' }}><Trash2 size={18} color="#FFFCF7" /></div><span className="text-[10px] font-heading" style={{ color: '#FF8A8A' }}>删除</span></motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Move Modal */}
      <AnimatePresence>{showMoveModal && <MoveToAlbumModal photoIds={selectedPhotoIds} onClose={() => setShowMoveModal(false)} />}</AnimatePresence>

      <BottomNav />
    </div>
  );
};

/* ═══════════════════════════════════════════
   Router
   ═══════════════════════════════════════════ */
type SubView = 'grid' | 'events' | 'detail';

const AlbumPage: React.FC = () => {
  const [subView, setSubView] = useState<SubView>('grid');
  const [activeAlbum, setActiveAlbum] = useState<EventAlbum | null>(null);

  return (
    <AnimatePresence mode="wait">
      {subView === 'grid' && <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AlbumGridView onOpenEvents={() => setSubView('events')} /></motion.div>}
      {subView === 'events' && <motion.div key="events" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><EventAlbumsView onOpenAlbum={(a) => { setActiveAlbum(a); setSubView('detail'); }} onBack={() => setSubView('grid')} /></motion.div>}
      {subView === 'detail' && activeAlbum && <motion.div key="detail" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><AlbumDetailView album={activeAlbum} onBack={() => setSubView('events')} /></motion.div>}
    </AnimatePresence>
  );
};

export default AlbumPage;
