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
  const dataSource = useStore((s) => s.dataSource);
  const fetchError = useStore((s) => s.fetchError);

  // 启动时检查 token 持久化，自动登录
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    getProfile()
      .then(() => {
        useStore.getState().login();
        restoreAvatar();
        setPhase('main');
        useStore.getState().fetchInitialData();
      })
      .catch(() => {
        // token 过期，清除残留
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
  }, []);

  const restoreAvatar = () => {
    const savedAvatar = localStorage.getItem('user_avatar');
    if (!savedAvatar) return;
    const state = useStore.getState();
    if (!state.user) return;
    const name = state.user.name;
    state.setUser({ ...state.user, avatar: savedAvatar });
    useStore.setState((s) => ({
      familySpaces: s.familySpaces.map((fs) => ({
        ...fs,
        members: fs.members.map((m) =>
          m.name === name ? { ...m, avatar: savedAvatar } : m
        ),
      })),
    }));
  };
    // 如果已经登录过，直接进首页
    if (isLoggedIn) {
      setPhase('main');
    } else {
      setPhase('login');
    }
  };

  const handleLogin = () => {
    useStore.getState().login();
    restoreAvatar();
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
            {/* Data source indicator */}
            {dataSource === 'demo' && (
              <motion.div
                className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] px-3 py-1 rounded-full text-[10px] font-heading"
                style={{ backgroundColor: '#FFF4E1', color: '#8B7355', border: '1px solid rgba(92,64,51,0.3)' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                演示模式 · 数据未持久化
              </motion.div>
            )}
            {fetchError && (
              <motion.div
                className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-3 py-1 rounded-full text-[10px] font-heading max-w-[90vw] truncate"
                style={{ backgroundColor: '#FF8A8A', color: '#FFFCF7' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {fetchError}
              </motion.div>
            )}
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
