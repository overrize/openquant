import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 在 Capacitor 原生壳内预留状态栏高度，避免顶栏与系统状态栏重叠（不用顶层 await，兼容构建目标）
import('@capacitor/core').then(({ Capacitor }) => {
  if (Capacitor.isNativePlatform()) {
    document.body.classList.add('capacitor-status-bar-padding')
  }
}).catch(() => {})

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
