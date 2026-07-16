import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 1. Đăng ký Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg))
      .catch((err) => console.log('Service Worker registration failed:', err));
  });
}

// 2. Render App
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 3. Tắt Splash Screen khi App đã sẵn sàng
window.addEventListener('load', () => {
  const splash = document.getElementById('splash-overlay');
  if (splash) {
    splash.style.opacity = '0';
    // Đợi hiệu ứng mờ kết thúc (0.5s) rồi xóa hẳn khỏi DOM
    setTimeout(() => {
      splash.style.display = 'none';
      splash.remove();
    }, 500);
  }
});