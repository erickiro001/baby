import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, ImagePlus, Camera, Video, PenLine, Play, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { ContentType, TimelineEntry } from '@/types';

interface PublishModalProps {
  type: 'photo' | 'video' | 'text';
  onClose: () => void;
}

const TYPE_META: Record<PublishModalProps['type'], { label: string; icon: typeof Camera; accent: string }> = {
  photo: { label: '发布照片', icon: Camera, accent: '#FFD6E5' },
  video: { label: '发布视频', icon: Video, accent: '#A8D8EA' },
  text:  { label: '发布文字', icon: PenLine, accent: '#FFF4E1' },
};

const PublishModal: React.FC<PublishModalProps> = ({ type, onClose }) => {
  const user = useStore((s) => s.user);
  const babies = useStore((s) => s.babies);
  const activeBabyId = useStore((s) => s.activeBabyId);
  const activeBaby = babies.find((b) => b.id === activeBabyId);
  const addTimelineEntry = useStore((s) => s.addTimelineEntry);
  const setCurrentPage = useStore((s) => s.setCurrentPage);

  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoFileName, setVideoFileName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const meta = TYPE_META[type];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const limit = 9;
    Array.from(files).slice(0, limit - images.length).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setVideoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));
  const removeVideo = () => { setVideoUrl(''); setVideoFileName(''); };

  const addTag = () => {
    const raw = tagInput.trim().replace(/^#/, '');
    if (raw && !tags.includes(`#${raw}`)) setTags((prev) => [...prev, `#${raw}`]);
    setTagInput('');
  };

  const canSubmit = (() => {
    if (type === 'text') return description.trim().length > 0;
    if (type === 'video') return videoUrl.length > 0;
    return images.length > 0;
  })();

  const handleSubmit = () => {
    if (!activeBabyId || !canSubmit) return;

    const base = {
      id: `t_${Date.now()}`,
      authorId: user?.id || 'u1',
      authorName: user?.name || '我',
      authorAvatar: user?.avatar || '',
      babyId: activeBabyId,
      date: new Date().toISOString(),
      description: description.trim(),
      likes: 0,
      liked: false,
      featured: false,
      tags,
      comments: [],
    };

    let entry: TimelineEntry;
    if (type === 'photo') {
      entry = { ...base, type: 'photo' as ContentType, images };
    } else if (type === 'video') {
      entry = {
        ...base,
        type: 'video' as ContentType,
        videoUrl,
        imageUrl: images[0] || undefined,
      };
    } else {
      entry = { ...base, type: 'text' as ContentType };
    }

    addTimelineEntry(entry);
    setCurrentPage('home');
    onClose();
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[60]"
        style={{ backgroundColor: 'rgba(92,64,51,0.15)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden"
        style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: meta.accent, border: '1.5px solid #5C4033' }}>
              <meta.icon size={15} color="#5C4033" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-heading font-semibold" style={{ color: '#5C4033' }}>{meta.label}</h3>
          </div>
          <button onClick={onClose}><X size={18} color="#5C4033" /></button>
        </div>

        <div className="px-4 py-4 space-y-3 max-h-[64vh] overflow-y-auto no-scrollbar">
          {/* Baby indicator */}
          <p className="text-xs font-heading" style={{ color: '#8B7355' }}>
            正在为 <span style={{ color: '#5C4033', fontWeight: 600 }}>{activeBaby?.name || '宝宝'}</span> 记录
          </p>

          {/* Video upload (video mode) */}
          {type === 'video' && (
            <div>
              <label className="text-xs font-heading mb-1.5 block" style={{ color: '#8B7355' }}>
                视频文件（必选）
              </label>
              {videoUrl ? (
                <div className="space-y-2">
                  {/* Video preview */}
                  <div className="relative rounded-xl overflow-hidden bg-black" style={{ border: '1.5px solid #5C4033' }}>
                    <video
                      src={videoUrl}
                      className="w-full max-h-48 object-contain"
                      controls
                      playsInline
                      webkit-playsinline="true"
                      x5-video-player-type="h5"
                    />
                    <motion.button
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,138,138,0.9)' }}
                      whileTap={{ scale: 0.85 }}
                      onClick={removeVideo}
                    >
                      <Trash2 size={13} color="#fff" />
                    </motion.button>
                  </div>
                  <p className="text-[10px] font-body truncate" style={{ color: '#8B7355' }}>{videoFileName}</p>

                  {/* Optional cover image */}
                  <label className="text-xs font-heading block" style={{ color: '#8B7355' }}>封面图（可选）</label>
                  <div className="flex flex-wrap gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0" style={{ border: '1.5px solid #5C4033' }}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <motion.button
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(255,138,138,0.9)' }}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => removeImage(idx)}
                        >
                          <X size={10} color="#fff" />
                        </motion.button>
                      </div>
                    ))}
                    {images.length < 1 && (
                      <label className="w-20 h-20 rounded-xl flex flex-col items-center justify-center cursor-pointer shrink-0" style={{ border: '1.5px dashed #5C4033', backgroundColor: 'rgba(92,64,51,0.03)' }}>
                        <ImagePlus size={18} color="#8B7355" />
                        <span className="text-[10px] font-heading mt-0.5" style={{ color: '#8B7355' }}>封面</span>
                        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-8 rounded-xl cursor-pointer" style={{ border: '2px dashed #5C4033', backgroundColor: 'rgba(92,64,51,0.03)' }}>
                  <Video size={32} color="#5C4033" strokeWidth={1.5} />
                  <span className="text-sm font-heading mt-2" style={{ color: '#5C4033' }}>点击选择视频文件</span>
                  <span className="text-[10px] font-body mt-1" style={{ color: '#8B7355' }}>支持 MP4、MOV 等格式</span>
                  <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                </label>
              )}
            </div>
          )}

          {/* Image upload (photo mode) */}
          {type === 'photo' && (
            <div>
              <label className="text-xs font-heading mb-1.5 block" style={{ color: '#8B7355' }}>
                照片（最多9张，必选）
              </label>
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0" style={{ border: '1.5px solid #5C4033' }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <motion.button
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,138,138,0.9)' }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => removeImage(idx)}
                    >
                      <X size={10} color="#fff" />
                    </motion.button>
                  </div>
                ))}
                {images.length < 9 && (
                  <label className="w-20 h-20 rounded-xl flex flex-col items-center justify-center cursor-pointer shrink-0" style={{ border: '1.5px dashed #5C4033', backgroundColor: 'rgba(92,64,51,0.03)' }}>
                    <ImagePlus size={18} color="#8B7355" />
                    <span className="text-[10px] font-heading mt-0.5" style={{ color: '#8B7355' }}>添加</span>
                    <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>
              {type === 'text' ? '内容（必填）' : '说点什么吧（可选）'}
            </label>
            <textarea
              placeholder={type === 'text' ? '记录此刻的心情与故事...' : '为这条动态写点文字...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={type === 'text' ? 5 : 3}
              className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none resize-none"
              style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>标签（可选）</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入标签后点添加"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-body outline-none"
                style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }}
              />
              <motion.button
                className="px-4 py-2.5 rounded-xl text-sm font-heading font-semibold shrink-0"
                style={{ backgroundColor: '#FFF4E1', border: '1.5px solid #5C4033', color: '#5C4033' }}
                whileTap={{ scale: 0.95 }}
                onClick={addTag}
              >
                添加
              </motion.button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <motion.button
                    key={tag}
                    className="text-[11px] font-heading px-2 py-1 rounded-full flex items-center gap-1"
                    style={{ backgroundColor: '#A8D8EA25', color: '#5C4033' }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  >
                    {tag} <X size={10} />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <motion.button
            className="w-full py-3 rounded-full font-heading font-semibold"
            style={{
              backgroundColor: canSubmit ? '#FFD6E5' : '#F0EBE4',
              border: '2px solid #5C4033',
              color: canSubmit ? '#5C4033' : '#A09890',
              opacity: canSubmit ? 1 : 0.7,
            }}
            whileTap={canSubmit ? { scale: 0.97 } : {}}
            onClick={handleSubmit}
          >
            发布
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};

export default PublishModal;
