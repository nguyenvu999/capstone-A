// src/components/IntroScreen.jsx
import React, { useEffect, useState } from 'react';
import './IntroScreen.css';
// Import logo của bạn ở đây, ví dụ dùng icon sẵn có
import logo from '/iconapp.png'; 

const IntroScreen = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 1. Hiển thị intro, sau 2.5 giây bắt đầu chạy animation ẩn
    const timer = setTimeout(() => {
      setIsExiting(true); 
      
      // 2. Đợi animation chạy xong (0.5s) rồi gọi hàm onFinish
      setTimeout(() => {
        onFinish();
      }, 500); // Thời gian khớp với transition trong CSS

    }, 2500); // Tổng thời gian hiển thị intro là 3 giây (2.5s + 0.5s)

    // Cleanup function để tránh memory leak
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`intro-container ${isExiting ? 'fade-out' : ''}`}>
      <img src={logo} alt="App Logo" className="intro-logo" />
    </div>
  );
};

export default IntroScreen;