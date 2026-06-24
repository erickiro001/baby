import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const titleChars = '羽汐宝贝'.split('');
const subtitleChars = '成长小窝'.split('');

const RattleSVG: React.FC = React.memo(() => (
  <motion.svg
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    animate={{ rotate: [-8, 8, -8] }}
    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
  >
    <circle cx="40" cy="28" r="16" stroke="#5C4033" strokeWidth="2" fill="#FFD6E5" />
    <circle cx="34" cy="24" r="3" fill="#5C4033" />
    <circle cx="46" cy="24" r="3" fill="#5C4033" />
    <path d="M38 30 Q40 33 42 30" stroke="#5C4033" strokeWidth="1.5" fill="none" />
    <rect x="38" y="44" width="4" height="18" rx="2" stroke="#5C4033" strokeWidth="2" fill="#A8D8EA" />
    <circle cx="40" cy="66" r="8" stroke="#5C4033" strokeWidth="2" fill="#FFF4E1" />
    <circle cx="36" cy="20" r="4" stroke="#5C4033" strokeWidth="1.5" fill="#FF8A8A" opacity="0.6" />
    <circle cx="50" cy="26" r="3" stroke="#5C4033" strokeWidth="1.5" fill="#A8D8EA" opacity="0.6" />
    <circle cx="32" cy="32" r="2.5" stroke="#5C4033" strokeWidth="1.5" fill="#FFF4E1" opacity="0.6" />
  </motion.svg>
));

const SplashPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ backgroundColor: '#FFFCF7' }}>
      {/* Title */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="flex gap-1">
          {titleChars.map((char, i) => (
            <motion.span
              key={i}
              className="text-5xl font-display"
              style={{ color: '#5C4033', WebkitTextStroke: '1.5px #5C4033' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
            >
              {char}
            </motion.span>
          ))}
        </div>
        <div className="flex gap-1">
          {subtitleChars.map((char, i) => (
            <motion.span
              key={i}
              className="text-xl font-heading font-semibold"
              style={{ color: '#8B7355' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
            >
              {char}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Rattle */}
      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 15 }}>
        <RattleSVG />
      </motion.div>

      {/* Enter Button */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            className="mt-12 px-10 py-3 rounded-full font-heading font-semibold text-lg"
            style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={onEnter}
          >
            进入
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplashPage;
