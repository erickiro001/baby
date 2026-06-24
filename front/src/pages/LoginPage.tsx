import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, Sparkles, Loader2, Mail } from 'lucide-react';
import { login, register, getErrorMessage } from '@/api/auth';

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const switchMode = () => {
    setIsRegister((prev) => !prev);
    setError('');
    setEmail('');
    setConfirmPassword('');
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入账号和密码');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(username.trim(), password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      onLogin();
    } catch (err) {
      setError(getErrorMessage(err, '登录失败，请重试'));
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('请填写所有字段');
      triggerShake();
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      triggerShake();
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少6位');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await register(username.trim(), email.trim(), password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      onLogin();
    } catch (err) {
      setError(getErrorMessage(err, '注册失败，请重试'));
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isRegister) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6" style={{ backgroundColor: '#FFFCF7' }}>
      {/* Logo */}
      <motion.div className="flex flex-col items-center mb-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex gap-1 mb-2">
          {'宝宝时光'.split('').map((char, i) => (
            <motion.span key={i} className="text-4xl font-display" style={{ color: '#5C4033', WebkitTextStroke: '1.5px #5C4033' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              {char}
            </motion.span>
          ))}
        </div>
        <p className="text-sm font-heading" style={{ color: '#8B7355' }}>{isRegister ? '创建你的家庭时光' : '记录宝宝每一个珍贵瞬间'}</p>
      </motion.div>

      {/* Form */}
      <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {/* Account */}
        <div className="mb-4">
          <label className="text-xs font-heading mb-1.5 block ml-1" style={{ color: '#8B7355' }}>账号</label>
          <div
            className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl"
            style={{
              border: shake ? '2px solid #FF8A8A' : '1.5px solid #5C4033',
              backgroundColor: '#FFFCF7',
              transition: 'border-color 0.2s',
            }}
          >
            <User size={18} color="#A09890" strokeWidth={1.5} />
            <input
              type="text"
              placeholder={isRegister ? '给自己起个名字' : '请输入账号'}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              className="flex-1 bg-transparent outline-none text-sm font-body"
              style={{ color: '#5C4033' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        {/* Email (register only) */}
        {isRegister && (
          <motion.div className="mb-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label className="text-xs font-heading mb-1.5 block ml-1" style={{ color: '#8B7355' }}>邮箱</label>
            <div
              className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl"
              style={{
                border: shake ? '2px solid #FF8A8A' : '1.5px solid #5C4033',
                backgroundColor: '#FFFCF7',
                transition: 'border-color 0.2s',
              }}
            >
              <Mail size={18} color="#A09890" strokeWidth={1.5} />
              <input
                type="email"
                placeholder="请输入邮箱地址"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="flex-1 bg-transparent outline-none text-sm font-body"
                style={{ color: '#5C4033' }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </motion.div>
        )}

        {/* Password */}
        <div className="mb-2">
          <label className="text-xs font-heading mb-1.5 block ml-1" style={{ color: '#8B7355' }}>密码</label>
          <div
            className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl"
            style={{
              border: shake ? '2px solid #FF8A8A' : '1.5px solid #5C4033',
              backgroundColor: '#FFFCF7',
              transition: 'border-color 0.2s',
            }}
          >
            <Lock size={18} color="#A09890" strokeWidth={1.5} />
            <input
              type="password"
              placeholder={isRegister ? '至少6位密码' : '请输入密码'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="flex-1 bg-transparent outline-none text-sm font-body"
              style={{ color: '#5C4033' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        {/* Confirm Password (register only) */}
        {isRegister && (
          <motion.div className="mb-2" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label className="text-xs font-heading mb-1.5 block ml-1" style={{ color: '#8B7355' }}>确认密码</label>
            <div
              className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl"
              style={{
                border: shake ? '2px solid #FF8A8A' : '1.5px solid #5C4033',
                backgroundColor: '#FFFCF7',
                transition: 'border-color 0.2s',
              }}
            >
              <Lock size={18} color="#A09890" strokeWidth={1.5} />
              <input
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                className="flex-1 bg-transparent outline-none text-sm font-body"
                style={{ color: '#5C4033' }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.p className="text-xs font-body ml-1 mb-3" style={{ color: '#FF8A8A' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.p>
        )}

        {/* Submit Button */}
        <motion.button
          className="w-full py-3.5 rounded-full font-heading font-semibold text-base mt-4 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#FFD6E5', border: '2px solid #5C4033', color: '#5C4033', opacity: loading ? 0.7 : 1 }}
          whileTap={loading ? {} : { scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? (isRegister ? '注册中...' : '登录中...') : (isRegister ? '注册' : '登录')}
        </motion.button>

        {/* Mode Switch */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <Sparkles size={10} color="#A09890" />
          <p className="text-[11px] font-body" style={{ color: '#A09890' }}>
            {isRegister ? '已有账号？' : '还没有账号？'}
          </p>
          <motion.button
            className="text-[11px] font-heading font-semibold underline"
            style={{ color: '#5C4033' }}
            whileTap={{ scale: 0.95 }}
            onClick={switchMode}
          >
            {isRegister ? '去登录' : '去注册'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
