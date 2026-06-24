import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { api } from './lib/api.ts'

// 启动时健康检查
api.get('/api/health').then((res) => {
  console.log('✅ 后端健康检查通过:', res)
}).catch((err) => {
  console.warn('❌ 后端健康检查失败:', err.message ?? err)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
