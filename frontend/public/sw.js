// public/sw.js
self.addEventListener('install', (e) => {
  console.log('Service Worker installed');
});

self.addEventListener('fetch', (e) => {
  // Để sau, bạn có thể thêm logic cache ở đây
});