import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Image, TrendingUp, User, Plus, Camera, Video, PenLine, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { PageType } from '@/types';
import PublishModal from './PublishModal';

const fabItems = [
  { key: 'photo', label: '照片', icon: Camera },
  { key: 'video', label: '视频', icon: Video },
  { key: 'text', label: '文字', icon: PenLine },
] as const;

type PublishType = 'photo' | 'video' | 'text';

const BottomNav: React.FC = () => {
  const currentPage = useStore((s) => s.currentPage);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const [fabOpen, setFabOpen] = useState(false);
  const [publishType, setPublishType] = useState<PublishType | null>(null);

  const handleNav = (page: PageType) => {
    setCurrentPage(page);
    setFabOpen(false);
  };

  const handlePublish = (key: PublishType) => {
    setPublishType(key);
    setFabOpen(false);
  };

  return (
    <>
      {/* FAB Overlay */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(92, 64, 51, 0.15)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Menu */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-end gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {fabItems.map((item, i) => (
              <motion.button
                key={item.key}
                className="flex flex-col items-center gap-1"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 400 }}
                onClick={() => handlePublish(item.key)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                  style={{ backgroundColor: ['#FFD6E5', '#A8D8EA', '#FFF4E1'][i], borderColor: '#5C4033' }}
                >
                  <item.icon size={20} color="#5C4033" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-heading font-semibold" style={{ color: '#5C4033' }}>{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav Pill */}
      <div className="fixed bottom-2 left-3 right-3 z-50">
        <div
          className="h-16 rounded-full flex items-center relative"
          style={{
            backgroundColor: '#FFFCF7',
            border: '1.5px solid #5C4033',
            boxShadow: 'rgba(92, 64, 51, 0.1) 0px -2px 12px',
          }}
        >
          {/* Left: 首页 */}
          <motion.button
            className="flex-1 flex flex-col items-center justify-center gap-0.5 h-14"
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNav('home')}
          >
            {currentPage === 'home' ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD6E5' }}>
                <Home size={18} color="#5C4033" strokeWidth={2.5} />
              </div>
            ) : (
              <Home size={20} color="#A09890" strokeWidth={1.5} />
            )}
            <span className="text-[10px] font-heading font-semibold" style={{ color: currentPage === 'home' ? '#5C4033' : '#A09890' }}>首页</span>
          </motion.button>

          <div className="w-px h-5 border-l border-dashed" style={{ borderColor: '#A09890' }} />

          {/* Left-mid: 相册 */}
          <motion.button
            className="flex-1 flex flex-col items-center justify-center gap-0.5 h-14"
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNav('album')}
          >
            {currentPage === 'album' ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD6E5' }}>
                <Image size={18} color="#5C4033" strokeWidth={2.5} />
              </div>
            ) : (
              <Image size={20} color="#A09890" strokeWidth={1.5} />
            )}
            <span className="text-[10px] font-heading font-semibold" style={{ color: currentPage === 'album' ? '#5C4033' : '#A09890' }}>相册</span>
          </motion.button>

          {/* Center: FAB */}
          <div className="w-16 flex items-center justify-center relative">
            <motion.button
              className="absolute -top-5 w-14 h-14 rounded-full flex items-center justify-center border-2"
              style={{ backgroundColor: '#FFD6E5', borderColor: '#5C4033', boxShadow: '0 2px 10px rgba(92,64,51,0.2)' }}
              whileTap={{ scale: 0.85 }}
              onClick={() => setFabOpen(!fabOpen)}
            >
              <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                {fabOpen ? <X size={22} color="#5C4033" /> : <Plus size={22} color="#5C4033" />}
              </motion.div>
            </motion.button>
          </div>

          {/* Right-mid: 成长 */}
          <motion.button
            className="flex-1 flex flex-col items-center justify-center gap-0.5 h-14"
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNav('growth')}
          >
            {currentPage === 'growth' ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD6E5' }}>
                <TrendingUp size={18} color="#5C4033" strokeWidth={2.5} />
              </div>
            ) : (
              <TrendingUp size={20} color="#A09890" strokeWidth={1.5} />
            )}
            <span className="text-[10px] font-heading font-semibold" style={{ color: currentPage === 'growth' ? '#5C4033' : '#A09890' }}>成长</span>
          </motion.button>

          <div className="w-px h-5 border-l border-dashed" style={{ borderColor: '#A09890' }} />

          {/* Right: 我的 */}
          <motion.button
            className="flex-1 flex flex-col items-center justify-center gap-0.5 h-14"
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNav('profile')}
          >
            {currentPage === 'profile' ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD6E5' }}>
                <User size={18} color="#5C4033" strokeWidth={2.5} />
              </div>
            ) : (
              <User size={20} color="#A09890" strokeWidth={1.5} />
            )}
            <span className="text-[10px] font-heading font-semibold" style={{ color: currentPage === 'profile' ? '#5C4033' : '#A09890' }}>我的</span>
          </motion.button>
        </div>
      </div>

      {/* Publish Modal */}
      <AnimatePresence>
        {publishType && (
          <PublishModal type={publishType} onClose={() => setPublishType(null)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(BottomNav);
