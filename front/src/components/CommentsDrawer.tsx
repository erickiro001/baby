import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { smartTimeDisplay } from '@/lib/timeFormat';

const avatarColor = (name: string) => {
  const colors = ['#FFD6E5', '#A8D8EA', '#FFF4E1', '#B8D4E3', '#FF8A8A'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

const SleepingBabySVG: React.FC = React.memo(() => (
  <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
    <ellipse cx="50" cy="45" rx="30" ry="25" stroke="#5C4033" strokeWidth="1.5" fill="#FFD6E5" opacity="0.2" />
    <circle cx="42" cy="42" r="2.5" fill="#5C4033" />
    <circle cx="58" cy="42" r="2.5" fill="#5C4033" />
    <path d="M47 48 Q50 51 53 48" stroke="#5C4033" strokeWidth="1.5" fill="none" />
    <circle cx="50" cy="22" r="16" stroke="#5C4033" strokeWidth="1.5" fill="#FFFCF7" />
    <path d="M38 18 Q42 14 46 18" stroke="#5C4033" strokeWidth="1.5" fill="none" />
    <path d="M54 18 Q58 14 62 18" stroke="#5C4033" strokeWidth="1.5" fill="none" />
    <text x="70" y="24" fontSize="12" fill="#A09890">z</text>
    <text x="76" y="16" fontSize="9" fill="#A09890">z</text>
  </svg>
));

const CommentsDrawer: React.FC = () => {
  const isOpen = useStore((s) => s.isCommentsOpen);
  const selectedEntryId = useStore((s) => s.selectedEntryId);
  const timeline = useStore((s) => s.timeline);
  const addComment = useStore((s) => s.addComment);
  const closeComments = useStore((s) => s.closeComments);
  const user = useStore((s) => s.user);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const entry = timeline.find((e) => e.id === selectedEntryId);
  const comments = entry?.comments || [];

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, comments.length]);

  const handleSend = () => {
    if (!inputText.trim() || !selectedEntryId) return;
    addComment(selectedEntryId, inputText.trim());
    setInputText('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-[60]" style={{ backgroundColor: 'rgba(92,64,51,0.2)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeComments} />
          <motion.div className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col" style={{ height: '70vh', backgroundColor: '#FFFCF7', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', border: '1.5px solid #5C4033', borderBottom: 'none' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(92,64,51,0.1)' }}>
              <h3 className="text-base font-heading font-semibold flex-1 text-center" style={{ color: '#5C4033' }}>评论 ({comments.length})</h3>
              <motion.button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: '1px solid #5C4033' }} whileTap={{ scale: 0.9 }} onClick={closeComments}><X size={16} color="#5C4033" /></motion.button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-3">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3"><SleepingBabySVG /><p className="text-sm font-body" style={{ color: '#A09890' }}>还没有评论，写下第一条吧</p></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {comments.map((comment, i) => (
                    <motion.div key={comment.id} className="flex gap-2.5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-heading font-bold shrink-0" style={{ backgroundColor: avatarColor(comment.authorName), color: '#5C4033' }}>{comment.authorName.charAt(0)}</div>
                      <div className="flex-1 rounded-xl px-3 py-2" style={{ backgroundColor: '#FFFCF7', border: '1.5px solid #5C4033' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-heading font-semibold" style={{ color: '#5C4033' }}>{comment.authorName}</span>
                          <span className="text-[10px]" style={{ color: '#A09890' }}>{smartTimeDisplay(comment.timestamp)}</span>
                        </div>
                        <p className="text-[15px] font-body" style={{ color: '#5C4033' }}>{comment.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t flex items-center gap-2" style={{ borderColor: 'rgba(92,64,51,0.1)', backgroundColor: '#FFFCF7' }}>
              <div className="flex-1 rounded-full px-4 py-2.5" style={{ border: '1.5px solid #5C4033', backgroundColor: '#FFFCF7' }}>
                <input type="text" placeholder="写下你的评论..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="w-full bg-transparent outline-none text-sm font-body" style={{ color: '#5C4033' }} />
              </div>
              <motion.button className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFD6E5' }} whileTap={{ scale: 0.9 }} onClick={handleSend}><Send size={18} color="#5C4033" strokeWidth={2} /></motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommentsDrawer;
