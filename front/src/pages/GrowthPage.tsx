import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Star, Plus, X, Clock, Lock, Trash2, TrendingUp, Ruler, Weight, CircleDot,
  Palette, Blocks, Scissors, Mountain, Camera, Video, Sparkles, ImagePlus, ChevronDown,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import BottomNav from '@/components/BottomNav';
import GrowthChart from '@/components/GrowthChart';
import type { Milestone, Capsule, CreativeWork, CreativeType } from '@/types';
import type { HealthRecord } from '@/types/health';

/* ═══════════════════════════════════════════
   Type → Icon / Label / Color Map
   ═══════════════════════════════════════════ */
const CREATIVE_TYPE_MAP: Record<CreativeType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  drawing:  { label: '涂鸦',    icon: <Palette  size={14}/>, color: '#FF8A8A', bg: '#FFF0F0' },
  handcraft:{ label: '手工',    icon: <Scissors size={14}/>, color: '#A8D8EA', bg: '#E8F4F8' },
  lego:     { label: '乐高',    icon: <Blocks   size={14}/>, color: '#D4E5A8', bg: '#F0F5E0' },
  sandart:  { label: '沙画',    icon: <Mountain size={14}/>, color: '#FFD6A5', bg: '#FFF5E8' },
  photo:    { label: '摄影',    icon: <Camera   size={14}/>, color: '#D4A5E5', bg: '#F5E8FF' },
  video:    { label: '视频',    icon: <Video    size={14}/>, color: '#A5C4E5', bg: '#E8F0FF' },
  other:    { label: '其他',    icon: <Sparkles size={14}/>, color: '#C4B5A0', bg: '#F0EBE0' },
};

