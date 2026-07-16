import React, { useEffect, useState } from 'react';
import './IntroScreen.css';
// XÓA DÒNG IMPORT NÀY ĐI
// import logo from '/iconapp.png'; 

const IntroScreen = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true); 
      setTimeout(() => {
        onFinish();
      }, 500);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`intro-container ${isExiting ? 'fade-out' : ''}`}>
      {/* SỬ DỤNG ĐƯỜNG DẪN TRỰC TIẾP "/iconapp.png" */}
      <img src="/iconapp.png" alt="App Logo" className="intro-logo" />
    </div>
  );
};

export default IntroScreen;