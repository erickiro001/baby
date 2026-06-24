import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Clock, Lock, Plus, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import BottomNav from '@/components/BottomNav';

const CapsulePage: React.FC = () => {
  const capsules = useStore((s) => s.capsules);
  const openCapsule = useStore((s) => s.openCapsule);
  const addCapsule = useStore((s) => s.addCapsule);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !unlockDate) return;
    addCapsule({ id: `cap_${Date.now()}`, title: title.trim(), contentType: 'text', content: content.trim(), unlockDate, createdDate: new Date().toISOString(), isOpened: false });
    setShowForm(false); setTitle(''); setContent(''); setUnlockDate('');
  };

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#FFFCF7' }}>
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ backgroundColor: '#FFFCF7' }}>
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-display" style={{ color: '#5C4033' }}>时间胶囊</h1><p className="text-xs font-heading" style={{ color: '#8B7355' }}>写给未来的信</p></div>
          <motion.button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD6E5', border: '1.5px solid #5C4033' }} whileTap={{ scale: 0.9 }} onClick={() => setShowForm(true)}><Plus size={18} color="#5C4033" strokeWidth={2.5} /></motion.button>
        </div>
      </div>

      <div className="px-4">
        {capsules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20"><Lock size={32} color="#A09890" strokeWidth={1.5} /><p className="text-sm font-body mt-3" style={{ color: '#A09890' }}>还没有胶囊</p></div>
        ) : capsules.map((capsule, index) => {
          const now = new Date();
          const unlockDate = parseISO(capsule.unlockDate);
          const isUnlocked = now >= unlockDate || capsule.isOpened;
          const daysLeft = Math.max(0, Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          return (
            <motion.div key={capsule.id} className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', boxShadow: 'rgba(92,64,51,0.08) 0 2px 8px' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
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
        })}
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} />
            <motion.div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(92,64,51,0.1)' }}><h3 className="text-lg font-heading font-semibold" style={{ color: '#5C4033' }}>新建时间胶囊</h3><button onClick={() => setShowForm(false)}><X size={18} color="#5C4033" /></button></div>
              <div className="px-4 py-4 space-y-3">
                <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>标题</label><input type="text" placeholder="给未来的信..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
                <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>内容</label><textarea placeholder="写下你想说的话..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none resize-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
                <div><label className="text-xs font-heading mb-1 block" style={{ color: '#8B7355' }}>开启日期</label><input type="date" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-body outline-none" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7', color: '#5C4033' }} /></div>
                <motion.button className="w-full py-3 rounded-full font-heading font-semibold" style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033' }} whileTap={{ scale: 0.97 }} onClick={handleSubmit}>封存</motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default CapsulePage;