/* ─── Milestone Card ─── */
const MilestoneCard: React.FC<{ ms: Milestone; index: number }> = ({ ms, index }) => {
  const isEvent = ms.type === 'event';
  return (
    <motion.div
      className="rounded-xl overflow-hidden mb-3"
      style={{ backgroundColor: '#FFFCF7', border: isEvent ? '2px solid #5C4033' : '1.5px solid #5C4033', borderTopWidth: isEvent ? '4px' : '1.5px', borderTopColor: isEvent ? '#A8D8EA' : undefined, boxShadow: 'rgba(92,64,51,0.08) 0 2px 8px' }}
      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06, duration: 0.35 }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF4E1' }}>
            <Star size={16} color="#5C4033" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-heading font-semibold" style={{ color: '#5C4033' }}>{ms.title}</h3>
            <p className="text-xs font-heading mb-1" style={{ color: '#8B7355' }}>{format(parseISO(ms.date), 'yyyy年MM月dd日', { locale: zhCN })}</p>
            {ms.description && <p className="text-sm font-body leading-relaxed" style={{ color: '#5C4033' }}>{ms.description}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Capsule Card ─── */
const CapsuleCard: React.FC<{ capsule: Capsule; index: number }> = ({ capsule, index }) => {
  const openCapsule = useStore((s) => s.openCapsule);
  const now = new Date();
  const unlockDate = parseISO(capsule.unlockDate);
  const isUnlocked = now >= unlockDate || capsule.isOpened;
  const daysLeft = Math.max(0, Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  return (
    <motion.div className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', boxShadow: 'rgba(92,64,51,0.08) 0 2px 8px' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: isUnlocked ? '#A8D8EA' : '#FFF4E1' }}>
            {isUnlocked ? <Clock size={16} color="#5C4033" /> : <Lock size={16} color="#5C4033" />}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-heading font-semibold" style={{ color: '#5C4033' }}>{capsule.title}</h3>
            <p className="text-xs" style={{ color: '#8B7355' }}>{isUnlocked ? '已开启' : `${daysLeft}天后`} · {format(unlockDate, 'yyyy年MM月dd日', { locale: zhCN })}</p>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E0D8' }}>
          <motion.div className="h-full rounded-full" style={{ backgroundColor: isUnlocked ? '#A8D8EA' : '#FFD6E5' }} initial={{ width: 0 }} animate={{ width: isUnlocked ? '100%' : `${Math.max(5, 100 - daysLeft)}%` }} transition={{ duration: 0.8 }} />
        </div>
        {isUnlocked && !capsule.isOpened && <motion.button className="mt-3 w-full py-2 rounded-full text-sm font-heading font-semibold" style={{ backgroundColor: '#A8D8EA', border: '1.5px solid #5C4033', color: '#5C4033' }} whileTap={{ scale: 0.97 }} onClick={() => openCapsule(capsule.id)}>开启胶囊</motion.button>}
        {capsule.isOpened && <div className="mt-3 p-3 rounded-lg text-sm font-body" style={{ backgroundColor: '#FFF4E1', border: '1px dashed #5C4033', color: '#5C4033' }}>{capsule.content}</div>}
      </div>
    </motion.div>
  );
};

/* ─── Health Record Row ─── */
const HealthRecordRow: React.FC<{ record: HealthRecord; index: number; onDelete: (id: string) => void }> = ({ record, index, onDelete }) => {
  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2"
      style={{ backgroundColor: '#FFFCF7', border: '1.5px solid rgba(92,64,51,0.15)' }}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFD6E5' }}>
        <TrendingUp size={16} color="#5C4033" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-heading font-semibold" style={{ color: '#5C4033' }}>
            {format(parseISO(record.date), 'MM月dd日', { locale: zhCN })}
          </span>
          {record.note && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF4E1', color: '#8B7355' }}>{record.note}</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {record.weight !== undefined && <span className="text-xs font-body" style={{ color: '#5C4033' }}><Weight size={10} className="inline mr-0.5" />{record.weight}kg</span>}
          {record.height !== undefined && <span className="text-xs font-body" style={{ color: '#5C4033' }}><Ruler size={10} className="inline mr-0.5" />{record.height}cm</span>}
          {record.headCircumference !== undefined && <span className="text-xs font-body" style={{ color: '#5C4033' }}><CircleDot size={10} className="inline mr-0.5" />{record.headCircumference}cm</span>}
        </div>
      </div>
      <motion.button className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFF4E1' }} whileTap={{ scale: 0.9 }} onClick={() => { if (confirm('删除这条记录？')) onDelete(record.id); }}>
        <Trash2 size={12} color="#FF8A8A" />
      </motion.button>
    </motion.div>
  );
};

/* ─── Creative Work Card ─── */
const CreativeWorkCard: React.FC<{ work: CreativeWork; index: number; onDelete: (id: string) => void }> = ({ work, index, onDelete }) => {
  const t = CREATIVE_TYPE_MAP[work.type];
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      className="rounded-xl overflow-hidden mb-3"
      style={{ backgroundColor: '#FFFCF7', border: '2px solid #5C4033', boxShadow: 'rgba(92,64,51,0.08) 0 2px 10px' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
    >
      {/* Image area */}
      {(work.images && work.images.length > 0) || work.imageUrl ? (
        <div className="relative w-full" style={{ aspectRatio: '1 / 1', maxHeight: 360 }}>
          <img
            src={work.images?.[0] || work.imageUrl}
            alt={work.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Type badge */}
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{ backgroundColor: t.bg, border: '1.5px solid #5C4033' }}
          >
            <span style={{ color: t.color }}>{t.icon}</span>
            <span className="text-[11px] font-heading font-semibold" style={{ color: '#5C4033' }}>{t.label}</span>
          </div>
          {/* Delete button */}
          <motion.button
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,252,247,0.9)', border: '1.5px solid #5C4033' }}
            whileTap={{ scale: 0.85 }}
            onClick={() => { if (confirm(`删除「${work.title}」？`)) onDelete(work.id); }}
          >
            <Trash2 size={12} color="#FF8A8A" />
          </motion.button>
        </div>
      ) : (
        /* No-image card */
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: t.bg, border: '1.5px solid #5C4033' }}>
                <span style={{ color: t.color }}>{t.icon}</span>
              </div>
              <div>
                <h3 className="text-base font-heading font-semibold" style={{ color: '#5C4033' }}>{work.title}</h3>
                <p className="text-[10px] font-heading" style={{ color: '#8B7355' }}>{format(parseISO(work.date), 'yyyy年MM月dd日', { locale: zhCN })}</p>
              </div>
            </div>
            <motion.button
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#FFF4E1' }}
              whileTap={{ scale: 0.85 }}
              onClick={() => { if (confirm(`删除「${work.title}」？`)) onDelete(work.id); }}
            >
              <Trash2 size={12} color="#FF8A8A" />
            </motion.button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-3.5">
        {((work.images && work.images.length > 0) || work.imageUrl) && (
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-base font-heading font-semibold" style={{ color: '#5C4033' }}>{work.title}</h3>
            <span className="text-[10px] font-heading" style={{ color: '#8B7355' }}>{format(parseISO(work.date), 'yyyy年MM月dd日', { locale: zhCN })}</span>
          </div>
        )}
        {work.description && (
          <p
            className="text-sm font-body leading-relaxed cursor-pointer"
            style={{ color: '#5C4033' }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? work.description : work.description.length > 60 ? work.description.slice(0, 60) + '...' : work.description}
          </p>
        )}
        {/* Multi-image dots */}
        {work.images && work.images.length > 1 && (
          <div className="flex items-center gap-1 mt-2">
            {work.images.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: i === 0 ? '#FFD6E5' : '#E8E0D8' }} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ─── Health Record Form ─── */
const HealthRecordForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const addHealthRecord = useStore((s) => s.addHealthRecord);
  const activeBabyId = useStore((s) => s.activeBabyId);
  const babies = useStore((s) => s.babies);
  const activeBaby = babies.find((b) => b.id === activeBabyId);

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!activeBabyId || !date) return;
    addHealthRecord({
      id: `hr_${Date.now()}`,
      babyId: activeBabyId,
      date,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      headCircumference: head ? parseFloat(head) : undefined,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <>
      <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
          <h3 className="text-lg font-heading font-semibold" style={{ color: '#5C4033' }}>记录生长数据 · {activeBaby?.name}</h3>
          <button onClick={onClose}><X size={18} color="#5C4033" /></button>
        </div>
        <div className="px-4 py-4 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
          <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>日期</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>体重(kg)</label><input type="number" step="0.1" placeholder="0.0" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-3 py-3 rounded-xl text-sm font-body outline-none text-center" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
            <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>身高(cm)</label><input type="number" step="0.1" placeholder="0.0" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full px-3 py-3 rounded-xl text-sm font-body outline-none text-center" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
            <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>头围(cm)</label><input type="number" step="0.1" placeholder="0.0" value={head} onChange={(e) => setHead(e.target.value)} className="w-full px-3 py-3 rounded-xl text-sm font-body outline-none text-center" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
          </div>
          <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>备注（可选）</label><input type="text" placeholder="例如：6个月体检" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
          <motion.button className="w-full py-3 rounded-full font-heading font-semibold" style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033' }} whileTap={{ scale: 0.97 }} onClick={handleSubmit}>保存记录</motion.button>
        </div>
      </motion.div>
    </>
  );
};

/* ─── Milestone Form ─── */
const MilestoneForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const addMilestone = useStore((s) => s.addMilestone);
  const activeBabyId = useStore((s) => s.activeBabyId);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'milestone' | 'event'>('milestone');
  const handleSubmit = () => {
    if (!title.trim() || !date || !activeBabyId) return;
    addMilestone({ id: `ms_${Date.now()}`, type, title: title.trim(), date, description: desc.trim(), babyId: activeBabyId });
    onClose();
  };
  return (
    <>
      <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(92,64,51,0.1)' }}><h3 className="text-lg font-heading font-semibold" style={{ color: '#5C4033' }}>记录{type === 'milestone' ? '里程碑' : '大事记'}</h3><button onClick={onClose}><X size={18} color="#5C4033" /></button></div>
        <div className="px-4 py-4 space-y-3">
          <div className="flex gap-2">{(['milestone', 'event'] as const).map((t) => <button key={t} className="flex-1 py-2 rounded-xl text-sm font-heading border-2" style={{ backgroundColor: type === t ? '#FFD6E5' : '#FFFCF7', borderColor: type === t ? '#5C4033' : '#A09890', color: '#5C4033' }} onClick={() => setType(t)}>{t === 'milestone' ? '里程碑' : '大事记'}</button>)}</div>
          <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>标题</label><input type="text" placeholder={type === 'milestone' ? '例如：第一次翻身' : '例如：百日宴'} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
          <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>日期</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
          <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>描述</label><textarea placeholder="记录这个特别的时刻..." value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none resize-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
          <motion.button className="w-full py-3 rounded-full font-heading font-semibold" style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033' }} whileTap={{ scale: 0.97 }} onClick={handleSubmit}>保存</motion.button>
        </div>
      </motion.div>
    </>
  );
};

/* ─── Capsule Form ─── */
const CapsuleForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const addCapsule = useStore((s) => s.addCapsule);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const handleSubmit = () => { if (!title.trim() || !unlockDate) return; addCapsule({ id: `cap_${Date.now()}`, title: title.trim(), contentType: 'text', content: content.trim(), unlockDate, createdDate: new Date().toISOString(), isOpened: false }); onClose(); };
  return (
    <>
      <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(92,64,51,0.1)' }}><h3 className="text-lg font-heading font-semibold" style={{ color: '#5C4033' }}>新建时间胶囊</h3><button onClick={onClose}><X size={18} color="#5C4033" /></button></div>
        <div className="px-4 py-4 space-y-3">
          <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>标题</label><input type="text" placeholder="给未来的信..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
          <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>内容</label><textarea placeholder="写下你想说的话..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none resize-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
          <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>开启日期</label><input type="date" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
          <motion.button className="w-full py-3 rounded-full font-heading font-semibold" style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033' }} whileTap={{ scale: 0.97 }} onClick={handleSubmit}>封存</motion.button>
        </div>
      </motion.div>
    </>
  );
};

/* ─── Creative Work Form ─── */
const CreativeWorkForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const addCreativeWork = useStore((s) => s.addCreativeWork);
  const activeBabyId = useStore((s) => s.activeBabyId);
  const babies = useStore((s) => s.babies);
  const activeBaby = babies.find((b) => b.id === activeBabyId);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<CreativeType>('drawing');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setImagePreview((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!title.trim() || !date || !activeBabyId) return;
    addCreativeWork({
      id: `cw_${Date.now()}`,
      babyId: activeBabyId,
      title: title.trim(),
      type,
      description: description.trim(),
      images: imagePreview.length > 0 ? imagePreview : undefined,
      date,
      createdAt: `${date}T00:00:00`,
    });
    onClose();
  };

  const currentType = CREATIVE_TYPE_MAP[type];

  return (
    <>
      <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
          <h3 className="text-lg font-heading font-semibold" style={{ color: '#5C4033' }}>记录创意作品 · {activeBaby?.name}</h3>
          <button onClick={onClose}><X size={18} color="#5C4033" /></button>
        </div>
        <div className="px-4 py-4 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">

          {/* Type selector */}
          <div>
            <label className="text-xs font-heading mb-1.5 block" style={{ color: '#8B7355' }}>作品类型</label>
            <motion.button
              className="w-full px-4 py-3 rounded-xl flex items-center justify-between"
              style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowTypePicker(!showTypePicker)}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: currentType.color }}>{currentType.icon}</span>
                <span className="text-sm font-body" style={{ color: '#5C4033' }}>{currentType.label}</span>
              </div>
              <ChevronDown size={16} color="#8B7355" style={{ transform: showTypePicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </motion.button>
            <AnimatePresence>
              {showTypePicker && (
                <motion.div
                  className="mt-1.5 rounded-xl overflow-hidden"
                  style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7' }}
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                >
                  {(Object.keys(CREATIVE_TYPE_MAP) as CreativeType[]).map((t) => (
                    <button
                      key={t}
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-left"
                      style={{ backgroundColor: type === t ? CREATIVE_TYPE_MAP[t].bg : 'transparent' }}
                      onClick={() => { setType(t); setShowTypePicker(false); }}
                    >
                      <span style={{ color: CREATIVE_TYPE_MAP[t].color }}>{CREATIVE_TYPE_MAP[t].icon}</span>
                      <span className="text-sm font-body" style={{ color: '#5C4033' }}>{CREATIVE_TYPE_MAP[t].label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>作品标题</label>
            <input type="text" placeholder="例如：手指画小鸟" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>完成日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} />
          </div>

          {/* Image upload */}
          <div>
            <label className="text-xs font-heading mb-1.5 block" style={{ color: '#8B7355' }}>作品照片（可选）</label>
            <div className="flex flex-wrap gap-2">
              {imagePreview.map((img, idx) => (
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
              <label className="w-20 h-20 rounded-xl flex flex-col items-center justify-center cursor-pointer shrink-0" style={{ border: '1.5px dashed #5C4033', backgroundColor: 'rgba(92,64,51,0.03)' }}>
                <ImagePlus size={18} color="#8B7355" />
                <span className="text-[10px] font-heading mt-0.5" style={{ color: '#8B7355' }}>添加</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>描述（可选）</label>
            <textarea placeholder="记录创作过程和感受..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none resize-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} />
          </div>

          <motion.button className="w-full py-3 rounded-full font-heading font-semibold" style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033' }} whileTap={{ scale: 0.97 }} onClick={handleSubmit}>保存作品</motion.button>
        </div>
      </motion.div>
    </>
  );
};

/* ─── Latest Stats Card ─── */
const LatestStats: React.FC<{ records: HealthRecord[]; birthday: string }> = ({ records, birthday }) => {
  const latest = records[0];
  if (!latest) return null;
  const months = differenceInMonths(parseISO(latest.date), parseISO(birthday));
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {[
        { label: '体重', value: latest.weight, unit: 'kg', color: '#FF8A8A' },
        { label: '身高', value: latest.height, unit: 'cm', color: '#A8D8EA' },
        { label: '头围', value: latest.headCircumference, unit: 'cm', color: '#D4E5A8' },
      ].map((item) => (
        <div key={item.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033' }}>
          <p className="text-[10px] font-heading mb-0.5" style={{ color: '#8B7355' }}>{item.label}</p>
          <p className="text-xl font-display" style={{ color: item.color }}>{item.value !== undefined ? item.value : '--'}</p>
          <p className="text-[10px] font-heading" style={{ color: '#A09890' }}>{item.unit} · {months}个月</p>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Main Growth Page
   ═══════════════════════════════════════════ */
const GrowthPage: React.FC = () => {
  const milestones = useStore((s) => s.milestones);
  const capsules = useStore((s) => s.capsules);
  const healthRecords = useStore((s) => s.healthRecords);
  const deleteHealthRecord = useStore((s) => s.deleteHealthRecord);
  const creativeWorks = useStore((s) => s.creativeWorks);
  const deleteCreativeWork = useStore((s) => s.deleteCreativeWork);
  const activeBabyId = useStore((s) => s.activeBabyId);
  const babies = useStore((s) => s.babies);
  const activeBaby = babies.find((b) => b.id === activeBabyId);

  const [activeTab, setActiveTab] = useState<'health' | 'milestones' | 'capsules' | 'creativity'>('health');
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showCapsuleForm, setShowCapsuleForm] = useState(false);
  const [showCreativeForm, setShowCreativeForm] = useState(false);
  const [creativeFilter, setCreativeFilter] = useState<CreativeType | 'all'>('all');

  // Current age in months
  const currentAgeMonths = activeBaby
    ? differenceInMonths(new Date(), parseISO(activeBaby.birthday))
    : undefined;

  // Filter records for active baby
  const babyRecords = healthRecords.filter((r) => r.babyId === activeBabyId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const babyMilestones = milestones.filter((m) => m.babyId === activeBabyId);
  const babyCreativeWorks = creativeWorks
    .filter((w) => w.babyId === activeBabyId)
    .filter((w) => creativeFilter === 'all' || w.type === creativeFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Tabs config
  const tabs = [
    { key: 'health' as const, label: '健康' },
    { key: 'milestones' as const, label: '里程碑' },
    { key: 'capsules' as const, label: '胶囊' },
    { key: 'creativity' as const, label: '创造力' },
  ];

  const handleAdd = () => {
    switch (activeTab) {
      case 'health':     setShowHealthForm(true); break;
      case 'milestones': setShowMilestoneForm(true); break;
      case 'capsules':   setShowCapsuleForm(true); break;
      case 'creativity': setShowCreativeForm(true); break;
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#FFFCF7' }}>
      <div className="sticky top-0 z-30 px-4 pt-4 pb-0" style={{ backgroundColor: '#FFFCF7' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-display" style={{ color: '#5C4033' }}>成长记录</h1>
            <p className="text-xs font-heading" style={{ color: '#8B7355' }}>{activeBaby?.name ? `${activeBaby.name} · 出生${differenceInMonths(new Date(), parseISO(activeBaby.birthday))}个月` : ''}</p>
          </div>
          <motion.button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD6E5', border: '1.5px solid #5C4033' }} whileTap={{ scale: 0.9 }} onClick={handleAdd}>
            <Plus size={18} color="#5C4033" strokeWidth={2.5} />
          </motion.button>
        </div>
        <div className="flex gap-0.5 border-b" style={{ borderColor: '#5C4033' }}>
          {tabs.map((tab) => (
            <motion.button key={tab.key} className="relative px-3 py-2.5 font-heading font-semibold text-sm" style={{ color: activeTab === tab.key ? '#5C4033' : '#A09890' }} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
              {activeTab === tab.key && <motion.div className="absolute bottom-0 left-1.5 right-1.5 h-1 rounded-full" style={{ backgroundColor: '#FFD6E5' }} layoutId="growthTab" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        <AnimatePresence mode="wait">
          {/* Health Records Tab */}
          {activeTab === 'health' && (
            <motion.div key="health" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Latest Stats */}
              {babyRecords.length > 0 && activeBaby && <LatestStats records={babyRecords} birthday={activeBaby.birthday} />}

              {/* Growth Charts */}
              {babyRecords.length > 0 && activeBaby && (
                <>
                  <GrowthChart records={babyRecords} babyBirthday={activeBaby.birthday} chartType="weight" currentAgeMonths={currentAgeMonths} />
                  <GrowthChart records={babyRecords} babyBirthday={activeBaby.birthday} chartType="height" currentAgeMonths={currentAgeMonths} />
                  <GrowthChart records={babyRecords} babyBirthday={activeBaby.birthday} chartType="head" currentAgeMonths={currentAgeMonths} />
                </>
              )}

              {/* Records List */}
              <div className="mt-2">
                <h3 className="text-sm font-heading font-semibold mb-2" style={{ color: '#5C4033' }}>历史记录</h3>
                {babyRecords.length === 0 ? (
                  <div className="flex flex-col items-center py-8"><TrendingUp size={28} color="#A09890" /><p className="text-sm font-body mt-2" style={{ color: '#A09890' }}>还没有记录</p></div>
                ) : babyRecords.map((r, i) => <HealthRecordRow key={r.id} record={r} index={i} onDelete={deleteHealthRecord} />)}
              </div>
            </motion.div>
          )}

          {/* Milestones Tab */}
          {activeTab === 'milestones' && (
            <motion.div key="ms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {babyMilestones.length === 0 ? <div className="flex flex-col items-center py-16"><Star size={28} color="#A09890" /><p className="text-sm font-body mt-2" style={{ color: '#A09890' }}>还没有记录</p></div> : babyMilestones.map((m, i) => <MilestoneCard key={m.id} ms={m} index={i} />)}
            </motion.div>
          )}

          {/* Capsules Tab */}
          {activeTab === 'capsules' && (
            <motion.div key="cap" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {capsules.map((c, i) => <CapsuleCard key={c.id} capsule={c} index={i} />)}
            </motion.div>
          )}

          {/* Creativity Tab */}
          {activeTab === 'creativity' && (
            <motion.div key="creative" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Filter bar */}
              <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
                <button
                  className="px-3 py-1.5 rounded-full text-xs font-heading whitespace-nowrap border-2"
                  style={{
                    backgroundColor: creativeFilter === 'all' ? '#FFD6E5' : '#FFFCF7',
                    borderColor: creativeFilter === 'all' ? '#5C4033' : 'rgba(92,64,51,0.15)',
                    color: '#5C4033',
                  }}
                  onClick={() => setCreativeFilter('all')}
                >
                  全部
                </button>
                {(Object.keys(CREATIVE_TYPE_MAP) as CreativeType[]).map((t) => (
                  <button
                    key={t}
                    className="px-3 py-1.5 rounded-full text-xs font-heading whitespace-nowrap border-2 flex items-center gap-1"
                    style={{
                      backgroundColor: creativeFilter === t ? CREATIVE_TYPE_MAP[t].bg : '#FFFCF7',
                      borderColor: creativeFilter === t ? '#5C4033' : 'rgba(92,64,51,0.15)',
                      color: '#5C4033',
                    }}
                    onClick={() => setCreativeFilter(creativeFilter === t ? 'all' : t)}
                  >
                    <span style={{ color: CREATIVE_TYPE_MAP[t].color }}>{CREATIVE_TYPE_MAP[t].icon}</span>
                    {CREATIVE_TYPE_MAP[t].label}
                  </button>
                ))}
              </div>

              {/* Works gallery */}
              {babyCreativeWorks.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <Palette size={28} color="#A09890" />
                  <p className="text-sm font-body mt-2" style={{ color: '#A09890' }}>还没有创意作品</p>
                  <p className="text-xs font-body mt-1" style={{ color: '#C4B5A0' }}>记录孩子的涂鸦、手工、乐高...</p>
                </div>
              ) : (
                babyCreativeWorks.map((w, i) => (
                  <CreativeWorkCard key={w.id} work={w} index={i} onDelete={deleteCreativeWork} />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Forms */}
      <AnimatePresence>
        {showHealthForm && <HealthRecordForm onClose={() => setShowHealthForm(false)} />}
        {showMilestoneForm && <MilestoneForm onClose={() => setShowMilestoneForm(false)} />}
        {showCapsuleForm && <CapsuleForm onClose={() => setShowCapsuleForm(false)} />}
        {showCreativeForm && <CreativeWorkForm onClose={() => setShowCreativeForm(false)} />}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default GrowthPage;
