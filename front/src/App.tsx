import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { getProfile } from '@/api/auth';
import SplashPage from '@/pages/SplashPage';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import AlbumPage from '@/pages/AlbumPage';
import GrowthPage from '@/pages/GrowthPage';
import ProfilePage from '@/pages/ProfilePage';
import BottomNav from '@/components/BottomNav';
import CommentsDrawer from '@/components/CommentsDrawer';

type AppPhase = 'splash' | 'login' | 'main';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('splash');
  const currentPage = useStore((s) => s.currentPage);
  const isLoggedIn = useStore((s) => s.isLoggedIn);

  // 启动时检查 token 持久化，自动登录
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    getProfile()
      .then(() => {
        useStore.getState().login();
        setPhase('main');
        useStore.getState().fetchInitialData();
      })
      .catch(() => {
        // token 过期，清除残留
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
  }, []);

  const handleEnter = () => {
    // 如果已经登录过，直接进首页
    if (isLoggedIn) {
      setPhase('main');
    } else {
      setPhase('login');
    }
  };

  const handleLogin = () => {
    useStore.getState().login();
    setPhase('main');
    // 异步加载后端数据
    useStore.getState().fetchInitialData();
  };

  const renderMainPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage />;
      case 'album': return <AlbumPage />;
      case 'growth': return <GrowthPage />;
      case 'profile': return <ProfilePage />;
      default: return <HomePage />;
    }
  };

  return (
    <>
      {/* Hidden routes for URL compat */}
      <div style={{ display: 'none' }}>
        <Routes>
          <Route path="*" element={null} />
        </Routes>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'splash' && (
          <motion.div key="splash" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <SplashPage onEnter={handleEnter} />
          </motion.div>
        )}

        {phase === 'login' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <LoginPage onLogin={handleLogin} />
          </motion.div>
        )}

        {phase === 'main' && (
          <motion.div
            key="main"
            className="min-h-screen"
            style={{ backgroundColor: '#FFFCF7' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderMainPage()}
              </motion.div>
            </AnimatePresence>
            <CommentsDrawer />
            <BottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
